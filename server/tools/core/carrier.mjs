/* Settings */
import db, { query } from '../../settings/mysql.mjs'

/* Registry */
import inputLength from '../../../client/global/modules/registry/length.mjs'

/* Tools */
import Company from './company.mjs'
import Query, { hash, matchHash }  from '../utils/query.mjs'
import { classInstance, classStatic } from '../utils/class.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { processData } from '../utils/database.mjs'

const mysql = require('../utils/mysql')


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

        if (single && !hideRawId) {
            this.session = session


            this.fetch = (target, params) => classInstance.fetch(this, new.target, target, params)


            this.log = params => classInstance.log(this, new.target, params)
        }
    }

    static #algorithm = 'SHA-512/224'
    static hashId = (field = 'id') => hash(field, Carrier.#algorithm)
    static matchIdHash = value => matchHash(value, Carrier.#algorithm)

    static config = () => ({
        db: db.carrier,
        query: query.carrier,
        idProp: 'carrierId',
    })
    
    
    static create = (session, body, params) => classStatic.create(this, session, body, params, {
        async find(body, hideRawId) {
            const { mc, usdot } = body
            const data = await Carrier.fetch(session, { mc, usdot }, { hideRawId })

            return { found: !!data, data }
        },
        split(body) {
            const { companyId, since, mc, usdot, scac, irp, efs, fleetOne, transflo, ifta } = body
            const { number, jurisdiction } = ifta

            body = {
                main: { companyId, mc, usdot, scac, irp, efs, fleetOne, transflo },
                ifta: { since, number, jurisdiction },
            }

            return body
        },
    })


    static fetch = (session, filter,
        { hideRawId = false, sorts = Company.config().defSorts, mode } = {}
    ) => classStatic.fetch(this, session, filter, { hideRawId, hideSensitive, sorts, mode }, {
        prepare(batch, filter) {
            batch = Company.fetch(session, {}, { mode: 'batch' })

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
                id, _id, companyId,  _companyId, ein, duns, busName, coType, alias, route, mc, usdot,
                ids, _ids, companyIds, _companyIds,
            } = filter
            const single = !!id || !!_id || !!companyId || !!_companyId || !!ein || !!duns || !!(busName && coType) || !!alias || !!route || !!mc || !!usdot

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

            return { single, batch }
        },
    })


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



export default Carrier