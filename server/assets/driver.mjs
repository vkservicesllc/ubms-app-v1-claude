/* Settings */
import db from '../settings/mysql.mjs'

/* Assests */
import Individual from './individual.mjs'
import Team from './team.mjs'
import Company from './company.mjs'
import Carrier from './carrier.mjs'

/* Tools */
import { reSuper } from '../../client/global/modules/tools/object.mjs'
import { sortArrayByObjectKey } from '../../client/global/modules/tools/sorter.mjs'
import Query, { hash, matchHash } from '../tools/query.mjs'

const mysql = require('../tools/mysql')
const knex = require('../tools/knex')
const throwErr = require('../tools/error').api

const query = {
    drivers: new Query(db.carrier, 'drivers'),
    applications: new Query(db.carrier, 'applications'),
}



class Driver extends Individual {
    constructor(data = {}, light = false) {}
}



class Application {
    constructor(data = {}, light = false) {
        this._id = data._id
        this._teamId = data._teamId
        this._userId = data._userId
        this._carrierId = data._carrierId
        this.formId = data.formId
        this.appliedOn = data.appliedOn
        this.firstName = data.firstName
        this.middleName = data.middleName
        this.lastName = data.lastName
        this.suffix = data.suffix
        this.dob = data.dob
        this.email = data.email
        this.phone = data.phone
        this.emPhone = data.emPhone
        this.emName = data.emName
        this.legal = data.legal
        this.legStatus = data.legStatus
    }


    static #algorithm = 'SHA-224'

    static hashId = (field = 'id') => hash(field, Application.#algorithm)

    static matchIdHash = value => matchHash(value, Application.#algorithm)


    static companies = async (session, filter = {}) => {
        if (!session?.user || !session?.team) return

        const { excluded } = filter
        const companyId = await session.team.ids(session, 'companies')

        const batch = [
            {
                table: 'applications',
                fields: Carrier.hashId('carrierId'),
            },
            {
                table: 'carriers',
                fields: Company.hashId('companyId'),
                join: [ 'id', 'carrierId' ],
            },
            {
                db: db.business,
                table: 'companies',
                fields: [ 'active', 'until' ],
                join: [ 'id', 'companyId', 1 ],
                match: { confirmed: true },
            },
            {
                db: db.business,
                table: 'company_names',
                fields: [ 'busName', 'coType', { concat: [ [ 'busName', '^, ', 'coType' ], 'name' ] }, 'alias' ],
                join: [ 'companyId', 'id', 2 ],
            },
        ]
        if (excluded !== true) batch[1].match = { companyId }

        let companies = (await mysql.execute(Query.select(db.carrier, batch)))[0]
        companies = sortArrayByObjectKey(companies, 'name')

        return companies
    }


    static dtList = async (req, res) => { /* API use only */
        try {
            const sessionsUser = res.session.user
            let permissions = sessionsUser.DS

            if (!permissions) {
                permissions = await sessionsUser.permissions(res.session)
                if (!('d:drv/apl' in permissions)) return throwErr.auth(res, null, err, false)
            }

            const settings = await sessionsUser.settings(res.session)
            const team = await Team.data(res.session, { _id: req.session.team })
            const teamId = await team.id()
            const { draw, start, length, columns, search, filter, order } = req.body
            const { teamCompanies } = settings?.carrier || {}
            const companyIds = await team.ids(res.session, 'companies')

            let subquery = knex
                .select('*')
                .from(`${db.business}.company_names`)
                .whereIn('since', function() {
                    this.select(knex.raw('MAX(since)'))
                        .from(`${db.business}.company_names`)
                        .groupBy('companyId')
                })

            const defaultFilters = { teamId, 'cmp.confirmed': true }

            let query = knex(`${db.carrier}.applications AS apl`)
                .select(
                    knex.raw(Query.hashField(Application.hashId(), 'apl')),
                    knex.raw(Query.hashField(Carrier.hashId('carrierId'))),
                    knex.raw(Query.hashField(Team.hashId('teamId'))),
                    'formId',
                    'appliedOn',
                    'condition',
                    'position',
                    'firstName',
                    'middleName',
                    'lastName',
                    'suffix',
                    'dob',
                    'email',
                    'phone',
                    'busName',
                    'coType',
                    'alias',
                )
                .join(knex.raw(`${db.carrier}.carriers AS crr ON apl.carrierId = crr.id`))
                .join(knex.raw(`${db.business}.companies AS cmp ON crr.companyId = cmp.id`))
                .join(
                    knex.raw('? as cnm', [ subquery ]),
                    'cnm.companyId',
                    'cmp.id'
                )
                .where(defaultFilters)

            if (!teamCompanies || !teamCompanies.includes('i')) query.where({ 'cmp.active': true })
            if (!teamCompanies || !teamCompanies.includes('c')) query.where({ 'cmp.until': null })
            if (!teamCompanies || !teamCompanies.includes('e')) query.whereIn('cmp.id', companyIds)

            const searchableColumns = columns
                .filter(column => column.data && column.data !== 'function' && column.searchable === 'true')
                .map(column => column.data)

            if (filter) {
                if (filter?.conditions) {
                    filter.conditions = filter.conditions.split(',')

                    query = query.whereIn('condition', filter.conditions)
                }
                if (filter?.positions) {
                    filter.positions = filter.positions.split(',')

                    query = query.whereIn('position', filter.positions)
                }

                if (filter.companies) {
                    const carrierIds = []
                    filter.companies = filter.companies.split(',')

                    await Promise.all(filter.companies.map(async (_id) => {
                        const carrier = await Carrier.data(res.session, { _id })
                        const id = await carrier.id()

                        carrierIds.push(id)
                    }))

                    query.whereIn('apl.carrierId', carrierIds)
                }
            }

            if (search && search.value && searchableColumns.length) {
                query = query.where(qb => {
                    searchableColumns.forEach((field, i) => {
                        if (i === 0) qb.where(field, 'like', `%${search.value}%`)
                        else qb.orWhere(field, 'like', `%${search.value}%`)
                    })
                })
            }

            const orderColumn = order?.[0]?.column
            const orderField = columns?.[orderColumn]?.data || 'appliedOn'
            const orderDir = order?.[0]?.dir === 'asc' ? 'asc' : 'desc'
            query = query.orderBy(orderField, orderDir)

            query = query.limit(length).offset(start)

            const data = await query
            const [{ count }] = await knex('app_carrier.applications').count('* as count')

            res.json({
                draw,
                recordsTotal: count,
                recordsFiltered: data.length,
                data,
                permissions,
            })
        } catch(err) {
            throwErr.server(res, null, err, false)
        }
    }


}



class User {
    constructor() {}
}



export default Driver
export { Application, User }