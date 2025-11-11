import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'



class Team {
    static #algorithm = 'MD5'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Team Data')
    }

    static hashId = (field = 'id') => hash(field, Team.#algorithm)
    static matchIdHash = value => matchHash(value, Team.#algorithm)
}



export default Team