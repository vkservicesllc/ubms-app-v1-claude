/* Settings */
const { DIR__PATH: dir } = Bun.env
import db, { query, algorithm } from '../../settings/mysql.mjs'

/* Tools */
import Individual from './individual.mjs'
import User from './user.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import { hash, matchHash } from '../utils/query.mjs'
//! import more algorithms for other categories
import { classInstance, classStatic } from '../utils/class.mjs'
// import { processData } from '../utils/data.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import { selectAES, processAES } from '../utils/data.mjs'
import { renameFile } from '../utils/fs.mjs'

const mysql = require('../utils/mysql')



class Company {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true } = {}) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Company Data')

        this._id = data._id
        if (!hideRawId) this.id = data.id

        this.externalId = {}
        if (data._carrierId) {
            if (!hideRawId) this.externalId.carrierId = data.carrierId
            this.externalId._carrierId = data._carrierId
        }

        this.category = data.category
        if (!hideSensitive) this.ein = stringifyBuffer(data.ein)
        this.duns = data.duns
        this.website = data.website
        this.route = data.route
        this.active = !!data.active
        this.confirmed = !!data.confirmed
        this.locked = !!data.locked
        this.global = !!data.global
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
                prefix: data.prefix,
                firstName: data.firstName,
                middleName: data.middleName,
                lastName: data.lastName,
                suffix: data.suffix,
                gender: data.gender,
                dob: data.dob,
                ssn: data.ssn,
                nameSince: data.ownerNameSince,
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

        // this.comparator = {
        //     name: data.nameSince,
        //     address: data.addrSince,
        //     mail: data.mailSince,
        //     phone: data.phoneSince,
        //     fax: data.faxSince,
        //     email: data.emailSince,
        //     ownership: data.ownershipSince,
        // }

        if (single) {
            this.session = session
            this.config = { hideRawId, hideSensitive }


            this.add = (target, bodyOrIds) => classInstance.add(this, new.target, target, bodyOrIds)


            this.fetch = (target, filter, params) => classInstance.fetch(this, new.target, target, filter, params)


            this.update = (targetOrBody, body, match) => classInstance.update(this, new.target, targetOrBody, body, match, {
                sanitize(target, body) {
                    //* sql_mode=NO_ENGINE_SUBSTITUTION
                    if (target === 'main' && body.since === null) body.since = '0000-00-00'
                    return body
                },
                async final(company, body, target) {
                    if (target !== 'main' || body.since === undefined || body.since === company.since) return

                    let keys = Object.keys(query.company)
                    keys = keys.filter(key => !['main'].includes(key))

                    for (const target of keys)
                        await mysql.execute(query.company[target].update({ since: body.since }, {
                            companyId: company.id, since: company.since,
                        }))

                    await renameFile(`${dir}/uploads/business/company/${company.id}/logo/`, `${company.since}.png`, `${body.since}.png`)
                },
            })


            this.delete = (target, matchOrIds) => classInstance.delete(this, new.target, target, matchOrIds, {
                extendLog(company, log) {
                    //! REMOVE REDUNDANT
                    //! ATTACH HISTORY
                    return company
                },
            })


            this.close = async until => {
                await this.update({ until })
                return { closed: true }
            }


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
        sanitize(body) {
            //* sql_mode=NO_ENGINE_SUBSTITUTION
            if (!body.since) body.since = '0000-00-00'
            return body
        },
        split(body) {
            const { category, ein, duns, since, busName, coType, alias, website } = body

            body = {
                main: { category, since, duns, website },
                names: { since, busName, coType, alias },
            }
            if (ein) body.main.ein = ein

            return body
        },
    })


    static fetch = ({ user: sessionUser = {}, branch, siteId = null }, filter,
        { hideRawId = false, hideSensitive = true, sorts = Company.config().defSorts, limit, mode } = {}
    ) => {
        const join = [ 'companyId', 'id', { max: 'since' } ]

        return classStatic.fetch(this, { user: sessionUser, branch, siteId }, filter, { hideRawId, hideSensitive, sorts, limit, mode }, {
            batch: [
                {
                    table: query.company.main.table,
                    fields: [
                        'id', Company.hashId(), 'category', selectAES('ein'), 'duns', 'website',
                        'since', 'until', 'global', 'active', 'confirmed', 'locked', 'lastLogo', 'style',
                    ],
                },
                {
                    table: query.company.names.table,
                    fields: [
                        [ 'since', 'nameSince' ],
                        'busName', 'coType', 'alias',
                        { concat: [ [ 'busName', '^, ', 'coType' ], 'name' ] },
                        { route: [ [ 'busName', 'coType' ] ] },
                    ],
                    join,
                },
                {
                    table: query.company.ownerships.table,
                    fields: [ [ 'since', 'ownershipSince' ] ],
                    join,
                },
                {
                    table: query.company_owner.main.table,
                    fields: [ [ 'id', 'ownerId' ], [ Owner.hashId(), 'ownerId' ], 'personId', Individual.hashId('personId') ],
                    join: [ 'id', 'ownerId', query.company.ownerships.table ],
                },
                {
                    db: db.person,
                    table: query.person.main.table,
                    fields: [ 'dob', 'gender', selectAES('ssn') ],
                    join: [ 'id', 'personId', query.company_owner.main.table ],
                },
                {
                    db: db.person,
                    table: query.person.names.table,
                    fields: [ 'prefix', 'firstName', 'middleName', 'lastName', 'suffix', [ 'since', 'ownerNameSince' ] ],
                    join: [ 'personId', 'id', {
                        table: 'individuals',
                        max: 'since',
                    } ],
                },
                {
                    table: query.company.addresses.table,
                    fields: [
                        [ 'since', 'addrSince' ],
                        'address1', 'address2',
                        'city', 'state', 'zip', 'mail',
                    ],
                    join,
                },
                {
                    table: query.company.mail.table,
                    fields: [
                        [ 'since', 'mailSince' ],
                        [ 'address1', 'mailAddress1' ],
                        [ 'address2', 'mailAddress2' ],
                        [ 'city', 'mailCity' ],
                        [ 'state', 'mailState' ],
                        [ 'zip', 'mailZip' ],
                    ],
                    join,
                },
                {
                    table: query.company.phones.table,
                    fields: [ [ 'since', 'phoneSince' ], 'phone' ],
                    join,
                },
                {
                    table: query.company.faxes.table,
                    fields: [ [ 'since', 'faxSince' ], 'fax' ],
                    join,
                },
                {
                    table: query.company.emails.table,
                    fields: [ [ 'since', 'emailSince' ], 'email' ],
                    join,
                },
                //* External IDs based on category
                //! IMPORTANT: Filter this batch in external Category Class to avoid db/table coincidence in query
                {
                    db: db.carrier,
                    table: query.carrier.main.table,
                    fields: [ [ 'id', 'carrierId' ], [ hash('id', algorithm.carrier), '_carrierId' ] ],
                    join: [ 'companyId', 'id' ],
                },
                //! more to be added
            ],
            prepare(batch, filter) {
                const {
                    id, _id, ein, duns, busName, coType, alias, route,
                    ids, _ids, ownerId, _ownerId, category, global, lastLogo,
                    closed, confirmed, active, // Combined when undefined
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
                if (ein) match.main.ein = processAES('ein', ein)
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
            key(category, prop = 'branch', idx = null) {
                for (const key in this) {
                    let value = this[key][prop]
                    if (idx !== null) value = value[idx]
                    if (value === category) return key
                }
            },
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
            if (typeof categories[category] === 'function') continue
            const path = categories[category].path[0]
            props2.count[path] = data[`${path}Count`]
        }

        // props2.comparator = {
        //     name: data.nameSince,
        // }

        reSuper(this, props, props2)

        if (single) {
            this.session = session
            this.config = { hideRawId, hideSensitive }


            this.add = async (target, body) => {
                if (!this?.session?.user?.id) throw new Error('Owner Constructor Method Error [ADD]: Session user not supplied')

                const person = await Individual.fetch(this.session, { id: this.personId })
                if (!person) throw new Error('Individual not found')

                return await person.add(target, body)
            }

            this.fetch = async (target, filter, params) => {
                if (!this?.session?.user?.id) throw new Error('Owner Constructor Method Error [FETCH]: Session user not supplied')

                const person = await Individual.fetch(this.session, { id: this.personId || Individual.matchIdHash(this._personId) })
                if (!person) throw new Error('Individual not found')

                return await person.fetch(target, filter, params)
            }

            this.update = async (targetOrBody, body, match = {}) => {
                if (!this?.session?.user?.id) throw new Error('Owner Constructor Method Error [UPDATE]: Session user not supplied')

                let target = 'main'
                if (typeof targetOrBody === 'object') body = targetOrBody
                else target = targetOrBody

                let { signature } = body
                if ([0, 1, false, true, null, '0', '1', 'false', 'true', 'null'].includes(signature)) {
                    if (signature !== null) {
                        if (signature === 'null') signature = null
                        else signature = [1, true, '1', 'true'].includes(signature)
                    }

                    const [ result ] = await mysql.execute(query.company_owner.update({ signature }))
                    this.signature = signature

                    return { updated: result.affectedRows > 0, data: this }
                } else {
                    const person = await Individual.fetch(this.session, { id: this.personId })
                    if (!person) throw new Error('Individual not found')

                    if (target === 'main') return await person.update(body)
                    else return await person.update(target, body, match)
                }
            }

            this.delete = () => classInstance.delete(this, new.target, null, null, {
                extendLog(owner, log) {
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

                    for (const prop of reduntant) delete owner[prop]

                    //! ATTACH HISTORY

                    return owner
                },
            })


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


    static create = async (session, body, params) => {
        if (!session?.user?.id) throw new Error('Owner Static Method Error [CREATE]: Session user not supplied')

        const { ssn, dob } = body

        let person
        if (ssn) person = await Individual.fetch(session, { ssn })
        if (person && person.dob !== dob) throw new Error('SSN/DOB mismatch (SSN recognized)')

        if (!person) person = (await Individual.create(session, body)).data

        const [ result ] = await mysql.execute(query.company_owner.main.insert({
            personId: person.id,
            createdBy: session.user.id,
        }))
        const id = result.insertId

        if (!id) throw new Error('Failed to create owner')

        return { created: true, data: await Owner.fetch(session, { id } )}
    }


    static fetch = (session, filter, { hideRawId = false, hideSensitive = true, sorts = Owner.config().defSorts, limit, mode } = {}) => classStatic.fetch(this, session, filter, {
        hideRawId, hideSensitive, sorts, limit, mode,
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
                fields: [ 'dob', 'gender', selectAES('ssn') ],
                join: [ 'id', 'personId' ],
            },
            {
                db: db.person,
                table: query.person.names.table,
                fields: [ 'prefix', 'firstName', 'middleName', 'lastName', 'suffix', [ 'since', 'nameSince' ] ],
                join: [ 'personId', 'id', {
                    table: 'individuals',
                    max: 'since',
                } ],
            },
            {
                db: db.person,
                table: query.person.phones.table,
                fields: 'phone',
                join: [ 'personId', 'id', {
                    table: 'individuals',
                    max: 'since',
                } ],
            },
            {
                table: query.company.ownerships.table,
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
            for (const category in categories) {
                if (typeof categories[category] === 'function') continue
                batch[5].fields.push({
                    countCase: [ { category }, `${categories[category].path[0]}Count` ],
                })
            }

            const {
                id, _id, ssn,
                ids, _ids, gender, firstName, lastName,
            } = filter
            const single = !!id || !!_id || !!ssn

            const match = {
                main: { id },
                individuals: { gender },
                names: { firstName, lastName },
            }
            if (!id) {
                if (ids) match.main.id = ids
                match.main.id = Owner.matchIdHash(_id || _ids)
            }
            if (ssn) match.individuals.ssn = processAES('ssn', ssn)

            batch[0].match = match.main
            batch[1].match = match.individuals
            batch[2].match = match.names

            return { single, batch }
        },
    })


}


class RefSource {
    constructor(data = {}, { single = true, session, hideRawId = false, custom = {} }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid RefSource Data')

        const { offline = false } = custom
        this._id = data._id
        if (!hideRawId) this.id = data.id
        this.name = data.name

        this.count = {
            companies: data.companyCount,
        }

        if (single) {
            this.session = session || {}
            this.session.offline = offline
            this.config = { hideRawId }


            this.add = (target, ids) => {
                if (!this.session?.user?.id) throw new Error('RefSource Constructor Method Error [ADD]: Session user not supplied')

                return classInstance.add(this, new.target, target, ids)
            }


            this.fetch = (target, filter, params) => classInstance.fetch(this, new.target, target, filter, params)


            this.update = (body) => {
                if (!session?.user?.id) throw new Error('RefSource Constructor Method Error [UPDATE]: Session user not supplied')

                return classInstance.update(this, new.target, body)
            }


            this.delete = (target, ids) => {
                if (!this.session?.user?.id) throw new Error('RefSource Constructor Method Error [DELETE]: Session user not supplied')

                return classInstance.delete(this, new.target, target, ids)
            }


            this.log = params => classInstance.log(this, new.target, params)
        }
    }

    static #algorithm = 'MD5'
    static hashId = (field = 'id') => hash(field, RefSource.#algorithm)
    static matchIdHash = value => matchHash(value, RefSource.#algorithm)

    static config = () => ({
        enforceUser: false,
        db: db.business,
        query: query.ref_source,
        idProp: 'refSrcId',
        jxTargets: jxTargets('refsources'),
        defSorts: [ 'name' ],
        logFile: 'referral-sources',
    })


    static create = (session, body, params) => {
        if (!session?.user?.id) throw new Error('RefSource Static Method Error [CREATE]: Session user not supplied')

        return classStatic.create(this, session, body, params, {
            async find(body, hideRawId) {
                const { name } = body
                const data = await RefSource.fetch(session, { name }, { hideRawId })

                return { found: !!data, data }
            },
        })
    }


    static fetch = (session, filter, { hideRawId = false, offline = false, sorts = RefSource.config().defSorts, limit, mode } = {}) => {
        if (!offline && !session?.user?.id) throw new Error('RefSource Static Method Error [FETCH]: Session user not supplied')

        return classStatic.fetch(this, session, filter, { hideRawId, sorts, limit, mode }, {
            batch: [
                {
                    table: query.ref_source.main.table,
                    fields: [ 'id', RefSource.hashId(), 'name' ],
                    group: 'id',
                },
                {
                    table: query.jx.companies_refSrc.table,
                    fields: { countDist: [ 'companyId', 'companyCount' ] },
                    join: [ 'refSrcId', 'id' ],
                },
            ],
            prepare(batch, filter) {
                const {
                    id, _id, name,
                    ids, _ids,
                } = filter
                const single = !!id || !!_id || !!name

                const match = { id, name }
                if (!id) {
                    if (ids) match.id = ids
                    else match.id = RefSource.matchIdHash(_id || _ids)
                }

                batch[0].match = match

                return { single, batch, custom: { offline } }
            },
        })
    }


}



function jxTargets(src, target = null) {
    const targets =  {
        company: {
            users: [ query.jx.users_companies, 'userId', User ],
            refsources: [ query.jx.companies_refSrc, 'refSrcId', RefSource ],
        },
        refsources: {
            companies: [ query.jx.companies_refSrc, 'companyId', Company ],
        },
    }[src]

    return target ? targets[target] : targets
}



export default Company
export { Owner, RefSource }
