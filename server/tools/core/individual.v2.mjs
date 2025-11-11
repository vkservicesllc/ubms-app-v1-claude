import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import Person from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'

import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'



class Individual extends Person {
    static #algorithm = 'SHA-512/256'

    static #batch = ({ user: sessionUser = {} }, filter = {}) => {}


    constructor(data = {}, { single = true, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Person Data')

        super(data)

        const props = { _id: data._id }
        if (!hideRawId) props.id = data.id
        if (!hideSensitive) this.ssn = stringifyBuffer(data.ssn)

        const { phone, email, marital } = data
        const legalPresence = { status: data.status, expiresOn: data.statusExpiresOn }
        const address = new Address(data)

        const identification = {
            driver: data.driver,
            commercial: data.commercial,
            number: data.idNumber,
            class: data.idClass,
            state: data.idState,
            issuedOn: data.idIssuedOn,
            expiresOn: data.idExpiresOn,
            endorsement: data.idEndorsement,
            restriction: data.idRestriction,
        }

        reSuper(this, props, { legalPresence, phone, email, marital, address, identification })

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

    static hashId = (field = 'id') => hash(field, Individual.#algorithm)
    static matchIdHash = value => matchHash(value, Individual.#algorithm)


    static create = ({ user: sessionUser = {} }, data = {}) => {
        let created = false, error

        //* ...

        return { created, error }
    }


    static fetch = ({ user: sessionUser = {} } = {}, filter = {}) => {
        const batch = Role.#batch({ user: sessionUser }, filter)

        //* ...
    }


    static list = {

        prefix: {
            'Mr': 'Mister',
            'Mrs': 'Mistress',
            'Ms': 'Miss',
        },

        suffix: {
            'Sr': 'Senior (I)',
            'Jr': 'Junior (II)',
            'II': 'II',
            'III': 'III',
            'IV': 'IV',
            'V': 'V',
        },

        gender: {
            'M': 'Male',
            'F': 'Female',
        },

        marital: {
            's': 'Single',
            'm': 'Married',
            'd': 'Divorced',
            'p': 'Separated',
            'w': 'Widowed',
        },

    }


}



class Relationship {

    static list = {
        'Spouse': [['Husband', 'M'], ['Wife', 'F']],
        'Parent': [['Father', 'M'], ['Mother', 'F'], ['Stepfather', 'M'], ['Stepmother', 'F']],
        'Child': [['Son', 'M'], ['Daughter', 'F'], ['Stepson', 'M'], ['Stepdaughter', 'F']],
        'Sibling': [['Brother', 'M'],  ['Sister', 'F'], ['Stepbrother', 'M'], ['Stepsister', 'F']],
        'Grandparent': [['Grandfather', 'M'], ['Grandmother', 'F']],
        'Grandchild': [['Grandson', 'M'], ['Granddaughter', 'F']],
        'Immediate In-Law': [['Father-in-law', 'M'], ['Mother-in-law', 'F'], ['Son-in-law', 'M'], ['Daughter-in-law', 'F'], ['Brother-in-law', 'M'], ['Sister-in-law', 'F']],
        'Other': [['Uncle', 'M'], ['Aunt', 'F'], ['Nephew', 'M'], ['Niece', 'F'], 'Cousin', 'Fiancé(e)', 'Domestic Partner', 'Friend', 'Other'],
    }

    static data = () => {
        const list = Relationship.list
        const data = {}

        for (const group in list) {
            data[group] = {}

            for (let relation of list[group]) {
                if (Array.isArray(relation)) relation = relation[0]
                data[group][relation] = relation
            }
        }

        return data
    }

    static gender = member => {
        let gender = null
        const list = Relationship.list

        groupLoop:
        for (const group in list) {
            for (let relation of list[group]) {
                if (!Array.isArray(relation)) continue
                if (relation[0] === member) {
                    gender = relation[1]
                    break groupLoop
                }
            }
        }

        return gender
    }

}



delete Individual.formSelect

export default Individual
export { Relationship }