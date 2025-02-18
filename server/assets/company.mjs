require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_EIN, DB__MYSQL_AES_SSN } = process.env
const secret = {
    ein: DB__MYSQL_AES_EIN,
    ssn: DB__MYSQL_AES_SSN,
}

/* Settings */
import db from '../settings/mysql.mjs'

/* Assets */
import Individual from './individual.mjs'
import Team from './team.mjs'
import Address from '../../client/global/modules/assets/address.us.mjs'
import { sessionError } from './user.mjs'

/* Tools */
import Query, { hash, matchHash } from '../tools/query.mjs'
import { processData, logDeletion } from '../tools/database.mjs'
import { encrypt } from '../tools/crypto.mjs'
import { reSuper } from '../../client/global/modules/tools/object.mjs'
import { numberic } from '../../client/global/modules/tools/number.mjs'
import { stringifyBuffer } from '../../client/global/modules/tools/buffer.mjs'
import strip, { ein as formatEin, ssn as formatSsn } from '../../client/global/modules/tools/formatter.mjs'
import { sortArrayByObjectKey } from '../../client/global/modules/tools/sorter.mjs'

const mysql = require('../tools/mysql')


const { sqlMode } = Query
const query = {
    companies: new Query(db.business, 'companies'),
    names: new Query(db.business, 'company_names'),
    owners: new Query(db.business, 'company_owners'),  // * 2
    ownerships: new Query(db.business, 'company_ownerships'),
    addresses: new Query(db.business, 'company_addresses'),  // * 4
    mail: new Query(db.business, 'company_mail'),  // * 5
    phones: new Query(db.business, 'company_phones'),
    faxes: new Query(db.business, 'company_faxes'),
    emails: new Query(db.business, 'company_emails'),
    teams: new Query(db.business, 'teams_companies'),  // * 9
}
const targets = Object.keys(query)



