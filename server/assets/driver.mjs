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
            const { draw, start, length, search, order, columns } = req.body

            const defaultFilters = { teamId }
            let query = knex(`${db.carrier}.applications AS apl`)
                .select(
                    knex.raw(Query.hashField(Application.hashId(), 'apl')),
                    knex.raw(Query.hashField(Carrier.hashId('carrierId'))),
                    knex.raw(Query.hashField(Team.hashId('teamId'))),
                    'formId',
                    'appliedOn',
                    'firstName',
                    'middleName',
                    'lastName',
                    'suffix',
                    'dob',
                    'email',
                    'phone',
                    'busName',
                    'coType',
                )
                .join(`${db.carrier}.carriers AS crr ON apl.carrierId = crr.id`)
                .join(`${db.business}.companies AS cmp ON crr.companyId = cmp.id`)
                .join(`${db.business}.company_names as cnm ON cnm.companyId = cmp.id`) //! need to filter out the most recent name by latest `since`
                .where(defaultFilters)

            const searchableColumns = columns
                .filter(column => column.searchable)
                .map(column => column.data)

            if (search && search.value && searchableColumns.length) {
                query = query.where(qb => {
                    let i = 0

                    searchableColumns.forEach(field => {
                        if (field && field !== 'function') {
                            if (i === 0) qb.where(field, 'like', `%${search.value}%`)
                            else qb.orWhere(field, 'like', `%${search.value}%`)

                            i++
                        }
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

    static dtList_RM = async (req, res) => { //* Datatables Server Side API
        try {
            let table = 'app_carrier.applications apl'
            //* attach ' JOIN app_carrier.application_addresses adr on apl.id = adr.aplId'
            //! make it select only the latest address

            const query = dtQuery(mysql, table, [
                Application.hashId(),
                Carrier.hashId('carrierId'),
                Team.hashId('teamId'),
                'formId',
                'appliedOn',
                'firstName',
                'middleName',
                'lastName',
                'suffix',
                'dob',
                'email',
                'phone',
            ])

            const { sql, params } = dtQuery.createQuery(req.body)
            const [ rows ] = await mysql.execute(sql, params)
            const result = {
                draw: req.body.draw,
                recordsTotal: rows.length,
                recordsFiltered: rows.length,
                data: rows
            }
console.log(result)
            res.json(result)
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