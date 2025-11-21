/* Settings */
import db from '../../settings/mysql.mjs'

/* Registry */
import inputLength from '../../../client/global/modules/registry/length.mjs'

/* Tools */
import Company, { query as companyQuery } from './company.mjs'
import Query, { hash, matchHash }  from '../utils/query.mjs'
import { classInstance } from '../utils/class.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { processData } from '../utils/database.mjs'

const mysql = require('../utils/mysql')


const query = {
    carrier: {
        main: new Query(db.carrier, 'carriers'),
        ifta: new Query(db.carrier, 'carrier_ifta'),
        stateTax: new Query(db.carrier, 'carrier_state_permits'),
    },
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

        if (single && !hideRawId) {
            this.session = session

        }
    }

    static #algorithm = 'SHA-512/224'
    static hashId = (field = 'id') => hash(field, Carrier.#algorithm)
    static matchIdHash = value => matchHash(value, Carrier.#algorithm)

    static config = () => ({
        query: query.carrier,
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



delete Carrier.sortDefs

export default Carrier
export { query }