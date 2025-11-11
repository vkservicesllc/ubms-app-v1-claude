import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import Person from '../../../client/global/modules/tools/core/person.mjs'
import Company from './company.mjs'

import defProp from '../utils/data.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'



class User extends Person {
    static #algorithm = 'SHA-512'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid User Data')

        super(data)

        let { single, login, hideRawId, hideSensitive } = options
        single = defProp(single, true, 'boolean')
        hideRawId = defProp(hideRawId, false, 'boolean')
        hideSensitive = defProp(hideSensitive, true, 'boolean')
        login = defProp(login, false, 'boolean')

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

        if (single) {}
    }

    static hashId = (field = 'id') => hash(field, User.#algorithm)
    static hashSimpleId = (field = 'id') => hash(field)
    static matchIdHash = value => matchHash(value, User.#algorithm)
    static matchSimpleIdHash = value => matchHash(value)


    static list = {

        condition: {
            'A': 'Active',
            'I': 'Inactive',
            'L': 'Locked',
        },

        location: {
            'US': 'USA',
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


}



class Role {
    static #algorithm = 'SHA-1'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Role Data')

        let { single, hideRawId } = options
        single = defProp(single, true, 'boolean')
        hideRawId = defProp(hideRawId, false, 'boolean')

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

        if (single) {}
    }

    static hashId = (field = 'id') => hash(field, Role.#algorithm)
    static matchIdHash = value => matchHash(value, Role.#algorithm)
}



delete User.formSelect

export default User
export { Role }