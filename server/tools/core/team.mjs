/* Settings */
import db from '../../settings/mysql.mjs'

/* Tools */
import User, { query as userQuery } from './user.mjs'
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


const query = {
    team : {
        main: new Query(db.online, 'teams'),
        profile: new Query(db.online, 'team_profiles'),
    },
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

        if (single && !hideRawId) {
            this.session = session

        }
    }

    static #algorithm = 'MD5'
    static hashId = (field = 'id') => hash(field, Team.#algorithm)
    static matchIdHash = value => matchHash(value, Team.#algorithm)
            
    static config = () => ({
        query: query.team,
        idProp: 'teamId',
        jxTargets: jxTargets('team'),
        defSorts: [ 'name' ],
        logFile: 'teams',
    })


    static mw = {


        verify: async (req, res, next) => {
            const api = recognizeApi(req)

            try {
                const { user } = res.session
                if (!user) return sendError.auth(req, res)

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
                sendError.server(req, res, err)
            }
        },


    }


}



function jxTargets(src, target = null) {
    const targets =  {
        team: {
            users: [ userQuery.jx.teams, 'userId', User, User.defSort ],
        },
    }[src]

    return target ? targets[target] : targets
}



export default Team
export { query, jxTargets }