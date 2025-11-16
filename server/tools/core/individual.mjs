import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import Person from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'

import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'

const query = {
    main: new Query(db.person, 'individuals'),
    names: new Query(db.person, 'names'),
    legalPresence: new Query(db.person, 'legal_presence'),
    maritals: new Query(db.person, 'maritals'),
    //?...
    phones: new Query(db.person, 'phones'),
    addresses: new Query(db.person, 'addresses'),
    emails: new Query(db.person, 'emails'),
    identifications: new Query(db.person, 'identifications'),
    //! ...add more if needed
}



class Individual extends Person {
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

        if (single) {}
    }

    static #algorithm = 'SHA-512/256'
    static hashId = (field = 'id') => hash(field, Individual.#algorithm)
    static matchIdHash = value => matchHash(value, Individual.#algorithm)

    static defSorts = [ null, [ 'lastName', 'suffix', 'firstName', 'middleName' ] ]


    static create = ({ user: sessionUser = {} }, body = {}) => {}


    static fetch = ({ user: sessionUser = {} }, filter = {}, { hideRawId = false, batchOnly = false, sorts = Individual.defSorts } = {}) => {}


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
export { Relationship, query }