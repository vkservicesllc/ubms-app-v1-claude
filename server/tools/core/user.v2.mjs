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

const { validationResult } = require('express-validator')
const mysql = require('../utils/mysql')
const sendError = require('../utils/error')



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
    static #algorithm = 'SHA-512'

    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true, login = false }) {
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
            //? May consider adding create/invite log info (like inviter)
        }
        if (login) {
            props.fails = data.fails
            props._hash = data._hash
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
                if (!['roles', 'teams', 'companies'].includes(target)) throw new Error('User Add Error: Invalid target supplied')

                const data = []
                const [ Src, idProp ] = { roles: [ Role, 'roleId' ], teams: [ Team, 'teamId' ], company: [ Company, 'companyId' ] }[target]
                const list = await Src.fetch(this.session, { ids })

                list.map(item => data.push({
                    userId: this.id,
                    [idProp]: item.id,
                    createdBy: session.user.id,
                }))

                const [ result ] = await mysql.execute(query.jx[target].insert(data))

                return result.affectedRows > 0
            }


            this.fetch = async (target, { hideRawId = false } = {}) => {
                if (!this.session?.user?.id) throw new Error('User Fetch Error: No session user')
                if (!target) throw new Error('User Fetch Error: Target not supplied')
                if (!['roles', 'teams', 'companies'].includes(target)) throw new Error('User Fetch Error: Invalid target supplied')

                const [ Src, idProp ] = { roles: [ Role, 'roleId' ], teams: [ Team, 'teamId' ], company: [ Company, 'companyId' ] }[target]

                const ids = []
                const [ rows ] = (await mysql.execute(query.jx[target].select(idProp, { userId: this.id || User.matchIdHash(this._id) })))

                rows.map(row => ids.push(rows[idProp]))

                return await Src.fetch(this.session, { ids }, { hideRawId })
            }


            this.update = async body => {
                const { userId: sessionUserId, branch } = this.session || {}
                if (!sessionUserId || !branch) throw new Error('User Update Error: Session user or branch not found')
                if (!this.self && (this.status === 'D' || branch !== 'user')) throw new Error('User Update Error: Immune user or invalid branch')

                let updated = false
                
                body = processData(body, {
                    modifiedBy: sessionUserId, branch,
                    currentData: this, currentUpdateLog: await this.log('updateLog'),
                })

                if (this.location !== 'US' && body.location !== 'US' && body.phone) body.phone = null

                const [ result ] = await mysql.execute(query.main.update(body, { id: this.id || User.matchIdHash(this._id) }))

                if (result.affectedRows) {
                    updated = true

                    if (!this.username && body.email && this.email !== data.email) {
                        const { formId } = (await mysql.execute(query.registration.select('formId', { match: { userId: this.id || User.matchIdHash(this._id) } })))[0][0]

                        if (formId) {
                            this.invite(formId)

                            const [ result ] = await mysql.execute(query.registration.update({ invitedAt: Query.timeStamp }, {
                                userId: this.id, formId,
                            }))
                            if (!result.affectedRows) throw new Error('User Update Error: Failed to update registration timestamp')
                        }
                    }
                }

                return updated
            }


            this.delete = async ({ target, ids = [] } = {}) => {
                const { userId: sessionUserId } = this.session || {}
                if (!sessionUserId) throw new Error('User Delete Error: Session user not found')

                if (this.status === 'D') throw new Error('User Delete Error: Developer can not be deleted')

                if (!target) {
                    const update = processData({ username: null, email: null, phone: null, condition: 'I' }, {
                        modifiedBy: sessionUserId,
                        currentData: this,
                        currentUpdateLog: await this.log('updateLog'),
                    })
                    update._passKey = null
                    update.deletedBy = sessionUserId
                    update.deletedAt = Query.timeStamp

                    const [ result ] = await mysql.execute(query.main.update(update, { id: this.id || User.matchIdHash(this._id) }))
                    if (!result.affectedRows) return false

                    const match = { userId: this.id || User.matchIdHash(this._id) }
                    await mysql.execute(query.registration.delete(match))
                    await mysql.execute(query.passReset.delete(match))
                    await mysql.execute(query.tokens.delete(match))

                    return true
                } else if (['roles', 'teams', 'companies'].includes(target) && ids.length) {
                    const idProp = { roles: 'roleId', teams: 'teamId', companies: 'companyId' }[target]

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


            this.url = async (lastUrl) => {
                if (!this.self || lastUrl.slice(0, 5) === '/api/' || lastUrl.includes('/files/') || lastUrl.includes('/image/') || lastUrl.endsWith('.map')) return

                const { branch, siteId } = this.session || {}
                if (!branch) throw new Error('User URL Error: Session branch not supplied')

                const { id: userId, lastLogin } = this

                await mysql.execute(query.sessions.update(
                    { lastUrl },
                    { userId, siteId, branch, lastLogin }
                ))

                this.lastUrl = lastUrl
            }


            this.log = async (field, deleted = false) => {
                const fields = ['createdBy', 'createdAt', 'updateLog']
                if (deleted) fields.push('deletedBy', 'deletedAt')

                let log = (await mysql.execute(query.main.select(fields, {
                    match: { id: this.id || User.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }
        }
    }

    static hashId = (field = 'id') => hash(field, User.#algorithm)
    static hashSimpleId = (field = 'id') => hash(field)
    static matchIdHash = value => matchHash(value, User.#algorithm)
    static matchSimpleIdHash = value => matchHash(value)


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

    static #authUrl = (session, _id, status) => `${addrBook.user}/authenticate?user=${_id}&branch=${btoa(session.branch)}&site=${btoa(session.siteId)}&status=${status}`


    static create = async ({ user: sessionUser = {} }, body = {}) => {
        if (!sessionUser.id) throw new Error('User Create Error: No session user')

        body = processData(body)

        const { email } = body
        if (await User.fetch({ sessionUser }, { email })) return

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

        const user = await User.fetch({ sessionUser }, { id })
        if (!user) throw new Error('Fetch Error: New user not found')

        user.invite(formId)

        return user
    }


    static fetch = async (
        { user: sessionUser = {}, branch, siteId = null }, filter = {},
        { hideRawId = false, hideSensitive = true, combined = false, login = false, batch: qBatch = false }
    ) => {
        const { id: sessionUserId = null } = sessionUser
        if (!sessionUserId && !login) throw new Error('User Fetch Error: No session user')

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

        const single = id || _id || _simpleId || username || email
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
            batch[1].fields.push({ ip: 'clientIp' })

            if (branch === 'admin') batch[0].match.status = [ 'D', 'S', 'A' ]
        } else {
            if (session?.user?.location) {
                const location = sessionUser.location
                if (location !== 'US') batch[0].match.location = location
            }
        }
        if (branch && !single) batch[1].join[2].max = 'lastLogin'

        if (qBatch) return batch

        const session = { user: { id: sessionUserId }, siteId, branch }
        const list = (await mysql.execute(Query.select(db.online, batch)))[0]
        list.forEach((data, i, arr) => arr[i] = new User(data, { single, session, login, hideRawId, hideSensitive }))

        return single ? list[0] : list
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
                const token = Token.fetch({ userId: id, clientIp })
                const { key, verified, expired } = token

                if (!key || (!verified && expired)) await Token.create({ userId: id, clientIp })

                await mysql.execute(query.main.update({ fails: 0 }, { id }))

                res.redirect(User.#authUrl(session, user._id, 'pending'))
            } catch (err) {
                sendError.server(res, err, api)
            }
        },


        session: async (req, res) => {
            try {
                const { clientIp } = req.session
                const { branch, siteId, defUrl } = res.session
                const { user: _id, token: providedToken } = req.body

                const user = await User.fetch(res.session, { _id }, { hideSensitive: false })
                if (!user) throw new Error('Session Error: User not found')

                const { id: userId } = user
                const token = await Token.fetch({ userId, clientIp })
                if (!token.key) throw new Error('Session Error: Token not found')

                const { key: tokenKey, verified, expired } = token

                if (!verified) {
                    if (tokenKey !== providedToken) return res.redirect(User.#authUrl(res.session, _id, 'mismatch'))
                    else if (expired) {
                        await Token.create({ userId, clientIp })
                        return res.redirect(User.#authUrl(res.session, _id, 'expired'))
                    } else await token.verify()
                }

                const settings = await user.settings()
                let { lastUrl } = user
                let url = lastUrl
                if (settings?.[branch]?.lastUrl === 0) url = defUrl

                const body = { userId, siteId, branch, clientIp: { ip: clientIp }, lastUrl }
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

                const _token = await Bun.password.hash(token)

                req.session.user = _id
                res.cookie('connect.token', _token, { httpOnly: true })

                res.redirect(url)
            } catch (err) {
                sendError.server(res, err, api)
            }
        },


        verify: async (req, res, next) => {
            const api = recognizeApi(req)

            try {
                const { method, originalUrl, query } = req
                const { user: _id, clientIp } = req.session
                const { excUrl, teams, companies, userApp } = res.session

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

                const user = await User.fetch(res.session, { _id })

                if (!user) {
                    User.logout(req, res)
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

                if (!next) return user

                res.session.user = user
                next()
            } catch (err) {
                sendError.server(res, err, api)
            }
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



class Token {
    constructor(data = {}) {
        if (!data?.key) throw new Error('Constructor Error: Invalid Token Data')

        this.key = stringifyBuffer(data.key)
        this.userId = data.userId
        this.clientIp = data.clientIp
        this.verified = !!data.verified
        this.createdAt = data.createdAt
        this.expiresAt = new Date(this.createdAt.getTime() + data.tokenAge * 60 * 1000)
        this.expired = new Date >= this.expiresAt
    }

    verify = async ({ queryInst = query.tokens } = {}) => {
        const clientIp = { ip: this.clientIp }
        const token = token = { aes: [ this.key, tokenSecret ]}

        const [ result ] = await mysql.execute(queryInst.update({ verified: true }, {
            userId: this.userId,
            clientIp, token,
        }))

        if (!result.affectedRows) throw new Error('DB Error: Token verification failed')
    }


    static create = async ({ userId, clientIp }, { queryInst = query.tokens, UserSrc = User } = {}) => {
        let token = generateRandomString(inputLength.user.token.max, 'd')

        let [ result ] = await mysql.execute(queryInst.delete({ userId, clientIp: { ip: clientIp } }))
        if (!result.affectedRows) throw new Error('DB Error: Failed to clear token')

        [ result ] = await mysql.execute(queryInst.insert({
            userId, clientIp,
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
            [ { aes: [ 'token', tokenSecret ] }, 'key' ],
            'verified', 'createdAt',
        ], { match: { userId, clientIp: { ip: clientIp } } }))

        if (!rows.length) return {}

        return new Token({ userId, clientIp, ...rows[0] })
    }


}



class Role {
    static #algorithm = 'SHA-1'

    constructor(data = {}, { single = true, hideRawId = false }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Role Data')

        this._id = data._id
        if (!hideRawId) props.id = data.id

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

            this.log = () => {}


            this.add = ({ user: sessionUser = {} }, { target, data = [] } = {}) => {
                if (!target) throw new Error('Instance Add Error: Target not supplied')

                let added = false, error

                //* ...

                return { added, error }
            }


            this.fetch = ({ user: sessionUser = {} }, { target, filter = {} } = {}) => {
                if (!target) throw new Error('Instance Fetch Error: Target not supplied')

                let data = [], error

                //* ...

                return { data, error }
            }


            this.update = ({ user: sessionUser = {} }, { target, data = [], ids = [] }) => {
                let updated = false, error

                if (!target) {
                    //* Update main
                } else {
                    //* Update relationships
                }

                //* ...

                return { updated, error }
            }


            this.delete = ({ user: sessionUser = {} }, { target, ids = [] }) => {
                let deleted = false, error

                if (!target) {
                    //* Delete main
                } else {
                    //* Delete relationships
                }

                //* ...

                return { deleted, error }
            }


        }
    }

    static hashId = (field = 'id') => hash(field, Role.#algorithm)
    static matchIdHash = value => matchHash(value, Role.#algorithm)


    static create = ({ user: sessionUser = {} }, data = {}) => {
        let created = false, error

        //* ...

        return { created, error }
    }


    static fetch = async ({ user: sessionUser = {} }, filter = {}, { hideRawId = false, batch: qBatch = false }) => {
        if (!sessionUser.id) throw new Error('Role Fetch Error: No session user')

        const {
            id, _id,
            ids, _ids, category, name, location,
        } = filter
        const single = id || _id
        const { hideRawId, qBatch } = params

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

        if (qBatch) return batch

        const list = (await mysql.execute(Query.select(db.online, batch)))[0]
        list.forEach((data, i, arr) => arr[i] = new Role(data, { single, hideRawId }))

        return single ? list[0] : list
    }


}



delete User.formSelect

export default User
export { Role }



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