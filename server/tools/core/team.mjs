/* Settings */
import db from '../../settings/mysql.mjs'

/* Tools */
import User from './user.mjs'
import Company from './company.mjs'
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
    teams: new Query(db.business, 'teams'),
    profiles: new Query(db.business, 'team_profiles'),
    companies: new Query(db.business, 'teams_companies'),
    users: new Query(db.business, 'teams_users'),
}



class Team {
    constructor(data = {}, light = false) {
        this._id = data._id
        this.catId = data.catId
        this.name = data.name
        this.description = data.description
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
            companies: data.companyCount,
            users: data.userCount,
        }
        this.settings = data.settings?.[this.catId] || null

        if (!light) {

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


            this.id = async () => (await mysql.execute(query.teams.select('id', {
                match: { id: Team.matchIdHash(this._id) },
            })))[0][0].id


            this.log = async (field, target) => {
                if (!['teams', 'profiles'].includes(target)) target = 'teams'

                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]
                const idProp = target === 'teams' ? 'id' : 'teamId'

                let log = (await mysql.execute(query[target].select(fields, {
                    match: { [idProp]: Team.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }


            this.ids = async (session, type) => {
                if (!session.user) return

                const teamId = await this.id()
                let data = [], batch = []

                switch (type) {

                    case 'companies':
                        const { catId } = this

                        batch = [
                            {
                                table: 'teams_companies',
                                match: { teamId },
                            },
                            {
                                table: 'companies',
                                fields: 'id',
                                join: [ 'id', 'companyId' ],
                                match: { catId },
                            },
                        ]

                        break

                }

                data = (await mysql.execute(Query.select(db.business, batch)))[0]
                data = data.map(row => row.id)

                return data
            }


            this.data = async (session, type) => {
                if (!session?.user) return

                const teamId = await this.id()
                const data = {
                    [type]: { all: [], available: [], applied: [] },
                }
                const appliedIds = []
                let batch

                switch (type) {

                    case 'companies':
                        const { catId } = this
                        const companies = await Company.list(session, { catId, confirmed: true })

                        batch = [
                            {
                                table: 'teams_companies',
                                match: { teamId },
                            },
                            {
                                table: 'companies',
                                fields: Company.hashId(),
                                join: [ 'id', 'companyId' ],
                                match: { catId },
                            },
                            {
                                table: 'company_names',
                                fields: [
                                    { concat: [ [ 'busName', '^, ', 'coType' ], 'name' ] },
                                    { route: [ [ 'busName', 'coType' ] ] },
                                ],
                                join: [ 'companyId', 'id', 1 ],
                            },
                        ]

                        data[type].applied = (await mysql.execute(Query.select(db.business, batch)))[0]
                        data[type].applied.forEach(company => appliedIds.push(company._id))

                        companies.map((company, i) => {
                            const { _id, name } = company

                            data[type].all.push({ _id, name, applied: false })
                            if (appliedIds.includes(_id)) data[type].all[i].applied = true
                            else data[type].available.push({ _id, name })
                        })
                        break

                    case 'users':
                        const status = [ 'U', 'A' ]
                        const users = await User.list(session, { status })

                        batch = [
                            {
                                table: 'teams_users',
                                match: { teamId },
                            },
                            {
                                db: db.online,
                                table: 'users',
                                fields: [ User.hashId(), 'firstName', 'lastName', 'alias', 'email' ],
                                join: [ 'id', 'userId' ],
                                match: { status },
                            },
                        ]

                        data[type].applied = (await mysql.execute(Query.select(db.business, batch)))[0]
                        data[type].applied.forEach(user => {
                            user = new User(user)
                            user = {
                                _id: user._id,
                                name: user.name,
                                desc: user.email,
                            }

                            appliedIds.push(user._id)
                        })

                        users.map((user, i) => {
                            const { _id, name, email } = user

                            data[type].all.push({ _id, name, desc: email, applied: false })
                            if (appliedIds.includes(_id)) data[type].all[i].applied = true
                            else data[type].available.push({ _id, name, desc: email })
                        })
                        break

                }

                data[type].all = sortArrayByObjectKey(data[type].all, 'name')
                data[type].applied = sortArrayByObjectKey(data[type].applied, 'name')
                data[type].available = sortArrayByObjectKey(data[type].available, 'name')

                return data
            }


            this.profileData = async (session, data) => {
                let error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { error }

                const userId = await session.user.id()
                const teamId = await this.id()

                if (!this.profile) {
                    data = processData(data)
                    data.teamId = teamId
                    data.createdBy = userId

                    const [ result ] = await mysql.execute(query.profiles.insert(data))
                    if (result.affectedRows !== 1) error = 'DB Error: Could not create Team Profile'
                } else {
                    const { profile } = this
                    const { address1, address2, city, state, zip } = profile.address
                    profile.address1 = address1
                    profile.address2 = address2
                    profile.city = city
                    profile.state = state[0]
                    profile.zip = zip

                    data = processData(data, {
                        modifiedBy: userId,
                        currentData: this.profile,
                        currentUpdateLog: await this.log('updateLog', 'profiles'),
                    })

                    if (Object.keys(data).length) {
                        try {
                            const [ result ] = await mysql.execute(query.profiles.update(data, { teamId }))
                            if (result.affectedRows !== 1) error = 'DB Error: Could not update Team Profile'
                        } catch (err) {
                            error = 'DB Error'
                        }
                    }
                }

                return { error, data: await Team.data(session, { id: teamId }) }
            }


            this.settingsData = async (session, data) => {
                let error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { error }

                const id = await this.id()
                let settings = (await mysql.execute(query.teams.select('settings', {
                    match: { id },
                })))[0][0].settings || {}

                switch (this.catId) {
                    case 'crr':
                        data[this.catId].drivers.cdl = data[this.catId].drivers.cdl
                            ? true
                            : false
                        break
                }

                settings[this.catId] = data[this.catId]
                console.log(settings)
                settings = JSON.stringify(settings)

                try {
                    const [ result ] = await mysql.execute(query.teams.update({ settings }, { id }))
                } catch (err) {
                    error = 'DB Error'
                }

                return { error, data: await Team.data(session, { id }) }
            }


            this.manage = async (session, target, action, _relId) => {
                let modified = false, error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { modified, error }

                const types = {
                    users: { idProp: 'userId', Src: User },
                    companies: { idProp: 'companyId', Src: Company },
                }
                const { idProp, Src } = types[target]
                const teamId = await this.id()
                const src = await Src.data(session, { _id: _relId })
                const data = { teamId, [idProp]: await src.id() }

                switch (action) {
                    case '+':
                        data.createdBy = await session.user.id()
                        action = 'insert'
                        break
                    case '-':
                        action = 'delete'
                        break
                }

                const [ result ] = await mysql.execute(query[target][action](data))
                if (result.affectedRows > 0) modified = true
                else error = `DB Error: Failed to ${action} data`

                return { modified, error }
            }


            this.modify = async (session, data) => {
                let modified = false, error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { modified, error }

                if (this.count.companies) delete data.catId

                const id = await this.id()
                data = processData(data, {
                    modifiedBy: await session.user.id(),
                    currentData: this,
                    currentUpdateLog: await this.log('updateLog'),
                })

                try {
                    const [ result ] = await mysql.execute(query.teams.update(data, { id }))
                    if (result.affectedRows === 1) modified = true
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

        const join = [ 'teamId', 'id' ]
        const batch = [
            {
                table: 'teams',
                fields: [ Team.hashId(), 'catId', 'name', 'description', 'settings' ],
                match,
                group: 'id',
            },
            {
                table: 'team_profiles',
                fields: [
                    'busName', 'coType',
                    { concat: [ [ 'busName', '^, ', 'coType' ], 'company' ] },
                    'phone', 'email', 'website',
                    'address1', 'address2', 'city', 'state', 'zip',
                ],
                join,
            },
            {
                table: 'teams_companies',
                fields: [ { countDist: [ 'companyId', 'companyCount' ] } ],
                join,
            },
            {
                table: 'teams_users',
                fields: [ { countDist: [ 'userId', 'userCount' ] } ],
                join,
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


    static find = async (session, params = {}) => {
        if (!session?.user) return { error: 'Invalid User' }

        const { name, exclude } = params
        if (!name) return { error: 'Invalid Parameters' }

        const match = { name }
        if (exclude?._id) {
            const team = await Team.data(session, { _id: exclude._id })
            const id = await team.id()

            match.not = { id }
        }

        const data = (await mysql.execute(query.teams.select('id', { match })))[0]

        return { found: data.length === 1 }
    }



    /* Middleware */


    static verify = async (req, res, next) => {
        const { user } = res.session
        const { errKey } = recognizeApi(req)

        if (!user) return throwErr[errKey].auth(res, null, err)

        try {
            const { team: _id } = req.session
            if (!_id) return res.redirect('/')

            const team = await Team.data(res.session, { _id })

            const userId = await user.id()
            const teamId = await team.id()
            const found = (await mysql.execute(query.users.select('teamId', {
                match: { userId, teamId },
            })))[0].length === 1

            if (!user.DS && !found) {
                delete req.session.team
                return res.redirect('/')
            } else
                if (team) res.session.team = team

            next()
        } catch (err) {
            const msg = 'Team validation check failed: Server could not process the request'
            throwErr[errKey].server(res, msg, err)
        }
    }


}



export default Team