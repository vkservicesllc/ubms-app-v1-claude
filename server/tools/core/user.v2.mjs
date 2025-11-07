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
import config, { addrBook, userApps } from '../../../config.mjs'
import db from '../../settings/mysql.mjs'

/* Tools */
import Team, { query as teamQuery } from './team.mjs'
import Company, { query as companyQuery } from './company.mjs'
import Carrier, { query as carrierQuery } from './carrier.mjs'
import Person from '../../../client/global/modules/tools/core/person.v2.mjs' //! FIX DIR
import Query, { hash, matchHash } from '../utils/query.mjs'
import recognizeApi from '../utils/api.mjs'
import transporter, { sender } from '../utils/nodemailer.mjs'
import { generateRandomString } from '../utils/string.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { numeric } from '../../../client/global/modules/tools/utils/number.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import { sortArrayByObjectKey } from '../../../client/global/modules/tools/utils/sorter.mjs'
import { tel as formatTel } from '../../../client/global/modules/tools/utils/formatter.mjs'

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
        teams: new Query(db.online, 'user_team_map'),
        companies: new Query(db.business, 'user_company_map'),
    },
}



class User extends Person {
    constructor(data, options = {}) {
        if (!data?._id) throw new Error('Invalid User Data')

        super(data)

        let { single, login, hideRawId, hideSensitive } = options
        if (single === undefined || typeof single !== 'boolean') single = true
        if (login === undefined || typeof login !== 'boolean') login = false
        if (hideRawId === undefined || typeof hideRawId !== 'boolean') hideRawId = false
        if (hideSensitive === undefined || typeof hideSensitive !== 'boolean') hideSensitive = true

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
            //? May consider adding create/invite log info (like inviter)
        }
        if (login) {
            props.fails = data.fails
            props.lastUrl = data.lastUrl
            props._hash = data._hash
        }

        this.expansion.status = User.statusList[data.status]
        this.expansion.condition = User.conditionList[data.condition]
        this.expansion.location = User.locationList[data.location]
        reSuper(this, props)

