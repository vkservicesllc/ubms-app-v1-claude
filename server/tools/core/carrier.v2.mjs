import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import Company from './company.mjs'

import defProp from '../utils/data.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'



class Carrier extends Company {
    static #algorithm = 'SHA-512/224'

    static #batch = (session = {}, filter = {}) => {}


    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Carrier Data')

        options.single = defProp(options.single, true, 'boolean')
        options.hideRawId = defProp(options.hideRawId, false, 'boolean')
        options.hideSensitive = defProp(options.hideSensitive, true, 'boolean')
        super(data, options)

        const { single, hideRawId } = options

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

        if (single) {}
    }

    static hashId = (field = 'id') => hash(field, Carrier.#algorithm)
    static matchIdHash = value => matchHash(value, Carrier.#algorithm)


    static create = (session, data) => {}


    static fetch = (session, filter) => {}


}



delete Carrier.list

export default Carrier