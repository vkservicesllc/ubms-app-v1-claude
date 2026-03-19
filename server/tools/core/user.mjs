const { DB__MYSQL_AES_SESSION_TOKEN: tokenSecret, DIR__PATH: dir } = Bun.env


/* Registry */
import inputLength from '../../../client/global/modules/registry/length.mjs'

/* Settings */
import config, { addrBook, userApps } from '../../../config.mjs'
import db, { query } from '../../settings/mysql.mjs'

/* Tools */
import Team from './team.mjs'
import Company from './company.mjs'
//! Add more classes and query instances when more categories are available
import Individual from './individual.mjs'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import { classInstance, classStatic } from '../utils/class.mjs'
import transporter, { sender } from '../utils/nodemailer.mjs'
import { generateRandomString } from '../utils/string.mjs'
import { processData } from '../utils/data.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import { utcTimeStamp, utc2tz, tz2utc } from '../utils/date.mjs'
import { respond404 } from '../utils/response.mjs'

const fs = require('fs')
const { validationResult } = require('express-validator')
const mysql = require('../utils/mysql')
const recognizeApi = require('../utils/api')
const sendError = require('../utils/error')



class User extends Person {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true, custom = {} } = {}) {
        if (!data?._id) throw new Error('Constructor Error: Invalid User Data')

        super(data)

        const { offline = false, auth = false, hideEvents = true } = custom
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
        props.avaSrc = `/images/icons/gender/${this.gender || 'X'}.png`