class Company {
    constructor(data = {}, light = false) {
        this._id = data._id
        this.catId = data.catId
        this.category = Company.categoryList[data.catId].item[1]
        this.group = Company.categoryList[data.catId].group
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
        this.logo = data.logo
        this.style = data.style || {}
        if (!this.style.background) this.style.background = null
        if (!this.style.text) this.style.text = null

        this.owner = data._ownerId
        ? new Owner({
                _id: data._ownerId,
                _personId: data._personId,
                firstName: data.firstName,
                middleName: data.middleName,
                lastName: data.lastName,
                suffix: data.suffix,
                sex: data.sex,
                dob: data.dob,
                ssn: data.ssn,
            })
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

        if (!light) {

            this.id = async () => (await mysql.execute(query.companies.select('id', {
                match: { id: Company.matchIdHash(this._id) },
            })))[0][0].id


            this.ein = async (session, format = false, _id) => {
                if (!session?.user) return

                let { ein } = (await mysql.execute(query.companies.select({ aes: [ 'ein', secret.ein ] }, {
                    match: { id: Company.matchIdHash(_id || this._id) },
                })))[0][0]
                ein = stringifyBuffer(ein)
                if (format === true) ein = formatEin(ein)

                return ein
            }


            this.log = async (target, field) => {
                if (!targets.includes(target)) target = targets[0]

                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]
                const idProp = target == targets[0] ? 'id' : 'companyId'

                let log = (await mysql.execute(query[target].select(fields, {
                    match: { [idProp]: Company.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }


            this.flush = async target => {
                if (!targets.includes(target)) target = targets[0]

                const idProp = target == targets[0] ? 'id' : 'companyId'

                await mysql.execute(query[target].update({ updateLog: null }, {
                    [idProp]: Company.matchIdHash(this._id),
                }))
            }


            this.history = async (target = targets[1], log = false) => {
                if (!targets.includes(target)) target = targets[1]

                let fields, sort = { desc: 'since' }
                switch (target) {
                    case targets[1]:
                        fields = [ 'since', 'busName', 'coType', 'alias' ]
                        break
                    case targets[3]:
                        fields = [ 'since', 'ownerId' ]
                        break
                    case targets[4]:
                    case targets[5]:
                        fields = [ 'since', 'address1', 'address2', 'city', 'state', 'zip' ]
                        break
                    case targets[6]:
                    case targets[7]:
                        fields = [ 'since', 'number' ]
                        break
                    case targets[8]:
                        fields = [ 'since', 'email' ]
                        break
                }
                if (log === true) fields.push('createdBy', 'createdAt', 'updateLog')

                return (await mysql.execute(query[target].select(fields, {
                    match: { companyId: Company.matchIdHash(this._id) },
                    sort,
                })))[0]
            }


            this.teams = async (session, action, teamIds) => {
                const companyId = await this.id()

                if (action && teamIds) {
                    let modified = false,
                        error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                    if (error) return { modified, error }

                    if (!Array.isArray(teamIds)) teamIds = [ teamIds ]
                    error = []

                    let i = 0, modCt = 0, createdBy
                    if (action == '-') action = 'delete'
                    else if (action == '+') {
                        action = 'insert'
                        createdBy = await session.user.id()
                    }

                    for (let teamId of teamIds) {
                        if (!numberic(teamId))
                            teamId = await (await Team.data(session, { _id: teamId })).id()

                        try {
                            const data = { companyId, teamId }
                            if (action == 'insert') data.createdBy = createdBy

                            const [ result ] = await mysql.execute(query.teams[action](data))
                            if (result.affectedRows == 1) modCt++
                        } catch (err) {
                            error.push('DB Error: idx ' + i)
                        }

                        i++
                    }

                    if (modCt === teamIds.length) {
                        modified = true
                        error = undefined
                    } else error = error.join(' / ')

                    return { modified, error }
                } else {
                    if (!session?.user?.DS) return

                    const { catId } = this
                    const data = { all: [], available: [], applied: [] }
                    const appliedIds = []

                    const teams = await Team.list(session, { catId })

                    const batch = [
                        {
                            table: 'teams_companies',
                            match: { companyId },
                        },
                        {
                            table: 'teams',
                            fields: [ Team.hashId(), 'name' ],
                            join: [ 'id', 'teamId' ],
                            match: { catId },
                        },
                    ]

                    data.applied = (await mysql.execute(Query.select(db.business, batch)))[0]
                    data.applied.forEach(team => appliedIds.push(team._id))

                    teams.map((team, i) => {
                        const { _id, name } = team

                        data.all.push({ _id, name, applied: false })
                        if (appliedIds.includes(_id)) data.all[i].applied = true
                        else data.available.push({ _id, name })
                    })

                    data.all = sortArrayByObjectKey(data.all, 'name')
                    data.applied = sortArrayByObjectKey(data.applied, 'name')
                    data.available = sortArrayByObjectKey(data.available, 'name')

                    return data
                }
            }


            this.modify = async (session, target, data) => {
                let modified = false,
                    error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { modified, error }

                const { user } = session
                const id = await this.id()
                const modifiedBy = await user.id()
                let { since } = data
                if (!since) since = this.since

                let currentData = this, idProp = 'companyId'
                switch (target) {
                    case targets[0]:
                        idProp = 'id'
                        currentData.ein = await this.ein(session)
                        break
                    case targets[4]:
                        currentData = this.address.physical
                        currentData.state = currentData.state[0]
                        break
                    case targets[5]:
                        currentData = this.address.mail
                        currentData.state = currentData.state[0]
                        break
                }

                data = processData(data, {
                    modifiedBy,
                    currentData,
                    currentUpdateLog: await this.log(target, 'updateLog'),
                })
                if ('ein' in data) data.ein = { aes: [ data.ein, secret.ein ] }

                const match = { [idProp]: id, since }

                try {
                    const [ result ] = await mysql.execute(query[target].update(data, match))
                    if (result.affectedRows == 1) modified = true
                } catch (err) {
                    error = 'DB Error'
                }

                if (modified && target == targets[0] && data.since) {
                    const { since } = data
                    const length = targets.length
                    let errors = []

                    for (let i = 1; i < length; i++) {
                        if (i == 2) continue
                        if (i > 8) break

                        try {
                            // ? No point in updating `updateLog` when added in `target[0]`
                            await mysql.execute(query[targets[i]].update({ since }, {
                                [idProp]: id,
                                since: this.since,
                            }))
                        } catch (err) {
                            console.error(err)
                            errors.push(`DB Error: "${target[i]}" (${i})`)
                        }
                    }

                    if (errors.length) error = errors.join(' / ')
                }

                return { modified, error, data: await Company.data(session, { id }) }
            }


            this.update = async (session, target, data) => {
                let updated = false, error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { updated, error }

                data = processData(data)
                if (!data.since) data.since = this.since

                data.companyId = await this.id()
                data.createdBy = await session.user.id()

                const [ result ] = await mysql.execute(query[target].insert(data))
                if (result.affectedRows == 1) updated = true
                else error = 'DB Error'

                return { updated, error, data: await Company.data(session, { id: data.companyId }) }
            }


            this.delete = async (session, target = targets[0], filter = {}) => {
                let deleted = false, error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { deleted, error }

                const id = await this.id()
                let idProp = 'id', since, ein, log, history = {}
                if (target != targets[0]) {
                    idProp = 'companyId'
                    since = filter?.since ? filter.since : this.since
                } else {
                    ein = encrypt(await this.ein(session))
                    log = await this.log()

                    const historyProps = [ 'names', 'ownerships', 'addresses', 'mail', 'phones', 'faxes', 'emails' ]
                    for (const prop of historyProps)
                        history[prop] = await this.history(prop, true)
                }

                const match = { [idProp]: id, since }

                try {
                    const [ result ] = await mysql.execute(query[target].delete(match))
                    if (result.affectedRows > 0) deleted = true
                } catch(err) {
                    console.error(err)
                    error = 'DB Error'
                }

                if (error) return { deleted, error }

                let company, file
                if (deleted) {
                    let data
                    switch (target) {
                        case targets[0]:
                            data = this
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
                            for (const prop of reduntant) delete data[prop]
                            data.ein = ein
                            data.history = history
                            for (const prop in log) data[prop] = log[prop]
                            file = 'companies'
                            break
                    }

                    if (target != targets[0])
                        company = await Company.data(session, { _id: this._id })

                    if (file && data) await logDeletion(session, file, data, { [idProp]: id }) 
                }

                return { deleted, data: company }
            }


            this.confirm = async session => {
                let { confirmed } = this, error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { confirmed, error }

                if (!confirmed) {
                    const modifiedBy = await session.user.id()

                    const data = processData({ confirmed: true }, {
                        modifiedBy,
                        currentData: this,
                        currentUpdateLog: await this.log(targets[0], 'updateLog'),
                    })

                    try {
                        const [ result ] = await mysql.execute(query.companies.update(data, { id: await this.id() }))

                        if (result.affectedRows == 1) {
                            confirmed = true
                            this.confirmed = true
                        }
                    } catch (err) {
                        error = 'DB Error'
                    }
                }

                return { confirmed, error, data: this }
            }

        }
    }


    static #algorithm = 'SHA-256'

    static categoryList = {
        'crr': {  item: [ 'Carriers', 'Carrier' ],      group: 'Logistics',     path: [ 'carriers', 'carrier' ]      },
        'brk': {  item: [ 'Brokers', 'Broker' ],        group: 'Brokerage',     path: [ 'brokers', 'broker' ]        },
        'whs': {  item: [ 'Warehouses', 'Warehouse' ],  group: 'Storage',       path: [ 'warehouses', 'warehouse' ]  },
        'shp': {  item: [ 'Shops', 'Shop' ],            group: 'Shops',         path: [ 'shops', 'shop' ]            },
        'scl': {  item: [ 'Schools', 'School' ],        group: 'CDL Training',  path: [ 'schools', 'school' ]        },
        'cst': {  item: [ 'Builders', 'Builder' ],      group: 'Construction',  path: [ 'builders', 'builder' ]      },
    }

    static typeList = {
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
    }


    static hashId = (field = 'id') => hash(field, Company.#algorithm)

    static matchIdHash = value => matchHash(value, Company.#algorithm)


    static create = async (session, data) => {
        let created = false
        const error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
        if (error) return { created, error }

        data = processData(data)

        for (const prop of [ 'catId', 'since', 'ein', 'busName', 'coType', 'alias' ])
            if (!data[prop]) return { created, error: 'Invalid Data' }

        const { catId, ein, duns, since, busName, coType, alias } = data
        const createdBy = await session.user.id()

        data = {
            company: { catId, ein: { aes: [ ein, secret.ein ] }, duns, since, createdBy },
            name: { since, busName, coType, alias, createdBy },
        }

        const [ result ] = await mysql.execute(query.companies.insert(data.company))
        const id = result.insertId

        if (id) {
            data.name.companyId = id

            const [ result ] = await mysql.execute(query.names.insert(data.name))

            if (result.affectedRows == 1) created = true
            else return { created, error: 'DB Error: Stage 2' }
        } else return { created, error: 'DB Error: Stage 1' }

        return { created, data: await Company.data(session, { id })}
    }


    static batch = async (session, options = {}) => {
        if (!session?.user) return []

        const { branch, user } = session
        const { DS } = user

        const join = [ 'companyId', 'id', { max: 'since' } ]
        const batch = [
            {
                table: 'companies',
                fields: [
                    Company.hashId(), 'catId', { aes: [ 'ein', secret.ein ] }, 'duns', 'website',
                    'since', 'until', 'global', 'active', 'confirmed', 'logo', 'style',
                ],
            },
            {
                table: 'company_names',
                fields: [
                    'busName', 'coType', 'alias',
                    { concat: [ [ 'busName', '^, ', 'coType' ], 'name' ] },
                    { route: [ [ 'busName', 'coType' ] ] },
                ],
                join,
            },
            {
                table: 'company_ownerships',
                join,
            },
            {
                table: 'company_owners',
                fields: [ [ Owner.hashId(), 'ownerId' ], [ Individual.hashId(), 'personId' ] ],
                join: [ 'id', 'ownerId', 'company_ownerships' ],
            },
            {
                db: db.person,
                table: 'individuals',
                fields: [ 'dob', 'sex', { aes: [ 'ssn', secret.ssn ] } ],
                join: [ 'id', 'personId', 'company_owners' ],
            },
            {
                db: db.person,
                table: 'names',
                fields: [ 'firstName', 'middleName', 'lastName', 'suffix' ],
                join: [ 'personId', 'id', {
                    table: 'individuals',
                    max: 'since',
                } ],
            },
            {
                table: 'company_addresses',
                fields: [ 'address1', 'address2', 'city', 'state', 'zip' ],
                join,
            },
            {
                table: 'company_mail',
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
                table: 'company_phones',
                fields: [ [ 'number', 'phone' ] ],
                join,
            },
            {
                table: 'company_faxes',
                fields: [ [ 'number', 'fax' ] ],
                join,
            },
            {
                table: 'company_emails',
                fields: 'email',
                join,
            },
        ]

        if (!DS) {
            const teams = await user.teams(session)
            let teamId = []
            teams.applied.forEach(team => teamId.push(team.id))
            if (!teamId.length) teamId = null

            batch.push({
                table: 'teams_companies',
                join: [ 'companyId', 'id' ],
                match: { teamId },
            })
        }

        let { params, filter } = options
        if (!params) params = {}
        if (!filter) filter = {}

        const { _id, id, ein, duns, route } = params
        const { catId, global, logo, _ownerId } = filter

        const match = {
            companies: { id, duns, catId, global, logo },
            names: {},
            ownerships: { ownerId: Owner.matchIdHash(_ownerId) },
        }
        if (!id) match.companies.id = Company.matchIdHash(_id)
        if (route) match.names.route = { route: [ [ 'busName', 'coType' ], route ] }
        if (ein) match.companies.ein = { aes: [ ein, secret.ein ] }
        if (DS && branch == 'admin') {
            const { closed, active, confirmed } = filter

            if (typeof closed == 'boolean') match.companies.until = { null: !closed }
            if (typeof active == 'boolean') match.companies.active = active
            if (typeof confirmed == 'boolean') match.companies.confirmed = confirmed
        } else {
            match.companies.until = null
            match.companies.confirmed = true
        }

        batch[0].match = match.companies
        batch[1].match = match.names

        return batch
    }


    static data = async (session, params = {}) => {
        if (!params._id && !params.id && !params.ein && !params.duns && !params.route) return

        const batch = await Company.batch(session, { params })
        if (!batch.length) return

        // await mysql.query(sqlMode.onlyFullGroupBy.remove)
        const data = (await mysql.execute(Query.select(db.business, batch)))[0][0]

        return !data ? data : new Company(data)
    }


    static list = async (session, filter = {}) => {
        const batch = await Company.batch(session, { filter })
        if (!batch.length) return []

        // await mysql.query(sqlMode.onlyFullGroupBy.remove)
        const list = (await mysql.execute(Query.select(db.business, batch)))[0]
        list.forEach((data, i, arr) => arr[i] = new Company(data, true))

        return list
    }


    static find = async (session, params = {}) => {
        if (!session?.user) return { error: 'Invalid User' }

        const { ein, duns, busName, coType, alias } = params
        if (
            (!ein && !duns && !alias && !busName && !coType) ||
            (busName && !coType) || (!busName && coType)
        ) return { error: 'Invalid Parameters' }

        let target = 'names', idProp = 'companyId'
        if (ein || duns) target = 'companies', idProp = 'id'

        const match = { alias, busName, coType }
        if (ein) match.ein = { aes: [ strip(ein), secret.ein ] }
        if (duns) match.duns = strip(duns)

        const data = (await mysql.execute(query[target].select(idProp, { match })))[0]

        return { found: data.length == 1 }
    }


}



class Owner extends Individual {
    constructor(data = {}, light = false) {
        super(data, light)
        if (!data?._id || !data?._personId || !Object.keys(this).length)
            throw new Error('Owner instantiation failed: Invalid data')

        const { _id, _personId, companyCount } = data
        const properties = { count: { companies: companyCount } }

        const categories = Company.categoryList
        for (const catId in categories) {
            const path = categories[catId].path[0]
            properties.count[path] = data[`${path}Count`]
        }

        reSuper(this, { _id, _personId }, properties)

        if (!light) {

            this.id = async () => (await mysql.execute(query.owners.select('id', {
                match: { id: Owner.matchIdHash(this._id) },
            })))[0][0].id

            this.personId = async () => (await mysql.execute(query.owners.select('personId', {
                match: { personId: Individual.matchIdHash(this._personId) },
            })))[0][0].personId


            this.log = async field => {
                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]
                let log = (await mysql.execute(query.owners.select(fields, {
                    match: { id: Owner.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }


            this.flush = async target => {}


            this.history = async (session, target = 'names', log = false) => {
                if (target == 'names') {
                    const individual = await Individual.data(session, { _id: this._personId })
                    return individual.history(session, log)
                }

                return []
            }


            this.modify = async (session, data) => {
                let modified = false
                const error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { modified, error }

                const { _id, _personId } = this
                const individual = await Individual.data(session, { _id: _personId })
                const result = await individual.modify(session, data)

                if (!result.modified) {
                    if (result.error) return { modified, error: result.error }
                } else modified = true

                return { modified, data: await Owner.data(session, { _id }) }
            }


            this.update = async (session, data) => {
                let updated = false
                const error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { updated, error }

                const { _id, _personId } = this
                const individual = await Individual.data(session, { _id: _personId })
                const result = await individual.update(session, data)

                if (!result.updated) {
                    if (result.error) return { updated, error: result.error }
                } else updated = true

                return { updated, data: await Owner.data(session, { _id }) }
            }


            this.delete = async session => {
                let deleted = false,
                    error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { deleted, error }

                try {
                    const id = await this.id()
                    const personId = await this.personId()
                    const log = await this.log()
                    const history = {
                        names: await this.history(session),
                    }

                    const [ result ] = await mysql.execute(query.owners.delete({ id }))
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
                            'count',
                        ]

                        for (const prop of reduntant) delete this[prop]
                        this.history = history
                        for (const prop in log) this[prop] = log[prop]

                        await logDeletion(session, 'company-owners', this, { id, personId })
                    }
                } catch (err) {
                    console.error(err)
                    error = 'DB Error'
                }

                return { deleted, error }
            }

        }
    }


    static #algorithm = 'SHA-1'

    static hashId = (field = 'id') => hash(field, Owner.#algorithm)

    static matchIdHash = value => matchHash(value, Owner.#algorithm)


    static create = async (session, data) => {
        let created = false
        const error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
        if (error) return { created, error }

        const result = await Individual.create(session, data)

        let id, owner

        if (!result.created) {
            if (result.error) return { created, error: result.error }
        } else if (result.data) {
            const personId = await result.data.id()
            const createdBy = await session.user.id()

            {
                const [ result ] = await mysql.execute(
                    query.owners.insert({ personId, createdBy })
                )
                id = result.insertId

                if (id) {
                    created = true
                    owner = await Owner.data(session, { id })
                }
            }
        }

        return { created, data: owner }
    }


    static #batch = (session, options = {}) => {
        if (!session?.user) return []

        const batch = [
            {
                table: 'company_owners',
                fields: [ Owner.hashId(), Individual.hashId('personId') ],
                group: 'id',
            },
            {
                db: db.person,
                table: 'individuals',
                fields: [ 'dob', 'sex', { aes: [ 'ssn', secret.ssn ] } ],
                join: [ 'id', 'personId' ],
            },
            {
                db: db.person,
                table: 'names',
                fields: [ 'firstName', 'middleName', 'lastName', 'suffix' ],
                join: [ 'personId', 'id', {
                    table: 'individuals',
                    max: 'since',
                } ],
            },
            {
                db: db.person,
                table: 'phones',
                fields: [ [ 'number', 'cell' ] ],
                join: [ 'personId', 'id', {
                    table: 'individuals',
                    max: 'since',
                } ],
            },
            {
                table: 'company_ownerships',
                join: [ 'ownerId', 'id' ],
            },
            {
                table: 'companies',
                fields: [ { count: [ 'catId', 'companyCount' ] } ],
                join: [ 'id', 'companyId', 4 ],
            },
        ]

        const categories = Company.categoryList
        for (const catId in categories)
            batch[5].fields.push({
                countCase: [ { catId }, `${categories[catId].path[0]}Count` ],
            })

        let { params, filter } = options
        if (!params) params = {}
        if (!filter) filter = {}

        const { _id, id, ssn } = params
        const { sex, firstName, lastName } = filter

        const match = {
            owners: { id },
            individuals: { sex },
            names: { firstName, lastName },
        }
        if (!id) match.owners.id = Owner.matchIdHash(_id)
        if (ssn) match.individuals.ssn = { aes: [ ssn, secret.ssn ] }

        batch[0].match = match.owners
        batch[1].match = match.individuals
        batch[2].match = match.names

        return batch
    }


    static data = async (session, params = {}) => {
        if (!params._id && !params.id && !params.ssn) return

        const batch = Owner.#batch(session, { params })
        if (!batch.length) return

        await mysql.query(sqlMode.onlyFullGroupBy.remove)
        const data = (await mysql.execute(Query.select(db.business, batch)))[0][0]

        return !data ? data : new Owner(data)
    }


    static list = async (session, filter = {}) => {
        const batch = Owner.#batch(session, { filter })
        if (!batch.length) return []

        await mysql.query(sqlMode.onlyFullGroupBy.remove)
        const list = (await mysql.execute(Query.select(db.business, batch)))[0]
        list.forEach((data, i, arr) => arr[i] = new Owner(data, true))

        return list
    }


    static find = async (session, params = {}) => {
        if (!session?.user?.DS) return { error: 'Invalid User' }

        const { ssn } = params
        if (!ssn) return { error: 'Invalid Parameters' }

        let { scope } = params
        if (!scope || !['global', 'local'].includes(scope)) scope = 'local'

        //* Global search first by default
        let { found, personId } = await Individual.find(session, { ssn })

        //* Search in owners only
        if (personId && scope == 'local') {
            const data = (await mysql.execute(query.owners.select('id', {
                match: { personId },
            })))

            found = data.length == 1
        }

        return { found }
    }


}


delete Owner.prefixList
delete Owner.suffixList
delete Owner.genderList
// delete Owner.formSelect


export default Company
export { Owner }