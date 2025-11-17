require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_EIN, DB__MYSQL_AES_SSN } = process.env
const secret = {
    ein: DB__MYSQL_AES_EIN,
    ssn: DB__MYSQL_AES_SSN,
}

/* Settings */
import db from '../../settings/mysql.mjs'

/* Tools */
import moment from 'moment'
import Individual, { query as personQuery } from './individual.mjs'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Team from './team.mjs'
import User, { query as userQuery } from './user.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
// import { sessionError } from './user.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { encrypt } from '../utils/crypto.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { numeric } from '../../../client/global/modules/tools/utils/number.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import strip, { ein as formatEin, ssn as formatSsn } from '../../../client/global/modules/tools/utils/formatter.mjs'
import { sortArrayByObjectKey, sortObjectByValue } from '../../../client/global/modules/tools/utils/sorter.mjs'

const mysql = require('../utils/mysql')


const { sqlMode } = Query
const query = {
    main: new Query(db.business, 'companies'),
    names: new Query(db.business, 'company_names'),
    owners: new Query(db.business, 'company_owners'),  // * 2
    ownerships: new Query(db.business, 'company_ownerships'),
    addresses: new Query(db.business, 'company_addresses'),  // * 4
    mail: new Query(db.business, 'company_mail'),  // * 5
    phones: new Query(db.business, 'company_phones'),
    faxes: new Query(db.business, 'company_faxes'),
    emails: new Query(db.business, 'company_emails'),
    //? teams: new Query(db.business, 'teams_companies'),
    //! users: new Query(db.business, 'companies_users'),
}



class Company {
    constructor(data = {}, { single = true, hideRawId = false, hideSensitive = true } = {}) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Company Data')

        const props = { _id: data._id }
        if (!hideRawId) props.id = data.id

