require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_EIN, DB__MYSQL_AES_SSN } = process.env
const secret = {
    ein: DB__MYSQL_AES_EIN,
    ssn: DB__MYSQL_AES_SSN,
}

/* Settings */
import db, { query } from '../../settings/mysql.mjs'

/* Tools */
import moment from 'moment'
import Individual from './individual.mjs'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Team from './team.mjs'
import User from './user.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
// import { sessionError } from './user.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import { classInstance, classStatic } from '../utils/class.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { encrypt } from '../utils/crypto.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { numeric } from '../../../client/global/modules/tools/utils/number.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import strip, { ein as formatEin, ssn as formatSsn } from '../../../client/global/modules/tools/utils/formatter.mjs'
import { sortArrayByObjectKey, sortObjectByValue } from '../../../client/global/modules/tools/utils/sorter.mjs'

const mysql = require('../utils/mysql')



class Company {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true } = {}) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Company Data')

        this._id = data._id
        if (!hideRawId) this.id = data.id

        this.category = data.category
        if (!hideSensitive) this.ein = stringifyBuffer(data.ein)
        this.duns = data.duns
        this.website = data.website
        this.route = data.route
        this.active = data.active
        this.confirmed = data.confirmed
        this.global = data.global
        this.name = data.name
        this.busName = data.busName
        this.coType = data.coType
        this.alias = data.alias
        this.since = data.since
        this.until = data.until
        this.lastLogo = data.lastLogo
        this.style = data.style || {}
        if (!this.style.background) this.style.background = null
        if (!this.style.text) this.style.text = null

        this.expansion = {
            category: Company.list.category[data.category].item[1],
            categoryGroup: Company.list.category[data.category].item[0],
            group: Company.list.category[data.category].group,
        }

        this.owner = data._ownerId
            ? new Owner({
                _id: data._ownerId,
                _personId: data._personId,
                id: data.ownerId,
                personId: data.personId,
                firstName: data.firstName,
                middleName: data.middleName,
                lastName: data.lastName,
                suffix: data.suffix,
                sex: data.sex,
                dob: data.dob,
                ssn: data.ssn,
            }, { hideRawId, hideSensitive })
            : { _id: null }
        if (this.owner._id)
            this.owner.name = this.owner.fullName('FmLs')

        this.address = {
            physical: new Address(data),
            mail: new Address({
                address1: data.mailAddress1,
                address2: data.mailAddress2,
                city: data.mailCity,
                state: data.mailState,
                zip: data.mailZip,
            }),
        }
        this.address.physical.mail = !!data.mail

        this.phone = data.phone
        this.fax = data.fax
        this.email = data.email

        if (single) {
            this.session = session


            this.fetch = (target, params) => classInstance.fetch(this, new.target, target, params)


            this.log = params => classInstance.log(this, new.target, params)
        }
    }

    static #algorithm = 'SHA-256'
    static hashId = (field = 'id') => hash(field, Company.#algorithm)
    static matchIdHash = value => matchHash(value, Company.#algorithm)

    static config = () => ({
        db: db.business,
        query: query.company,
        idProp: 'companyId',
        jxTargets: jxTargets('company'),
        defSorts: [ null, [ 'busName', 'coType' ] ],
        logFile: 'companies',
    })


    static create = (session, body, params) => classStatic.create(this, session, body, params, {
        async find(body, hideRawId) {
            const { busName, coType } = body
            const data = await Company.fetch(session, { busName, coType }, { hideRawId })

            return { found: !!data, data }
        },
        split(body) {
            const { category, ein, duns, since, busName, coType, alias } = body

            body = {
                main: { category, ein, duns, since },
                name: { since, busName, coType, alias },
            }

            return body
        },
    })


    static fetch = ({ user: sessionUser = {}, branch, siteId = null }, filter,
        { hideRawId = false, hideSensitive = true, sorts = Company.config().defSorts, mode } = {}
    ) => {
        const join = [ 'companyId', 'id', { max: 'since' } ]

        return classStatic.fetch(this, { user: sessionUser, branch, siteId }, filter, { hideRawId, hideSensitive, sorts, mode }, {
            batch: [
                {
                    table: query.company.main.table,
                    fields: [
                        'id', Company.hashId(), 'category', { aes: [ 'ein', secret.ein ] }, 'duns', 'website',
                        'since', 'until', 'global', 'active', 'confirmed', 'lastLogo', 'style',
                    ],
                },
                {
                    table: query.company.name.table,
                    fields: [
                        'busName', 'coType', 'alias',
                        { concat: [ [ 'busName', '^, ', 'coType' ], 'name' ] },
                        { route: [ [ 'busName', 'coType' ] ] },
                    ],
                    join,
                },
                {
                    table: query.company.ownership.table,
                    join,
                },
                {
                    table: query.company_owner.main.table,
                    fields: [ [ 'id', 'ownerId' ], [ Owner.hashId(), 'ownerId' ], 'personId', Individual.hashId('personId') ],
                    join: [ 'id', 'ownerId', 'company_ownerships' ],
                },
                {
                    db: db.person,
                    table: query.person.main.table,
                    fields: [ 'dob', 'sex', { aes: [ 'ssn', secret.ssn ] } ],
                    join: [ 'id', 'personId', 'company_owners' ],
                },
                {
                    db: db.person,
                    table: query.person.name.table,
                    fields: [ 'firstName', 'middleName', 'lastName', 'suffix' ],
                    join: [ 'personId', 'id', {
                        table: 'individuals',
                        max: 'since',
                    } ],
                },
                {
                    table: query.company.address.table,
                    fields: [ 'address1', 'address2', 'city', 'state', 'zip', 'mail' ],
                    join,
                },
                {
                    table: query.company.mail.table,
                    fields: [
                        [ 'address1', 'mailAddress1' ],
                        [ 'address2', 'mailAddress2' ],
                        [ 'city', 'mailCity' ],
                        [ 'state', 'mailState' ],
                        [ 'zip', 'mailZip' ],
                    ],
                    join,
                },
                {
                    table: query.company.phone.table,
                    fields: 'phone',
                    join,
                },
                {
                    table: query.company.fax.table,
                    fields: 'fax',
                    join,
                },
                {
                    table: query.company.email.table,
                    fields: 'email',
                    join,
                },
            ],
            prepare(batch, filter) {
                const {
                    id, _id, ein, duns, busName, coType, alias, route,
                    ids, _ids, ownerId, _ownerId, category, global, lastLogo,
                    closed = false, confirmed = true, active, // Combined when undefined
                } = filter
                const single = !!id || !!_id || !!ein || !!duns || !!(busName && coType) || !!alias || !!route

                const match = {
                    main: { id, duns, category, global, lastLogo, confirmed, active },
                    names: { alias },
                    ownerships: { ownerId: ownerId || Owner.matchIdHash(_ownerId) },
                }
                if (!id) {
                    if (ids) match.main.id = ids
                    else match.main.id = Company.matchIdHash(_id || _ids)
                }
                if (ein) match.main.ein = { aes: [ ein, secret.ein ] }
                if (busName && coType) {
                    match.names.busName = busName
                    match.names.coType = coType
                }
                if (route) match.names.route = { route: [ [ 'busName', 'coType' ], route ] }
                if (typeof closed === 'boolean') match.main.until = { null: !closed }

                batch[0].match = match.main
                batch[1].match = match.names
                batch[2].match = match.ownerships

                return { single, batch }
            },
        })
    }


    static list = {

        category: {
            'crr': {  branch: 'carrier',       item: [ 'Carriers', 'Carrier' ],      group: 'Logistics',     path: [ 'carriers', 'carrier' ],  icon: '<i class="fas fa-truck-fast"></i>'  },
            'brk': {  branch: 'broker',        item: [ 'Brokers', 'Broker' ],        group: 'Brokerage',     path: [ 'brokers', 'broker' ]        },
            'whs': {  branch: 'warehouse',     item: [ 'Warehouses', 'Warehouse' ],  group: 'Storage',       path: [ 'warehouses', 'warehouse' ]  },
            'shp': {  branch: 'shop',          item: [ 'Shops', 'Shop' ],            group: 'Shops',         path: [ 'shops', 'shop' ]            },
            'scl': {  branch: 'school',        item: [ 'Schools', 'School' ],        group: 'CDL Training',  path: [ 'schools', 'school' ]        },
            'cst': {  branch: 'construction',  item: [ 'Builders', 'Builder' ],      group: 'Construction',  path: [ 'builders', 'builder' ]      },
        },

        type: {
            'Corporation': {
                'Inc': 'Incorporated',
                'PC': 'Professional Corporation',
                'B Corp': 'Benefit Corporation',
                'C Corp': 'C Corporation',
                'S Corp': 'S Corporation',
            },
            'Partnership': {
                'GP': 'General Partnership',
                'LP': 'Limited Partnership',
                'LLP': 'Limited Liability Partnership',
            },
            'Other': {
                'LLC': 'Limited Liability Company',
            },
            full() {
                return {
                    ...this['Corporation'],
                    ...this['Partnership'],
                    ...this['Other'],
                }
            },
        },

    }


}



class Owner extends Individual {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Owner Data')

        super(data, { single, hideRawId, hideSensitive })

        const props = { _id: data._id, _personId: data._personId }
        if (!hideRawId) {
            props.id = data.id
            props.personId = data.personId
        }
        if (!hideSensitive) this.ssn = stringifyBuffer(data.ssn)

        const props2 = { count: { companies: data.companyCount } }

        const categories = Company.list.category
        for (const category in categories) {
            const path = categories[category].path[0]
            props2.count[path] = data[`${path}Count`]
        }

        reSuper(this, props, props2)

        if (single) {
            this.session = session


            this.fetch = (target, params) => classInstance.fetch(this, new.target, target, params)


            this.log = params => classInstance.log(this, new.target, params)
        }
    }

    static #algorithm = 'SHA-1'
    static hashId = (field = 'id') => hash(field, Owner.#algorithm)
    static matchIdHash = value => matchHash(value, Owner.#algorithm)

    static config = () => ({
        db: db.business,
        query: query.company_owner,
        idProp: 'ownerId',
        defSorts: [ null, null, [ 'lastName', 'suffix', 'firstName', 'middleName' ] ],
        logFile: 'company-owners',
    })


    static create = (session, body, params) => classStatic.create(this, session, body, params, {
        async split(body) {
            const { ssn, dob } = body

            let person
            if (ssn) person = await Individual.fetch(session, { ssn })
            if (person?.dob !== dob) throw new Error('SSN/DOB mismatch (SSN recognized)')

            if (!person) ({ person } = await Individual.create(session, body))

            body = { main: { personId: person.id } }

            return body
        },
    })


    static fetch = (session, filter, { hideRawId = false, hideSensitive = true, sorts = Owner.config().defSorts, mode }) => classStatic.fetch(this, session, filter, {
        hideRawId, hideSensitive, sorts, mode,
    }, {
        removeFullGroupBy: true,
        batch: [
            {
                table: query.company_owner.main.table,
                fields: [ 'id', Owner.hashId(), 'personId', Individual.hashId('personId') ],
                group: 'id',
            },
            {
                db: db.person,
                table: query.person.main.table,
                fields: [ 'dob', 'sex', { aes: [ 'ssn', secret.ssn ] } ],
                join: [ 'id', 'personId' ],
            },
            {
                db: db.person,
                table: query.person.name.table,
                fields: [ 'firstName', 'middleName', 'lastName', 'suffix' ],
                join: [ 'personId', 'id', {
                    table: 'individuals',
                    max: 'since',
                } ],
            },
            {
                db: db.person,
                table: query.person.phone.table,
                fields: 'phone',
                join: [ 'personId', 'id', {
                    table: 'individuals',
                    max: 'since',
                } ],
            },
            {
                table: query.company.ownership.table,
                join: [ 'ownerId', 'id' ],
            },
            {
                table: query.company.main.table,
                fields: [ { count: [ 'category', 'companyCount' ] } ],
                join: [ 'id', 'companyId', 4 ],
            },
        ],
        prepare(batch, filter) {
            const categories = Company.list.category
            for (const category in categories)
                batch[5].fields.push({
                    countCase: [ { category }, `${categories[category].path[0]}Count` ],
                })

            const {
                id, _id, ssn,
                ids, _ids, sex, firstName, lastName,
            } = filter
            const single = !!id || !!_id || !!ssn

            const match = {
                main: { id },
                individuals: { sex },
                names: { firstName, lastName },
            }
            if (!id) {
                if (ids) match.main.id = ids
                match.main.id = Owner.matchIdHash(_id || _ids)
            }
            if (ssn) match.individuals.ssn = { aes: [ ssn, secret.ssn ] }

            batch[0].match = match.main
            batch[1].match = match.individuals
            batch[2].match = match.names

            return { single, batch }
        },
    })


}



function jxTargets(src, target = null) {
    const targets =  {
        company: {
            users: [ query.jx.users_companies, 'userId', User ],
        },
    }[src]

    return target ? targets[target] : targets
}



export default Company
export { Owner }