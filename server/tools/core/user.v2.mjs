import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import Person from '../../../client/global/modules/tools/core/person.mjs'

import defProp from '../utils/data.mjs'



class User extends Person {
    static #algorithm = 'SHA-512'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid User Data')
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
    }

    static hashId = (field = 'id') => hash(field, Role.#algorithm)
    static matchIdHash = value => matchHash(value, Role.#algorithm)
}



delete User.formSelect

export default User
export { Role }