import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import Person from '../../../client/global/modules/tools/core/person.mjs'
import Company from './company.mjs'

import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'


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


    static create = async ({ user: sessionUser = {} }, data = {}) => {
        let created = false, error

        //* ...

        return { created, error }
    }


    static fetch = async ({ user: sessionUser = {}, branch, siteId = null }, filter = {}, { combined = false, login = false, hideRawId = false, hideSensitive = true, batch: qBatch = false }) => {
        const { id: sessionUserId = null } = sessionUser

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
            {
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



class Role {
    static #algorithm = 'SHA-1'

    static #batch = ({ user: sessionUser = {} }, filter = {}) => {}


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


    static fetch = ({ user: sessionUser = {} } = {}, filter = {}) => {
        const batch = Role.#batch({ user: sessionUser }, filter)

        //* ...
    }


}



delete User.formSelect

export default User
export { Role }