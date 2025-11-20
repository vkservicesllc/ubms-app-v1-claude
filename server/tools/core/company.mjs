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
import User, { query as userQuery, setSession } from './user.mjs'
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
    ownerships: new Query(db.business, 'company_ownerships'),
    addresses: new Query(db.business, 'company_addresses'),
    mail: new Query(db.business, 'company_mail'),
    phones: new Query(db.business, 'company_phones'),
    faxes: new Query(db.business, 'company_faxes'),
    emails: new Query(db.business, 'company_emails'),
    //! ...Add more if needed
    owners: new Query(db.business, 'company_owners'),
}



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

        if (single) {
            this.session = session


            this.add = async (target, bodyOrIds) => {
                const { user: sessionUser } = this.session || {}

                if (sessionUser?.id) throw new Error('Company Add Error: No session user')
                if (!target) throw new Error('Company Add Error: Target not supplied')
                if (!this.id) throw new Error('Company Add Error: Personal ID is missing')

                const jxTargets = relTargets('main')
                const targets = Object.keys(query)
                const inTargets = Object.keys(targets).includes(target)
                if (!inTargets || !Object.keys(jxTargets).includes(target) || target === 'main' || target === 'owners')
                    throw new Error('Company Add Error: Invalid target supplied')

                if (inTargets) {
                    let body = bodyOrIds

                    body = processData(body)
                    body.companyId = this.id
                    body.createdBy = sessionUser.id

                    const [ result ] = await mysql.execute(query[target].insert(body))
                    if (!result.affectedRows) throw new Error('DB Error: Failed to update company')

                    return true
                } else {
                    if (!Array.isArray(bodyOrIds)) throw new Error('Company Add Error: IDs of incorrect type')
                    const ids = bodyOrIds

                    const data = []
                    const [ Src, idProp, queryInst ] = jxTargets[target]
                    const list = await Src.fetch(this.session, { ids })

                    list.map(item => data.push({
                        companyId: this.id,
                        [idProp]: item.id,
                        createdBy: sessionUser.id,
                    }))

                    const [ result ] = await mysql.execute(queryInst.insert(data))

                    return result.affectedRows > 0
                }
            }


            this.fetch = async (target, { hideRawId = false, hideSensitive = true, sorts = null, idsOnly = false } = {}) => {
                if (!this.session?.user?.id) throw new Error('Company Fetch Error: No session user')
                if (!target) throw new Error('Company Fetch Error: Target not supplied')

                const targets = relTargets('main')
                if (!Object.keys(targets).includes(target)) throw new Error('Company Fetch Error: Invalid target supplied')

                const [ Src, idProp, queryInst, defSorts ] = targets[target]
                if (!sorts) sorts = defSorts

                const ids = []
                const [ rows ] = await mysql.execute(queryInst.select(idProp, {
                    match: { companyId: this.id || Company.matchIdHash(this._id) },
                }))

                rows.map(row => ids.push(row[idProp]))

                return idsOnly ? ids : await Src.fetch(this.session, { ids }, { hideRawId, hideSensitive, sorts })
            }
            
            
            this.update = async (body, target, { since }) => {}


            this.delete = async (target, matchOrIds) => {
                if (!this.session?.user?.id) throw new Error('Company Delete Error: Session user not found')

                const jxTargets = relTargets('main')

                if (!target) {
                    if (!this.id) throw new Error('Company Delete Error: Personal ID missing')

                    const { id } = this
                    const log = await this.log()
                    const history = {}

                    const historyProps = [ 'names', 'ownerships', 'addresses', 'mail', 'phones', 'faxes', 'emails' ]
                    for (const prop of historyProps)
                        history[prop] = await this.history(prop, true)

                    const [ result ] = await mysql.execute(query.main.delete({ id }))
                    if (!result.affectedRows) return false

                    const reduntant = [
                        'category',
                        'group',
                        'route',
                        'style',
                        'busName',
                        'coType',
                        'alias',
                        'owner',
                        'address',
                        'phone',
                        'fax',
                        'email',
                    ]

                    for (const prop of reduntant) delete this[prop]
                    this.ein = ein ? encrypt(ein) : null
                    this.history = history
                    for (const prop in log) this[prop] = log[prop]

                    await logDeletion(this.session, 'companies', this, { id })

                    return true
                } else if (Object.keys(query) && target !== 'main' && target !== 'owners' && matchOrIds?.since) {
                    const match = matchOrIds
                    match.id = this.id || Company.matchIdHash(this._id)

                    const [ result ] = await mysql.execute(query[target].delete(match))

                    return result.affectedRows > 0
                } else if (Object.keys(jxTargets).includes(target)) {
                    if (!Array.isArray(matchOrIds)) throw new Error('Company Delete Error: IDs of incorrect type')

                    const ids = matchOrIds
                    if (!ids) return

                    const queryInst = jxTargets[target][2]
                    const idProp = jxTargets[target][1]

                    const [ result ] = await mysql.execute(queryInst.delete({ [idProp]: ids }))

                    return result.affectedRows > 0
                }
            }


            this.confirm = async () => {
                if (!this.session?.user?.id) throw new Error('Company Confirm Error: Session user not found')

                const data = processData({ confirmed: true }, {
                    modifiedBy: this.session.user.id,
                    currentData: this,
                    currentUpdateLog: await this.log('updateLog'),
                })

                const [ result ] = await mysql.execute(query.main.update(data, { id: this.id || Company.matchIdHash(this._id) }))
                if (!result.affectedRows) throw new Error('DB Error: Failed to confirm company')

                return true
            }


            this.history = async (target, log = false) => {
                let fields, sort = { desc: 'since' }

                switch (target) {
                    case 'names':
                        fields = [ 'since', 'busName', 'coType', 'alias' ]
                        break
                    case 'ownerships':
                        fields = [ 'since', 'ownerId' ]
                        break
                    case 'addresses':
                    case 'mail':
                        fields = [ 'since', 'address1', 'address2', 'city', 'state', 'zip' ]
                        break
                    case 'phones':
                    case 'faxes':
                        fields = [ 'since', 'number' ]
                        break
                    case 'emails':
                        fields = [ 'since', 'email' ]
                        break
                }
                if (log === true) fields.push('createdBy', 'createdAt', 'updateLog')

                return (await mysql.execute(query[target].select(fields, {
                    match: { companyId: this.id || Company.matchIdHash(this._id) },
                    sort,
                })))[0]
            }


            this.log = async (field, queryProp = 'main') => {
                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]
                const idProp = queryProp === 'main' ? 'id' : 'companyId'

                let log = (await mysql.execute(query[queryProp].select(fields, {
                    match: { [idProp]: this.id || Company.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }
        }
    }

    static #algorithm = 'SHA-256'
    static hashId = (field = 'id') => hash(field, Company.#algorithm)
    static matchIdHash = value => matchHash(value, Company.#algorithm)

    static defSorts = [ null, [ 'busName', 'coType' ] ]


    static create = async ({ user: sessionUser = {}, branch, siteId = null }, body = {}) => {
        if (!sessionUser.id) throw new Error('Company Create Error: No session user')

        body = processData(body)

        const { category, ein, duns, since, busName, coType, alias } = body
        if (await Company.fetch({ user: sessionUser }, { ein, duns, busName, coType, alias })) return

        const createdBy = sessionUser.id
        const data = {
            main: { category, duns, since, createdBy },
            name: { since, busName, coType, alias, createdBy },
        }
        if (ein) data.main.ein = { aes: [ ein, secret.ein ] }

        let [ result ] = await mysql.execute(query.main.insert(data.main))
        const id = result.insertId

        if (!id) throw new Error('DB Error: Failed to create company')

        { data.name.companyId = id }
        [ result ] = await mysql.execute(query.names.insert(data.name))
        if (!result.affectedRows) throw new Error('DB Error: Failed to register company name')

        const company = await Company.fetch({ user: sessionUser, branch, siteId }, { id, confirmed: false })
        if (!company) throw new Error('Fetch Error: New company not found')

        return company
    }


    static fetch = async (
        { user: sessionUser = {}, branch, siteId = null } = {}, filter = {},
        { hideRawId = false, hideSensitive = true, sorts = Company.defSorts, mode = 'data' } = {}
    ) => {
        if (!sessionUser.id) throw new Error('Company Fetch Error: No session user')

        const join = [ 'companyId', 'id', { max: 'since' } ]
        const batch = [
            {
                table: query.main.table,
                fields: [
                    'id', Company.hashId(), 'category', { aes: [ 'ein', secret.ein ] }, 'duns', 'website',
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
            id, _id, ein, duns, busName, coType, alias, route,
            ids, _ids, ownerId, _ownerId, category, global, lastLogo
        } = filter
        const single = !!id || !!_id || !!ein || !!duns || !!(busName && coType) || !!alias || !!route

        const match = {
            main: { id, duns, category, global, lastLogo },
            names: { alias },
            ownerships: { ownerId: ownerId || Owner.matchIdHash(_ownerId) },
        }
        if (!id) {
            if (ids) match.main.id = ids
            match.main.id = Company.matchIdHash(_id || _ids)
        }
        if (ein) match.main.ein = { aes: [ ein, secret.ein ] }
        if (busName && coType) {
            match.names.busName = busName
            match.names.coType = coType
        }
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

        batch[0].match = match.main
        batch[1].match = match.names
        batch[2].match = match.ownerships

        if (!single && Array.isArray(sorts))
            sorts.forEach((sort, i) => { if (sort) batch[i].sort = sort })

        if (mode === 'batch') return batch

        const queryStr = Query.select(db.business, batch)
        if (mode === 'query') return queryStr

        const list = (await mysql.execute(queryStr))[0]

        const session = setSession (sessionUser, branch, siteId)
        list.forEach((data, i, arr) => arr[i] = new Company(data, { single, session, hideRawId, hideSensitive }))

        return single ? list[0] : list
    }
    
    
    static find = async (session, params = {}) => {
        if (!session?.user) return { error: 'Invalid User' }

        const { ein, duns, busName, coType, alias, exclude } = params
        if (
            (!ein && !duns && !alias && !busName && !coType) ||
            (busName && !coType) || (!busName && coType)
        ) return { error: 'Invalid Parameters' }

        let target = 'names', idProp = 'companyId'
        if (ein || duns) target = 'main', idProp = 'id'

        const match = { alias, busName, coType }
        if (ein) match.ein = { aes: [ strip(ein), secret.ein ] }
        if (duns) match.duns = strip(duns)

        if (exclude?._id) {
            const company = await Company.fetch(session, { _id: exclude._id })

            match[idProp] = { not: company.id }
        }

        const data = (await mysql.execute(query[target].select(idProp, { match })))[0]

        return { found: data.length === 1 }
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


            this.add = async (target, body) => {
                const { user: sessionUser } = this.session

                if (sessionUser?.id) throw new Error('Owner Add Error: No session user')
                if (!this.id) throw new Error('Owner Add Error: Personal ID is missing')
                
                const person = await Individual.fetch({ user: sessionUser }, { id: this.id, _id: this.personId })
                if (!person) throw new Error('Owner Add Error: Individual not determined')

                return await person.add(target, body)
            }


            this.update = async (body, target, { since }) => {}


            this.delete = async () => {
                if (!this.session?.user?.id) throw new Error('Owner Delete Error: Session user not found')
                if (!this.id) throw new Error('Owner Delete Error: Personal ID missing')

                const { id } = this
                const log = await this.log()
                const history = {
                    names: await this.history('names', true),
                }

                const [ result ] = await mysql.execute(query.owners.delete({ id }))
                if (!result.affectedRows) return false

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
                this.history = history
                for (const prop in log) this[prop] = log[prop]

                await logDeletion(this.session, 'company-owners', this, { id })

                return true
            }


            this.history = async (target = 'names', log = false) => {
                if (target === 'names') {
                    const individual = await Individual.data(this.session, { _id: this._personId })
                    return individual.history('names', log)
                }

                return []
            }


            this.log = async field => {
                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]

                let log = (await mysql.execute(query.owners.select(fields, {
                    match: { id: this.id || Owner.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }
        }
    }

    static #algorithm = 'SHA-1'
    static hashId = (field = 'id') => hash(field, Owner.#algorithm)
    static matchIdHash = value => matchHash(value, Owner.#algorithm)

    static defSorts = [ null, null, [ 'lastName', 'suffix', 'firstName', 'middleName' ] ]


    static create = async ({ user: sessionUser = {} }, body = {}) => {
        if (!sessionUser.id) throw new Error('Owner Create Error: No session user')

        body = processData(body)

        const { ssn } = body
        let person = await Individual.fetch({ user: sessionUser }, { ssn })

        if (!person) person = await Individual.create({ user: sessionUser }, body)
        else {
            const { dob } = person

            if (dob !== body.dob) throw new Error('Owner Create Error: SSN recognized; DOB mismatch')
        }
        const personId = person.id
        const createdBy = sessionUser.id

        const [ result ] = await mysql(query.owners.insert({ personId, createdBy }))
        const id = result.insertId

        if (!id) throw new Error('DB Error: Failed to create owner')

        const owner = await User.fetch({ user: sessionUser }, { id })
        if (!owner) throw new Error('Fetch Error: New owner not found')

        return owner
    }


    static fetch = async (
        { user: sessionUser = {}, branch, siteId = null} = {}, filter = {},
        { hideRawId = false, hideSensitive = true, sorts = Owner.defSorts, mode = 'data' } = {}
    ) => {
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
                fields: [ { count: [ 'category', 'companyCount' ] } ],
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

        if (!single && Array.isArray(sorts))
            sorts.forEach((sort, i) => { if (sort) batch[i].sort = sort })

        if (mode === 'batch') return batch

        const queryStr = Query.select(db.business, batch)
        if (mode === 'query') return queryStr

        await mysql.query(sqlMode.onlyFullGroupBy.remove)
        const list = (await mysql.execute(queryStr))[0]

        const session = setSession (sessionUser, branch, siteId)
        list.forEach((data, i, arr) => arr[i] = new Owner(data, { single, session, hideRawId, hideSensitive }))

        return single ? list[0] : list
    }


    static find = async (session, params = {}) => {
        if (!session?.user?.DS) return { error: 'Invalid User' }

        const { ssn } = params
        if (!ssn) return { error: 'Invalid Parameters' }

        let { scope } = params
        if (!scope || !['global', 'local'].includes(scope)) scope = 'local'

        //* Global search first by default
        const result = await Individual.find(session, { ssn })
        let { found } = result

        //* Search in owners only
        if (result?.personId && scope === 'local') {
            const { personId } = result
            const data = (await mysql.execute(query.owners.select('id', {
                match: { personId },
            })))

            found = data.length === 1
        }

        return { found }
    }


}



function relTargets(src, target = null) {
    const targets =  {
        main: {
            users: [ User, 'userId', userQuery.jx.companies, User.defSorts ],
        },
    }[src]

    return target ? targets[target] : targets
}



export default Company
export { Owner, query, relTargets }