/* Settings */
import db from '../settings/mysql.mjs'

/* Tools */
import Query, { hash, matchHash } from '../tools/query.mjs'

const mysql = require('../tools/mysql')


const query = {
    teams: new Query(db.business, 'teams'),
    companies: new Query(db.business, 'teams_companies'),
    users: new Query(db.business, 'teams_users'),
}



class Team {
    constructor(data = {}, light = false) {
        this._id = data._id
        this.catId = data.catId
        this.name = data.name
        this.description = data.description
        this.count = {
            companies: data.companyCount,
            users: data.userCount,
        }

        if (!light) {
        
            this.id = async () => (await mysql.execute(query.companies.select('id', {
                match: { id: Team.matchIdHash(this._id) },
            })))[0][0].id

        }
    }


    static #algorithm = 'MD5'

    static hashId = (field = 'id') => hash(field, Team.#algorithm)

    static matchIdHash = value => matchHash(value, Team.#algorithm)


    static create = async (session, data) => {}


    static #batch = async (session, options = {}) => {
        if (!session?.user) return []

        let { params, filter } = options
        if (!params) params = {}
        if (!filter) filter = {}

        const { _id, id } = params
        const { catId } = filter
        const match = { id, catId }
        if (!id) match.id = Team.matchIdHash()

        const batch = [
            {
                table: 'teams',
                fields: [ Team.hashId(), 'catId', 'name', 'description' ],
                match,
                group: 'id',
            },
            {
                table: 'teams_companies',
                fields: [ { countDist: [ 'companyId', 'companyCount' ] } ],
                join: [ 'teamId', 'id' ],
            },
            {
                table: 'teams_users',
                fields: [ { countDist: [ 'userId', 'userCount' ] } ],
                join: [ 'teamId', 'id' ],
            },
        ]

        return batch
    }


    static data = async (session, params = {}) => {}


    static list = async (session, filter = {}) => {
        const batch = await Team.#batch(session, { filter })
        if (!batch.length) return []

        const list = (await mysql.execute(Query.select(db.business, batch)))[0]
        list.forEach((data, i, arr) => arr[i] = new Team(data, true))

        return list
    }


    static find = async (session, params = {}) => {}


}



export default Team