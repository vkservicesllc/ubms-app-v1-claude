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

            this.list = {
                drivers: {
                    positions: Driver.positionList,
                },
            }

            {
                const settings = this.settings || {}
                const positions = settings?.drivers?.positions

                if (positions) {
                    this.list.drivers.positions = {}
                    for (const item in Driver.positionList)
                        if (positions.includes(item))
                            this.list.drivers.positions[item] = Driver.positionList[item]
                }
            }


            this.log = async (field, target) => {
                if (!['teams', 'profiles'].includes(target)) target = 'main'

                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]
                const idProp = target === 'main' ? 'id' : 'teamId'

                let log = (await mysql.execute(query[target].select(fields, {
                    match: { [idProp]: this.id || Team.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }


            this.flush = async () => {
                return (await mysql.execute(query.main.update({ updateLog: null }, {
                    id: this.id || Team.matchIdHash(this._id),
                })))[0]
            }


            this.fetch = async (session, target = null, params = {}) => {
                if (!session?.user || typeof session.user !== 'object') return
                const { user: sessionUser } = session

                let data = [], batch

                switch (target) {

                    case 'userIds':
                    case 'users':
                        {
                            batch = [
                                {
                                    table: userQuery.jx.teams.table,
                                    match: { teamId: this.id || Team.matchIdHash(this._id) },
                                },
                                {
                                    table: userQuery.main.table,
                                    join: [ 'id', 'userId' ],
                                    match: { deletedBy: null, status: ['U', 'A'] },
                                },
                            ]
                            if (sessionUser.location != 'US')
                                batch[1].match.location = sessionUser.location
                            if (target === 'userIds') {
                                batch[0].fields = 'userId'
                                const [ result ] = await mysql.execute(new Query(db.online, batch))
                                result.forEach(row => data.push(row.userId))
                            } else {
                                const { hideRawId, hideSensitive, sortBy, assign } = params
                                const userBatch = await User.batch(session, {}, { qBatch: true })
                                batch[1].fields = userBatch[0].fields

                                [ data ] = await mysql.execute(new Query(db.online, batch))
                                data.forEach((row, i) => data[i] = new User(row, { hideRawId, hideSensitive }))
                                if (sortBy) data = sortArrayByObjectKey(data, sortBy)

                                if (assign === true) {
                                    const filter = { status: [ 'U', 'A' ] }
                                    if (sessionUser.location != 'US') filter.location = sessionUser.location
        
                                    data = { applied: data }
                                    data.all = await User.fetch(session, filter, { hideRawId, hideSensitive })
                                    data.available = data.all.filter(user => !data.applied.some(appliedUser => appliedUser._id === user._id))
                                    if (sortBy) {
                                        data.all = sortArrayByObjectKey(data.all, sortBy)
                                        data.available = sortArrayByObjectKey(data.available, sortBy)
                                    }
                                }
                            }
                        }
                        break


                }

                return data
            }


            this.add = async (session, target, _ids) => {
                let added = false, error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (!error && !this.id) error = 'Data Error: Raw ID is missing'
                if (error) return { added, error }

                const data = [], createdBy = session.user.id, teamId = this.id
                let querySrc = query, queryProp

                switch (target) {
                    case 'users':
                        const users = await User.fetch(session, { _ids })
                        users.forEach(user => data.push({
                            userId: user.id,
                            teamId, createdBy,
                        }))
                        querySrc = userQuery
                        queryProp = 'teams'
                        break
                }

                const [ result ] = await mysql.execute(querySrc.jx[queryProp].insert(data))
                added = result.affectedRows > 0

                return { added }
            }


            this.delete = async (session, target = null, ids = []) => {
                if (!target) {
                    let deleted = false, error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                    if (error) return { deleted, error }

                    const id = this.id || Team.matchIdHash(this._id)
                    const log = await this.log()

                    try {
                        const [ result ] = await mysql.execute(query.main.delete({ id }))
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
                } else if (ids.length) { //? No delete log
                    const [ querySrc, queryProp, idProp ] = {
                        users: [ userQuery, 'teams', 'userId' ],
                    }
                    const [ result ] = await mysql.execute(querySrc.jx[queryProp].delete({ [idProp]: ids }))

                    return { deleted: result.affectedRows > 0 }
                }
            }


            this.modify = async (session, data) => {
                let modified = false, error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { modified, error }

                const id = this.id || Team.matchIdHash(this._id)
                data = processData(data, {
                    modifiedBy: session.user.id,
                    currentData: this,
                    currentUpdateLog: await this.log('updateLog'),
                })

                try {
                    const [ result ] = await mysql.execute(query.main.update(data, { id }))
                    if (result.affectedRows === 1) modified = true
                } catch (err) {
                    error = 'DB Error'
                }

                return { modified, error, data: await Team.data(session, { id } ) }
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
        for (const prop of [ 'name' ]) if (!data[prop]) return { created, error: 'Invalid Data' }

        data.createdBy = session.user.id

        let id
        try {
            const [ result ] = await mysql.execute(query.main.insert(data))
            id = result.insertId

            if (id) created = true
        } catch (err) {
            console.error(err)
            return { created, error: 'DB Error' }
        }

        return { created, data: await Team.fetch(session, { id })}
    }


    static fetch = async (session, filter = {}, params = {}) => {
        if (!session?.user || typeof session.user !== 'object') return

        const {
            id, _id, name,
            ids, _ids,
        } = filter
        const single = id || _id || name
        const { hideRawId, qBatch } = params

        const match = { id, category, name, location }
        if (!id) {
            if (ids) match.id = ids
            else match.id = Role.matchIdHash(_id || _ids)
        }

        const join = ['teamId', 'id']

        const batch = [
            {
                table: query.main.table,
                fields: [ Team.hashId(), 'name', 'description', 'settings' ],
                match,
                group: 'id',
            },
            {
                table: query.profiles.table,
                fields: [
                    'busName', 'coType',
                    { concat: [ [ 'busName', '^, ', 'coType' ], 'company' ] },
                    'phone', 'email', 'website',
                    'address1', 'address2', 'city', 'state', 'zip',
                ],
                join,
            },
            {
                table: userQuery.jx.teams.table,
                fields: [ { countDist: ['userId', 'userCount', {
                    case: {
                        db: db.online,
                        table: userQuery.main.table,
                        match: { deletedBy: null },
                    },
                }] } ],
                join,
            },
            {
                db: db.online,
                table: userQuery.main.table,
                join: ['id', 'userId', { table: userQuery.jx.teams.table }],
            },
        ]

        if (qBatch === true) return batch

        const list = (await mysql.execute(Query.select(db.online, batch)))[0]
        list.forEach((data, i, arr) => arr[i] = new Team(data, { single, hideRawId }))

        return single ? list[0] : list
    }


    static find = async (session, params = {}) => {
        if (!session?.user) return { error: 'Invalid User' }

        const { name, exclude } = params
        if (!name) return { error: 'Invalid Parameters' }

        const match = { name }
        if (exclude?._id) {
            const team = await Team.fetch(session, { _id: exclude._id })
            const id = await team.id()

            match.id = { not: id }
        }

        const data = (await mysql.execute(query.main.select('id', { match })))[0]

        return { found: data.length === 1 }
    }


    static mw = {


        async verify(req, res, next) {
            const { user } = res.session
            const { errKey } = recognizeApi(req)

            if (!user) return throwErr[errKey].auth(res, null, err)
            if (user.unscoped) {
                delete req.session.team
                return next()
            }

            try {
                const { team: _id } = req.session
                if (!_id) return res.redirect('/')
    
                const team = await Team.fetch(res.session, { _id })
    
                const userId = user.id
                const teamId = team.id
                const found = (await mysql.execute(userQuery.jx.teams.select('teamId', {
                    match: { userId, teamId },
                })))[0].length === 1
    
                if (!user.DS && !found) {
                    delete req.session.team
                    return res.redirect('/')
                } else if (team) res.session.team = team

                next()
            } catch (err) {
                const msg = 'Team validation check failed: Server could not process the request'
                throwErr[errKey].server(res, msg, err)
            }
        },


    }


}



export default Team
export { query }