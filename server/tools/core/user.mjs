require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_SESSION_TOKEN: tokenSecret } = process.env


/* Registry */
import inputLength from '../../../client/global/modules/registry/length.mjs'

/* Settings */
import config, { addrBook, userApps } from '../../../config.mjs'
import db, { query } from '../../settings/mysql.mjs'

/* Tools */
import Team from './team.mjs'
import Company from './company.mjs'
//! Add more classes and query instances when more categories are available
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import { classInstance, classStatic } from '../utils/class.mjs'
import transporter, { sender } from '../utils/nodemailer.mjs'
import { generateRandomString } from '../utils/string.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'

const { validationResult } = require('express-validator')
const mysql = require('../utils/mysql')
const recognizeApi = require('../utils/api')
const sendError = require('../utils/error')



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


            this.fetch = (target, params) => classInstance.fetch(this, new.target, target, params)
        }
    }

    static #algorithm = 'SHA-512'
    static hashId = (field = 'id') => hash(field, User.#algorithm)
    static hashSimpleId = (field = 'id') => hash(field)
    static matchIdHash = value => matchHash(value, User.#algorithm)
    static matchSimpleIdHash = value => matchHash(value)

    static config = () => ({
        // enforceUser: false,
        db: db.online,
        query: query.user,
        idProp: 'userId',
        jxTargets: jxTargets('user'),
        logDeleted: false,
    })


    static idStr = async (target, length, queryInst) => {
        let idStr, found = true

        do {
            idStr = generateRandomString(length)

            const [ rows ] = await mysql.execute(queryInst.select(target, { match: { [target]: idStr }}))
            if (!rows.length) found = false
        } while (found)

        return idStr
    }

    static #formId = async () => await User.idStr('formId', inputLength.user.formId.max, query.user.registration)
    static #resetId = async () => await User.idStr('resetId', inputLength.user.resetId.max, query.user.passReset)


    static create = ({ user: sessionUser = {}, branch, siteId = null }, body, params) => classStatic.create(this, { user: sessionUser, branch, siteId }, body, params, {
        async final(user, userId) {
            const formId = await User.#formId()

            const [ result ] = await mysql.execute(query.user.registration.insert({
                formId, userId,
                invitedBy: sessionUser.id,
            }))
            if (!result.affectedRows) throw new Error('DB Error: Failed to register user')

            user.invite(formId)
        },
    })


    static fetch = ({ user: sessionUser = {}, branch, siteId = null }, filter,
        { hideRawId = false, hideSensitive = true, combined = false, login = false, sorts = User.config().defSorts, mode } = {}
    ) => {
        const join = [ 'userId', 'id' ]

        return classStatic.fetch(this, { user: sessionUser, branch, siteId }, filter, { hideRawId, hideSensitive, sorts, mode }, {
            batch: [
                {
                    table: query.user.main.table,
                    fields: [
                        'id', User.hashId(), [ User.hashSimpleId(), 'simpleId' ],
                        'username', 'email', 'phone',
                        'firstName', 'lastName', 'alias', 'sex',
                        'status', 'condition', 'location',
                        'passReset', 'unscoped', 'decliner', 'fails',
                        { compare: [ 'id', 'self', { eq: sessionUser.id } ] },
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
                {
                    table: query.session.main.table,
                    fields: [ [ 'siteId', 'lastSiteId' ], [ 'branch', 'lastBranch' ], 'lastLogin', 'lastUrl' ],
                    join: [ 'userId', 'id', { max: [ 'lastLogin', { branch, siteId } ] } ],
                },
            ],
            handleFilter(batch, filter) {
                if (branch)
                    batch.push()

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
                }

                if (!single) batch[4].join[2].max = 'lastLogin'

                return { single, batch }
            },
            removeFullGroupBy: true,
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
                let user = await User.fetch(res.session, { username }, { login: true, hideSensitive: false })

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
                const { excUrl, branch, siteId, teams, companies, userApp } = res.session //! RECONSIDER

                const reject = async apiErrMsg => {
                    if (api) sendError.auth(req, res, apiErrMsg)
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
            if (res.session.branch !== 'admin' || res.session.user.status === 'A') {
                const api = recognizeApi(req)
        
                return sendError.auth(req, res, 'Error: Access to this path is granted to Super Admin only<br><a href="/">Home</a>')
            }
            next()
        },


        developerOnly: async (req, res, next) => {
            if (res.session.branch !== 'admin' || res.session.user.status === 'D') {
                const api = recognizeApi(req)
        
                return sendError.auth(req, res, 'Error: Access to this path is granted to Developer only<br><a href="/">Home</a>')
            }
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


            this.fetch = (target, params) => classInstance.fetch(this, new.target, target, params)
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

            return { found: !!data, data }
        },
        stringify: [ 'permissions' ],
    })


    static fetch = (session, filter, { hideRawId = false, sorts = Role.config().defSorts, mode } = {}) => classStatic.fetch(this, session, filter, {
        hideRawId, sorts, mode,
    }, {
        batch: [
            {
                table: query.role.main.table,
                fields: [ 'id', Role.hashId(), 'category', 'location', 'name', 'permissions' ],
            },
        ],
        handleFilter(batch, filter,) {
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
        this.createdAt = data.createdAt
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