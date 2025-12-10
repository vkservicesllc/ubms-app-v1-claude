/* Settings */
import db, { query } from '../../settings/mysql.mjs'

/* Tools */
import User from './user.mjs'
import Company from './company.mjs'
import Carrier from './carrier.mjs'
import Driver from './driver.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import { classInstance, classStatic } from '../utils/class.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { sortArrayByObjectKey } from '../../../client/global/modules/tools/utils/sorter.mjs'

const mysql = require('../utils/mysql')
const recognizeApi = require('../utils/api')
const sendError = require('../utils/error')



class Team {
    constructor(data = {}, { single = true, session, hideRawId = false, custom = {} } = {}) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Team Data')

        const { offline = false } = custom
        this._id = data._id
        if (!hideRawId) this.id = data.id

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
            users: data.userCount,
        }

        if (single) {
            this.session = session || {}
            this.session.offline = offline


            this.add = (target, bodyOrIds) => classInstance.add(this, new.target, target, bodyOrIds)


            this.fetch = (target, params) => classInstance.fetch(this, new.target, target, params)


            this.update = (targetOrBody, body) => {
                const team = this

                return classInstance.update(this, new.target, targetOrBody, body, {}, {
                    currentData(target, data) {
                        switch (target) {
                            case 'profile':
                                const { profile } = team
                                const { address } = profile
                                delete profile.address

                                data = { ...profile, ...address }
                                break
                        }

                        return data
                    }
                })
            }


            this.delete = (target, matchOrIds) => classInstance.delete(this, new.target, target, matchOrIds)


            this.settings = async body => {
                if (!this.session?.user?.id) throw new Error('Team Constructor Method Error [SETTINGS]: Session user not supplied')

                const { settings = {} } = (await mysql.execute(query.team.main.select('settings', { match: { id: this.id || Team.matchIdHash(this._id) } })))[0][0]

                if (body && typeof body === 'object') {
                    if (!settings.carrier) settings.carrier = {}
                    if (!settings.carrier.application) settings.carrier.application = {}
                    //? More to be added...

                    settings.carrier.application.cdl = Number(body?.carrier?.application?.cdl === 'on')
                    //? More to be added...

                    await this.update({ settings })
                }

                return settings
            }


            this.log = params => classInstance.log(this, new.target, params)
        }
    }

    static #algorithm = 'MD5'
    static hashId = (field = 'id') => hash(field, Team.#algorithm)
    static matchIdHash = value => matchHash(value, Team.#algorithm)
            
    static config = () => ({
        db: db.online,
        query: query.team,
        idProp: 'teamId',
        jxTargets: jxTargets('team'),
        defSorts: [ 'name' ],
        logFile: 'teams',
    })


    static create = (session, body, params) => classStatic.create(this, session, body, params, {
        async find(body, hideRawId) {
            const { name } = body
            const data = await Team.fetch(session, { name }, { hideRawId })

            return { found: !!data, data }
        },
    })


    static fetch = (session, filter, { hideRawId = false, offline = false, sorts = Team.config().defSorts, mode } = {}) => {
        const join = [ 'teamId', 'id' ]

        return classStatic.fetch(this, session, filter, { hideRawId, sorts, mode }, {
            batch: [
                {
                    table: query.team.main.table,
                    fields: [ 'id', Team.hashId(), 'name', 'description' ],
                    group: 'id',
                },
                {
                    table: query.team.profile.table,
                    fields: [
                        'busName', 'coType',
                        { concat: [ [ 'busName', '^, ', 'coType' ], 'company' ] },
                        'phone', 'email', 'website',
                        'address1', 'address2', 'city', 'state', 'zip',
                    ],
                    join,
                },
                {
                    table: query.jx.users_teams.table,
                    fields: { countDist: [ 'userId', 'userCount' ] },
                    join,
                },
                //! No need to use case based counter since jx relationships get deleted if user deleted or upgraded to super admin
                // {
                //     table: query.jx.users_teams.table,
                //     fields: [ { countDist: ['userId', 'userCount', {
                //         case: {
                //             table: query.user.main.table,
                //             match: { deletedBy: null },
                //         },
                //     }] } ],
                //     join,
                // },
                // {
                //     table: query.user.main.table,
                //     join: ['id', 'userId', { table: query.jx.users_teams.table }],
                // },
            ],
            prepare(batch, filter) {
                const {
                    id, _id, name,
                    ids, _ids,
                } = filter
                const single = !!id || !!_id || !!name

                const match = { id, name }
                if (!id) {
                    if (ids) match.id = ids
                    else match.id = Team.matchIdHash(_id || _ids)
                }

                batch[0].match = match

                return { single, batch, custom: { offline } }
            },
        })
    }


    static mw = {


        verify: async (req, res, next) => {
            const api = recognizeApi(req)

            try {
                const { user } = res.session
                if (!user) return sendError.auth(req, res)

                if (user.unscoped || user.DS) {
                    delete req.session.team

                    return next()
                }

                const { team: _id } = req.session
                if (!_id) return res.redirect('/')
    
                const team = await Team.fetch(res.session, { _id })
    
                const userId = user.id
                const teamId = team.id
                const found = (await mysql.execute(query.jx.users_teams.select('teamId', {
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
                sendError.server(req, res, err)
            }
        },


    }


}



function jxTargets(src, target = null) {
    const targets =  {
        team: {
            users: [ query.jx.users_teams, 'userId', User, User.defSort ],
        },
    }[src]

    return target ? targets[target] : targets
}



export default Team