        if (offline && auth) {
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

        if (!hideEvents) {
            this.events = {
                passReset: data.passReset,
                lastLogin: utc2tz(data.lastLogin),
                lastBranch: data.lastBranch,
                lastSiteId: data.lastSiteId,
                lastUrl: data.lastUrl,
                declinedAt: utc2tz(data.declinedAt),
            }
        }

        reSuper(this, props)

        if (single) {
            this.session = session || {}
            this.session.offline = offline
            this.config = { hideRawId, hideSensitive }


            this.add = (target, ids = []) => {
                if (!this.session?.user?.id) throw new Error('User Constructor Method Error [ADD]: Session user not supplied')

                return classInstance.add(this, new.target, target, ids)
            }


            this.fetch = (target, filter, params) => classInstance.fetch(this, new.target, target, filter, params)


            this.update = body => {
                const { session } = this
                if (!session?.user?.id) throw new Error('User Constructor Method Error [UPDATE]: Session user not supplied')

                return classInstance.update(this, new.target, 'main', body, {}, {
                    async final(user, body) {
                        user = await User.fetch(session, { _id: user._id }, { hideSensitive: false }) //* Original user does not have a username prop
                        const { status, email } = body

                        if (email && user.email !== email && !user.username) {
                            if (user.events === undefined) throw new Error('Failed to reinvite user due to missing event property')
                            
                            if (!user.events.declinedAt) {
                                user = await User.fetch(session, { id: user.id })
                                await user.invite()
                            }
                        }

                        if (!['S', 'D'].includes(status)) return

                        const { jxTargets } = User.config()
                        for (const target in jxTargets) {
                            const [ jxQuery ] = jxTargets[target]

                            await mysql.execute(jxQuery.delete({ userId: user.id }))
                        }
                        await user.update({ unscoped: true })
                    },
                })
            }


            this.delete = (target, ids = []) => {
                if (!this.session?.user?.id) throw new Error('User Constructor Method Error [DELETE]: Session user not supplied')

                return classInstance.delete(this, new.target, target, ids, async () => {
                    const config = User.config()

                    const update = await processData({ username: null, email: null, phone: null, condition: 'I' }, {
                        query: config.query, match: { id: this.id }, skipLog: true,
                    })
                    update._passKey = null
                    update.deletedBy = this.session.user.id
                    update.deletedAt = Query.timeStamp

                    const [ result ] = await mysql.execute(query.user.main.update(update, { id: this.id || User.matchIdHash(this._id) }))
                    if (!result.affectedRows) throw new Error('Failed to delete the user')

                    const match = { userId: this.id || User.matchIdHash(this._id) }
                    await mysql.execute(query.user.registration.delete(match))
                    await mysql.execute(query.user.passReset.delete(match))
                    await mysql.execute(query.session.token.delete(match))

                    const { jxTargets } = config

                    for (const target in jxTargets) {
                        const [ jxQuery ] = jxTargets[target]

                        await mysql.execute(jxQuery.delete(match))
                    }

                    return true
                })
            }


            this.reset = async () => {
                if (!this.session?.user?.id) throw new Error('User Constructor Method Error [RESET]: Session user not supplied')

                const userId = this.id
                const resetId = await User.#resetId()
                const createdBy = this.session.user.id
                
                await mysql.execute(query.user.passReset.delete({ userId }))
                let [ result ] = await mysql.execute(query.user.passReset.insert({ resetId, userId, createdBy }))
                if (!result.affectedRows) {
                    throw new Error('Failed to register reset credentials')
                }

                [ result ] = await mysql.execute(query.user.main.update({ _passKey: null, passReset: true }, { id: userId }))
                if (!result.affectedRows) throw new Error('Failed to reset user')

                const { email } = this

                const url = `${addrBook.user}/pass-reset/${this._id}?form=${resetId}`
                const mailOpts = {
                    from: sender,
                    to: email,
                    subject: 'Password Reset',
                    html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                        Dear ${this.fullName('AL')},<br/>
                        Your request to reset the password has been received.
                        A secure link has been generated for you to create a new password. Please click the link below to proceed:<br/><br/>
                        <a href="${url}" target="_blank">Reset Password</a><br/><br/>
                        Best ragards,<br/>
                        ${config.site.name} Administration
                    </div>`,
                }

                transporter.sendMail(mailOpts, error => {
                    if (error) console.error(error)
                })
            }


            this.invite = async () => {
                if (!this.session?.user?.id) throw new Error('User Constructor Method Error [INVITE]: Session user not supplied')

                const [ rows ] = await mysql.execute(query.user.registration.select('formId', { match: { userId: this.id } }))
                if (rows.length !== 1) throw new Error('Registration Form ID could not be located')

                const { formId } = rows[0]
                const url = `${addrBook.user}/register/${this._id}?form=${formId}`

                const mailOpts = {
                    from: sender,
                    to: this.email,
                    subject: 'User Registration',
                    html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                        Dear ${this.fullName('AL')},<br/>
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


            this.inviter = async () => {
                let id = await this.log({ field: 'createdBy' })
                if (!id) return { name: config.site.name, email: null }

                const { offline } = this.session

                const user = await User.fetch(this.session, { id }, { offline })
                const { email } = user
                const name = user.fullName('AL')

                return { name, email }
            }


            this.settings = async (action = 'fetch', data = {}) => {
                const match = { id: this.id || User.matchIdHash(this._id) }
                let settings = (await mysql.execute(query.user.main.select('settings', { match })))[0][0].settings || {}

                if (action === 'fetch') return settings

                if (action === 'update') {
                    if (!this.session.branch) throw new Error('User Settings Error: Session branch missing')

                    settings[this.session.branch] = data
                    settings = JSON.stringify(settings)

                    await mysql.execute(query.user.main.update({ settings }, match))
                }
            }


            this.url = async lastUrl => {
                if (lastUrl.slice(0, 5) === '/api/' || lastUrl.includes('/files/') || lastUrl.includes('/image/') || lastUrl.endsWith('.map')) return

                const { branch, siteId } = this.session || {}
                if (!branch) throw new Error('User URL Error: Session branch not supplied')

                const { id: userId } = this
                const lastLogin = tz2utc(this.events.lastLogin)

                await mysql.execute(query.session.main.update(
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
                        table: query.jx.users_roles.table,
                        match: { userId: this.id || User.matchIdHash(this._id) },
                    },
                    {
                        table: query.role.main.table,
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


            this.password = async newPassword => {
                const { id } = this
                if (this.session?.user?.id !== this.id) return false

                const _passKey = await Bun.password.hash(newPassword)
                const [ result ] = await mysql.execute(query.user.main.update({ _passKey }, { id }))

                return result.affectedRows > 0
            }


            this.report = async () => {
                const result = { data: { ...this } }
                const log = await this.log()

                delete result.data.id
                delete result.data.session

                const { createdBy, deletedBy, updateLog } = log
                /*
                    The timestamps will only be correct on the Live Server
                    if it is set up with UTC tz
                */

                let ids = [ createdBy ]
                if (deletedBy) ids.push(deletedBy)

                if (updateLog)
                    updateLog.forEach(log => {
                        ids.push(log.modifiedBy)
                    })
                ids = [ ...new Set(ids) ]

                const labelList = {
                    username: 'Username',
                    status: 'Status',
                    location: 'Location',
                    condition: 'Condition',
                    unscoped: 'Unscoped',
                    fails: 'Login Attempts',
                    email: 'Email',
                    phone: 'US Cell Phone',
                    firstName: 'First Name',
                    lastName: 'Last Name',
                    alias: 'Alias',
                    gender: 'Gender',
                }
                const labels = {}
                const names = {}
                const users = await User.fetch(this.session, { ids })

                if (users)
                    for (let i = 0; i < users.length; i++) {
                        const { id } = users[i]
                        names[id] = users[i].fullName('AL')
                    }

                log.createdBy = names[createdBy] || config.site.name
                if (deletedBy) log.deletedBy = names[deletedBy]

                if (updateLog)
                    for (let i = 0; i < updateLog.length; i++) {

                        log.updateLog[i].modifiedBy = names[updateLog[i].modifiedBy] || config.site.name

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
                                case 'gender':
                                    log.updateLog[i].data.gender = Individual.list.gender[updateLog[i].data.gender] || null
                                    log.updateLog[i].oldData.gender = Individual.list.gender[updateLog[i].oldData.gender] || null
                                case 'unscoped':
                                    log.updateLog[i].data.unscoped = !!log.updateLog[i].data.unscoped
                                    log.updateLog[i].oldData.unscoped = !!log.updateLog[i].oldData.unscoped
                            }

                            if (!(prop in labels)) labels[prop] = labelList[prop]
                        }
                    }

                result.log = log
                result.labels = labels
        
                return result
            }


            this.sign = () => this.fullName('AL')


            this.log = params => classInstance.log(this, new.target, params)
        }
    }

    static #algorithm = 'SHA-512'
    static hashId = (field = 'id') => hash(field, User.#algorithm)
    static hashSimpleId = (field = 'id') => hash(field)
    static matchIdHash = value => matchHash(value, User.#algorithm)
    static matchSimpleIdHash = value => matchHash(value)

    static config = () => ({
        enforceUser: false,
        enforceLocation: 'update',
        db: db.online,
        query: query.user,
        idProp: 'userId',
        jxTargets: jxTargets('user'),
        defSorts: [ [ 'firstName', 'alias', 'lastName', 'status', 'location' ] ],
        logDeleted: false,
    })


    static #idStr = async (idField, length, queryInst) => {
        let idStr, found = true

        do {
            idStr = generateRandomString(length)

            const [ rows ] = await mysql.execute(queryInst.select(idField, { match: { [idField]: idStr }}))
            if (!rows.length) found = false
        } while (found)

        return idStr
    }

    static #formId = async () => await User.#idStr('formId', inputLength.user.formId.max, query.user.registration)
    static #resetId = async () => await User.#idStr('resetId', inputLength.user.resetId.max, query.user.passReset)


    static create = ({ user: sessionUser = {}, branch, siteId = null }, body, params) => {
        if (!sessionUser.id) throw new Error('User Static Method Error [CREATE]: Session user not supplied')

        return classStatic.create(this, { user: sessionUser, branch, siteId }, body, params, {
            async final(user, userId) {
                const formId = await User.#formId()

                const [ result ] = await mysql.execute(query.user.registration.insert({
                    formId, userId,
                    invitedBy: sessionUser.id,
                }))
                if (!result.affectedRows) throw new Error('DB Error: Failed to register user')

                await user.invite()
            },
        })
    }


    static fetch = ({ user: sessionUser = {}, branch, siteId = null }, filter,
        { hideRawId = false, hideSensitive = true, combined = false, offline = false, auth = false, hideEvents = true, sorts = User.config().defSorts, limit, mode } = {}
    ) => {
        if (!offline) {
            if (!sessionUser?.id) throw new Error('User Static Method Error [FETCH]: Session user not supplied')
            auth = false
        }

        const join = [ 'userId', 'id' ]

        return classStatic.fetch(this, { user: sessionUser, branch, siteId }, filter, { hideRawId, hideSensitive, sorts, limit, mode }, {
            removeFullGroupBy: true,
            batch: [
                {
                    table: query.user.main.table,
                    fields: [
                        'id', User.hashId(), [ User.hashSimpleId(), 'simpleId' ],
                        'username', 'email', 'phone',
                        'firstName', 'lastName', 'alias', 'gender',
                        'status', 'condition', 'location',
                        'passReset', 'unscoped', 'fails', 'declinedAt',
                        { compare: [ 'id', 'self', { eq: sessionUser.id } ] },
                    ],
                    group: 'id',
                },
                {
                    table: query.jx.users_roles.table,
                    fields: { countDist: [ 'roleId', 'roleCount' ] },
                    join,
                },
                {
                    table: query.jx.users_teams.table,
                    fields: { countDist: [ 'teamId', 'teamCount' ] },
                    join,
                },
                {
                    db: db.business,
                    table: query.jx.users_companies.table,
                    fields: { countDist: [ 'companyId', 'companyCount' ] },
                    join,
                },
                {
                    table: query.session.main.table,
                    fields: [ [ 'siteId', 'lastSiteId' ], [ 'branch', 'lastBranch' ], 'lastLogin', 'lastUrl' ],
                    join: [ 'userId', 'id', { max: [ 'lastLogin', { branch, siteId } ] } ],
                },
            ],
            prepare(batch, filter) {
                if (branch)
                    batch.push()

                const {
                    id, _id, _simpleId, username, email,
                    ids, _ids, firstName, lastName, alias, gender, status, location, condition, declined, deleted, unscoped,
                } = filter

                const single = !!id || !!_id || !!_simpleId || !!username || !!email

                let deletedAt, declinedAt
                if (!combined) {
                    deletedAt = deleted ? { null: false } : null
                    if (typeof deleted === 'boolean') deletedAt = { null: !declined }
                    if (typeof declined === 'boolean') declinedAt = { null: !declined }
                }

                batch[0].match = {
                    deletedAt, declinedAt, unscoped,
                    id, username, email,
                    firstName, lastName, alias, gender,
                    status, location, condition,
                }

                if (!id) {
                    if (ids) batch[0].match.id = ids
                    else if (_simpleId) batch[0].match.id = User.matchSimpleIdHash(_simpleId)
                    else batch[0].match.id = User.matchIdHash(_id || _ids)
                }

                if (offline) {
                    if (auth) batch[0].fields.push([ '_passKey', '_hash' ])
                    batch[4].fields.push({ ip: 'clientIp' })

                    if (branch === 'admin') batch[0].match.status = [ 'D', 'S', 'A' ]
                }

                if (!single) batch[4].join[2].max = 'lastLogin'

                return { single, batch, custom: { offline, auth, hideEvents } }
            },
        })
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
                let user = await User.fetch(res.session, { username }, { offline: true, auth: true, hideSensitive: false })

                // Interrupt if User not found
                if (!user) {
                    if (api) {
                        apiRes.username = false
                        apiRes.error.username = `${branch === 'admin' ? 'Admin' : 'User'} not found`

                        return res.send(apiRes)
                    } else return sendError.auth(req, res, 'Authentication failed: User not found')
                }


                /* Step 2: Verify Password if User found */

                const { loginAttempts } = config.session
                const { id, _hash, condition } = user
                let { fails } = user

                const matched = await Bun.password.verify(password, _hash)

                // Interrupt if Password mismatched
                // Increment Fails if API or alter Status if Limit is reached
                if (!matched) {
                    if (api) {
                        apiRes.password = false
                        apiRes.error.password = 'Incorrect password'

                        if (fails <= loginAttempts && condition !== 'L') {
                            fails++
                            let update = { fails }
                            if (fails === loginAttempts) update.condition = 'L'
                            update = await processData(update, { query: User.config().query, match: { id }, modifiedBy: 0, branch, siteId })

                            await mysql.execute(query.user.main.update(update, { id }))
                        }
                    } else return sendError.auth(req, res, 'Authentication failed: User not verified')
                }


                /* Step 3: Check User's Condition if Password verified */

                if (condition !== 'A') {
                    const conditions = User.list.condition

                    if (api) {
                        apiRes.condition = condition
                        if (!apiRes.error.username)
                            apiRes.error.username = `User is ${conditions[condition].toLowerCase()}`
                    } else return sendError.auth(req, res, `Authentication failed: ${conditions[condition]} user`)
                }


                // Respond if API
                if (api) {
                    apiRes.fails = fails

                    return res.send(apiRes)
                }


                /* Step 4: Verify IP Token and redirect to Authentication page in User branch */

                //? Interrupt if User not found
                if (!user) return sendError.auth(req, res, 'Authentication failed: User not found')


                const { clientIp } = req.session
                const token = await Token.fetch({ userId: id, clientIp })
                const { key, verified, expired } = token

                if (!key || (!verified && expired)) await Token.create({ userId: id, clientIp })

                await mysql.execute(query.user.main.update({ fails: 0 }, { id }))

                res.redirect(authUrl(res.session, user._id, 'pending'))
            } catch (err) {
                sendError.server(req, res, err)
            }
        },


        session: async (req, res) => {
            try {
                const { clientIp } = req.session
                const { branch, siteId, defUrl } = res.session
                const { user: _id, token: providedToken } = req.body

                const user = await User.fetch(res.session, { _id }, { offline: true, hideSensitive: false, hideEvents: false })
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
                let { lastUrl } = user.events

                let url = lastUrl || '/'

                if (settings?.[branch]?.lastUrl == 0) url = defUrl

                const body = { userId, siteId, branch, clientIp: { ip: clientIp } }
                if (lastUrl) body.lastUrl = lastUrl

                const [ result ] = await mysql.execute(query.session.main.insert(body))

                if (!result.affectedRows) {
                    if (req.session.user) delete req.session.user
                    if (res.session.user) delete res.session.user
                    if (req.session.team) delete req.session.team
                    if (res.session.team) delete res.session.team
                    if (res.session.client) delete res.session.client

                    return req.session.destroy((err) => {
                        if (err) return res.status(500).send('Failed to log out')
            
                        return sendError.auth(req, res, 'Authentication failed: Session failed')
                    })
                }

                const _token = await Bun.password.hash(tokenKey)

                req.session.user = _id
                res.cookie('connect.token', _token, { httpOnly: true })

                res.redirect(url)
            } catch (err) {
                sendError.server(req, res, err)
            }
        },


        verify: async (req, res, next) => {
            const api = recognizeApi(req)

            try {
                const { method, originalUrl, query } = req
                const { user: _id, clientIp } = req.session
                const { excUrl, branch, siteId } = res.session

                const reject = async apiErrMsg => {
                    if (api) sendError.auth(req, res, apiErrMsg)
                    else {
                        const { refer } = query
                        const { logoutUrl } = config.session

                        if (refer) {
                            const user = await User.fetch(res.session, { _id: refer }, { hideSensitive: false, hideEvents: false, offline: true })

                            if (method !== 'POST' && !excUrl.includes(originalUrl))
                                await user.url(stripUrl(originalUrl, query, 'refer'))
                        }

                        if (!next) return false
                        else return res.redirect(logoutUrl)
                    }
                }

                if (!_id) return await reject('Authentication check failed: Not authenticated')

                const user = await User.fetch(res.session, { _id }, { offline: true, hideSensitive: false, hideEvents: false })

                if (!user) {
                    User.mw.logout(req, res)
                    return sendError.auth(req, res, 'Authentication check failed: No user found')
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
                {
                    const status = Object.keys(User.list.status).reverse().indexOf(user.status)
                    const DS = +user.DS
                    const DSA = +user.DSA
                    const location = +(user.location === 'US')

                    res.session.client = '' + status + DS + DSA + location
                }

                next()
            } catch (err) {
                sendError.server(req, res, err)
            }
        },


        superAdminOnly: async (req, res, next) => {
            if (res.session.branch !== 'admin' || res.session.user.status === 'A') return respond404(res)

            next()
        },


        developerOnly: async (req, res, next) => {
            if (res.session.branch !== 'admin' || res.session.user.status !== 'D') return respond404(res)

            next()
        },


        logout: (req, res) => {
            if (req.session.user) delete req.session.user
            if (res.session.user) delete res.session.user
            if (req.session.team) delete req.session.team
            if (res.session.team) delete res.session.team
            if (res.session.client) delete res.session.client

            return req.session.destroy((err) => {
                if (err) return res.status(500).send('Failed to log out')

                res.redirect('/')
            })
        },


        register: async (req, res) => {
            try {
                const { _id, username, newPassword: password } = req.body
                
                const [ result ] = await mysql.execute(query.user.main.update({
                    username, _passKey: await Bun.password.hash(password),
                }, { id: User.matchIdHash(_id) }))

                if (!result.affectedRows) throw new Error('Failed to register credentials')

                await mysql.execute(query.user.registration.delete({ userId: User.matchIdHash(_id) }))

                const user = await User.fetch(res.session, { _id }, { offline: true })
                const { email } = user
                let branchUrls = ''

                for (const branch in userApps) {
                    if (branch === 'admin' && !user.DSA) continue

                    const { address, name } = userApps[branch]

                    branchUrls += `<li><a href="${address}" target="_blank">`
                    branchUrls += `${name}</a></li>`
                }

                const mailOpts = {
                    from: sender,
                    to: email,
                    subject: 'Successful User Registration',
                    html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                        Dear ${user.fullName('AL')},<br/>
                        ${config.site.name} welcomes you aboard! Your registration has been successfully completed, and your account is now active.<br/><br/>
                        You can sign in to any of the available branches:<br/>
                        <ul>
                            ${branchUrls}
                        </ul><br/>
                        Best regards,<br/>
                        ${config.site.name} Automated Support
                    </div>`,
                }

                transporter.sendMail(mailOpts, error => {
                    if (error) console.error(error)
                })

                res.redirect(`${addrBook.default}/welcome?user=${_id}`)
            } catch (err) {
                sendError.server(req, res, err)
            }
        },


        reset: async (req, res) => {
            try {
                const { _id, newPassword: password } = req.body

                const [ result ] = await mysql.execute(query.user.main.update({
                    _passKey: await Bun.password.hash(password),
                    passReset: false,
                }, { id: User.matchIdHash(_id) }))
                if (!result.affectedRows) throw new Error('Failed to reset credentials')

                await mysql.execute(query.user.passReset.delete({ userId: User.matchIdHash(_id) }))

                res.redirect(`${addrBook.default}/welcome?user=${_id}&reset=success`)
            } catch (err) {
                sendError.server(req, res, err)
            }
        },


        invite: async (req, res) => {
            try {
                const { _id } = req.params
                const user = await User.fetch(res.session, { _id })
                if (!user) throw new Error('User not found')

                const [ result ] = await mysql.execute(query.user.registration.update({
                    invitedAt: utcTimeStamp(),
                }, { userId: user.id }))
                if (!result.affectedRows) throw new Error('Failed to update invitation time')

                await user.invite()

                res.send('OK')
            } catch (err) {
                sendError.server(req, res, err)
            }
        },


        initialize: async (req, res) => {
            const [ rows ] = await mysql.execute(query.user.main.select('id', { id: 1 }))

            if (!rows.length) {
                try {
                    fs.rmSync(dir, { recursive: true, force: true })
                    fs.mkdirSync(dir, { recursive: true })
                } catch (err) {
                    console.error('Failed to reset directory:', dir, err)
                    throw err
                }

                const { body } = req
                const { password } = body
                delete body.password

                body.status = 'D'
                body.location = 'US'
                body._passKey = await Bun.password.hash(password)

                await mysql.execute(query.user.main.insert(body))
            }

            res.redirect('/')
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

        this.count = {
            users: data.userCount,
        }

        this.expansion = {
            location: data.location ? User.list.location[data.location] : null,
            category: data.category ? Company.list.category[data.category].item[1] : null,
            categoryGroup: data.category ? Company.list.category[data.category].item[0] : null,
        }

        if (single) {
            this.session = session
            this.config = { hideRawId }


            this.add = (target, ids = []) => classInstance.add(this, new.target, target, ids)


            this.fetch = (target, filter, params) => classInstance.fetch(this, new.target, target, filter, params)


            this.update = body => classInstance.update(this, new.target, body)


            this.delete = (target, ids = []) => classInstance.delete(this, new.target, target, ids)


            this.log = params => classInstance.log(this, new.target, params)
        }
    }

    static #algorithm = 'SHA-1'
    static hashId = (field = 'id') => hash(field, Role.#algorithm)
    static matchIdHash = value => matchHash(value, Role.#algorithm)

    static config = () => ({
        db: db.online,
        query: query.role,
        idProp: 'roleId',
        jxTargets: jxTargets('role'),
        defSorts: [ [ 'name', 'location', 'category' ] ],
        logFile: 'roles',
    })


    static create = (session, body, params) => classStatic.create(this, session, body, params, {
        async find(body, hideRawId) {
            const { name, category, location } = body
            const data = await Role.fetch(session, { name, category, location }, { hideRawId })

            return { found: data.length > 0, data }
        },
    })


    static fetch = (session, filter, { hideRawId = false, sorts = Role.config().defSorts, limit, mode } = {}) => classStatic.fetch(this, session, filter, {
        hideRawId, sorts, limit, mode,
    }, {
        batch: [
            {
                table: query.role.main.table,
                fields: [ 'id', Role.hashId(), 'category', 'location', 'name', 'permissions' ],
                group: 'id',
            },
            {
                table: query.jx.users_roles.table,
                fields: { countDist: [ 'userId', 'userCount' ] },
                join: [ 'roleId', 'id' ],
            },
            // {
            //     table: query.jx.users_roles.table,
            //     fields: [ { countDist: ['userId', 'userCount', {
            //         case: {
            //             table: query.user.main.table,
            //             match: { deletedBy: null },
            //         },
            //     }] } ],
            //     join: ['roleId', 'id'],
            // },
            // {
            //     table: query.user.main.table,
            //     join: ['id', 'userId', { table: query.jx.users_roles.table }],
            // },
        ],
        prepare(batch, filter,) {
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

            batch[0].match = match

            return { single, batch }
        },
    })


}



class Token {
    constructor(data = {}) {
        if (!data?.tokenKey) throw new Error('Constructor Error: Invalid Token Data')

        this.key = stringifyBuffer(data.tokenKey)
        this.userId = data.userId
        this.clientIp = data.clientIp
        this.verified = !!data.verified
        this.createdAt = utc2tz(data.createdAt)
        this.expiresAt = new Date(this.createdAt).getTime() + data.tokenAge * 60 * 1000
        this.expired = new Date >= this.expiresAt
    }

    verify = async ({ queryInst = query.session.token } = {}) => {
        const clientIp = { ip: this.clientIp }
        const token = { aes: [ this.key, tokenSecret ]}

        const [ result ] = await mysql.execute(queryInst.update({ verified: true }, {
            userId: this.userId,
            clientIp, token,
        }))

        if (!result.affectedRows) throw new Error('DB Error: Token verification failed')
    }


    static create = async ({ userId, clientIp }, { queryInst = query.session.token, UserSrc = User } = {}) => {
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

            const user = await UserSrc.fetch({}, { id: userId }, { offline: true })
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


    static fetch = async ({ userId, clientIp }, { queryInst = query.session.token, UserSrc = User } = {}) => {
        const [ rows ] = await mysql.execute(queryInst.select([
            [ { aes: [ 'token', tokenSecret ] }, 'tokenKey' ],
            'verified', 'createdAt',
        ], { match: { userId, clientIp: { ip: clientIp } } }))

        if (!rows.length) return {}

        return new Token({ userId, clientIp, ...rows[0] })
    }


}



function jxTargets(src, target = null) {
    const targets =  {
        user: {
            roles: [ query.jx.users_roles, 'roleId', Role ],
            teams: [ query.jx.users_teams, 'teamId', Team ],
            companies: [ query.jx.users_companies, 'companyId', Company ],
        },
        role: {
            users: [ query.jx.users_roles, 'userId', User ],
        },
    }[src]

    return target ? targets[target] : targets
}



delete User.formSelect

export default User
export { Role, Token }



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