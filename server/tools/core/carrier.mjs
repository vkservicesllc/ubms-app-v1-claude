/* Settings */
import db from '../../settings/mysql.mjs'

/* Registry */
import inputLength from '../../../client/global/modules/registry/length.mjs'

/* Tools */
import Company, { query as companyQuery } from './company.mjs'
// import { sessionError } from './user.mjs'
import Query, { hash, matchHash }  from '../utils/query.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { processData } from '../utils/database.mjs'

const mysql = require('../utils/mysql')


const query = {
    main: new Query(db.carrier, 'carriers'),
    ifta: new Query(db.carrier, 'carrier_ifta'),
    stateTax: new Query(db.carrier, 'carrier_state_permits'),
}

const stateTaxIds = Object.keys(inputLength.carrier.permit.max)



class Carrier extends Company {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Carrier Data')

        super(data, { single, hideRawId, hideSensitive })

        const props = { _id: data._id, _companyId: data._companyId }
        if (!hideRawId) {
            props.id = data.id
            props.companyId = data.companyId
        }

        const props2 = {
            mc: data.mc,
            usdot: data.usdot,
            scac: data.scac,
            irp: data.irp,
            ifta: data.ifta,
            iftaJur: data.iftaJur,
            stateTax: {},
            efs: data.efs,
            fleetOne: data.fleetOne,
            transflo: data.transflo,
        }
        stateTaxIds.forEach(state => props2.stateTax[state] = data[`${state}Permit`])

        reSuper(this, props, props2)

        if (single) {
            this.session = session

            delete this.history
            delete this.confirm


            this.add = async (target, body) => {}


            this.log = async (field, queryProp = 'main') => {
                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]
                const idProp = queryProp === 'main' ? 'id' : 'companyId'

                let log = (await mysql.execute(query[queryProp].select(fields, {
                    match: { [idProp]: this.id || Carrier.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }
        }
    }

    static #algorithm = 'SHA-512/224'
    static hashId = (field = 'id') => hash(field, Carrier.#algorithm)
    static matchIdHash = value => matchHash(value, Carrier.#algorithm)


    static create = async ({ user: sessionUser = {} }, body = {}) => {
        if (!sessionUser.id) throw new Error('Carrier Create Error: No session user')

        body = processData(body)

        const { usdot, mc } = body

        if (await Company.fetch({ user: sessionUser }, { usdot, mc })) return

        body.createdBy = sessionUser.id

        const [ result ] = await mysql.execute(query.main.insert(body))
        const id = result.insertId

        if (!id) throw new Error('DB Error: Failed to create carrier')

        const carrier = await Company.fetch({ user: sessionUser }, { id })
        if (!carrier) throw new Error('Fetch Error: New carrier not found')

        return carrier
    }


    static fetch = async (
        { user: sessionUser = {}, branch, siteId } = {}, filter = {},
        { hideRawId = false, hideSensitive = true, sorts = Company.defSorts, mode = 'data' } = {}
    ) => {
        if (!sessionUser.id) throw new Error('Carrier Fetch Error: No session user')

        const batch = await Company.fetch({ user: sessionUser }, filter, { hideRawId, hideSensitive, sorts, mode: 'batch' })

        const join = [ 'carrierId', 'id', 'carriers' ]
        const stateTaxFields = []
        stateTaxIds.map(state => stateTaxFields.push([ state, `${state}Permit` ]))

        batch.push({
            db: db.carrier,
            table: query.main.table,
            fields: [
                [ 'id', 'carrierId' ], [ Carrier.hashId(), 'carrierId' ],
                'mc', 'usdot', 'scac', 'irp',
                'efs', 'fleetOne', 'transflo',
            ],
            join: [ 'companyId', 'id' ],
        }, {
            db: db.carrier,
            table: query.ifta.table,
            fields: [ [ 'number', 'ifta' ], [ 'jurisdiction', 'iftaJur' ] ],
            join,
        }, {
            db: db.carrier,
            table: query.stateTax.table,
            fields: stateTaxFields,
            join,
        })

        delete batch[0].match.id
        batch[0].match.category = 'crr'

        const {
            id, _id, companyId,  _companyId, ein, duns, busName, coType, alias, route, usdot, mc,
            ids, _ids, companyIds, _companyIds,
        } = filter
        const single = !!id || !!_id || !!companyId || !!_companyId || !!ein || !!duns || !!(busName && coType) || !!alias || !!route

        const idx = batch.length - 3
        batch[idx].match = { usdot, mc }
        if (id || _id || ids || _ids) {
            batch[idx].match.id = { id }
            if (!id) {
                if (ids) batch[idx].match.id = ids
                else batch[idx].match.id = Carrier.matchIdHash(_id || _ids)
            }
        }
        if (companyId || _companyId || companyIds || _companyIds)
            batch[0].match.id = companyId || companyIds || Company.matchIdHash(_companyId || _companyIds)

        if (mode === 'batch') return batch

        const queryStr = Query.select(db.business, batch)
        if (mode === 'query') return queryStr

        const list = (await mysql.execute(queryStr))[0]

        const session = { user: { id: sessionUser.id }, siteId, branch }
        list.forEach((data, i, arr) => arr[i] = new Carrier(data, { single, session, hideRawId, hideSensitive }))

        return single ? list[0] : list
    }


    static list = {

        permit: {
            ca: {
                content: 'CA Number',
                title: 'California Number & Weight-Mile Tax',
            },
            fl: {
                content: 'FL Highway Use Permit',
                title: 'Florida Highway Use Permit',
            },
            il: {
                content: 'IL MFUT',
                title: 'Illinois Motor Fuel Use Tax',
            },
            in: {
                content: 'IN MCFT',
                title: 'Indiana Motor Carrier Fuel Tax',
            },
            ky: {
                content: 'KYU Number',
                title: 'Kentucky Weight Distance Tax Number (Permit)',
            },
            nj: {
                content: 'NJ HUT',
                title: 'New Jersey Highway Use Tax',
            },
            nm: {
                content: 'NM Permit',
                title: 'New Mexico Weight Distance Tax Permit',
            },
            nv: {
                content: 'NV Highway Use Fees',
                title: 'Nevada Highway Use Fees',
            },
            ny: {
                content: 'HUT Certificate (NY)',
                title: 'New York Highway Use Tax Certificate Number (Permit)',
            },
            or: {
                content: 'OR Permit',
                title: 'Oregon Motor Carrier Permit',
            },
            tx: {
                content: 'TX Motor Carrier Registration',
                title: 'Texas Motor Carrier Registration',
            },
            wa: {
                content: 'WA Weight Distance Permit',
                title: 'Washington State Weight Distance Permit',
            },
        },

    }


}



delete Carrier.sortDefs

export default Carrier
export { query }