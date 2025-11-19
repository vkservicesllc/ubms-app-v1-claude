require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_SESSION_TOKEN: tokenSecret } = process.env


/* Registry */
import inputLength from '../../../client/global/modules/registry/length.mjs'

/* Settings */
import config, { addrBook, userApps } from '../../../config.mjs'
import db from '../../settings/mysql.mjs'

/* Tools */
import Team, { query as teamQuery } from './team.mjs'
import Company, { query as companyQuery } from './company.mjs'
import Carrier, { query as carrierQuery } from './carrier.mjs'
//! Add more classes and query instances when more categories are available
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import recognizeApi from '../utils/api.mjs'
import transporter, { sender } from '../utils/nodemailer.mjs'
import { generateRandomString } from '../utils/string.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'

const { validationResult } = require('express-validator')
const mysql = require('../utils/mysql')
const sendError = require('../utils/error')


const { sqlMode } = Query
const query = {
    main: new Query(db.online, 'users'),
    registration: new Query(db.online, 'user_registration'),
    passReset: new Query(db.online, 'user_passreset'),
    roles: new Query(db.online, 'user_roles'),
    tokens: new Query(db.online, 'tokens'),
    sessions: new Query(db.online, 'sessions'),
    jx: {
        roles: new Query(db.online, 'user_role_map'),
        teams: new Query(db.online, 'user_team_map'),
        companies: new Query(db.business, 'user_company_map'),
    },
}



class User extends Person {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true, login = false } = {}) {
        if (!data?._id) throw new Error('Constructor Error: Invalid User Data')

        super(data)

        const props = { _id: data._id, _simpleId: data._simpleId }
        if (!hideRawId) props.id = data.id

        if (!hideSensitive) props.username = data.username
        props.email = data.email
        props.phone = data.phone
        props.status = data.status
        props.DS = data.status === 'S' || data.status === 'D'
        props.DSA = data.status !== 'U'
        props.condition = data.condition
        props.location = data.location
        props.unscoped = props.DS || !!data.unscoped
        props.self = !!data.self
        props.avaSrc = `/images/icons/gender/${this.gender}.png`

        if (!hideSensitive) {
            props.decliner = !!data.decliner
            props.passReset = data.passReset
            props.lastLogin = data.lastLogin
            props.lastBranch = data.lastBranch
            props.lastSiteId = data.lastSiteId
            props.lastUrl = data.lastUrl
        }

        if (login) {
            props.fails = data.fails
            props._hash = data._hash
        }

        this.count = {
            roles: data.roleCount,
            teams: data.teamCount,
            companies: data.companyCount,
        }

        this.expansion.status = User.list.status[data.status]
        this.expansion.condition = User.list.condition[data.condition]
        this.expansion.location = User.list.location[data.location]

        reSuper(this, props)

