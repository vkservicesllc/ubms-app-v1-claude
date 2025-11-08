/* Settings */
import db from '../../settings/mysql.mjs'

/* Tools */
import User, { query as userQuery } from './user.mjs'
import Company from './company.mjs'
import Carrier from './carrier.mjs'
import Driver from './driver.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import { sessionError } from './user.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import recognizeApi from '../utils/api.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { sortArrayByObjectKey } from '../../../client/global/modules/tools/utils/sorter.mjs'

const mysql = require('../utils/mysql')
const throwErr = require('../utils/error')


const query = {
    main: new Query(db.online, 'teams'),
    profiles: new Query(db.online, 'team_profiles'),
}



class Team {
    constructor(data, options = {}) {
        if (!data?._id) throw new Error('Invalid Team Data')

        let { single, hideRawId } = options
        if (single === undefined || typeof single !== 'boolean') single = true
        if (hideRawId === undefined || typeof hideRawId !== 'boolean') hideRawId

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

        if (single) {
            //! to be continued...
        }
    }


    static #algorithm = 'MD5'
    static hashId = (field = 'id') => hash(field, Team.#algorithm)
    static matchIdHash = value => matchHash(value, Team.#algorithm)


    //! to be continued...
}



export default Team
export { query }