import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'



class Team {
    constructor(data = {}, { single = true, session, hideRawId = false }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Team Data')

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
            this.session = session


            this.add = async (target, ids = []) => {}


            this.fetch = async (target, { hideRawId = false, idsOnly = false } = {}) => {}


            this.update = async body => {}


            this.delete = async (target, ids = []) => {}


            this.log = async field => {
                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]

                let log = (await mysql.execute(query.main.select(fields, {
                    match: { id: this.id || Role.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }
        }
    }

    static #algorithm = 'MD5'
    static hashId = (field = 'id') => hash(field, Team.#algorithm)
    static matchIdHash = value => matchHash(value, Team.#algorithm)


    static create = async ({ user: sessionUser = {} }, body = {}) => {}


    static fetch = async ({ user: sessionUser = {} }, filter = {}, { hideRawId = false, batchOnly = false }) => {}


}



export default Team