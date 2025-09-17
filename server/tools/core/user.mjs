require('dotenv').config({ path: '../../.env' })
const {
    SITE__APP_NAME: appName,
    SITE__DEV_USER: initUser,
    SITE__DEV_PASS: initPass,
    SITE__DEV_FNAME: initFname,
    SITE__DEV_LNAME: initLname,
    SITE__DEV_ALIAS: initAlias,
    SITE__DEV_EMAIL: initEmail,
    DB__MYSQL_AES_SESSION_TOKEN: tokenSecret,
} = process.env

/* Registry */
import inputLength from '../../../client/global/modules/registry/length.mjs'

/* Settings */
import config, { addrBook } from '../../../config.mjs'
import db from '../../settings/mysql.mjs'

/* Tools */
import Team, { query as teamQuery } from './team.mjs'
import Company, { query as companyQuery } from './company.mjs'
import Carrier, { query as carrierQuery } from './carrier.mjs'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import recognizeApi from '../utils/api.mjs'
import transporter, { sender } from '../utils/nodemailer.mjs'
import { generateRandomString } from '../utils/string.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { numeric } from '../../../client/global/modules/tools/utils/number.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import { sortArrayByObjectKey } from '../../../client/global/modules/tools/utils/sorter.mjs'
import { table } from '../utils/knex'

const { validationResult } = require('express-validator')
const mysql = require('../utils/mysql')
const throwErr = require('../utils/error')


const query = {
    main: new Query(db.online, 'users'),
    registration: new Query(db.online, 'user_registration'),
    passReset: new Query(db.online, 'user_passreset'),
    roles: new Query(db.online, 'user_roles'),
    tokens: new Query(db.online, 'tokens'),
    sessions: new Query(db.online, 'sessions'),
    jx: {
        roles: new Query(db.online, 'user_role_map'),
        companies: new Query(db.business, 'user_company_map'),
        teams: new Query(db.business, 'user_team_map'),
    },
}