        if (single) {
            this.session = session


            this.add = async (target, ids = []) => {
                if (!this.session?.user?.id) throw new Error('User Add Error: No session user')
                if (!target) throw new Error('User Add Error: Target not supplied')
                if (!this.id) throw new Error('User Add Error: Personal ID is missing')

                const targets = relTargets('main', target)

                const data = []
                const [ Src, idProp, queryInst ] = targets
                const list = await Src.fetch(this.session, { ids })

                list.map(item => data.push({
                    userId: this.id,
                    [idProp]: item.id,
                    createdBy: session.user.id,
                }))

                const [ result ] = await mysql.execute(queryInst.insert(data))

                return result.affectedRows > 0
            }


            this.fetch = async (target, { hideRawId = false, hideSensitive = true, sorts = null, idsOnly = false } = {}) => {
                if (!this.session?.user?.id) throw new Error('User Fetch Error: No session user')
                if (!target) throw new Error('User Fetch Error: Target not supplied')

                const targets = relTargets('main', target), specTargets = [ 'carriers' ] //! Add more targets when more categories are available
                const special = specTargets.includes(target)

                const ids = []
                let Src, idProp, queryInst, defSorts

                if (special) {
                    const batch = [
                        {
                            table: query.jx.companies.table,
                            fields: 'companyId',
                            match: { userId: this.id || User.matchIdHash(this._id) },
                        },
                        {
                            table: companyQuery.main.table,
                            join: [ 'id', 'companyId' ],
                        },
                    ]

                    switch (target) {

                        case 'carriers':
                            Src = Carrier
                            batch[1].match = { category: 'crr' }
                            batch.push({
                                table: carrierQuery.main.table,
                                fields: 'id',
                            })
                            //! UNKNOWN SORT
                            break

                        //! Add more cases when more categories are available

                    }

                    const [ rows ] = await mysql.execute(Query.select(db.online, batch))

                    rows.map(row => {
                        const { id, companyId } = row

                        if (idsOnly) ids.push({ id, companyId })
                        else ids.push(id)
                    })
                } else {
                    [ Src, idProp, queryInst, defSorts ] = targets
                    if (!sorts) sorts = defSorts

                    const [ rows ] = await mysql.execute(queryInst.select(idProp, {
                        match: { userId: this.id || User.matchIdHash(this._id) },
                    }))
                    rows.map(row => ids.push(row[idProp]))
                }

                return idsOnly ? ids : await Src.fetch(this.session, { ids }, { hideRawId, hideSensitive, sorts })
            }


            this.update = async body => {
                const { user: sessionUser, branch } = this.session || {}
                if (!sessionUser || !branch) throw new Error('User Update Error: Session user or branch not found')
                if (!this.self && (this.status === 'D' || branch !== 'user')) throw new Error('User Update Error: Immune user or invalid branch')

                let updated = false
                
                body = processData(body, {
                    modifiedBy: sessionUser.id, branch,
                    currentData: this, currentUpdateLog: await this.log('updateLog'),
                })

                if (this.location !== 'US' && body.location !== 'US' && body.phone) body.phone = null

                const [ result ] = await mysql.execute(query.main.update(body, { id: this.id || User.matchIdHash(this._id) }))

                if (result.affectedRows) {
                    updated = true

                    if (['S', 'D'].includes(body.status))
                        for (const queryProp in query.jx)
                            await mysql.execute(query.jx[queryProp].delete({ userId: this.id || User.matchIdHash(this._id) }))

                    if (!this.username && body.email && this.email !== data.email) {
                        const { formId } = (await mysql.execute(query.registration.select('formId', { match: { userId: this.id } })))[0][0]

                        if (formId) {
                            this.invite(formId)

                            const [ result ] = await mysql.execute(query.registration.update({ invitedAt: Query.timeStamp }, {
                                userId: this.id || User.matchIdHash(this._id), formId,
                            }))
                            if (!result.affectedRows) throw new Error('User Update Error: Failed to update registration timestamp')
                        }
                    }
                }

                return updated
            }


            this.delete = async (target, ids) => {
                if (!this.session?.user?.id) throw new Error('User Delete Error: Session user not found')
                if (this.status === 'D') throw new Error('User Delete Error: Developer can not be deleted')

                const targets = relTargets('main', target)

                if (!target) {
                    const update = processData({ username: null, email: null, phone: null, condition: 'I' }, {
                        modifiedBy: sessionUserId,
                        currentData: this,
                        currentUpdateLog: await this.log('updateLog'),
                    })
                    update._passKey = null
                    update.deletedBy = session.user.id
                    update.deletedAt = Query.timeStamp

                    const [ result ] = await mysql.execute(query.main.update(update, { id: this.id || User.matchIdHash(this._id) }))
                    if (!result.affectedRows) return false

                    const match = { userId: this.id || User.matchIdHash(this._id) }
                    await mysql.execute(query.registration.delete(match))
                    await mysql.execute(query.passReset.delete(match))
                    await mysql.execute(query.tokens.delete(match))

                    return true
                } else if (ids.length) {
                    const idProp = targets[1]
                    const [ result ] = await mysql.execute(query.jx[target].delete({ [idProp]: ids }))

                    return result.affectedRows > 0
                }
            }


            this.invite = formId => {
                if (!formId) throw new Error('User Invitation Error: Form ID not supplied')

                const url = `${addrBook.user}/register/${this._id}?form=${formId}`

                const mailOpts = {
                    from: sender,
                    to: this.email,
                    subject: 'User Registration',
                    html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                        Dear ${this.name},<br/>
                        Welcome to ${config.site.name}!<br/><br/>
                        We are thrilled to have you join our team and look forward to your contributions.
                        To get started, we need you to complete a few simple steps to finalize your registration.<br/><br/>
                        Please follow the link below to complete your registration:<br/>
                        <a href="${url}" target="_blank">Proceed with Registration</a><br/><br/>
                        Kindly complete this process within the next 24 hours to ensure a smooth onboarding experience.
                    </div>`,
                }

                transporter.sendMail(mailOpts, error => {
                    if (error) console.error(error)
                })
            }


            this.inviter = async session => {
                let id = await this.log('createdBy')
                if (!id) return { name: appName, email: null }

                const user = await User.fetch(session, { id })
                const { name, email } = user

                return { name, email }
            }


            this.settings = async (action = 'fetch', data = {}) => {
                if (!this.self) return

                const match = { id: this.id || User.matchIdHash(this._id) }
                let settings = (await mysql.execute(query.main.select('settings', { match })))[0] || {}

                if (action === 'fetch') return settings

                if (action === 'update') {
                    if (!this.session.branch) throw new Error('User Settings Error: Session branch missing')

                    settings[this.session.branch] = data
                    settings = JSON.stringify(settings)

                    await mysql.execute(query.main.update({ settings }, match))
                }
            }


            this.url = async lastUrl => {
                if (lastUrl.slice(0, 5) === '/api/' || lastUrl.includes('/files/') || lastUrl.includes('/image/') || lastUrl.endsWith('.map')) return

                const { branch, siteId } = this.session || {}
                if (!branch) throw new Error('User URL Error: Session branch not supplied')

                const { id: userId, lastLogin } = this

                await mysql.execute(query.sessions.update(
                    { lastUrl },
                    { userId, siteId, branch, lastLogin }
                ))

                this.lastUrl = lastUrl
            }


            this.permissions = async () => {
                const { branch } = this.session || {}
                if ( !branch) throw new Error('User Permissions Error: Branch not found')

                const catList = Company.list.category
                let category

                for (const prop in catList) {
                    if (catList[prop].branch !== branch) continue
                    category = prop
                    break
                }

                if (!category) throw new Error('User Permissions Error: Category not determined')

                const batch = [
                    {
                        table: query.jx.roles.table,
                        match: { userId: this.id || User.matchIdHash(this._id) },
                    },
                    {
                        table: query.roles.table,
                        fields: 'permissions',
                        join: [ 'id', 'roleId' ],
                        match: { category, location: [ null, this.location ] },
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


            this.report = async session => {
                const result = { user: this }
                const log = await this.log()

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
                                    log.updateLog[i].data.status = User.list.status[updateLog[i].data.status]
                                    log.updateLog[i].oldData.status = User.list.status[updateLog[i].oldData.status]
                                    break
                                case 'location':
                                    log.updateLog[i].data.location = User.list.location[updateLog[i].data.location]
                                    log.updateLog[i].oldData.location = User.list.location[updateLog[i].oldData.location]
                                    break
                                case 'condition':
                                    log.updateLog[i].data.condition = User.list.condition[updateLog[i].data.condition]
                                    log.updateLog[i].oldData.condition = User.list.condition[updateLog[i].oldData.condition]
                                    break
                                case 'sex':
                                    const genders = { '0': 'Female', '1': 'Male' }
                                    const { sex } = updateLog[i].data
                                    const { sex: oldSex } = updateLog[i].oldData
                                    if ([0, 1].includes(sex)) log.updateLog[i].data.sex = genders[sex]
                                    if ([0, 1].includes(oldSex)) log.updateLog[i].oldData.sex = genders[oldSex]
                            }

                            if (!(prop in labels)) labels[prop] = labelList[prop]
                        }
                    }

                result.log = log
                result.labels = labels
        
                return result
            }


            this.log = async field => {
                const fields = ['createdBy', 'createdAt', 'deletedBy', 'deletedAt', 'updateLog']

                let log = (await mysql.execute(query.main.select(fields, {
                    match: { id: this.id || User.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }
        }
    }

    static #algorithm = 'SHA-512'
    static hashId = (field = 'id') => hash(field, User.#algorithm)
    static hashSimpleId = (field = 'id') => hash(field)
    static matchIdHash = value => matchHash(value, User.#algorithm)
    static matchSimpleIdHash = value => matchHash(value)

    static defSorts = null


    static idStr = async (target, length, queryInst) => {
        let idStr, found = true

        do {
            idStr = generateRandomString(length)

            const [ rows ] = await mysql.execute(queryInst.select(target, { match: { [target]: idStr }}))
            if (!rows.length) found = false
        } while (found)

        return idStr
    }

    static #formId = async () => await User.idStr('formId', inputLength.user.formId.max, query.registration)
    static #resetId = async () => await User.idStr('resetId', inputLength.user.resetId.max, query.passReset)


    static create = async ({ user: sessionUser = {} }, body = {}) => {
        if (!sessionUser.id) throw new Error('User Create Error: No session user')

        body = processData(body)

        const { email } = body
        if (await User.fetch({ user: sessionUser }, { email })) return

        body.createdBy = sessionUser.id

        let [ result ] = await mysql.execute(query.main.insert(body))
        const id = result.insertId

        if (!id) throw new Error('DB Error: Failed to create user')

        const formId = await User.#formId()
        (
            [ result ] = await mysql.execute(query.registration.insert({
                formId, userId: id,
                invitedBy: sessionUser.id,
            }))
        )
        if (!result.affectedRows) throw new Error('DB Error: Failed to register user')

        const user = await User.fetch({ user: sessionUser }, { id })
        if (!user) throw new Error('Fetch Error: New user not found')

        user.invite(formId)

        return user
    }


    static fetch = async (
        { user: sessionUser = {}, branch, siteId = null }, filter = {},
        { hideRawId = false, hideSensitive = true, combined = false, login = false, sorts = User.defSorts, mode = 'data' } = {}
    ) => {
        const { id: sessionUserId = null } = sessionUser
        if (!sessionUserId && !login) throw new Error('User Fetch Error: No session user')

        const join = [ 'userId', 'id' ]
        const batch = [
            {
                table: query.main.table,
                fields: [
                    'id', User.hashId(), [ User.hashSimpleId(), 'simpleId' ],
                    'username', 'email', 'phone',
                    'firstName', 'lastName', 'alias', 'sex',
                    'status', 'condition', 'location',
                    'passReset', 'unscoped', 'decliner', 'fails',
                    { compare: [ 'id', 'self', { eq: sessionUserId } ] },
                ],
                group: 'id',
            },
            {
                table: query.jx.roles.table,
                fields: [ { countDist: [ 'roleId', 'roleCount' ] } ],
                join,
            },
            {
                table: query.jx.teams.table,
                fields: [ { countDist: [ 'teamId', 'teamCount' ] } ],
                join,
            },
            {
                db: db.business,
                table: query.jx.companies.table,
                fields: [ { countDist: [ 'companyId', 'companyCount' ] } ],
                join,
            },
        ]

        if (branch)
            batch.push({
                table: query.sessions.table,
                fields: [ [ 'siteId', 'lastSiteId' ], [ 'branch', 'lastBranch' ], 'lastLogin', 'lastUrl' ],
                join: [ 'userId', 'id', { max: [ 'lastLogin', { branch, siteId } ] } ],
            })

        const {
            id, _id, _simpleId, username, email,
            ids, _ids, firstName, lastName, alias, sex, status, location, condition, decliner, deleted,
        } = filter

        const single = !!id || !!_id || !!_simpleId || !!username || !!email
        let deletedBy
        if (!combined)  deletedBy = deleted ? { null: false } : null

        batch[0].match = {
            deletedBy,
            id, username, email,
            firstName, lastName, alias, sex,
            status, location, condition, decliner,
        }

        if (!id) {
            if (ids) batch[0].match.id = ids
            else if (_simpleId) batch[0].match.id = User.matchSimpleIdHash(_simpleId)
            else batch[0].match.id = User.matchIdHash(_id || _ids)
        }

        if (login) {
            batch[0].fields.push([ '_passKey', '_hash' ])
            batch[4].fields.push({ ip: 'clientIp' })

            if (branch === 'admin') batch[0].match.status = [ 'D', 'S', 'A' ]
        } else {
            if (sessionUser?.location) {
                const location = sessionUser.location
                if (location !== 'US') batch[0].match.location = location
            }
        }
        if (branch && !single) batch[4].join[2].max = 'lastLogin'

        if (!single && Array.isArray(sorts))
            sorts.forEach((sort, i) => { if (sort) batch[i].sort = sort })

        if (mode === 'batch') return batch

        const queryStr = Query.select(db.online, batch)
        if (mode === 'query') return queryStr

        await mysql.query(sqlMode.onlyFullGroupBy.remove)
        const list = (await mysql.execute(queryStr))[0]

        const session = { user: { id: sessionUserId }, siteId, branch }
        list.forEach((data, i, arr) => arr[i] = new User(data, { single, login, session, hideRawId, hideSensitive }))

        return single ? list[0] : list
    }


    static find = async (session, params = {}) => {
        if (!session?.user) return { error: 'Invalid User' }

        const { username, email, exclude } = params
        if (!username && !email) return { error: 'Invalid Parameters' }

        const match = { username, email }
        if (exclude?._id) {
            const user = await User.fetch(session, { _id: exclude._id })

            match.id = { not: user.id }
        }

        const data = (await mysql.execute(query.main.select('id', { match })))[0]

        return { found: data.length === 1 }
    }


    static list = {

        condition: {
            'A': 'Active',
            'I': 'Inactive',
            'L': 'Locked',
        },

        location: {
            'US': 'USA',
            // 'CA': 'Canada',
            // 'MX': 'Mexico',
            'UA': 'Ukraine',
            // 'RU': 'Russia',
        },

        status: {
            'U': 'User',
            'A': 'Admin',
            'S': 'Super Admin',
            'D': 'Developer',
        },

    }


    static mw = {


        login: async (req, res) => {
            const api = recognizeApi(req)

            try {
                const validationFails = validationResult(req)
                const { errors } = validationFails

                const apiRes = api ? { error: {}, username: true, password: true, condition: 'A' } : null

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


                /* Step 1: Lookup User by Username */

                const { branch, siteId } = res.session
                const { username, password } = req.body
                let user = await User.fetch(res.session, { username }, { login: true, hideSensitive: false })

                // Interrupt if User not found
                if (!user) {
                    if (api) {
                        apiRes.username = false
                        apiRes.error.username = `${branch === 'admin' ? 'Admin' : 'User'} not found`

                        return res.send(apiRes)
                    } else return sendError.auth(res, 'Authentication failed: User not found')
                }


                /* Step 2: Verify Password if User found */

                const { loginAttempts } = config.session
                const { id, _hash, condition  } = user
                let { fails} = user

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
                                user = await User.fetch(res.session, { id }, { hideSensitive: false })

                                const currentData = { ...user }
                                const currentUpdateLog = await user.log('updateLog')
                                currentData.condition = user.condition

                                const options = { currentData, currentUpdateLog, modifiedBy: 0, modifiedIn: { branch } }
                                if (siteId) options.modifiedIn.siteId = siteId

                                update = processData(update, options)
                            }

                            await mysql.execute(query.main.update(update, { id }))
                        }
                    } else return sendError.auth(res, 'Authentication failed: User not verified')
                }


                /* Step 3: Check User's Condition if Password verified */

                if (condition !== 'A') {
                    const conditions = User.list.condition

                    if (api) {
                        apiRes.condition = condition
                        if (!apiRes.error.username)
                            apiRes.error.username = `User is ${conditions[condition].toLowerCase()}`
                    } else return sendError.auth(res, `Authentication failed: ${conditions[condition]} user`)
                }


                // Respond if API
                if (api) {
                    apiRes.fails = fails

                    return res.send(apiRes)
                }


                /* Step 4: Verify IP Token and redirect to Authentication page in User branch */

                //? Interrupt if User not found
                if (!user) return sendError.auth(res, 'Authentication failed: User not found')


                const { clientIp } = req.session
                const token = await Token.fetch({ userId: id, clientIp })
                const { key, verified, expired } = token

                if (!key || (!verified && expired)) await Token.create({ userId: id, clientIp })

                await mysql.execute(query.main.update({ fails: 0 }, { id }))

                res.redirect(authUrl(res.session, user._id, 'pending'))
            } catch (err) {
                sendError.server(res, err, api)
            }
        },


        session: async (req, res) => {
            try {
                const { clientIp } = req.session
                const { branch, siteId, defUrl } = res.session
                const { user: _id, token: providedToken } = req.body

                const user = await User.fetch(res.session, { _id }, { hideSensitive: false, login: true })
                if (!user) throw new Error('Session Error: User not found')

                const { id: userId } = user
                const token = await Token.fetch({ userId, clientIp })
                if (!token.key) throw new Error('Session Error: Token not found')

                const { key: tokenKey, verified, expired } = token

                if (!verified) {
                    if (tokenKey !== providedToken) return res.redirect(authUrl(res.session, _id, 'mismatch'))
                    else if (expired) {
                        await Token.create({ userId, clientIp })
                        return res.redirect(authUrl(res.session, _id, 'expired'))
                    } else await token.verify()
                }

                const settings = await user.settings()
                let { lastUrl } = user
                let url = lastUrl || '/'
                if (settings?.[branch]?.lastUrl === 0) url = defUrl

                const body = { userId, siteId, branch, clientIp: { ip: clientIp } }
                if (lastUrl) body.lastUrl = lastUrl

                const [ result ] = await mysql.execute(query.sessions.insert(body))

                if (!result.affectedRows) {
                    if (req.session.user) delete req.session.user
                    if (res.session.user) delete res.session.user
                    if (req.session.team) delete req.session.team
                    if (res.session.team) delete res.session.team

                    return req.session.destroy((err) => {
                        if (err) return res.status(500).send('Failed to log out')
            
                        return sendError.auth(res, 'Authentication failed: Session failed')
                    })
                }

                const _token = await Bun.password.hash(tokenKey)

                req.session.user = _id
                res.cookie('connect.token', _token, { httpOnly: true })

                res.redirect(url)
            } catch (err) {
                sendError.server(res, err)
            }
        },


        verify: async (req, res, next) => {
            const api = recognizeApi(req)

            try {
                const { method, originalUrl, query } = req
                const { user: _id, clientIp } = req.session
                const { excUrl, branch, siteId, teams, companies, userApp } = res.session //! RECONSIDER

                const reject = async apiErrMsg => {
                    if (api) sendError.auth(res, apiErrMsg, api)
                    else {
                        const { refer } = query
                        const { logoutUrl } = config.session

                        if (refer) {
                            const user = await User.fetch(session, { _id: refer }, { hideSensitive: false })
                            if (method !== 'POST' && !excUrl.includes(originalUrl))
                                await user.url(stripUrl(originalUrl, query, 'refer'))
                        }

                        if (!next) return false
                        else return res.redirect(logoutUrl)
                    }
                }

                if (!_id) return await reject('Authentication check failed: Not authenticated')

                const user = await User.fetch(res.session, { _id }, { login: true, hideSensitive: false })

                if (!user) {
                    User.mw.logout(req, res)
                    return sendError.auth(res, 'Authentication check failed: No user found', api)
                }

                const connectToken = req.cookies['connect.token']
                const { key: token } = await Token.fetch({ userId: user.id, clientIp })

                if (!connectToken || !token || !(await Bun.password.verify(token, connectToken)))
                    return await reject('Authentication check failed: Token verification failed')

                if (res.session.branch === 'admin' && user.status === 'U')
                    return await reject('Authentication check failed: Unauthorized Environment')

                if (user.DS && user.location !== 'US')
                    return await reject('Verification failed: Incorrect status in current location')

                if (query.refer) {
                    const newUrl = stripUrl(originalUrl, query, 'refer')

                    if (method !== 'POST') await user.url(newUrl)
                    return res.redirect(newUrl)
                }

                if (method !== 'POST' && !excUrl.includes(originalUrl))
                    await user.url(originalUrl)

                user.session = {
                    branch, siteId,
                    user: { id: user.id },
                }

                if (!next) return user

                res.session.user = user
                next()
            } catch (err) {
                sendError.server(res, err, api)
            }
        },


        superAdminOnly: async (req, res, next) => {
            if (res.session.branch !== 'admin' || res.session.user.status === 'A') {
                const api = recognizeApi(req)
        
                return sendError.auth(res, 'Error: Access to this path is granted to Super Admin only<br><a href="/">Home</a>', api)
            }
            next()
        },


        developerOnly: async (req, res, next) => {
            if (res.session.branch !== 'admin' || res.session.user.status === 'D') {
                const api = recognizeApi(req)
        
                return sendError.auth(res, 'Error: Access to this path is granted to Developer only<br><a href="/">Home</a>', api)
            }
            next()
        },


        logout: (req, res) => {
            if (req.session.user) delete req.session.user
            if (res.session.user) delete res.session.user
            if (req.session.team) delete req.session.team
            if (res.session.team) delete res.session.team

            return req.session.destroy((err) => {
                if (err) return res.status(500).send('Failed to log out')

                res.redirect('/')
            })
        },


    }


}



class Role {
    constructor(data = {}, { single = true, session, hideRawId = false } = {}) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Role Data')

        this._id = data._id
        if (!hideRawId) this.id = data.id

        this.category = data.category
        this.location = data.location
        this.name = data.name
        this.permissions = data.permissions

        this.expansion = {
            location: data.location ? User.list.location[data.location] : null,
            category: data.category ? Company.list.category[data.category].item[1] : null,
            categoryGroup: data.category ? Company.list.category[data.category].item[0] : null,
        }

        if (single) {
            this.session = session


            this.add = async (target, ids = []) => {
                if (!this.session?.user?.id) throw new Error('Role Add Error: No session user')
                if (!target) throw new Error('Role Add Error: Target not supplied')
                if (!this.id) throw new Error('Role Add Error: Personal ID is missing')

                const targets = relTargets('role', target)
                const data = []
                const [ Src, idProp, queryInst ] = targets
                const list = await Src.fetch(this.session, { ids })

                list.map(item => data.push({
                    roleId: this.id,
                    [idProp]: item.id,
                    createdBy: session.user.id,
                }))

                const [ result ] = await mysql.execute(queryInst.insert(data))

                return result.affectedRows > 0
            }


            this.fetch = async (target, { hideRawId = false, hideSensitive = true, sorts = null, idsOnly = false } = {}) => {
                if (!this.session?.user?.id) throw new Error('Role Fetch Error: No session user')
                if (!target) throw new Error('Role Fetch Error: Target not supplied')

                const targets = relTargets('role', target)
                const [ Src, idProp, queryInst, defSorts ] = targets
                if (!sorts) sorts = defSorts

                const ids = []
                const [ rows ] = await mysql.execute(queryInst.select(idProp, {
                    match: { roleId: this.id || Role.matchIdHash(this._id) },
                }))

                rows.map(row => ids.push(row[idProp]))

                return idsOnly ? ids : await Src.fetch(this.session, { ids }, { hideRawId, hideSensitive, sorts })
            }


            this.update = async body => {
                if (!this.session?.user?.id) throw new Error('Role Update Error: Session user not found')

                const { permissions } = body
                delete body.permissions
                
                body = processData(body, {
                    modifiedBy: sessionUser.id,
                    currentData: this, currentUpdateLog: await this.log('updateLog'),
                })
                body.permissions = JSON.stringify(permissions)

                const [ result ] = await mysql.execute(query.roles.update(body, { id: this.id || Role.matchIdHash(this._id) }))
                
                return result.affectedRows > 0
            }


            this.delete = async (target, ids = []) => {
                if (!this.session?.user?.id) throw new Error('Role Delete Error: Session user not found')

                const targets = relTargets('role', target)

                if (!target) {
                    if (!this.id) throw new Error('Role Delete Error: Personal ID missing')

                    const { id } = this
                    const log = await this.log()

                    const [ result ] = await mysql.execute(query.roles.delete({ id }))
                    if (!result.affectedRows) return false

                    for (const prop in log) this[prop] = log[prop]
                    await logDeletion(session, 'roles', this, { id })

                    return true
                } else if (ids.length) {
                    const idProp = targets[1]
                    const queryInst = targets[2]

                    const [ result ] = await mysql.execute(queryInst.delete({ [idProp]: ids }))

                    return result.affectedRows > 0
                }
            }


            this.log = async field => {
                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]

                let log = (await mysql.execute(query.roles.select(fields, {
                    match: { id: this.id || Role.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }
        }
    }

    static #algorithm = 'SHA-1'
    static hashId = (field = 'id') => hash(field, Role.#algorithm)
    static matchIdHash = value => matchHash(value, Role.#algorithm)

    static defSorts = [ [ 'name', 'location', 'category' ] ]


    static create = async ({ user: sessionUser = {} }, body = {}) => {
        if (!sessionUser.id) throw new Error('Role Create Error: No session user')
            
        body = processData(body)

        const { name, category, location } = body
        if (await Role.fetch({ user: sessionUser }, { name, category, location })) return

        body.permissions = JSON.stringify(body.permissions)
        body.createdBy = sessionUser.id

        const [ result ] = await mysql.execute(query.roles.insert(body))
        const id = result.insertId

        if (!id) throw new Error('DB Error: Failed to create role')

        const role = await Role.fetch({ user: sessionUser }, { id })
        if (!role) throw new Error('Fetch Error: New role not found')

        return role
    }


    static fetch = async ({ user: sessionUser = {} } = {}, filter = {}, { hideRawId = false, sorts = Role.defSorts, mode = 'data' } = {}) => {
        if (!sessionUser.id) throw new Error('Role Fetch Error: No session user')

        const {
            id, _id,
            ids, _ids, category, name, location,
        } = filter
        const single = !!id || !!_id

        const match = { id, category, name, location }
        if (!id) {
            if (ids) match.id = ids
            else match.id = Role.matchIdHash(_id || _ids)
        }

        const batch = [
            {
                table: query.roles.table,
                fields: [ 'id', Role.hashId(), 'category', 'location', 'name', 'permissions' ],
                match,
            },
        ]

        if (!single && Array.isArray(sorts))
            sorts.forEach((sort, i) => { if (sort) batch[i].sort = sort })

        if (mode === 'batch') return batch

        const queryStr = Query.select(db.online, batch)
        if (mode === 'query') return queryStr

        const session = { user: { id: sessionUser.id } }
        const list = (await mysql.execute(queryStr))[0]
        list.forEach((data, i, arr) => arr[i] = new Role(data, { single, session, hideRawId }))

        return single ? list[0] : list
    }


    static find = async (session, params = {}) => {
        if (!session?.user) return { error: 'Invalid User' }

        const { name, category, exclude } = params
        if (!name && !category) return { error: 'Invalid Parameters' }
        let { location } = params
        if (location !== undefined && !location) location = null

        const match = { name, category, location }
        if (exclude?._id) {
            const role = await Role.fetch(session, { _id: exclude._id })

            match.id = { not: role.id }
        }

        const data = (await mysql.execute(query.roles.select('id', { match: { name, category, location } })))[0]

        return { found: data.length === 1 }
    }


}



class Token {
    constructor(data = {}) {
        if (!data?.tokenKey) throw new Error('Constructor Error: Invalid Token Data')

        this.key = stringifyBuffer(data.tokenKey)
        this.userId = data.userId
        this.clientIp = data.clientIp
        this.verified = !!data.verified
        this.createdAt = data.createdAt
        this.expiresAt = new Date(this.createdAt).getTime() + data.tokenAge * 60 * 1000
        this.expired = new Date >= this.expiresAt
    }

    verify = async ({ queryInst = query.tokens } = {}) => {
        const clientIp = { ip: this.clientIp }
        const token = { aes: [ this.key, tokenSecret ]}

        const [ result ] = await mysql.execute(queryInst.update({ verified: true }, {
            userId: this.userId,
            clientIp, token,
        }))

        if (!result.affectedRows) throw new Error('DB Error: Token verification failed')
    }


    static create = async ({ userId, clientIp }, { queryInst = query.tokens, UserSrc = User } = {}) => {
        let token = generateRandomString(inputLength.user.token.max, 'd')

        await mysql.execute(queryInst.delete({ userId, clientIp: { ip: clientIp } }))

        const [ result ] = await mysql.execute(queryInst.insert({
            userId, clientIp: { ip: clientIp },
            token: { aes: [ token, tokenSecret ]},
        }))
        if (!result.affectedRows) throw new Error('DB Error: Failed to register token')

        if (config.notification.email.authToken) {
            const { tokenAge } = config.session
            const tokenExpiration = `${tokenAge} minute${tokenAge > 1 ? 's' : ''}`

            const user = await UserSrc.fetch({}, { id: userId }, { login: true })
            if (!user) throw new Error('Token Delivery Error: User not found')

            const mailOpts = {
                from: sender,
                to: user.email,
                subject: 'New Authentication Token',
                html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                    <p>
                        Your one-time Security Token is <strong style="padding: 4px; outline: 1px solid lightgrey;">${token}</strong>.<br />
                        The token will expire in ${tokenExpiration}.
                    </p>
                    <p>
                        <em style="background-color: yellow;">To ensure your security, keep this token confidential.</em><br />
                        No one from ${config.site.name} will request this number from you.
                    </p>
                    <p>
                        <span style="color: red;">If someone requests this token, do <u>NOT</u> disclose it.</span>
                    </p>
                </div>`,
            }

            transporter.sendMail(mailOpts, error => {
                if (error) console.error({ error })
            })
        }

        return await Token.fetch({ userId, clientIp })
    }


    static fetch = async ({ userId, clientIp }, { queryInst = query.tokens, UserSrc = User } = {}) => {
        const [ rows ] = await mysql.execute(queryInst.select([
            [ { aes: [ 'token', tokenSecret ] }, 'tokenKey' ],
            'verified', 'createdAt',
        ], { match: { userId, clientIp: { ip: clientIp } } }))

        if (!rows.length) return {}

        return new Token({ userId, clientIp, ...rows[0] })
    }


}



function relTargets(src, target = null) {
    const targets =  {
        main: {
            roles: [ Role, 'roleId', query.jx.roles, Role.defSorts ],
            teams: [ Team, 'teamId', query.jx.teams, Team.defSorts ],
            companies: [ Company, 'companyId', query.jx.companies, [ null, [ 'busName', 'coType' ] ] ],
        },
        role: {
            users: [ User, 'userId', query.jx.roles, User.defSort ],
        },
    }[src]

    return target ? targets[target] : targets
}



delete User.formSelect

export default User
export { Role, Token, query, relTargets }



function authUrl(session, _id, status) { return `${addrBook.user}/authenticate?user=${_id}&branch=${btoa(session.branch)}&site=${btoa(session.siteId)}&status=${status}` }



/* Supportive Functions */


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