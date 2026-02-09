/* Settings */
import db, { query, algorithm } from '../../settings/mysql.mjs'

/* Registry */
import inputLength from '../../../client/global/modules/registry/length.mjs'

/* Tools */
import Company from './company.mjs'
import { hash, matchHash }  from '../utils/query.mjs'
import { classInstance, classStatic } from '../utils/class.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'


const stateTaxIds = Object.keys(inputLength.carrier.permit.max)



class Carrier extends Company {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Carrier Data')

        super(data, { single, hideRawId, hideSensitive })
        this.externalId = undefined

        const props = { _id: data._carrierId, _companyId: data._id }
        if (!hideRawId) {
            props.id = data.carrierId
            props.companyId = data.id
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
            this.config = { hideRawId, hideSensitive }


            this.add = (target, body) => classInstance.add(this, new.target, target, body)


            this.fetch = (target, filter, params) => classInstance.fetch(this, new.target, target, filter, params)


            this.update = (targetOrBody, body, match) => classInstance.update(this, new.target, targetOrBody, body, match)


            this.delete = (target, match) => classInstance.delete(this, new.target, target, match)


            this.log = params => classInstance.log(this, new.target, params)
        }
    }

    static #algorithm = algorithm.carrier
    static hashId = (field = 'id') => hash(field, Carrier.#algorithm)
    static matchIdHash = value => matchHash(value, Carrier.#algorithm)

    static config = () => ({
        db: db.business,
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
            const { companyId, since, mc, usdot, scac, irp, efs, fleetOne, transflo } = body
            let { ifta, stateTax } = body
            ifta = JSON.parse(ifta)
            stateTax = JSON.parse(stateTax)

            const { number, jurisdiction } = ifta

            body = {
                main: { companyId, mc, usdot, scac, irp, efs, fleetOne, transflo },
                ifta: { since, number, jurisdiction },
                stateTax,
            }

            return body
        },
    })


    static fetch = (session, filter,
        { hideRawId = false, hideSensitive = true, sorts = Company.config().defSorts, mode } = {}
    ) => classStatic.fetch(this, session, filter, { hideRawId, hideSensitive, sorts, mode }, {
        async prepare(batch, filter) {
            batch = await Company.fetch(session, {}, { mode: 'batch' })

            //! IMPORTANT
            batch = batch.filter(item => item.table !== query.carrier.main.table && item.db !== db.carrier)

            const join = [ 'carrierId', 'id', 'carriers' ]
            const stateTaxFields = []
            stateTaxIds.map(state => stateTaxFields.push([ state, `${state}Permit` ]))

            batch.push({
                db: db.carrier,
                table: query.carrier.main.table,
                fields: [
                    [ 'id', 'carrierId' ], [ Carrier.hashId(), 'carrierId' ],
                    'mc', 'usdot', 'scac', 'irp',
                    'efs', 'fleetOne', 'transflo',
                ],
                join: [ 'companyId', 'id' ],
            }, {
                db: db.carrier,
                table: query.carrier.ifta.table,
                fields: [ [ 'number', 'ifta' ], [ 'jurisdiction', 'iftaJur' ] ],
                join,
            }, {
                db: db.carrier,
                table: query.carrier.stateTax.table,
                fields: stateTaxFields,
                join,
            })

            delete batch[0].match.id
            batch[0].match.category = 'crr'

            const {
                id, _id, companyId,  _companyId, ein, duns, busName, coType, alias, route,
                mc, usdot, scac, irp, efs, fleetOne, transflo, ifta, stateTax = {},
                ids, _ids, companyIds, _companyIds,
            } = filter
            const single = !!id || !!_id || !!companyId || !!_companyId || !!ein || !!duns || !!(busName && coType) || !!alias || !!route || !!mc || !!usdot

            const idx = batch.length - 3
            batch[idx].match = { usdot, mc, scac, irp, efs, fleetOne, transflo }
            
            //! IFTA match will probably match only if final ifta number checked, not previous
            batch[idx + 1].match = { number: ifta?.number }
            Object.keys(stateTax).forEach(state => batch[idx + 2].match = { [state]: stateTax[state] })

            if (!batch[0].match) batch[0].match = {}
            if (!batch[1].match) batch[1].match = {}

            if (id || _id || ids || _ids) {
                if (id) batch[idx].match.id = id
                else if (ids) batch[idx].match.id = ids
                else if (_id || _ids) batch[idx].match.id = Carrier.matchIdHash(_id || _ids)
            }
            if (companyId || _companyId || companyIds || _companyIds)
                batch[0].match.id = companyId || companyIds || Company.matchIdHash(_companyId || _companyIds)
            if (ein) batch[0].match.ein = { aes: [ ein, secret.ein ] }
            if (busName && coType) {
                batch[1].match.busName = busName
                batch[1].match.coType = coType
            }
            if (route) batch[1].match.route = { route: [ [ 'busName', 'coType' ], route ] }

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