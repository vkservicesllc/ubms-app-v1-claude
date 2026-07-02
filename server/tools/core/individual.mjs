/* Settings */
import db, { query } from '../../settings/mysql.mjs'

/* Tools */
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import { hash, matchHash } from '../utils/query.mjs'
import { classInstance, classStatic } from '../utils/class.mjs'
import { selectAES, processAES, unprocessAES } from '../utils/data.mjs'

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
                addrSince: data.idAddrSince,
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
        if (identification) {
            if (identification.addrSince)
                identification.address = new Address({
                    address1: data.idAddr1,
                    address2: data.idAddr2,
                    city: data.idAddrCity,
                    state: data.idAddrState,
                    zip: data.idAddrZip,
                })
            else if (data.idAddrZipBu)
                identification.address = new Address({
                    address1: data.idAddr1Bu,
                    address2: data.idAddr2Bu,
                    city: data.idAddrCityBu,
                    state: data.idAddrStateBu,
                    zip: data.idAddrZipBu,
                })
        }

        let count
        if (data.ownerCount !== undefined && data.driverCount !== undefined)
            count = {
                companyOwners: data.ownerCount,
                drivers: data.driverCount,
                driverApplications: data.driverAplCount,
            }

        const props2 = { legal, phone, email, marital, address, identification }
        if (count) props2.count = count

        // props2.comparator = {
        //     name: data.nameSince,
        //     legal: data.legalSince,
        //     marital: data.maritalSince,
        //     address: data.addrSince,
        //     phone: data.phoneSince,
        //     email: data.emailSince,
        //     identification: data.identId,
        // }

        reSuper(this, props, props2)

        if (single) {
            this.session = session
            this.config = { hideRawId, hideSensitive }


            this.add = (target, body) => classInstance.add(this, new.target, target, body)


            this.fetch = (target, filter, params) => classInstance.fetch(this, new.target, target, filter, params)


            this.update = (targetOrBody, body, match) => classInstance.update(this, new.target, targetOrBody, body, match, {
                sanitize(target, body) {
                    //* sql_mode=NO_ENGINE_SUBSTITUTION
                    if (target === 'main' && body.dob === null) body.dob = '0000-00-00'
                    return body
                },
                async final(person, body, target) {
                    if (target !== 'main' || body.dob === undefined || body.dob === person.dob) return

                    let keys = Object.keys(query.person)
                    keys = keys.filter(key => !['main', 'identifications'].includes(key))
                    const match = { personId: person.id, since: person.dob }

                    for (const target of keys)
                        await mysql.execute(query.person[target].update({ since: body.dob }, match))
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
        childSort: {
            identifications: 'issuedOn',
        },
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
        sanitize(body) {
            //* sql_mode=NO_ENGINE_SUBSTITUTION
            if (!body.dob) body.dob = '0000-00-00'
            return body
        },
        split(body) {
            const {
                dob, gender, ssn,
                prefix, firstName, middleName, lastName, suffix, alias,
            } = body

            body = {
                main: { dob, gender },
                names: { since: dob, prefix, firstName, middleName, lastName, suffix, alias },
            }
            if (ssn) body.main.ssn = processAES('ssn', unprocessAES(ssn))

            return body
        },
    })


    static fetch = (session, filter, { hideRawId = false, hideSensitive = true, sorts = Individual.config().defSorts, limit, mode = 'data' } = {}) => {
        const join = [ 'personId', 'id', { max: 'since' } ]

        return classStatic.fetch(this, session, filter, {
            hideRawId, hideSensitive, sorts, limit, mode,
        }, {
            removeFullGroupBy: true,
            batch: [
                {
                    table: query.person.main.table,
                    fields: [ 'id', Individual.hashId(), 'dob', 'gender', selectAES('ssn') ],
                    group: 'id',
                },
                {
                    table: query.person.names.table,
                    fields: [
                        [ 'since', 'nameSince' ],
                        'prefix', 'firstName', 'alias', 'middleName', 'lastName', 'suffix',
                    ],
                    join,
                },
                {
                    table: query.person.legal.table,
                    fields: [
                        [ 'since', 'legalSince' ],
                        'status', [ 'expiresOn', 'statusExpiredOn' ],
                    ],
                    join,
                },
                {
                    table: query.person.maritals.table,
                    fields: [ [ 'since', 'maritalSince' ], [ 'status', 'marital' ] ],
                    join,
                },
                {
                    table: query.person.addresses.table,
                    fields: [
                        [ 'since', 'addrSince' ],
                        'address1', 'address2',
                        'city', 'state', 'zip',
                    ],
                    join,
                },
                {
                    table: query.person.phones.table,
                    fields: [ [ 'since', 'phoneSince' ], 'phone' ],
                    join,
                },
                {
                    table: query.person.emails.table,
                    fields: [ [ 'since', 'emailSince' ], 'email' ],
                    join,
                },
                {
                    table: query.person.identifications.table,
                    fields: [
                        [ 'id', 'identId' ],
                        [ 'addrSince', 'idAddrSince' ],
                        'driver', 'commercial',
                        [ 'number', 'idNumber' ],
                        [ 'class', 'idClass' ],
                        [ 'state', 'idState' ],
                        [ 'issuedOn', 'idIssuedOn' ],
                        [ 'expiresOn', 'idExpiresOn' ],
                        [ 'endorsement', 'idEndorsement' ],
                        [ 'restriction', 'idRestriction' ],
                        //* Bu - Backup
                        [ 'address1', 'idAddr1Bu' ],
                        [ 'address2', 'idAddr2Bu' ],
                        [ 'addrCity', 'idAddrCityBu' ],
                        [ 'addrState', 'idAddrStateBu' ],
                        [ 'addrZip', 'idAddrZipBu' ],
                    ],
                    join: [ 'personId', 'id', { max: 'issuedOn' } ],
                },
                {
                    table: [ query.person.addresses.table, 'identificationAddresses' ],
                    fields: [
                        [ 'address1', 'idAddr1'  ],
                        [ 'address2', 'idAddr2' ],
                        [ 'city', 'idAddrCity' ],
                        [ 'state', 'idAddrState' ],
                        [ 'zip', 'idAddrZip' ],
                    ],
                    join: [ 'personId', 'id', 0, [
                        'since', 'addrSince', query.person.identifications.table,
                    ] ],
                },
                //? need it?
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
                //! ADD MORE COUNTS IF NEEDED
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
                if (ssn) match.main.ssn = processAES('ssn', ssn)

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



export default Individual
