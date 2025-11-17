/* Settings */
import db from '../../settings/mysql.mjs'

/* Tools */
import User, { query as userQuery } from './user.mjs'
import Company from './company.mjs'
import Carrier from './carrier.mjs'
import Driver from './driver.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import recognizeApi from '../utils/api.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { sortArrayByObjectKey } from '../../../client/global/modules/tools/utils/sorter.mjs'

const mysql = require('../utils/mysql')
const sendError = require('../utils/error')


const query = {
    main: new Query(db.online, 'teams'),
    profiles: new Query(db.online, 'team_profiles'),
}



class Team {
    constructor(data = {}, { single = true, session, hideRawId = false } = {}) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Team Data')

        this._id = data._id
        if (!hideRawId) this.id = data.id

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


            this.add = async (target, ids = []) => {
                if (!this.session?.user?.id) throw new Error('Team Add Error: No session user')
                if (!target) throw new Error('Team Add Error: Target not supplied')
                if (!this.id) throw new Error('Team Add Error: Personal ID is missing')

                const targets = relTargets('main', target)
                if (!Object.keys(targets).includes(target)) throw new Error('Team Add Error: Invalid target supplied')

                const data = []
                const [ Src, idProp, queryInst ] = targets
                const list = await Src.fetch(this.session, { ids })

                list.map(item => data.push({
                    teamId: this.id,
                    [idProp]: item.id,
                    createdBy: session.user.id,
                }))

                const [ result ] = await mysql.execute(queryInst.insert(data))

                return result.affectedRows > 0
            }


            this.fetch = async (target, { hideRawId = false, sorts = null, idsOnly = false } = {}) => {
                if (!this.session?.user?.id) throw new Error('Team Fetch Error: No session user')
                if (!target) throw new Error('Team Fetch Error: Target not supplied')

                const targets = relTargets('main', target)
                if (!Object.keys(targets).includes(target)) throw new Error('Team Fetch Error: Invalid target supplied')

                const [ Src, idProp, queryInst, defSorts ] = targets
                if (!sorts) sorts = defSorts

                const ids = []
                const [ rows ] = await mysql.execute(queryInst.select(idProp, {
                    match: { teamId: this.id || Team.matchIdHash(this._id) },
                }))

                rows.map(row => ids.push(row[idProp]))

                return idsOnly ? ids : await Src.fetch(this.session, { ids }, { hideRawId, sorts })
            }


            this.update = async (body, queryProp = 'main') => {
                if (!this.session?.user?.id) throw new Error('Team Update Error: Session user not found')

                const idProp = queryProp === 'main' ? 'id' : 'teamId'
                const modifiedBy = sessionUser.id
                const currentUpdateLog = await this.log('updateLog', queryProp)

                if (queryProp === 'main') {
                    const { settings } = body
                    delete body.settings
                    
                    body = processData(body, { modifiedBy, currentData: this, currentUpdateLog })
                    if (settings) body.settings = JSON.stringify(settings)
                } else {
                    let currentData

                    switch (queryProp) {

                        case 'profiles':
                            if (!this.profile) return false

                            currentData = { ...this.profile, ...this.profile.address }
                            break

                    }

                    body = processData(body, { modifiedBy, currentData, currentUpdateLog })
                }

                const [ result ] = await mysql.execute(query[queryProp].update(body, { [idProp]: this.id || Team.matchIdHash(this._id) }))

                return result.affectedRows > 0
            }


            this.delete = async (target, ids = []) => {
                if (!this.session?.user?.id) throw new Error('Team Delete Error: Session user not found')

                const targets = relTargets('main', target)

                if (!target) {
                    const log = await this.log()

                    const [ result ] = await mysql.execute(query.main.delete({ id: this.id || Team.matchIdHash(this._id) }))
                    if (!result.affectedRows) return false

                    for (const prop in log) this[prop] = log[prop]
                    await logDeletion(session, 'teams', this, { id })

                    return true
                } else if (Object.keys(targets).includes(target) && ids.length) {
                    const idProp = targets[1]
                    const queryInst = targets[2]

                    const [ result ] = await mysql.execute(queryInst.delete({ [idProp]: ids }))

                    return result.affectedRows > 0
                }
            }