        this.category = data.category
        if (!hideSensitive) this.ein = stringifyBuffer(ein)
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
            category: data.category ? Company.list.category[data.category].item[1] : null,
            categoryGroup: data.category ? Company.list.category[data.category].item[0] : null,
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
            physical: new Address({
                address1: data.address1,
                address2: data.address2,
                city: data.city,
                state: data.state,
                zip: data.zip,
            }),
            mail: new Address({
                address1: data.mailAddress1,
                address2: data.mailAddress2,
                city: data.mailCity,
                state: data.mailState,
                zip: data.mailZip,
            }),
        }

        this.phone = data.phone
        this.fax = data.fax
        this.email = data.email

        if (single) {}
    }

    static #algorithm = 'SHA-256'
    static hashId = (field = 'id') => hash(field, Company.#algorithm)
    static matchIdHash = value => matchHash(value, Company.#algorithm)

    static defSorts = [ null, [ 'busName', 'coType' ] ]


    static create = async ({ user: sessionUser = {} }, body = {}) => {}


    static fetch = async ({ user: sessionUser = {}, branch, siteId } = {}, filter = {}, { hideRawId = false, hideSensitive = true, sorts = Company.defSorts, mode = 'data' } = {}) => {
        if (!sessionUser.id) throw new Error('Company Fetch Error: No session user')

        const join = [ 'companyId', 'id', { max: 'since' } ]
        const batch = [
            {
                table: query.main.table,
                fields: [
                    'id', Company.hashId(), 'catId', { aes: [ 'ein', secret.ein ] }, 'duns', 'website',
                    'since', 'until', 'global', 'active', 'confirmed', 'lastLogo', 'style',
                ],
            },
            {
                table: query.names.table,
                fields: [
                    'busName', 'coType', 'alias',
                    { concat: [ [ 'busName', '^, ', 'coType' ], 'name' ] },
                    { route: [ [ 'busName', 'coType' ] ] },
                ],
                join,
            },
            {
                table: query.ownerships.table,
                join,
            },
            {
                table: query.owners.table,
                fields: [ [ 'id', 'ownerId' ], [ Owner.hashId(), 'ownerId' ], 'personId', Individual.hashId('personId') ],
                join: [ 'id', 'ownerId', 'company_ownerships' ],
            },
            {
                db: db.person,
                table: personQuery.main.table,
                fields: [ 'dob', 'sex', { aes: [ 'ssn', secret.ssn ] } ],
                join: [ 'id', 'personId', 'company_owners' ],
            },
            {
                db: db.person,
                table: personQuery.names.table,
                fields: [ 'firstName', 'middleName', 'lastName', 'suffix' ],
                join: [ 'personId', 'id', {
                    table: 'individuals',
                    max: 'since',
                } ],
            },
            {
                table: query.addresses.table,
                fields: [ 'address1', 'address2', 'city', 'state', 'zip' ],
                join,
            },
            {
                table: query.mail.table,
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
                table: query.phones.table,
                fields: [ [ 'number', 'phone' ] ],
                join,
            },
            {
                table: query.faxes.table,
                fields: [ [ 'number', 'fax' ] ],
                join,
            },
            {
                table: query.emails.table,
                fields: 'email',
                join,
            },
        ]

        const {
            id, _id, ein, duns, route,
            ids, _ids, ownerId, _ownerId, category, global, lastLogo
        } = filter
        const single = id || _id || ein || duns || route

        const match = {
            main: { id, duns, category, global, lastLogo },
            names: {},
            ownerships: { ownerId: ownerId || Owner.matchIdHash(_ownerId) },
        }
        if (!id) {
            if (ids) match.main.id = ids
            match.main.id = Company.matchIdHash(_id || _ids)
        }
        if (ein) match.main.ein = { aes: [ ein, secret.ein ] }
        if (route) match.names.route = { route: [ [ 'busName', 'coType' ], route ] }

        if (sessionUser.DS && branch === 'admin') {
            const { closed, active, confirmed } = filter

            if (typeof closed === 'boolean') match.main.until = { null: !closed }
            if (typeof active === 'boolean') match.main.active = active
            if (typeof confirmed === 'boolean') match.main.confirmed = confirmed
        } else {
            match.main.until = null
            match.main.confirmed = true
        }

        batch[0].match = match.companies
        batch[1].match = match.names
        batch[2].match = match.ownerships

        if (!single && Array.isArray(sorts))
            sorts.forEach((sort, i) => { if (sort) batch[i].sort = sort })

        if (mode === 'batch') return batch

        const queryStr = Query.select(db.online, batch)
        if (mode === 'query') return queryStr

        const list = (await mysql.execute(queryStr))[0]

        const session = { user: { id: sessionUser.id }, siteId, branch }
        list.forEach((data, i, arr) => arr[i] = new Company(data, { single, session, hideRawId, hideSensitive }))

        return single ? list[0] : list
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
    constructor(data = {}, { single = true, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Owner Data')

        super(data, { single, hideRawId, hideSensitive })

        const props = { _id: data._id, _personId: data._personId }
        if (!hideRawId) {
            props.id = data.id
            props.personId = data.personId
        }
        if (!hideSensitive) this.ssn = stringifyBuffer(data.ssn)

        const props2 = { count: { companies: companyCount } }

        const categories = Company.list.category
        for (const catId in categories) {
            const path = categories[catId].path[0]
            props2.count[path] = data[`${path}Count`]
        }

        reSuper(this, props, props2)

        if (single) {}
    }

    static #algorithm = 'SHA-1'
    static hashId = (field = 'id') => hash(field, Owner.#algorithm)
    static matchIdHash = value => matchHash(value, Owner.#algorithm)

    static defSorts = [ null, null, [ 'lastName', 'suffix', 'firstName', 'middleName' ] ]


    static create = async ({ user: sessionUser = {} }, body = {}) => {}


    static fetch = async ({ user: sessionUser = {} } = {}, filter = {}, { hideRawId = false, hideSensitive = true, sorts = Role.defSorts, mode = 'data' } = {}) => {
        if (!sessionUser.id) throw new Error('Owner Fetch Error: No session user')

        const batch = [
            {
                table: query.owners.table,
                fields: [ 'id', Owner.hashId(), 'personId', Individual.hashId('personId') ],
                group: 'id',
            },
            {
                db: db.person,
                table: personQuery.main.table,
                fields: [ 'dob', 'sex', { aes: [ 'ssn', secret.ssn ] } ],
                join: [ 'id', 'personId' ],
            },
            {
                db: db.person,
                table: personQuery.names.table,
                fields: [ 'firstName', 'middleName', 'lastName', 'suffix' ],
                join: [ 'personId', 'id', {
                    table: 'individuals',
                    max: 'since',
                } ],
            },
            {
                db: db.person,
                table: personQuery.phones.table,
                fields: [ [ 'number', 'cell' ] ],
                join: [ 'personId', 'id', {
                    table: 'individuals',
                    max: 'since',
                } ],
            },
            {
                table: query.ownerships.table,
                join: [ 'ownerId', 'id' ],
            },
            {
                table: query.main.table,
                fields: [ { count: [ 'catId', 'companyCount' ] } ],
                join: [ 'id', 'companyId', 4 ],
            },
        ]

        const categories = Company.list.category
        for (const category in categories)
            batch[5].fields.push({
                countCase: [ { category }, `${categories[category].path[0]}Count` ],
            })

        const {
            id, _id, ssn,
            ids, _ids, sex, firstName, lastName,
        } = filter
        const single = id || _id || ssn

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

        if (!single && Array.isArray(sorts))
            sorts.forEach((sort, i) => { if (sort) batch[i].sort = sort })

        if (mode === 'batch') return batch

        const queryStr = Query.select(db.online, batch)
        if (mode === 'query') return queryStr

        await mysql.query(sqlMode.onlyFullGroupBy.remove)
        const list = (await mysql.execute(queryStr))[0]

        const session = { user: { id: sessionUser.id }, siteId, branch }
        list.forEach((data, i, arr) => arr[i] = new Owner(data, { single, session, hideRawId, hideSensitive }))

        return single ? list[0] : list
    }


}



export default Company
export { Owner, query }