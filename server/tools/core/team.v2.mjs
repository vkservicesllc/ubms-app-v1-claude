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
const sendError = require('../utils/error')



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

                res.session.team = team
                next()
            } catch (err) {
                sendError.server(res, err, api)
            }
        },


    }


}



export default Team