class User extends Person {
    constructor(data = {}, light = false) {
        super(data)
        if (!data?._id || !Object.keys(this).length)
            throw new Error('User instantiation failed: Invalid data')

        const { _id, _simpleId, fails, lastUrl, lastLogin, branch, siteId, _hash } = data
        const properties = {
            _id, _simpleId,
            username: data.username,
            status: [ data.status, User.statusList[data.status] ],
            condition: [ data.condition, User.conditionList[data.condition] ],
            location: [ data.location, User.locationList[data.location] ],
            unscoped: !!data.unscoped,
            DS: data.status === 'S' || data.status === 'D',
            DSA: data.status !== 'U',
            decliner: data.decliner,
            name: this.fullName('AL'),
            email: data.email,
            phone: data.phone,
            // count: {
            //     roles: data.roleCount,
            //     teams: data.teamCount,
            // },
        }
        if (properties.DS) properties.unscoped = true

        if (fails !== undefined) this.fails = fails
        if (lastUrl !== undefined) this.lastUrl = lastUrl
        if (lastLogin !== undefined) this.lastLogin = lastLogin
        if (branch !== undefined) this.lastBranch = branch
        if (siteId !== undefined) this.lastSiteId = siteId
        if (!light && _hash !== undefined) this._hash = _hash
        switch (this.sex) {
            case 1:
                this.ava = 'M'
                break
            case 0:
                this.ava = 'F'
                break
            default:
                this.ava = 'X'
        }
        this.avaSrc = `/images/icons/gender/${this.ava}.png`

        reSuper(this, properties)

        if (!light) {

            this.log = async (field, deleted = false) => {
                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]
                if (deleted) fields.push('deletedBy', 'deletedAt')

                let log = (await mysql.execute(query.main.select(fields, {
                    match: { id: User.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }


            this.inviter = async session => {
                let id = await this.log('createdBy')
                if (!id) return { name: config.site.name, email: null }

                const user = await User.data(session, { id })
                const { name, email } = user

                return { name, email }
            }


            this.flush = async () => {
                return await mysql.execute(query.main.update({ updateLog: null }, {
                    id: User.matchIdHash(this._id),
                }))
            }


            this.report = async session => {
                const result = { user: this }
                const log = await this.log(null, true)

                const { createdBy, deletedBy, updateLog } = log
                /*
                    The timestamps will only be correct on the Live Server
                    if it is set up with UTC tz
                */

                let id = [ createdBy ]
                if (deletedBy) id.push(deletedBy)

                if (updateLog)
                    updateLog.forEach(log => {
                        id.push(log.modifiedBy)
                    })
                id = [ ...new Set(id) ]

                const labelList = {
                    username: 'Username',
                    status: 'Status',
                    location: 'Location',
                    condition: 'Condition',
                    fails: 'Login Attempts',
                    email: 'Email',
                    phone: 'US Cell Phone',
                    firstName: 'First Name',
                    lastName: 'Last Name',
                    alias: 'Alias',
                    sex: 'Gender',
                }
                const labels = {}
                const names = {}
                const users = await User.list(session, { id })

                if (users)
                    for (let i = 0; i < users.length; i++) {
                        const id = await users[i].id()
                        names[id] = users[i].name
                    }

                log.createdBy = names[createdBy] || appName
                if (deletedBy) log.deletedBy = names[deletedBy]

                if (updateLog)
                    for (let i = 0; i < updateLog.length; i++) {
                        log.updateLog[i].modifiedBy = names[updateLog[i].modifiedBy] || appName

                        for (const prop in updateLog[i].data) {
                            switch (prop) {
                                case 'status':
                                    log.updateLog[i].data.status = User.statusList[updateLog[i].data.status]
                                    log.updateLog[i].oldData.status = User.statusList[updateLog[i].oldData.status]
                                    break
                                case 'location':
                                    log.updateLog[i].data.location = User.locationList[updateLog[i].data.location]
                                    log.updateLog[i].oldData.location = User.locationList[updateLog[i].oldData.location]
                                    break
                                case 'condition':
                                    log.updateLog[i].data.condition = User.conditionList[updateLog[i].data.condition]
                                    log.updateLog[i].oldData.condition = User.conditionList[updateLog[i].oldData.condition]
                                    break
                                case 'sex':
                                    const genders = { '0': 'Female', '1': 'Male' }
                                    const { sex } = updateLog[i].data
                                    const { sex: oldSex } = updateLog[i].oldData
                                    if ([0, 1].includes(sex)) log.updateLog[i].data.sex = genders[sex]
                                    if ([0, 1].includes(oldSex)) log.updateLog[i].oldData.sex = genders[oldSex]
                            }

                            if (!(prop in labels))
                                labels[prop] = labelList[prop]
                        }
                    }

                result.log = log
                result.labels = labels
        
                return result
            }


            this.permissions = async session => {
                if (!session?.user) return

                const { branch } = session
                const catId = Company.catId(branch) //! Check how it will work with default branch
                const userId = await this.id()
                const batch = [
                    {
                        table: query.jx.roles.table,
                        match: { userId },
                    },
                    {
                        table: query.roles.table,
                        fields: 'permissions',
                        join: [ 'id', 'roleId' ],
                        match: { catId, location: [ null, this.location[0] ] },
                    },
                ]

                const [ result ] = await mysql.execute(Query.select(db.online, batch))

                return result.reduce((acc, item) => {
                    Object.entries(item.permissions).forEach(([ key, values ]) => {
                        acc[key] = [ ...new Set([ ...(acc[key] || []), ...values ])]
                    })

                    return acc
                }, {})
            }


            this.roles = async (session, action, roleIds) => {
                const userId = await this.id()

                if (action && roleIds) {
                    //? Need to find the best solution for logging changes
                    let modified = false,
                        error = sessionError(session, { status: 'DSA', branches: [ 'admin' ] })
                    if (error) return { modified, error }

                    if (!Array.isArray(roleIds)) roleIds = [ roleIds ]
                    error = []

                    let i = 0, modCt = 0, createdBy
                    if (action === '-') action = 'delete'
                    else if (action === '+') {
                        action = 'insert'
                        createdBy = await session.user.id()
                    }

                    for (let roleId of roleIds) {
                        if (!numeric(roleId))
                            roleId = await (await Role.data(session, { _id: roleId })).id()

                        try {
                            const data = { userId, roleId }
                            if (action === 'insert') data.createdBy = createdBy

                            const [ result ] = await mysql.execute(query.jx.roles[action](data))
                            if (result.affectedRows === 1) modCt++
                        } catch (err) {
                            error.push('DB Error: idx ' + i)
                        }

                        i++
                    }

                    if (modCt === roleIds.length) {
                        modified = true
                        error = undefined
                    } else error = error.join(' / ')

                    return { modified, error }
                } else {
                    if (!session?.user) return

                    const sessionUser = session.user
                    const self = sessionUser._id === this._id
                    if (!self && !sessionUser.DSA) return

                    const data = { all: [], available: [], applied: [] }

                    const batch = [
                        {
                            table: query.jx.roles.table,
                            match: { userId },
                        },
                        {
                            table: query.roles.table,
                            fields: [ Role.hashId(), 'name', 'location' ],
                            join: [ 'id', 'roleId' ],
                        },
                    ]

                    if (self) { /* Filter when SESSION USER in Special Branch */
                        delete data.all
                        delete data.available

                        const { branch } = session
                        const catId = Company.catId(branch)
                        const roles = await Role.list(session, { catId })

                        if (sessionUser.DS) {
                            roles.map(role => {
                                const { _id, name, location } = role
                                data.applied.push({ _id, name, location })
                            })
                        } else {
                            batch[1].match = { catId }

                            data.applied = (await mysql.execute(Query.select(db.online, batch)))[0]
                        }
                    } else {
                        batch[1].fields.push('catId')

                        const roles = await Role.list(session, { location: [ null, this.location[0] ] })
                        data.applied = (await mysql.execute(Query.select(db.online, batch)))[0]

                        roles.map(role => {
                            const { _id, name, catId } = role
                            let { location } = role
                            if (location) location = location[0]

                            data.all.push({ _id, name, location, catId })
                        })

                        data.available = data.all.filter(role => !data.applied.some(appliedRole => appliedRole._id === role._id))

                        data.all = sortArrayByObjectKey(data.all, 'name')
                        data.applied = sortArrayByObjectKey(data.applied, 'name')
                        data.available = sortArrayByObjectKey(data.available, 'name')
                    }

                    return data
                }
            }


            //! WORK IN PROGRESS

            this.relIds = async (session, target) => {
                if (!session?.user) return

                const userId = await this.id()
                let batch = [], data = []

                switch (target) {

                    case 'teams':
                        batch = [
                            {
                                table: query.jx.teams.table,
                                match: { userId },
                            },
                            {
                                table: teamQuery.main.table,
                                fields: 'id',
                                join: [ 'id', 'teamId' ],
                            },
                        ]
                        break

                    case 'carriers':
                        batch = [
                            {
                                table: query.jx.companies.table,
                                match: { userId },
                            },
                            {
                                db: db.carrier,
                                table: carrierQuery.main.table,
                                fields: 'id',
                                join: [ 'companyId', 'companyId' ],
                            },
                        ]
                        break

                }

                const [ result ] = await mysql.execute(Query.select(db.business, batch))
                if (result.length) result.forEach(record => data.push(record.id))

                return data
            }

            this.relationship = async (session, target, action, ids) => {
                if (!session?.user) return

                const sessionUser = session.user
                const userId = await this.id()
                let Src

                switch (target) {
                    case 'teams':
                        Src = Team
                        break
                    case 'companies':
                        Src = Company
                        break
                }

                if (action && ids) {
                    let modified = false,
                        error = sessionError(session, { status: 'DSA', branches: [ 'admin' ] })
                    if (error) return { modified, error }

                    if (!Array.isArray(ids)) ids = [ ids ]
                    error = []

                    let i = 0, modCt = 0, createdBy, idProp, qjxProp
                    if (action === '-') action = 'delete'
                    else if (action === '+') {
                        action = 'insert'
                        createdBy = await sessionUser.id()
                    }

                    switch (target) {
                        case 'teams':
                            idProp = 'teamId'
                            qjxProp = 'teams'
                            break
                        case 'companies':
                            idProp = 'companyId'
                            qjxProp = 'companies'
                            break
                    }

                    for (let id of ids) {
                        if (!numeric(id)) id = await (await Src.data(session, { _id: id })).id()

                        try {
                            const data = { userId, [idProp]: id }
                            if (action === 'insert') data.createdBy = createdBy

                            const [ result ] = await mysql.execute(query.jx[qjxProp][action](data))
                            if (result.affectedRows === 1) modCt++
                        } catch (err) {
                            error.push('DB Error: idx ' + i)
                        }

                        i++
                    }

                    if (modCt === ids.length) {
                        modified = true
                        error = undefined
                    } else error = error.join(' / ')

                    return { modified, error }
                } else {
                    const self = sessionUser._id === this._id
                    if (!self && !sessionUser.DSA) return

                    const data = {
                        all: [], available: [], applied: [],
                    }
                    let batch

                    switch (target) {

                        case 'teams':
                            batch = [
                                {
                                    table: query.jx.teams.table,
                                    match: { userId },
                                },
                                {
                                    table: teamQuery.main.table,
                                    fields: [ Team.hashId(), 'name' ],
                                    join: [ 'id', 'teamId' ],
                                },
                            ]
                            break

                        case 'companies':
                        case 'carriers':
                            batch = [
                                {
                                    table: query.jx.companies.table,
                                    match: { userId },
                                },
                                {
                                    table: companyQuery.main.table,
                                    fields: [ Company.hashId(), 'catId', 'active', 'until' ],
                                    join: [ 'id', 'companyId' ],
                                    match: { confirmed: true },
                                },
                                {
                                    table: companyQuery.names.table,
                                    fields: [
                                        { concat: [ [ 'busName', '^, ', 'coType' ], 'name' ] },
                                        { route: [ [ 'busName', 'coType' ] ] },
                                        'alias',
                                    ],
                                    join: [ 'companyId', 'id', {
                                        table: companyQuery.main.table,
                                        max: 'since',
                                    } ],
                                },
                            ]

                            if (target === 'carriers') {
                                batch[1].catId = 'crr'
                                batch.push({
                                    db: db.carrier,
                                    table: carrierQuery.main.table,
                                    fields: [ [ Carrier.hashId(), 'carrierId' ] ],
                                    join: [ 'companyId', 'id', 1 ],
                                })
                            }
                            break

                    }

                    if (self) { /* Filter when SESSION USER in Special Branch */
                        const catId = Company.catId(session.branch)

                        if (sessionUser.DS) {
                            const params = target !== 'teams' ? { catId } : {}
                            const relationData = await Src.list(session, params)

                            relationData.map(row => {
                                const { _id, name } = row
                                const record = { _id, name }

                                if (target !== 'teams') {
                                    record.alias = row.alias
                                    record.active = row.active
                                    record.until = row.until
                                }
                                data.applied.push(record)
                            })
                        } else {
                            if (target !== 'teams') batch[1].match = { catId }

                            data.applied = (await mysql.execute(Query.select(db.business, batch)))[0]
                        }
                    } else {
                        if (sessionUser.status[0] === 'A') {
                            batch[0].match.userId = await sessionUser.id()

                            const relIds = []
                            data.all = (await mysql.execute(Query.select(db.business, batch)))[0]
                            data.all.map(row => relIds.push(row._id))
                            data.applied = data.applied.filter(row => relIds.includes(row._id))
                        } else {
                            const relationData = await Src.list(session)

                            data.applied = (await mysql.execute(Query.select(db.business, batch)))[0]

                            relationData.map(row => {
                                const { _id, name, catId, route } = row
                                const record = { _id, name, route }
                                if (target === 'companies') record.catId = catId
                                if (target !== 'teams') record.route = route

                                data.all.push(record)
                            })
                        }

                        data.available = data.all.filter(row => !data.applied.some(appliedRow => appliedRow._id === row._id))
                    }

                    data.all = sortArrayByObjectKey(data.all, 'name')
                    data.applied = sortArrayByObjectKey(data.applied, 'name')
                    data.available = sortArrayByObjectKey(data.available, 'name')

                    return data
                }
            }


            // this.teamIds = async session => {
            //     if (!session?.user) return

            //     const { branch } = session
            //     const catId = Company.catId(branch)

            //     const batch = [
            //         {
            //             table: 'teams_users',
            //         },
            //         {
            //             table: 'teams',
            //             fields: 'id',
            //             join: [ 'id', 'teamId' ],
            //             match: { catId },
            //         },
            //     ]
            //     if (!this.DS) batch[0].match = { userId: await this.id() }

            //     const [ result ] = await mysql.execute(Query.select(db.business, batch))

            //     return result.map(row => row.id)
            // }


            //! ----


            this.modify = async (session, data) => {
                let modified = false, modifiedUser, error = sessionError(session, { branches: [ 'admin', 'user' ] })
                if (!error && this.status[0] === 'D' && session.user.status[0] !== 'D') error = 'Invalid Target: Immune User'

                const id = await this.id()
                const { branch, user: sessionUser } = session
                const sessionUserId = await sessionUser.id()

                if (!error) {
                    if (branch === 'user' && id !== sessionUserId) error = 'Invalid Target'
                    else {
                        const { status, location } = sessionUser

                        if (status[0] === 'A') {
                            if (this.status[0] === 'S') error = 'Invalid Target: Immune User'
                            else if (location[0] !== 'US' && location[0] !== this.location[0])
                                error = 'Invalid Region'
                        } else if (this.status[0] === 'D') {
                            if (data.status !== 'D') error = 'Invalid Target: Immune User'
                            else if (data.location !== 'US') error = 'Invalid Region'
                        }
                    }
                }

                if (error) return { modified, error }

                const currentData = { ...this }
                currentData.status = this.status[0]
                currentData.location = this.location[0]
                currentData.condition = this.condition[0]

                const update = processData(data, {
                    modifiedBy: sessionUserId,
                    currentData,
                    currentUpdateLog: await this.log('updateLog'),
                    branch,
                })

                if (this.status[0] === 'US') {
                    if (update.firstName) delete update.firstName
                    if (update.lastName) delete update.lastName
                    if (update.alias) delete update.alias
                }
                if ((this.location[0] !== 'US' && update.location !== 'US') && update.phone)
                    update.phone = null

                try {
                    const [ result ] = await mysql.execute(query.main.update(update, { id }))
                    if (result.affectedRows === 1) {
                        modified = true
                        modifiedUser = await User.data(session, { id })

                        if (!this.username && data.email && this.email !== data.email) {
                            const [ rows ] = await mysql.execute(query.registration.select('formId', { match: { userId: id } }))

                            if (rows.length) {
                                const { formId } = rows[0]

                                User.invite(session, modifiedUser, formId)

                                const [ result ] = await mysql.execute(query.registration.update({ invitedAt: Query.timeStamp }, {
                                    userId: id,
                                    formId,
                                }))
                                if (result.affectedRows === 0) error = 'DB Error: Registration Not Updated'
                            }
                        }
                    }
                } catch (err) {
                    console.error(err)
                    error = 'DB Error'
                }

                return { modified, error, data: modifiedUser }
            }


            this.delete = async session => {
                let deleted = false
                const error = sessionError(session, { status: 'DSA', branches: [ 'admin' ] })
                if (error) return { deleted, error }

                const sessionUserId = await session.user.id()
                const update = processData({ username: null, _passKey: null, email: null, phone: null, condition: 'I' }, {
                    modifiedBy: sessionUserId,
                    currentData: this,
                    currentUpdateLog: await this.log('updateLog'),
                })
                update.deletedBy = sessionUserId
                update.deletedAt = Query.timeStamp

                const [ result ] = await mysql.execute(query.main.update(update, { id: User.matchIdHash(this._id) }))
                if (result.affectedRows === 1) {
                    deleted = true
                    const match = { userId: User.matchIdHash(this._id) }

                    await mysql.execute(query.registration.delete(match))
                    await mysql.execute(query.passReset.delete(match))
                    await mysql.execute(query.tokens.delete(match))
                }

                return { deleted }
            }


            this.token = async (params = {}) => {
                let { clientIp, token } = params
                const userId = await this.id()
                const { tokenAge } = config.session
                
                if (clientIp) {  // Retrieve Token
                    if (clientIp !== this.clientIp) this.clientIp = clientIp

                    clientIp = { ip: clientIp }

                    const [ rows ] = await mysql.execute(query.tokens.select([
                        'verified',
                        { aes: [ 'token', tokenSecret ] },
                        'createdAt',
                    ], { match: { userId, clientIp } }))
                    if (!rows.length) return {}

                    let { verified, createdAt } = rows[0]
                    token = stringifyBuffer(rows[0].token)
                    createdAt = new Date(createdAt)

                    const expiresAt = new Date(createdAt.getTime() + tokenAge * 60 * 1000)
                    const expired = new Date >= expiresAt

                    return { token, verified, createdAt, expiresAt, expired }
                } else if (token) {  // Update Token
                    if (!this.clientIp) return

                    clientIp = { ip: this.clientIp }
                    token = { aes: [ token, tokenSecret ]}

                    await mysql.execute(
                        query.tokens.update({ verified: true }, { userId, clientIp, token })
                    )
                } else {  // Create Token
                    if (!this.clientIp) return

                    clientIp = { ip: this.clientIp }
                    token = generateRandomString(inputLength.user.token.max, 'd')

                    await mysql.execute(query.tokens.delete({ userId, clientIp }))

                    await mysql.execute(query.tokens.insert({
                        userId,
                        token: { aes: [ token, tokenSecret ]},
                        clientIp,
                    }))

                    if (config.notification.email.authToken) {
                        const tokenExpiration = `${tokenAge} minute${tokenAge > 1 ? 's' : ''}`
                        const email = {
                            from: sender,
                            to: this.email,
                            subject: 'New Authentication Token',
                            html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                                <p>
                                    Your one-time Security Token is <strong>${token}</strong>.<br />
                                    The token will expire in ${tokenExpiration}.
                                </p>
                                <p>
                                    <em style="background-color: yellow;">To ensure your security, keep this token confidential.</em><br />
                                    No one from ${appName} will request this number from you.
                                </p>
                                <p>
                                    <span style="color: red;">If someone requests this token, do <u>NOT</u> disclose it.</span>
                                </p>
                            </div>`,
                        }

                        transporter.sendMail(email, error => {
                            if (error) console.error({ error })
                        })
                    }

                    return token
                }
            }


            this.url = async (session, lastUrl) => {
                if (lastUrl.slice(0, 5) === '/api/' || lastUrl.includes('/files/') || lastUrl.includes('/image/') || lastUrl.endsWith('.map')) return

                const { branch, siteId } = session
                const userId = await this.id()
                const { lastLogin } = this

                await mysql.execute(query.sessions.update(
                    { lastUrl },
                    { userId, siteId, branch, lastLogin }
                ))

                this.lastUrl = lastUrl
            }


            this.settings = async (session, data) => {
                if (this._id !== session?.user?._id) return

                const match = { id: User.matchIdHash(this._id) }
                const [ result ] = await mysql.execute(query.main.select('settings', { match }))
                let { settings }= result[0]

                if (!data) return settings
                else {
                    if (settings === null) settings = {}
                    const { branch } = session

                    settings[branch] = data
                    settings = JSON.stringify(settings)

                    await mysql.execute(query.main.update({ settings }, match))
                }
            }

        }
    }


    id = async () => {
        if (!this._id) return

        return (await mysql.execute(query.main.select('id', {
            match: { id: User.matchIdHash(this._id) },
        })))[0][0].id
    }


    static #algorithm = 'SHA-512'

    static conditionList = {
        'A': 'Active',
        'I': 'Inactive',
        'L': 'Locked',
    }

    static locationList = {
        'US': 'USA',
        // 'MX': 'Mexico',
        'UA': 'Ukraine',
    }

    static statusList = {
        'U': 'User',
        'A': 'Admin',
        'S': 'Super Admin',
        'D': 'Developer',
    }


    static hashId = (field = 'id') => hash(field, User.#algorithm)
    static hashSimpleId = (field = 'id') => hash(field)

    static matchIdHash = value => matchHash(value, User.#algorithm)
    static matchSimpleIdHash = value => matchHash(value)


    static create = async (session, data) => {
        let created = false, newUser, error = sessionError(session, { status: 'DSA', branches: [ 'admin' ] })
        if (error) return { created, error }

        data = processData(data)

        for (const prop of [ 'status', 'location', 'email', 'firstName', 'lastName' ])
            if (!data[prop]) return { created, error: 'Invalid Data' }

        const { email } = data
        if (await User.data(session, { email })) return { created, error: "Invalid Data: Email Registered" }

        data.createdBy = await session.user.id()

        const [ result ] = await mysql.execute(query.main.insert(data))
        const id = result.insertId

        if (id) {
            const formId = await User.#formId()
            const [ result ] = await mysql.execute(query.registration.insert({
                formId,
                userId: id,
                invitedBy: data.createdBy,
            }))

            if (result.affectedRows === 0) {
                try {
                    // await mysql.execute(query.main.delete({ id }))
                    error = 'DB Error: Unregistered User Deleted'
                } catch (err) {
                    console.error(err)
                    error = 'DB Error: Unregistered User Not Deleted'
                }

                return { created, error }
            }

            created = true
            newUser = await User.data(session, { id })

            User.invite(session, newUser, formId)
        } else error = 'DB Error'

        return { created, error, data: newUser }
    }


    static invite = (session, user, formId) => {
        if (!session?.user?.DSA) return

        const { _id, email, name } = user
        const url = `${addrBook.user}/register/${_id}?form=${formId}`
        const options = {
            from: sender,
            to: email,
            subject: 'User Registration',
            html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                Dear ${name},<br/>
                Welcome to ${appName}!<br/><br/>
                We are thrilled to have you join our team and look forward to your contributions.
                To get started, we need you to complete a few simple steps to finalize your registration.<br/><br/>
                Please follow the link below to complete your registration:<br/>
                <a href="${url}" target="_blank">Proceed with Registration</a><br/><br/>
                Kindly complete this process within the next 24 hours to ensure a smooth onboarding experience.
            </div>`,
        }

        transporter.sendMail(options, error => {
            if (error) console.error(error)
        })
    }


    static #formId = async () => {
        let formId, found = true

        do {
            formId = generateRandomString(inputLength.user.formId.max)

            const [ rows ] = await mysql.execute(query.registration.select('formId', {
                match: { formId }
            }))

            if (!rows.length) found = false
        } while (found)

        return formId
    }


    static #batch = (session, options = {}) => {
        if (!session) return []
        const { branch, siteId } = session

        const batch = [
            {
                table: query.main.table,
                fields: [
                    User.hashId(),
                    [ User.hashSimpleId(), 'simpleId' ],
                    'username',
                    'email',
                    'phone',
                    'firstName',
                    'lastName',
                    'alias',
                    'sex',
                    'status',
                    'condition',
                    'location',
                    'unscoped',
                    'decliner',
                ],
            },
            {
                table: query.sessions.table,
                fields: [ 'siteId', 'branch', 'lastLogin' ], //* DEFAULT
                join: [ 'userId', 'id', { max: [ 'lastLogin', { branch, siteId } ] } ], //? In this case it doesn't confuse lastUrl
            },
        ]

        let { params, filter } = options
        if (!params) params = {}
        if (!filter) filter = {}

        const { _id, id, _simpleId, username, email, allowDeleted } = params
        const { id: ids, firstName, lastName, alias, sex, status, location, condition, decliner, deleted } = filter
        let deletedBy = null
        if (deleted === true) deletedBy = { null: false }

        batch[0].match = {
            deletedBy,
            id, username, email,
            firstName, lastName, alias, sex,
            status, location, condition, decliner,
        }
        if (allowDeleted === true) delete batch[0].match.deletedBy
        if (!id && _id) batch[0].match.id = User.matchIdHash(_id)
        if (!id && !_id) batch[0].match.id = ids
        if (_simpleId) batch[0].match.id = User.matchSimpleIdHash(_simpleId)

        if (_id || id || username) batch[1].fields.push('lastUrl')

        if (!('user' in session) && username) {
            batch[0].fields.push([ '_passKey', '_hash' ], 'fails')
            batch[1].fields.push({ ip: 'clientIp' })

            if (branch === 'admin') batch[0].match.status = [ 'D', 'S', 'A' ]
        } else {
            if (session?.user?.location) {
                const location = session.user.location[0]
                if (location !== 'US') {
                    batch[0].match.location = location
                }
            }
        }

        return batch
    }


    static data = async (session, params = {}) => {
        if (!params._id && !params.id && !params._simpleId && !params.username && !params.email) return

        const batch = User.#batch(session, { params })
        const data = (await mysql.execute(Query.select(db.online, batch)))[0][0]

        return !data ? data : new User(data)
    }


    static list = async (session, filter = {}) => {
        const batch = User.#batch(session, { filter })
        batch[1].join[2].max = 'lastLogin'

        const list = (await mysql.execute(Query.select(db.online, batch)))[0]
        list.forEach((data, i, arr) => arr[i] = new User(data, true))

        return list
    }


    static find = async (session, params = {}) => {
        if (!session?.user) return { error: 'Invalid User' }

        const { username, email, exclude } = params
        if (!username && !email) return { error: 'Invalid Parameters' }

        const match = { username, email }
        if (exclude?._id) {
            const user = await User.data(session, { _id: exclude._id })
            const id = await user.id()

            match.id = { not: id }
        }

        const data = (await mysql.execute(query.main.select('id', { match })))[0]

        return { found: data.length === 1 }
    }


    static #authUrl = (session, _id, status) => `${addrBook.user}/authenticate?user=${_id}&branch=${btoa(session.branch)}&site=${btoa(session.siteId)}&status=${status}`



    /* Middleware */


    static login = async (req, res) => {
        const { api, errKey } = recognizeApi(req)

        try {
            const apiRes = api
                ? { error: {}, username: true, password: true, condition: 'A' }
                : null

            const validationFails = validationResult(req)
            const { errors } = validationFails

            if (!validationFails.isEmpty()) {
                res.status(400)

                if (api) {
                    apiRes.error.validation = { errors }
                    apiRes.username = false
                    apiRes.password = false

                    return res.send(apiRes)
                }

                let errorList = '<pre>Validation Errors:<ol>'
                errors.forEach(error => {
                    errorList += `<li>${error.msg}</li>`
                })
                errorList += '</ol></pre>'

                return res.send(errorList)
            }

            const { session } = res
            const { branch, siteId } = session


            /* Step 1: Lookup User by Username */

            const { username, password } = req.body
            let user = await User.data(session, { username })

            // Interrupt if User not found
            if (!user) {
                if (api) {
                    apiRes.username = false
                    apiRes.error.username = `${branch === 'admin' ? 'Admin' : 'User'} not found`

                    return res.send(apiRes)
                } else return throwErr.data.auth(res, 'Authentication failed: User not found')
            }


            /* Step 2: Verify Password if User found */

            const { loginAttempts } = config.session
            const { _id, _hash } = user
            let { fails, condition } = user
            condition = condition[0]

            const matched = await Bun.password.verify(password, _hash)

            // Interrupt if Password mismatched
            // Increment Fails if API or alter Status if Limit is reached
            if (!matched) {
                if (api) {
                    apiRes.password = false
                    apiRes.error.password = 'Incorrect password'

                    if (fails < loginAttempts && condition !== 'L') {
                        fails++
                        let update = { fails }

                        if (fails === loginAttempts) {
                            update.condition = 'L'
                            user = await User.data(session, { _id })

                            const currentData = { ...user }
                            const currentUpdateLog = await user.log('updateLog')
                            currentData.condition = user.condition[0]

                            const options = { currentData, currentUpdateLog, modifiedBy: 0, modifiedIn: { branch } }
                            if (siteId) options.modifiedIn.siteId = siteId

                            update = processData(update, options)
                        }

                        await mysql.execute(query.main.update(update, { id: User.matchIdHash(_id) }))
                    }
                } else return throwErr.data.auth(res, 'Authentication failed: User not verified')
            }


            /* Step 3: Check User's Condition if Password verified */

            if (condition !== 'A') {
                const conditions = User.conditionList
                if (api) {
                    apiRes.condition = condition
                    if (!apiRes.error.username)
                        apiRes.error.username = `User is ${conditions[condition].toLowerCase()}`
                } else return throwErr.data.auth(res, `Authentication failed: ${conditions[condition]} user`)
            }


            // Respond if API
            if (api) {
                apiRes.fails = fails

                return res.send(apiRes)
            } else {


                /* Step 4: Verify IP Token and redirect to Authentication page in User branch */

                // Interrupt if User not found
                if (!user) return throwErr.data.auth(res, 'Authentication failed: User not found')

                const { clientIp } = req.session
                const { token, verified, expired } = await user.token({ clientIp })

                if (!token || (!verified && expired)) await user.token()

                await mysql.execute(query.main.update({ fails: 0 }, { id: User.matchIdHash(_id) }))

                res.redirect(User.#authUrl(session, _id, 'pending'))
            }

        } catch (err) {
            const msg = 'Authentication failed: Server could not process the request'
            throwErr[errKey].server(res, msg, err)
        }
    }


    static session = async (req, res) => {
        try {
            const { session } = res
            const { branch, siteId, defUrl } = session
            const { user: _id, token: providedToken } = req.body
            const { clientIp } = req.session
            const user = await User.data(session, { _id }, 'User:session')
            const { token, verified, expired } = await user.token({ clientIp })

            if (!verified) {

                if (token !== providedToken)
                    return res.redirect(User.#authUrl(session, _id, 'mismatch'))

                else if (expired) {
                    await user.token()

                    return res.redirect(User.#authUrl(session, _id, 'expired'))
                }

                else
                    await user.token({ token })
            }

            const _token = await Bun.password.hash(token)
            const userId = await user.id()
            const settings = await user.settings(res.session)
            const url = determineUrl(branch, settings, user.lastUrl, defUrl)

            const data = {
                userId,
                siteId,
                branch,
                clientIp: { ip: clientIp },
                lastUrl: url,
            }

            const [ result ] = await mysql.execute(query.sessions.insert(data))
            if (!result.affectedRows) {
                if (req.session.user) delete req.session.user
                if (res.session.user) delete res.session.user
                if (req.session.team) delete req.session.team
                if (res.session.team) delete res.session.team

                return req.session.destroy((err) => {
                    if (err) return res.status(500).send('Failed to log out')
        
                    return throwErr.data.auth(res, 'Authentication failed: Session failed')
                })
            }

            req.session.user = _id
            res.cookie('connect.token', _token, {
                httpOnly: true,
            })

            res.redirect(url)
        } catch (err) {
            const msg = 'Authentication failed: Server could not process the request'
            throwErr.data.server(res, msg, err)
        }
    }


    static verify = async (req, res, next) => {
        const { api, errKey } = recognizeApi(req)
        const { method } = req

        try {
            const { originalUrl, query } = req
            const { session } = res
            const { excUrl, teams, companies, userApp } = session
            const { user: _id, clientIp } = req.session
            const reject = async apiErrMsg => {
                if (api) throwErr.api.auth(res, apiErrMsg)
                else {
                    const { refer } = query
                    const { logoutUrl } = config.session

                    if (refer) {
                        const user = await User.data(session, { _id: refer })
                        if (method !== 'POST' && !excUrl.includes(originalUrl))
                            await user.url(session, stripUrl(originalUrl, query, 'refer'))
                    }

                    if (!next) return false
                    else return res.redirect(logoutUrl)
                }
            }

            if (!_id) return await reject('Authentication check failed: Not authenticated')

            const user = await User.data(session, { _id })
            if (!user) {
                User.logout(req, res)
                return throwErr[errKey].auth(res, 'Authentication check failed: No user found')
            }

            const connectToken = req.cookies['connect.token']
            const { token } = await user.token({ clientIp })

            if (!connectToken || !token || !(await Bun.password.verify(token, connectToken)))
                return await reject('Authentication check failed: Token verification failed')

            if (session.branch === 'admin' && user.status[0] === 'U')
                return await reject('Authentication check failed: Unauthorized Environment')

            if (user.DS && user.location[0] !== 'US')
                return await reject('Verification failed: Incorrect status in current location')

            if (session.branch !== 'admin' && session.branch !== 'user' && !user.unscoped) {
                const { applied: teams } = await user.relationship({ ...session, user }, 'teams')
                if (!teams.length) return await reject('Verification failed: No teams assigned')
            }

            if (query.refer) {
                const newUrl = stripUrl(originalUrl, query, 'refer')

                if (method !== 'POST') await user.url(session, newUrl)
                return res.redirect(newUrl)
            }

            if (method !== 'POST' && !excUrl.includes(originalUrl))
                await user.url(session, originalUrl)

            if (!next) return user

            res.session.user = user
            if (teams && !user.unscoped) {
                res.session.teams = (await user.relationship(session, 'teams')).applied
                res.session.teamIds = await user.relIds(session, 'teams')
            }
            if (companies) {
                const target = Company.categoryList[userApp].path[0]

                res.session.companies = (await user.relationship(session, target)).applied
                res.session.companyIds = await user.relIds(session, target)
            }

            next()
        } catch (err) {
            const msg = 'Authentication check failed: Server could not process the request'
            throwErr[errKey].server(res, msg, err)
        }
    }


    static logout = (req, res) => {
        if (req.session.user) delete req.session.user
        if (res.session.user) delete res.session.user
        if (req.session.team) delete req.session.team
        if (res.session.team) delete res.session.team

        return req.session.destroy((err) => {
            if (err) return res.status(500).send('Failed to log out')

            res.redirect('/')
        })
    }


    static initialize = async (req, res) => {
        const [ rows ] = await mysql.execute(query.main.select('id', { id: 1 }))

        if (!rows.length) await mysql.execute(query.main.insert({
            username: initUser,
            _passKey: await Bun.password.hash(initPass),
            firstName: initFname,
            lastName: initLname,
            alias: initAlias || null,
            email: initEmail,
            status: 'D',
            location: 'US',
        }))

        res.redirect('/')
    }


    static register = async (req, res) => {
        try {
            const { _id, username, password } = req.body

            const [ result ] = await mysql.execute(query.main.update({
                username,
                _passKey: await Bun.password.hash(password),
            }, { id: User.matchIdHash(_id) }))

            if (result.affectedRows === 1)
                await mysql.execute(query.registration.delete({ userId: User.matchIdHash(_id) }))

            res.redirect(addrBook.default)
        } catch (err) {
            const msg = 'Registration failed: Server could not process the request'
            throwErr.data.server(res, msg, err)
        }
    }


}


delete User.prefixList
delete User.suffixList
delete User.genderList
delete User.formSelect



class Role {
    constructor(data, light = false) {
        this._id = data._id
        this.catId = data.catId
        this.location = data.location
            ? [ data.location, User.locationList[data.location] ]
            : null
        this.name = data.name
        this.permissions = data.permissions

        if (!light) {
        
            this.id = async () => (await mysql.execute(query.roles.select('id', {
                match: { id: Role.matchIdHash(this._id) },
            })))[0][0].id
            
            
            this.log = async field => {
                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]

                let log = (await mysql.execute(query.roles.select(fields, {
                    match: { id: Role.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }


            this.flush = async () => {
                return await mysql.execute(query.roles.update({ updateLog: null }, {
                    id: Role.matchIdHash(this._id),
                }))
            }


            this.unique = async (session, params = {}) => {
                let unique = false, original = true,
                    error = error = sessionError(session, { branches: [ 'admin', 'user' ] })

                if (!error) {
                    const { name, catId, location } = params

                    if (
                        (name !== this.name) ||
                        (name === this.name && catId !== this.catId) ||
                        (name === this.name && catId === this.catId && location !== this.location[0])
                    ) {
                        original = false

                        const { found, error: sError } = await Role.find(session, params)
                        if (sError) error = sError
                        else unique = !found
                    }
                }

                return { unique, original, error }
            }


            this.modify = async (session, data) => {
                let modified = false, error = sessionError(session, { status: 'DSA', branches: [ 'admin' ] })
                if (error) return { modified, error }

                const { permissions } = data
                delete data.permissions

                const id = await this.id()
                const modifiedBy = await session.user.id()
                const currentData = { ...this }
                if (this.location) currentData.location = this.location[0]

                //! Permission change is NOT logged yet
                data = processData(data, {
                    modifiedBy,
                    currentData,
                    currentUpdateLog: await this.log('updateLog'),
                })

                data.permissions = JSON.stringify(permissions)

                try {
                    const [ result ] = await mysql.execute(query.roles.update(data, { id }))
                    if (result.affectedRows === 1) modified = true
                } catch (err) {
                    console.error(err)
                    error = 'DB Error: Failed to modify Role'
                }

                return { modified, error, data: await Role.data(session, { id }) }
            }


            this.delete = async session => {
                let deleted = false, error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { deleted, error }

                const id = await this.id()
                const log = await this.log()

                try {
                    const [ result ] = await mysql.execute(query.roles.delete({ id }))
                    if (result.affectedRows > 0) deleted = true
                } catch(err) {
                    console.error(err)
                    error = 'DB Error'
                }

                if (error) return { deleted, error }
                for (const prop in log) this[prop] = log[prop]
                
                await logDeletion(session, 'roles', this, { id })

                return { deleted }
            }

        }
    }


    static #algorithm = 'SHA-1'

    static hashId = (field = 'id') => hash(field, Role.#algorithm)

    static matchIdHash = value => matchHash(value, Role.#algorithm)


    static create = async (session, data) => {
        let created = false, error = sessionError(session, { status: 'DSA', branches: [ 'admin' ] })
        if (error) return { created, error }

        data = processData(data)

        for (const prop of [ 'catId', 'name', 'permissions' ])
            if (!data[prop]) return { created, error: 'Invalid Data' }

        if (await Role.list(session, {
            catId: data.catId,
            location: data.location || null,
            name: data.name,
        }).length) return { created, error: 'DB Error: Dublicated Data' }

        data.permissions = JSON.stringify(data.permissions)
        data.createdBy = await session.user.id()

        const [ result ] = await mysql.execute(query.roles.insert(data))
        const id = result.insertId
        if (!id) return { created, error: 'DB Error: Failed to write Data' }

        return { created, error, data: await Role.data(session, { id }) }
    }


    static #batch = (session, options = {}) => {
        if (!session?.user) return []

        let { params, filter } = options
        if (!params) params = {}
        if (!filter) filter = {}

        const { _id, id } = params
        const { catId, name, location } = filter

        const match = { id, catId, name, location }
        if (!match.id) match.id = Role.matchIdHash(_id)

        const batch = [
            {
                table: query.roles.table,
                fields: [ Role.hashId(), 'catId', 'location', 'name', 'permissions' ],
                match,
            },
        ]

        return batch
    }


    static data = async (session, params = {}) => {
        if (!params._id && !params.id) return

        const batch = Role.#batch(session, { params })
        const data = (await mysql.execute(Query.select(db.online, batch)))[0][0]

        return !data ? data : new Role(data)
    }


    static list = async (session, filter = {}) => {
        const batch = Role.#batch(session, { filter })
        const list = (await mysql.execute(Query.select(db.online, batch)))[0]

        list.forEach((data, i, arr) => arr[i] = new Role(data, true))

        return list
    }


    static find = async (session, params = {}) => {
        if (!session?.user) return { error: 'Invalid User' }

        const { name, catId, exclude } = params
        if (!name && !catId) return { error: 'Invalid Parameters' }
        let { location } = params
        if (location !== undefined && !location) location = null

        const match = { name, catId, location }
        if (exclude?._id) {
            const role = await Role.data(session, { _id: exclude._id })
            const id = await role.id()

            match.id = { not: id }
        }

        const data = (await mysql.execute(query.roles.select('id', { match: { name, catId, location } })))[0]

        return { found: data.length === 1 }
    }


    static userPermissions = async (session, userId) => {
        if (!session?.user) return []

        const [ permissions ] = await mysql.execute(Query.select(db.online, [
            {
                table: query.jx.roles.table,
                fields: User.hashId('userId'),
                match: { userId },
            },
            {
                table: query.roles.table,
                fields: 'permissions',
                join: [ 'id', 'roleId' ],
            },
        ]))

        return permissions
    }


}


export default User
export { Role, query }


export const adminBranchOnly = (req, res, next) => {
    if (res.session.branch !== 'admin') {
        const { errKey } = recognizeApi(req)

        return throwErr[errKey].auth(res, 'Error: Access allowed in Admin Environment only')
    }

    next()
}


export const superAdminUserOnly = (req, res, next) => {
    if (res.session.branch !== 'admin' || res.session.user.status[0] === 'A') {
        const { errKey } = recognizeApi(req)

        return throwErr[errKey].auth(res, 'Error: Access to this path is granted to Super Admin only<br><a href="/">Dashboard</a>')
    }
    next()
}


export const developerOnly = (req, res, next) => {
    if (res.session.branch !== 'admin' || res.session.user.status[0] !== 'D') {
        const { errKey } = recognizeApi(req)

        return throwErr[errKey].auth(res, 'Error: Access to this path is granted to Developer only<br><a href="/">Dashboard</a>')
    }
    next()
}


export const sessionError = (session, instructions = {}) => {
    let error

    if (!session?.user) error = 'Invalid User'
    else {
        const { user } = session
        let { status, branches, usOnly } = instructions
        if (!Array.isArray(branches)) branches = []
        if (typeof usOnly !== 'boolean') usOnly = false
        if (status === 'DS') usOnly = true

        if (['DS', 'DSA'].includes(status)) {
            switch (status) {
                case 'DS':
                    if (!user.DS) error = 'Invalid User Status: Super Admin only'
                    break
                case 'DSA':
                    if (!user.DSA) error = 'Invalid User Status: Admin only'
                    break
            }
        }

        if (error === undefined && branches.length) {
            const { branch } = session

            if (!branches.includes(branch)) error = 'Invalid Branch'
        }

        if (error === undefined && usOnly === true && user.location[0] !== 'US')
            error = 'Invalid User Location: US Users only' 
    }

    return error
}



/* Supportive Functions */


function determineUrl(branch, settings, lastUrl, defUrl) {
    let url = lastUrl || defUrl

    if (
        settings && typeof settings === 'object' &&
        branch in settings && 'lastUrl' in settings[branch] &&
        settings[branch].lastUrl === 0
    ) url = defUrl

    return url
}


function stripUrl(url, query, rmKey) {
    url = url.split('?')[0]

    delete query[rmKey]

    if (Object.keys(query).length) {
        url += '?'

        for (const key in query)
            url += `${key}=${query[key]}`
    }

    return url
}