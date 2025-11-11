import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import Company from './company.mjs'



class Carrier extends Company {
    static #algorithm = 'SHA-512/224'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Carrier Data')
    }

    static hashId = (field = 'id') => hash(field, Carrier.#algorithm)
    static matchIdHash = value => matchHash(value, Carrier.#algorithm)
}



delete Carrier.list

export default Carrier