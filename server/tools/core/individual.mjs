const { DB__MYSQL_AES_SSN: secret } = Bun.env

/* Settings */
import db, { query } from '../../settings/mysql.mjs'

/* Tools */
import moment from 'moment'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import { classInstance, classStatic } from '../utils/class.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { encrypt } from '../utils/crypto.mjs'

const mysql = require('../utils/mysql')



class Individual extends Person {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Person Data')

        super(data)

        const props = { _id: data._id }
        if (!hideRawId) props.id = data.id
        if (!hideSensitive) this.ssn = stringifyBuffer(data.ssn)

        const { phone, email, marital } = data
        const legal = data.status ? { status: data.status, expiresOn: data.statusExpiresOn } : null
        const address = data.zip ? new Address(data) : null

        const identification = data.idNumber
            ? {
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
            : null

        const count = {
            companyOwners: data.ownerCount,
            drivers: data.driverCount,
            driverApplications: data.driverAplCount,
        }

        reSuper(this, props, { legal, phone, email, marital, address, identification, count })

        if (single) {
            this.session = session


            this.fetch = (target, params) => classInstance.fetch(this, new.target, target, params)


            this.update = (targetOrBody, body, match) => classInstance.update(this, new.target, targetOrBody, body, match, {
                currentData(target, data) {
                    switch (target) {
                        //
                    }

                    return data
                },
                async final(person, body) {
                    if (!body.dob || body.dob === person.dob) return

                    let keys = Object.keys(query.person)
                    keys = keys.filter(key => !['main', 'identification'].includes(key))

                    for (const target of keys)
                        await mysql.execute(query.person[target].update({ since: body.dob }, {
                            personId: person.id, since: person.dob,
                        }))
                },
            })


            this.delete = (target, matchOrIds) => classInstance.delete(this, new.target, target, matchOrIds, {
                extendLog(person, log) {
                    //! REMOVE REDUNDANT
                    //! ATTACH HISTORY
                    return person
                },
            })


            this.log = params => classInstance.log(this, new.target, params, [
                ...classInstance.logFields,
                'createdIn',
            ])
        }
    }

    static #algorithm = 'SHA-512/256'
    static hashId = (field = 'id') => hash(field, Individual.#algorithm)
    static matchIdHash = value => matchHash(value, Individual.#algorithm)

    static config = () => ({
        enforceUser: false,
        enforceLocation: true,
        db: db.person,
        query: query.person,
        idProp: 'personId',
        defSorts: [ null, [ 'lastName', 'suffix', 'firstName', 'middleName' ] ],
        logFile: 'individuals',
    })


    static create = (session, body, params) => classStatic.create(this, session, body, params, {
        async find(body, hideRawId) {
            const { ssn, dob } = body
            let data

            if (ssn) {
                data = await Individual.fetch(session, { ssn }, { hideRawId })

                if (data && data.dob !== dob) throw new Error('SSN/DOB mismatch (SSN recognized)')
            }

            return { found: !!data, data }
        },
        split(body) {
            const {
                dob, gender, ssn,
                prefix, firstName, middleName, lastName, suffix, alias,
            } = body

            body = {
                main: { dob, gender },
                name: { since: dob, prefix, firstName, middleName, lastName, suffix, alias, },
            }
            if (ssn) body.main.ssn = ssn

            return body
        },
    })


    static fetch = (session, filter, { hideRawId = false, hideSensitive = true, sorts = Individual.config().defSorts, mode = 'data' } = {}) => {
        const join = [ 'personId', 'id', { max: 'since' } ]

        return classStatic.fetch(this, session, filter, {
            hideRawId, hideSensitive, sorts, mode,
        }, {
            removeFullGroupBy: true,
            batch: [
                {
                    table: query.person.main.table,
                    fields: [ 'id', Individual.hashId(), 'dob', 'gender', { aes: [ 'ssn', secret ] } ],
                    group: 'id',
                },
                {
                    table: query.person.name.table,
                    fields: [ 'prefix', 'firstName', 'alias', 'middleName', 'lastName', 'suffix' ],
                    join,
                },
                {
                    table: query.person.legal.table,
                    fields: [ 'status', [ 'expiresOn', 'statusExpiredOn' ] ],
                    join,
                },
                {
                    table: query.person.phone.table,
                    fields: 'phone',
                    join,
                },
                {
                    table: query.person.address.table,
                    fields: [ 'address1', 'address2', 'city', 'state', 'zip' ],
                    join,
                },
                {
                    table: query.person.email.table,
                    fields: 'email',
                    join,
                },
                {
                    table: query.person.identification.table,
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
                    table: query.person.marital.table,
                    fields: [ [ 'status', 'marital' ] ],
                    join,
                },
                {
                    db: db.business,
                    table: query.company_owner.main.table,
                    fields: [ { count: [ 'id', 'ownerCount' ] } ],
                    join: [ 'personId', 'id' ],
                },
                {
                    db: db.carrier,
                    table: query.driver.main.table,
                    fields: [ { count: [ 'id', 'driverCount' ] } ],
                    join: [ 'personId', 'id' ],
                },
                {
                    db: db.carrier,
                    table: query.driver_application.main.table,
                    fields: [ { count: [ 'id', 'driverAplCount' ] } ],
                    join: [ 'driverId', 'id', query.driver.main.table ],
                },
            ],
            prepare(batch, filter) {
                const {
                    id, _id, ssn,
                    ids, _ids, gender, firstName, lastName
                } = filter
                const single = !!id || !!_id || !!ssn

                const match = {
                    main: { id, gender },
                    names: { firstName, lastName },
                }
                if (!id) {
                    if (ids) match.main.id = ids
                    match.main.id = Individual.matchIdHash(_id || _ids)
                }
                if (ssn) match.main.ssn = { aes: [ ssn, secret ] }

                batch[0].match = match.main
                batch[1].match = match.names

                return { single, batch }
            },
        })
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



export default Individual
export { Relationship }