            this.log = async (field, queryProp = 'main') => {
                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]
                const idProp = queryProp === 'main' ? 'id' : 'teamId'

                let log = (await mysql.execute(query[queryProp].select(fields, {
                    match: { [idProp]: this.id || Team.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }
        }
    }

    static #algorithm = 'MD5'
    static hashId = (field = 'id') => hash(field, Team.#algorithm)
    static matchIdHash = value => matchHash(value, Team.#algorithm)

    static defSorts = [ 'name' ]


    static create = async ({ user: sessionUser = {} }, body = {}) => {
        if (!sessionUser.id) throw new Error('Team Create Error: No session user')

        body = processData(body)

        const { name } = body
        if (await Team.fetch({ sessionUser }, { name })) return

        body.createdBy = sessionUser.id

        const [ result ] = await mysql.execute(query.main.insert(body))
        const id = result.insertId

        if (!id) throw new Error('DB Error: Failed to create team')

        const team = await Team.fetch({ sessionUser }, { id })
        if (!team) throw new Error('Fetch Error: New team not found')

        return team
    }


    static fetch = async ({ user: sessionUser = {} }, filter = {}, { hideRawId = false, sorts = Team.defSorts, mode = 'data' } = {}) => {
        if (!sessionUser.id) throw new Error('Team Fetch Error: No session user')

        const {
            id, _id, name,
            ids, _ids,
        } = filter
        const single = id || _id || name

        const match = { id, name }
        if (!id) {
            if (ids) match.id = ids
            else match.id = Team.matchIdHash(_id || _ids)
        }

        const join = [ 'teamId', 'id' ]
        const batch = [
            {
                table: query.main.table,
                fields: [ 'id', Team.hashId(), 'name', 'description', 'settings' ],
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
                        table: userQuery.main.table,
                        match: { deletedBy: null },
                    },
                }] } ],
                join,
            },
            {
                table: userQuery.main.table,
                join: ['id', 'userId', { table: userQuery.jx.teams.table }],
            },
        ]

        if (!single && Array.isArray(sorts))
            sorts.forEach((sort, i) => { if (sort) batch[i].sort = sort })

        if (mode === 'batch') return batch

        const queryStr = Query.select(db.online, batch)
        if (mode === 'query') return queryStr

        const session = { user: { id: sessionUser.id } }
        const list = (await mysql.execute(queryStr))[0]
        list.forEach((data, i, arr) => arr[i] = new Team(data, { single, session, hideRawId }))

        return single ? list[0] : list
    }


    static mw = {


        verify: async (req, res, next) => {
            const api = recognizeApi(req)

            try {
                const { user } = res.session
                if (!user) return sendError.auth(res, null, api)

                if (user.unscoped) {
                    delete req.session.team

                    return next()
                }

                const { team: _id } = req.session
                if (!_id) return res.redirect('/')
    
                const team = await Team.fetch(res.session, { _id })
    
                const userId = user.id
                const teamId = team.id
                const found = (await mysql.execute(userQuery.jx.teams.select('teamId', {
                    match: { userId, teamId },
                })))[0].length === 1
    
                if ((!user.DS && !found) || !team) {
                    delete req.session.team

                    return res.redirect('/')
                }

                team.session = { user: { id: user.id } }

                res.session.team = team
                next()
            } catch (err) {
                sendError.server(res, err, api)
            }
        },


    }


}



function relTargets(src, target = null) {
    const targets =  {
        main: {
            users: [ User, 'userId', userQuery.jx.teams, User.defSort ],
        },
    }[src]

    return target ? targets[target] : targets
}



export default Team
export { query, relTargets }