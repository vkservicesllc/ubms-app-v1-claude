require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_SSN: secret } = process.env

/* Settings */
import db from '../../settings/mysql.mjs'

/* Tools */
import moment from 'moment'
import Person from '../../../client/global/modules/tools/core/person.mjs'
// import { sessionError } from './user.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import { ssn as formatSsn } from '../../../client/global/modules/tools/utils/formatter.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { encrypt } from '../utils/crypto.mjs'


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
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Person Data')

        super(data)

        const props = { _id: data._id }
        if (!hideRawId) props.id = data.id
        if (!hideSensitive) this.ssn = stringifyBuffer(data.ssn)

        const { phone, email, marital } = data
        const legalPresence = { status: data.status, expiresOn: data.statusExpiresOn }
        const address = new Address(data)

        const identification = {
            driver: !!data.driver,
            commercial: !!data.commercial,
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
            this.session = session


            this.add = async (target, body) => {}


            this.update = async (body, target, { since }) => {}


            this.delete = async (target, { since }) => {}


            this.log = async (field, queryProp = 'main') => {
                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]
                const idProp = queryProp === 'main' ? 'id' : 'personId'

                let log = (await mysql.execute(query[queryProp].select(fields, {
                    match: { [idProp]: this.id || Individual.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }
        }
    }

    static #algorithm = 'SHA-512/256'
    static hashId = (field = 'id') => hash(field, Individual.#algorithm)
    static matchIdHash = value => matchHash(value, Individual.#algorithm)

    static defSorts = [ null, [ 'lastName', 'suffix', 'firstName', 'middleName' ] ]


    static create = async ({ user: sessionUser = {}, branch, siteId }, body = {}) => {
        body = processData(body)

        const { ssn } = body
        let person

        if (ssn) person = await Individual.fetch({ user: sessionUser }, { ssn })

        if (person) {
            // ? Not sure how to update
            // ! Check if first and last names match, if not, it is possible that the person misspelled or changed the name
            // ! Add warning to the screen:
            /**
             * * -- Incorrect spelling
             * * -- Correct spelling, the name was legally changed
             * ? Ask for the date when the name was changed
             */

            //? Not sure what to return at this time
        } else {
            const {
                dob, sex,
                prefix, firstName, middleName, lastName, suffix, alias,
                status, statusExpiresOn, marital,
            } = body
            const createdBy = sessionUser.id || null
            let createdIn = null
            const today = moment().format('YYYY-MM-DD')

            if (branch) {
                createdIn = { branch }
                if (siteId) createdIn.siteId = siteId

                createdIn = JSON.stringify(createdIn)
            }

            let [ result ] = await mysql.execute(query.main.insert({
                dob, sex, ssn: { aes: [ ssn, secret ] },
                createdBy, createdIn,
            }))
            const id = result.insertId

            if (!id) throw new Error('DB Error: Failed to create individual')

            [ result ] = await mysql.execute(query.names.insert({
                personId: id,
                since: dob,
                prefix,
                firstName,
                middleName,
                lastName,
                suffix,
                alias,
                createdBy,
                createdIn,
            }))
            if (!result.affectedRows)  throw new Error("DB Error: Failed to create individual's name")

            if ([0, 1, 2].includes(status)) {
                const body = {
                    personId: id,
                    since: today,
                    status,
                    createdBy,
                    createdIn,
                }

                if (statusExpiresOn && status === 2)
                    body.expiresOn = statusExpiresOn

                await mysql.execute(query.legalPresence.insert(body))
            }

            if (marital)
                await mysql.execute(query.maritals.insert({
                    personId: id,
                    since: today,
                    status: marital,
                    createdBy,
                    createdIn,
                }))

            person = await Individual({ sessionUser }, { id })
            if (!person) throw new Error('Fetch Error: New individual not found')
        }

        return person
    }


    static fetch = async ({ user: sessionUser = {} }, filter = {}, { hideRawId = false, batchOnly = false, sorts = Individual.defSorts } = {}) => {
        const join = [ 'personId', 'id', { max: 'since' } ]
        const batch = [
            {
                table: query.main.table,
                fields: [ Individual.hashId(), 'dob', 'sex', { aes: [ 'ssn', secret ] } ],
            },
            {
                table: query.names.table,
                fields: [ 'prefix', 'firstName', 'alias', 'middleName', 'lastName', 'suffix' ],
                join,
            },
            {
                table: query.legalPresence.table,
                fields: [ 'status', [ 'expiresOn', 'statusExpiredOn' ] ],
                join,
            },
            {
                table: query.phones.table,
                fields: [ [ 'number', 'phone' ] ],
                join,
            },
            {
                table: query.addresses.table,
                fields: [ 'address1', 'address2', 'city', 'state', 'zip' ],
                join,
            },
            {
                table: query.emails.table,
                fields: 'email',
                join,
            },
            {
                table: query.identifications.table,
                fields: [
                    'driver',
                    'commercial',
                    [ 'number', 'idNumber' ],
                    [ 'class', 'idClass' ],
                    [ 'state', 'idState' ],
                    [ 'issuedOn', 'idIssuedOn' ],
                    [ 'expiresOn', 'idExpiresOn' ],
                    [ 'endorsement', 'idEndorsement' ],
                    [ 'restriction', 'idRestriction' ],
                ],
                join: [ 'personId', 'id', { max: 'issuedOn' } ],
            },
            {
                table: query.maritals.table,
                fields: [ [ 'status', 'marital' ] ],
                join,
            },
        ]

        const {
            id, _id, ssn,
            ids, _ids, sex, firstName, lastName
        } = filter
        const single = id || _id || ssn

        const match = {
            main: { id, sex },
            names: { firstName, lastName },
        }
        if (!id) {
            if (ids) match.main.id = ids
            match.main.id = Individual.matchIdHash(_id || _ids)
        }
        if (ssn) match.main.ssn = { aes: [ ssn, secret ] }

        batch[0].match = match.main
        batch[1].match = match.names

        if (!single && Array.isArray(sorts))
            sorts.forEach((sort, i) => { if (sort) batch[i].sort = sort })

        if (batchOnly) return batch

        const session = { user: { id: sessionUser.id } }
        const list = (await mysql.execute(Query.select(db.online, batch)))[0]
        list.forEach((data, i, arr) => arr[i] = new Team(data, { single, session, hideRawId }))

        return single ? list[0] : list
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
export { Relationship, query }