/* Settings */
import db from '../settings/mysql.mjs'

/* Assests */
import Individual from './individual.mjs'
import Carrier from './carrier.mjs'
import Team from './team.mjs'

/* Tools */
import { reSuper } from '../../client/global/modules/tools/object.mjs'
import Query, { hash, matchHash } from '../tools/query.mjs'

const mysql = require('../tools/mysql')
const knex = require('../tools/knex')
const throwErr = require('../tools/error').api



class Driver extends Individual {
    constructor(data = {}, light = false) {}
}



class Application {
    constructor(data = {}, light = false) {
        this._id = data._id
        this._carrierId = data._carrierId
        this._teamId = data._teamId
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


    static dtList = async (req, res) => {
        try {
            const team = await Team.data(res.session, { _id: req.session.team })
            const teamId = await team.id()
            const { draw, start, length, search, order, columns, filter } = req.body

            let subquery = knex
                .select('*')
                .from(`${db.business}.company_names`)
                .whereIn('since', function() {
                    this.select(knex.raw('MAX(since)'))
                        .from(`${db.business}.company_names`)
                        .groupBy('companyId')
                })

            const defaultFilters = { teamId }
            let query = knex(`${db.carrier}.applications AS apl`)
                .select(
                    knex.raw(Query.hashField(Application.hashId(), 'apl')),
                    knex.raw(Query.hashField(Carrier.hashId('carrierId'))),
                    knex.raw(Query.hashField(Team.hashId('teamId'))),
                    'formId',
                    'appliedOn',
                    'complete',
                    'decision',
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

            const searchableColumns = columns
                .filter(column => column.data && column.data !== 'function' && column.searchable === 'true')
                .map(column => column.data)

            if (filter) {
                if (filter?.condition) {
                    filter.condition.map((value, i, arr) => arr[i] = value === 'false' ? false : true)
                    query = query.whereIn('complete', filter.condition)
                }
                if (filter?.decision) query = query.whereIn('decision', filter.decision)
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