/* Settings */
import db from '../settings/mysql.mjs'

/* Assets */
import { sessionError } from './user.mjs'

/* Tools */
import Query, { hash, matchHash } from '../tools/query.mjs'
import { processData, logDeletion } from '../tools/database.mjs'

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
        
            this.id = async () => (await mysql.execute(query.teams.select('id', {
                match: { id: Team.matchIdHash(this._id) },
            })))[0][0].id


            this.log = async field => {
                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]

                let log = (await mysql.execute(query.teams.select(fields, {
                    match: { id: Team.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }


            this.modify = async (session, data) => {
                let modified = false, error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { modified, error }

                const id = await this.id()
                data = processData(data, {
                    modifiedBy: await session.user.id(),
                    currentData: this,
                    currentUpdateLog: await this.log('updateLog'),
                })

                try {
                    const [ result ] = await mysql.execute(query.teams.update(data, { id }))
                    if (result.affectedRows == 1) modified = true
                } catch (err) {
                    error = 'DB Error'
                }

                return { modified, error, data: await Team.data(session, { id } ) }
            }


            this.delete = async session => {
                let deleted = false, error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { deleted, error }

                const id = await this.id()
                const log = await this.log()

                try {
                    const [ result ] = await mysql.execute(query.teams.delete({ id }))
                    if (result.affectedRows > 0) deleted = true
                } catch(err) {
                    console.error(err)
                    error = 'DB Error'
                }

                if (error) return { deleted, error }
                for (const prop in log) this[prop] = log[prop]
                //? also may consider list of users and companies

                await logDeletion(session, 'teams', this, { id })

                return { deleted }
            }

        }
    }


    static #algorithm = 'MD5'

    static hashId = (field = 'id') => hash(field, Team.#algorithm)

    static matchIdHash = value => matchHash(value, Team.#algorithm)


    static create = async (session, data) => {
        let created = false
        const error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
        if (error) return { created, error }

        data = processData(data)

        for (const prop of [ 'name', 'catId' ])
            if (!data[prop]) return { created, error: 'Invalid Data' }

        data.createdBy = await session.user.id()

        let id
        try {
            const [ result ] = await mysql.execute(query.teams.insert(data))
            id = result.insertId

            if (id) created = true
        } catch (err) {
            console.error(err)
            return { created, error: 'DB Error' }
        }

        return { created, data: await Team.data(session, { id })}
    }


    static #batch = async (session, options = {}) => {
        if (!session?.user) return []

        let { params, filter } = options
        if (!params) params = {}
        if (!filter) filter = {}

        const { _id, id, name } = params
        const { catId } = filter
        const match = { id, name, catId }
        if (!id) match.id = Team.matchIdHash(_id)

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


    static data = async (session, params = {}) => {
        if (!params._id && !params.id && !params.name) return

        const batch = await Team.#batch(session, { params })
        if (!batch.length) return

        const data = (await mysql.execute(Query.select(db.business, batch)))[0][0]

        return !data ? data : new Team(data)
    }


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