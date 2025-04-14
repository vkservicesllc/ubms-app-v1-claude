require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_SSN: secret } = process.env

/* Settings */
import db from '../../settings/mysql.mjs'

/* Assests */
import Person from '../../../client/global/modules/tools/core/person.mjs'
import { sessionError } from './user.mjs'

/* Tools */
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import { ssn as formatSsn } from '../../../client/global/modules/tools/utils/formatter.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { encrypt } from '../utils/crypto.mjs'

const mysql = require('../utils/mysql')


const query = {
    individuals: new Query(db.person, 'individuals'),
    names: new Query(db.person, 'names'),
    phones: new Query(db.person, 'phones'),
}
const targets = Object.keys(query)



class Individual extends Person {
    constructor(data = {}, light = false) {
        super(data)
        if (!data?._id || !Object.keys(this).length)
            throw new Error('Individual instantiation failed: Invalid data')

        const { _id, phone } = data

        reSuper(this, { _id }, { phone })

        if (!light) {

            this.id = async () => (await mysql.execute(query.individuals.select('id', {
                match: { id: Individual.matchIdHash(this._id) },
            })))[0][0].id


            this.ssn = async (session, format = false) => {
                if (!session?.user) return

                let { ssn } = (await mysql.execute(query.individuals.select({ aes: [ 'ssn', secret ] }, {
                    match: { id: Individual.matchIdHash(this._id) },
                })))[0][0]
                if (ssn) {
                    ssn = stringifyBuffer(ssn)

                    if (format) formatSsn(ssn)
                }

                return ssn
            }


            this.log = async (target, field) => {
                if (!targets.includes(target)) target = targets[0]
                const fields = [ 'createdBy', 'createdAt', 'createdIn', 'updateLog' ]
                const idProp = target == targets[0] ? 'id' : 'personId'

                let log = (await mysql.execute(query[target].select(fields, {
                    match: { [idProp]: Individual.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }


            this.flush = async target => {
                if (!targets.includes(target)) target = targets[0]
                const idProp = target == targets[0] ? 'id' : 'personId'

                await mysql.execute(query[target].update({ updateLog: null }, {
                    [idProp]: Individual.matchIdHash(this._id),
                }))
            }


            this.history = async (session, target = targets[1], log = false) => {
                if (sessionError(session)) return []

                if (!targets.includes(target)) target = targets[1]

                let fields, sort = { desc: 'since' }
                switch (target) {
                    case targets[1]:  //* names
                        fields = [ 'since', 'prefix', 'firstName', 'alias', 'middleName', 'lastName', 'suffix' ]
                        break
                    case targets[2]:  //* phones
                        fields = [ 'since', 'number' ]
                        break
                }
                if (log === true) fields.push('createdBy', 'createdAt', 'createdIn', 'updateLog')

                return (await mysql.execute(query[target].select(fields, {
                    match: { personId: Individual.matchIdHash(this._id) },
                    sort,
                })))[0]
            }


            this.modify = async (session, data, target) => {
                let modified = false
                const error = sessionError(session)
                if (error && !error.includes('Invalid User')) return { modified, error }

                const { branch, siteId, user } = session
                const id = await this.id()
                const modifiedBy = await user?.id() || null
                const currentData = { ...this }

                if (!targets.includes(target) || targets.indexOf(target) <= 1) target = undefined

                switch (target) {

                    case targets[2]:
                        const { phone: number } = data
                        break

                    default:
                        const { dob, prefix, firstName, middleName, lastName, suffix, alias } = data
                        let { sex, ssn } = data
                        if (!ssn) ssn = await this.ssn(session)
                        else {
                            const { found, error } = await Individual.find(session, { ssn })
                            if (error) return { modified, error }
                            if (found === true) return { modified, error: 'Invalid Data: SSN exists' }
                        }
                        if (typeof sex == 'string' && !isNaN(sex)) sex = +sex

                        currentData.ssn = await this.ssn(session)

                        const update = {
                            individuals: processData({ dob, sex, ssn }, {
                                currentData,
                                currentUpdateLog: await this.log(null, 'updateLog'),
                                modifiedBy,
                                branch,
                                siteId,
                            }),
                            names: processData({
                                prefix,
                                firstName,
                                middleName,
                                lastName,
                                suffix,
                                alias,
                            }, {
                                currentData,
                                currentUpdateLog: await this.log('names', 'updateLog'),
                                modifiedBy,
                                branch,
                                siteId,
                            }),
                        }

                        /* This means SSN is being updated */
                        if ('ssn' in update.individuals) {
                            // ? check the new SSN on uniqueness

                            update.individuals.ssn = { aes: [ ssn, secret ]}
                        }

                        if (update.individuals.dob) update.names.since = update.individuals.dob

                        const [ result1 ] = await mysql.execute(query.individuals.update(update.individuals, { id }))
                        const [ result2 ] = await mysql.execute(query.names.update(update.names, { personId: id, max: 'since' }))
                        if (result1.affectedRows == 1 || result2.affectedRows == 1) modified = true
                }

                return { modified, data: await Individual.data(session, { id }) }
            }


            this.update = async (session, data, target = targets[1]) => {
                let updated = false
                const error = sessionError(session)
                if (error && !error.includes('Invalid User')) return { updated, error }

                const { branch, siteId, user } = session
                const id = await this.id()
                const createdIn = { branch }
                if (siteId) createdIn.siteId = siteId

                if (!targets.includes(target)) target = targets[1]
                data = processData(data)

                switch (target) {
                    case targets[1]:
                        for (const prop of [ 'since', 'firstName', 'lastName' ])
                            if (!data[prop]) return { updated, error: 'Invalid Data' }
                        if (data.since <= this.dob) return { updated, error: 'Invalid Data: Effective Date' }
                        break
                }

                delete data._id
                delete data._personId
                data.personId = id
                data.createdBy = await user?.id() || null
                data.createdIn = JSON.stringify(createdIn)

                const [ result ] = await mysql.execute(query[target].insert(data))
                if (result.affectedRows == 1) updated = true

                return { updated, data: await Individual.data(session, { id }) }
            }


            this.delete = async session => {
                let deleted = false, error = sessionError(session)
                if (error) return { deleted, error }

                try {
                    const id = await this.id()
                    const ssn = await this.ssn(session)
                    const log = await this.log()
                    const history = {
                        names: await this.history(session, 'names', true),
                    }

                    const [ result ] = await mysql.execute(query.individuals.delete({ id }))
                    if (result.affectedRows > 0) deleted = true

                    if (deleted) {
                        const reduntant = [
                            'gender',
                            'prefix',
                            'firstName',
                            'middleName',
                            'lastName',
                            'suffix',
                            'alias',
                            'age',
                        ]

                        for (const prop of reduntant) delete this[prop]
                        this.ssn = ssn ? encrypt(ssn) : null
                        this.history = history
                        for (const prop in log) this[prop] = log[prop]

                        await logDeletion(session, 'individuals', this, { id })
                    }
                } catch (err) {
                    console.error(err)
                    error = 'DB Error'
                }

                return { deleted, error }
            }

        }
    }


    static #algorithm = 'SHA-512/256'

    static hashId = (field = 'id') => hash(field, Individual.#algorithm)

    static matchIdHash = value => matchHash(value, Individual.#algorithm)


    static create = async (session, data) => {
        let created = false
        const error = sessionError(session)
        if (error && !error.includes('Invalid User')) return { created, error }

        data = processData(data)

        for (const prop of [ 'dob', 'firstName', 'lastName' ])
            if (!data[prop]) return { created, error: 'Invalid Data' }

        const { ssn } = data
        let person

        if (ssn) person = await Individual.data(session, { ssn })

        if (person) {
            // ? Not sure how to update
            // ! Check if first and last names match, if not, it is possible that the person misspelled or changed the name
            // ! Add warning to the screen:
            /**
             * * -- Incorrect spelling
             * * -- Correct spelling, the name was legally changed
             * ? Ask for the date when the name was changed
             */
            if (firstName != person.firstName || lastName != person.lastName)
                return { created, error: 'Invalid Name: SSN Found', data: person }

            return { created, ...await person.modify(session, data) }
        } else {
            const { branch, siteId, user } = session
            const { dob, sex, prefix, firstName, middleName, lastName, suffix, alias } = data
            const createdBy = await user?.id() || null
            let createdIn = null

            if (branch) {
                createdIn = { branch }
                if (siteId) createdIn.siteId = siteId

                createdIn = JSON.stringify(createdIn)
            }

            const [ result ] = await mysql.execute(query.individuals.insert({
                dob, sex, ssn: { aes: [ ssn, secret ] },
                createdBy, createdIn,
            }))
            const id = result.insertId

            if (id) {
                const [ result ] = await mysql.execute(query.names.insert({
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
                if (result.affectedRows == 1) created = true
            }

            return { created, data: await Individual.data(session, { id }) }
        }
    }


    static #batch = (session, options = {}) => {
        if (!session?.user) return []

        const join = [ 'personId', 'id', { max: 'since' } ]
        const batch = [
            {
                table: 'individuals',
                fields: [ Individual.hashId(), 'dob', 'sex' ],
            },
            {
                table: 'names',
                fields: [ 'prefix', 'firstName', 'alias', 'middleName', 'lastName', 'suffix' ],
                join,
            },
            {
                table: 'phones',
                fields: [ [ 'number', 'phone' ] ],
                join,
            },
        ]

        let { params, filter } = options
        if (!params) params = {}
        if (!filter) filter = {}

        const { _id, id, ssn } = params
        const { sex, firstName, lastName } = filter

        const match = {
            individuals: { id, sex },
            names: { firstName, lastName },
        }
        if (!id) match.individuals.id = Individual.matchIdHash(_id)
        if (ssn) match.individuals.ssn = { aes: [ ssn, secret ] }

        batch[0].match = match.individuals
        batch[1].match = match.names

        return batch
    }


    static data = async (session, params = {}) => {
        if (!params._id && !params.id && !params.ssn) return

        const batch = Individual.#batch(session, { params })
        if (!batch.length) return

        const data = (await mysql.execute(Query.select(db.person, batch)))[0][0]

        return !data ? data : new Individual(data)
    }


    static list = async (session, filter = {}) => {
        const batch = Individual.#batch(session, { filter })
        if (!batch.length) return []

        const list = (await mysql.execute(Query.select(db.person, batch)))[0]
        list.forEach((data, i, arr) => arr[i] = new Individual(data, true))

        return list
    }


    static find = async (session, params = {}) => {
        if (!session?.user) return { error: 'Invalid User' }

        const { ssn } = params
        if (!ssn) return { error: 'Invalid Parameters' }

        let found = false, personId

        const data = (await mysql.execute(query.individuals.select('id', {
            match: { ssn: { aes: [ ssn, secret ] } },
        })))[0]
        found = data.length == 1
        if (found) personId = data[0].id

        return { found, personId }
    }


}


delete Individual.formSelect



export default Individual