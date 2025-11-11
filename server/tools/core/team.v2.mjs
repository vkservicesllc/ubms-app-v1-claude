import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import defProp from '../utils/data.mjs'



class Team {
    static #algorithm = 'MD5'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Team Data')

        let { single, hideRawId } = options
        single = defProp(single, true, 'boolean')
        hideRawId = defProp(hideRawId, false, 'boolean')

        this._id = data._id
        if (!hideRawId) props.id = data.id

        this.name = data.name
        this.description = data.description
        this.settings = data.settings

        if (data.busName && data.coType)
            this.profile = {
                busName: data.busName,
                coType: data.coType,
                company: data.company,
                phone: data.phone,
                email: data.email,
                website: data.website,
                address: new Address({
                    address1: data.address1,
                    address2: data.address2,
                    city: data.city,
                    state: data.state,
                    zip: data.zip,
                })
            }

        this.count = {
            users: data.userCount,
        }

        if (single) {}
    }

    static hashId = (field = 'id') => hash(field, Team.#algorithm)
    static matchIdHash = value => matchHash(value, Team.#algorithm)
}



export default Team