        if (single) {

            this.log = async (field, deleted = false) => {
                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]
                if (deleted) fields.push('deletedBy', 'deletedAt')

                let log = (await mysql.execute(query.main.select(fields, {
                    match: { id: User.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }

            this.flush = async () => {
                return (await mysql.execute(query.main.update({ updateLog: null }, {
                    id: User.matchIdHash(this._id),
                })))[0]
            }

            this.fetch = async (session, target = null, assign = false) => {}

            this.add = async (session, target, data) => {}

            // this.update = async (session, target, data) => {}

            this.delete = async (session, target = null, ids = []) => {}

            this.modify = async (session, data) => {}


            this.reset = async session => {
                let reset = false
                let error = sessionError(session, { branches: [ 'admin' ] })
                if (error) return { reset, error }

                const resetId = await User.#resetId()
                const userId = this.id
                const createdBy = session.user.id

                await mysql.execute(query.passReset.delete({ userId }))
                const [ result ] = await mysql.execute(query.passReset.insert({ resetId, userId, createdBy }))

                if (result.affectedRows > 0) {
                    const [ result ] = await mysql.execute(query.main.update({ _passKey: null, passReset: true }, { id: userId }))
                    if (result.affectedRows > 0) reset = true
                    else error = 'DB Error: State 2'
                } else error = 'DB Error: State 1'

                if (reset) {
                    const { name, email } = this

                    const url = `${addrBook.user}/pass-reset/${_id}?form=${resetId}`
                    const options = {
                        from: sender,
                        to: email,
                        subject: 'Password Reset',
                        html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                            Dear ${name},<br/>
                            Your request to reset the password has been received.
                            A secure link has been generated for you to create a new password. Please click the link below to proceed:<br/><br/>
                            <a href="${url}" target="_blank">Reset Password</a><br/><br/>
                            Best ragards,<br/>
                            ${appName} Administration
                        </div>`,
                    }

                    transporter.sendMail(options, error => {
                        if (error) console.error(error)
                    })
                }

                return { reset, error }
            }

            this.hbs = () => {
                const { _id, firstName, lastName, alias, email, phone, avaSrc, sex, unscoped, DS, DSA, self } = this
                const { gender, status, condition, location } = this.expansion
                const name = this.full('AL')
                const fullName = this.fullName('FAL')

                return {
                    _id, firstName, lastName, alias, name, fullName,
                    email, phone: formatTel(phone),
                    gender, status, condition, location, avaSrc,
                    case: {
                        sex, self, unscoped, DS, DSA,
                        status: this.status,
                        condition: this.condition,
                        location: this.location,
                    },
                }
            }


            this.token = async (params = {}) => {
                let { clientIp, token } = params
                const userId = this.id
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
                const userId = this.id
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

    static conditionList = {
        'A': 'Active',
        'I': 'Inactive',
        'L': 'Locked',
    }

    static locationList = {
        'US': 'USA',
        // 'MX': 'Mexico',
        'UA': 'Ukraine',
        // 'RU': 'Russia',
    }

    static statusList = {
        'U': 'User',
        'A': 'Admin',
        'S': 'Super Admin',
        'D': 'Developer',
    }


    static #algorithm = 'SHA-512'
    static hashId = (field = 'id') => hash(field, User.#algorithm)
    static hashSimpleId = (field = 'id') => hash(field)
    static matchIdHash = value => matchHash(value, User.#algorithm)
    static matchSimpleIdHash = value => matchHash(value)

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

    static #resetId = async () => {
        let resetId, found = true

        do {
            resetId = generateRandomString(inputLength.user.token.max)

            const [ rows ] = await mysql.execute(query.passReset.select('resetId', {
                match: { resetId }
            }))

            if (!rows.length) found = false
        } while (found)

        return resetId
    }

    static #authUrl = (session, _id, status) => `${addrBook.user}/authenticate?user=${_id}&branch=${btoa(session.branch)}&site=${btoa(session.siteId)}&status=${status}`


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


    static create = async (session, data) => {
        let created = false, newUser, error = sessionError(session, { status: 'DSA', branches: [ 'admin' ] })
        if (error) return { created, error }

        const { user: sessionUser } = session

        data = processData(data)

        for (const prop of [ 'status', 'location', 'email', 'firstName', 'lastName' ])
            if (!data[prop]) return { created, error: 'Invalid Data' }

        const { email } = data
        if (await User.fetch(session, { email })) return { created, error: "Invalid Data: Email Registered" }

        data.createdBy = sessionUser.id

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
            newUser = await User.fetch(session, { id })

            User.invite(session, newUser, formId)
        } else error = 'DB Error'

        return { created, error, data: newUser }
    }


    static fetch = async (session, filter = {}, params = {}) => {
        if (!session?.user || typeof session.user !== 'object') return
        const { user: sessionUser, branch, siteId } = session
        
        const batch = [
            {
                table: query.main.table,
                fields: [
                    'id', User.hashId(), [ User.hashSimpleId(), 'simpleId' ],
                    'username', 'email', 'phone',
                    'firstName', 'lastName', 'alias', 'sex',
                    'status', 'condition', 'location',
                    'passReset', 'unscoped', 'decliner', 'fails',
                    { compare: [ 'id', 'self', { eq: sessionUser.id } ] },
                ],
            },
            {
                table: query.sessions.table,
                fields: [ [ 'siteId', 'lastSiteId' ], [ 'branch', 'lastBranch' ], 'lastLogin', 'lastUrl' ], //* DEFAULT
                join: [ 'userId', 'id', { max: [ 'lastLogin', { branch, siteId } ] } ], //? In this case it doesn't confuse lastUrl
            },
        ]

        const {
            id, _id, _simpleId, username, email,
            ids, _ids, firstName, lastName, alias, sex,
            status, location, condition, decliner, deleted,
        } = filter
        const { allowDeleted, login, hideRawId, hideSensitive, qBatch } = params
        const single = id || _id || _simpleId || username || email
        let deletedBy = null
        if (deleted === true) deletedBy = { null: false }

        batch[0].match = {
            deletedBy,
            id, username, email,
            firstName, lastName, alias, sex,
            status, location, condition, decliner,
        }
        if (allowDeleted === true) delete batch[0].match.deletedBy

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
        if (!single) batch[1].join[2].max = 'lastLogin'

        if (qBatch === true) return batch

        const list = (await mysql.execute(Query.select(db.online, batch)))[0]
        list.forEach((data, i, arr) => arr[i] = new User(data, { single, login, hideRawId, hideSensitive }))

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


    static mw = {


        async login(req, res) {
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
                let user = await User.fetch(session, { username }, { login: true })

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
                const { _id, _hash, condition } = user
                let { fails } = user

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
                                user = await User.fetch(session, { _id })

                                const currentData = { ...user }
                                const currentUpdateLog = await user.log('updateLog')
                                currentData.condition = user.condition

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
        },


        async session(req, res){
            try {
                const { session } = res
                const { branch, siteId, defUrl } = session
                const { user: _id, token: providedToken } = req.body
                const { clientIp } = req.session
                const user = await User.fetch(session, { _id })
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
                const userId = user.id
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
        },


        async verify(req, res, next) {
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
                            const user = await User.fetch(session, { _id: refer })
                            if (method !== 'POST' && !excUrl.includes(originalUrl))
                                await user.url(session, stripUrl(originalUrl, query, 'refer'))
                        }

                        if (!next) return false
                        else return res.redirect(logoutUrl)
                    }
                }

                if (!_id) return await reject('Authentication check failed: Not authenticated')

                const user = await User.fetch(session, { _id })
                if (!user) {
                    User.logout(req, res)
                    return throwErr[errKey].auth(res, 'Authentication check failed: No user found')
                }

                const connectToken = req.cookies['connect.token']
                const { token } = await user.token({ clientIp })

                if (!connectToken || !token || !(await Bun.password.verify(token, connectToken)))
                    return await reject('Authentication check failed: Token verification failed')

                if (session.branch === 'admin' && user.status === 'U')
                    return await reject('Authentication check failed: Unauthorized Environment')

                if (user.DS && user.location !== 'US')
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
        },


        logout(req, res) {
            if (req.session.user) delete req.session.user
            if (res.session.user) delete res.session.user
            if (req.session.team) delete req.session.team
            if (res.session.team) delete res.session.team

            return req.session.destroy((err) => {
                if (err) return res.status(500).send('Failed to log out')

                res.redirect('/')
            })
        },


        async initialize(req, res) {
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
        },


        async register(req, res) {
            try {
                const { _id, username, password } = req.body

                const [ result ] = await mysql.execute(query.main.update({
                    username,
                    _passKey: await Bun.password.hash(password),
                }, { id: User.matchIdHash(_id) }))

                if (result.affectedRows === 1) {
                    await mysql.execute(query.registration.delete({ userId: User.matchIdHash(_id) }))

                    const user = await User.fetch(res.session, { _id })
                    const { email, name } = user
                    let branchUrls = ''

                    for (const branch in userApps) {
                        if (branch === 'admin' && !user.DSA) continue

                        const { address, name } = userApps[branch]

                        branchUrls += `<li><a href="${address}" target="_blank">`
                        branchUrls += `${name}</a></li>`
                    }

                    const options = {
                        from: sender,
                        to: email,
                        subject: 'Successful User Registration',
                        html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                            Dear ${name},<br/>
                            ${appName} welcomes you aboard! Your registration has been successfully completed, and your account is now active.<br/><br/>
                            You can sign in to any of the available branches:<br/>
                            <ul>
                                ${branchUrls}
                            </ul><br/>
                            Best regards,<br/>
                            ${appName} Automated Support
                        </div>`,
                    }

                    transporter.sendMail(options, error => {
                        if (error) console.error(error)
                    })
                }

                res.redirect(addrBook.default)
            } catch (err) {
                const msg = 'Registration failed: Server could not process the request'
                throwErr.data.server(res, msg, err)
            }
        },


        async reset(req, res) {
            try {
                const { _id, password } = req.body

                const [ result ] = await mysql.execute(query.main.update({
                    _passKey: await Bun.password.hash(password),
                    passReset: false,
                }, { id: User.matchIdHash(_id) }))

                if (result.affectedRows === 1)
                    await mysql.execute(query.passReset.delete({ userId: User.matchIdHash(_id) }))

                res.redirect(addrBook.default)
            } catch (err) {
                const msg = 'Registration failed: Server could not process the request'
                throwErr.data.server(res, msg, err)
            }
        },


    }


}


delete User.prefixList
delete User.suffixList
delete User.genderList
delete User.formSelect



class Role {
    constructor(data, options = {}) {
        if (!data?._id) throw new Error('Invalid Role Data')

        let { single, hideRawId } = options
        if (single === undefined || typeof single !== 'boolean') single = true
        if (hideRawId === undefined || typeof hideRawId !== 'boolean') hideRawId = false

        this._id = data._id
        if (!hideRawId) props.id = data.id
        this.category = data.category
        this.location = data.location
        this.name = data.name
        this.permissions = data.permissions
        this.expansion = {
            location: data.location ? User.locationList[data.location] : null,
            category: data.category ? Company.categoryList[data.category].item[1] : null,
            categoryGroup: data.category ? Company.categoryList[data.category].item[0] : null,
        }

        if (single) {

            this.log = async field => {
                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]

                let log = (await mysql.execute(query.roles.select(fields, {
                    match: { id: Role.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }

            this.flush = async () => {
                return (await mysql.execute(query.roles.update({ updateLog: null }, {
                    id: Role.matchIdHash(this._id),
                })))[0]
            }

            this.fetch = async (session, target = null, params = {}) => {
                if (!session?.user || typeof session.user !== 'object') return
                const { user: sessionUser } = session

                const batch = [
                    {
                        table: query.jx.roles.table,
                        match: { roleId: this.id },
                    },
                    {
                        table: query.main.table,
                        join: [ 'id', 'userId' ],
                        match: { deletedBy: null, status: ['U', 'A'] },
                    },
                ]
                let data = []

                if (sessionUser.location != 'US')
                    batch[1].match.location = sessionUser.location

                switch (target) {

                    case 'userIds':
                        batch[0].fields = 'userId'

                        const [ result ] = await mysql.execute(new Query(db.online, batch))
                        result.forEach(row => data.push(row.userId))
                        break

                    case 'users':
                        const { hideRawId, hideSensitive, sortBy, assign } = params
                        const userBatch = await User.batch(session, {}, { qBatch: true })
                        batch[1].fields = userBatch[0].fields

                        [ data ] = await mysql.execute(new Query(db.online, batch))
                        data.forEach((row, i) => data[i] = new User(row, { hideRawId, hideSensitive }))
                        if (sortBy) data = sortArrayByObjectKey(data, sortBy)

                        if (assign === true) {
                            const filter = { status: [ 'US', 'A' ] }
                            if (sessionUser.location != 'US') filter.location = sessionUser.location

                            data = { applied: data }
                            data.all = await User.fetch(session, filter, { hideRawId, hideSensitive })
                            data.available = data.all.filter(user => !data.applied.some(appliedUser => appliedUser._id === user._id))
                            if (sortBy) {
                                data.all = sortArrayByObjectKey(data.all, sortBy)
                                data.available = sortArrayByObjectKey(data.available, sortBy)
                            }
                        }

                        break

                }

                return data
            }

            this.add = async (session, target, _ids) => {
                let added = false, error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { added, error }

                const data = [], createdBy = session.user.id
                let queryProp

                switch (target) {
                    case 'users':
                        const users = await User.fetch(session, { _ids })
                        users.forEach(user => data.push({
                            roleId: this.id,
                            userId: user.id,
                            createdBy,
                        }))
                        queryProp = 'roles'
                        break
                }

                const [ result ] = await mysql.execute(query.jx[queryProp].insert(data))
                added = result.affectedRows > 0

                return { added }
            }

            this.delete = async (session, target = null, ids = []) => {
                if (!target) {
                    let deleted = false, error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                    if (error) return { deleted, error }

                    const { id } = this
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
                } else if (ids.length) { //? No delete log
                    let result

                    switch (target) {

                        case 'users':
                            [ result ] = await mysql.execute(query.jx.roles.delete({ userId: ids }))
                            break

                    }

                    return { deleted: result.affectedRows > 0 }
                }
            }

            this.modify = async (session, data) => {
                let modified = false, error = sessionError(session, { status: 'DSA', branches: [ 'admin' ] })
                if (error) return { modified, error }

                const { permissions } = data
                delete data.permissions

                const { id } = this
                const modifiedBy = session.user.id
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

            this.unique = async (session, params = {}) => {
                let unique = false, original = true,
                    error = error = sessionError(session, { branches: [ 'admin', 'user' ] })

                if (!error) {
                    const { name, category, location } = params

                    if (
                        (name !== this.name) ||
                        (name === this.name && category !== this.category) ||
                        (name === this.name && category === this.category && location !== this.location[0])
                    ) {
                        original = false

                        const { found, error: sError } = await Role.find(session, params)
                        if (sError) error = sError
                        else unique = !found
                    }
                }

                return { unique, original, error }
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

        for (const prop of [ 'category', 'name', 'permissions' ])
            if (!data[prop]) return { created, error: 'Invalid Data' }

        if (await Role.list(session, {
            category: data.category,
            location: data.location || null,
            name: data.name,
        }).length) return { created, error: 'DB Error: Dublicated Data' }

        data.permissions = JSON.stringify(data.permissions)
        data.createdBy = session.user.id

        const [ result ] = await mysql.execute(query.roles.insert(data))
        const id = result.insertId
        if (!id) return { created, error: 'DB Error: Failed to write Data' }

        return { created, error, data: await Role.data(session, { id }) }
    }


    static fetch = async (session, filter = {}, params = {}) => {
        if (!session?.user || typeof session.user !== 'object') return
        const { user: sessionUser, branch, siteId } = session

        const {
            id, _id,
            ids, _ids, category, name, location,
        } = filter
        const single = id || _id
        const { qBatch } = params

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

        if (qBatch === true) return batch

        const list = (await mysql.execute(Query.select(db.online, batch)))[0]
        list.forEach((data, i, arr) => arr[i] = new Role(data, { single, hideRawId }))

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
            const role = await Role.data(session, { _id: exclude._id })

            match.id = { not: role.id }
        }

        const data = (await mysql.execute(query.roles.select('id', { match: { name, category, location } })))[0]

        return { found: data.length === 1 }
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
    if (res.session.branch !== 'admin' || res.session.user.status === 'A') {
        const { errKey } = recognizeApi(req)

        return throwErr[errKey].auth(res, 'Error: Access to this path is granted to Super Admin only<br><a href="/">Dashboard</a>')
    }
    next()
}


export const developerOnly = (req, res, next) => {
    if (res.session.branch !== 'admin' || res.session.user.status !== 'D') {
        const { errKey } = recognizeApi(req)

        return throwErr[errKey].auth(res, 'Error: Access to this path is granted to Developer only<br><a href="/">Dashboard</a>')
    }
    next()
}


export const sessionError = (session, instructions = {}) => {
    let error

    if (!session?.user) error = 'Invalid User'
    else {
        const { user: sessionUser } = session
        let { status, branches, usOnly } = instructions
        if (!Array.isArray(branches)) branches = []
        if (typeof usOnly !== 'boolean') usOnly = false
        if (status === 'DS') usOnly = true

        if (['DS', 'DSA'].includes(status)) {
            switch (status) {
                case 'DS':
                    if (!sessionUser.DS) error = 'Invalid User Status: Super Admin only'
                    break
                case 'DSA':
                    if (!sessionUser.DSA) error = 'Invalid User Status: Admin only'
                    break
            }
        }

        if (error === undefined && branches.length) {
            const { branch } = session

            if (!branches.includes(branch)) error = 'Invalid Branch'
        }

        if (error === undefined && usOnly === true && sessionUser.location !== 'US')
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