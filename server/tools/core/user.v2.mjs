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
    static #algorithm = 'SHA-512'

    constructor(data = {}, { single = true, hideRawId = false, hideSensitive = true, login = false }) {
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
            //? May consider adding create/invite log info (like inviter)
        }
        if (login) {
            props.fails = data.fails
            props.lastUrl = data.lastUrl
            props._hash = data._hash
        }

        this.expansion.status = User.list.status[data.status]
        this.expansion.condition = User.list.condition[data.condition]
        this.expansion.location = User.list.location[data.location]

        reSuper(this, props)

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


    static create = async ({ user: sessionUser = {} }, body = {}) => {
        if (!sessionUser.id) throw new Error('Session Fetch Error: No session user')

        let created = false, error
        body = processData(body)

        const { email } = body
        let data = await User.fetch({ sessionUser }, { email })

        if (data) error = 'Invalid Data: Email registered'
        else {
            body.createdBy = sessionUser.id

            const [ result ] = await mysql.execute(query.main.insert(body))
            const id = result.insertId

            if (id) {
                const formId = await User.#formId()

                const [ result ] = await mysql.execute(query.registration.insert({
                    formId, userId: id,
                    invitedBy: sessionUser.id,
                }))

                if (!result.affectedRows) error = 'DB Error: Failed to register new user'
                else {
                    created = true
                    data = await User.fetch({ sessionUser }, { id })

                    //! INVITE THE USER
                }
            }
        }

        return { created, error, data }
    }


    static fetch = async (
        { user: sessionUser = {}, branch, siteId = null }, filter = {},
        { hideRawId = false, hideSensitive = true, combined = false, login = false, batch: qBatch = false }
    ) => {
        const { id: sessionUserId = null } = sessionUser
        if (!sessionUserId && !login) throw new Error('Session Fetch Error: No session user')

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
            { //!!! Need to reconsider this part as default
                table: query.sessions.table,
                fields: [ [ 'siteId', 'lastSiteId' ], [ 'branch', 'lastBranch' ], 'lastLogin', 'lastUrl' ], //* DEFAULT
                join: [ 'userId', 'id', { max: [ 'lastLogin', { branch, siteId } ] } ], //? In this case it doesn't confuse lastUrl
            },
        ]

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
        if (!single) batch[1].join[2].max = 'lastLogin'

        if (qBatch) return batch

        const list = (await mysql.execute(Query.select(db.online, batch)))[0]
        list.forEach((data, i, arr) => arr[i] = new User(data, { single, login, hideRawId, hideSensitive }))

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


        async login(req, res) {},


        async session(req, res) {},


        async verify(req, res, next) {},


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


    }


}



class Token {
    constructor(data = {}) {
        if (!data?.key) throw new Error('Constructor Error: Invalid Token Data')

        this.key = stringifyBuffer(data.key)
        this.verified = !!data.verified
        this.createdAt = data.createdAt
        this.expiresAt = new Date(this.createdAt.getTime() + data.tokenAge * 60 * 1000)
        this.expired = new Date >= this.expiresAt
    }

    verify = async () => {}


    static create = async ({ userId, clientIp }, { queryInst = query.tokens, UserSrc = User } = {}) => {
        let token = generateRandomString(inputLength.user.token.max, 'd')
        clientIp = { ip: this.clientIp }

        let [ result ] = await mysql.execute(queryInst.delete({ userId, clientIp }))
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

            const email = {
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

            transporter.sendMail(email, error => {
                if (error) console.error({ error })
            })
        }

        return await Token.fetch({ userId, clientIp })
    }


    static fetch = async ({ userId, clientIp }, { queryInst = query.tokens, UserSrc = User } = {}) => {
        clientIp = { ip: clientIp }

        const [ rows ] = await mysql.execute(queryInst.select([
            [ { aes: [ 'token', tokenSecret ] }, 'key' ],
            'verified', 'createdAt',
        ], { match: { userId, clientIp } }))

        if (!rows.length) return {}

        return new Token(rows[0])
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
        if (!sessionUser.id) throw new Error('Session Fetch Error: No session user')

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