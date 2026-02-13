/* Settings */
import db from '../../../settings/mysql.mjs'

/* Tools */
import Driver, { Application } from '../../../tools/core/driver.mjs'
import Team from '../../../tools/core/team.mjs'
import User from '../../../tools/core/user.mjs'
import Carrier from '../../../tools/core/carrier.mjs'
import Individual from '../../../tools/core/individual.mjs'
import Query from '../../../tools/utils/query.mjs'
import { utc2tz } from '../../../tools/utils/date.mjs'

const sendError = require('../../../tools/utils/error')



export const dtDriverList = async (req, res) => {
    try {
        const sessionUser = res.session.user
        const { DS, unscoped } = sessionUser
        const permissions = await sessionUser.permissions() || {}

        if (!DS && !('d:drv/apl' in permissions)) return sendError.auth(req, res)

        let team, teamId
        if (req.session.team) {
            team = await Team.fetch(res.session, { _id: req.session.team })
            teamId = team.id
        }

        const { draw, start, length, search, filter = {} } = req.body

        filter.teamId = teamId


        const limit = [ start, length ]
        filter.search = search

        const data = await Driver.fetch(res.session, filter, { limit })
        const recordsFiltered = data.length
        const recordsTotal = await Driver.count(res.session, filter)

        res.json({
            draw,
            recordsTotal,
            recordsFiltered,
            data,
            //! add more if needed
        })
    } catch (err) {
        sendError.server(req, res, err)
    }
}



export const dtApplicationList = async (req, res) => {
    try {
        const sessionUser = res.session.user
        const { DS, unscoped } = sessionUser
        const permissions = await sessionUser.permissions() || {}

        if (!DS && !('d:drv/apl' in permissions)) return sendError.auth(req, res)

        let team, teamId
        if (req.session.team) {
            team = await Team.fetch(res.session, { _id: req.session.team })
            teamId = team.id
        }

        const { draw, start, length, search, filter = {} } = req.body
        let { archived } = req.query
        archived = archived === 'true'
        //* As of Archived it is never unfiltered

        filter.teamId = teamId
        filter.archived = archived


        const limit = [ start, length ]
        filter.search = search

        const data = await Application.fetch(res.session, filter, { limit })
        const recordsFiltered = data.length
        const recordsTotal = await Application.count(res.session, filter)

        res.json({
            draw,
            recordsTotal,
            recordsFiltered,
            data,
            actions: {
                data: {
                    comment: DS || permissions?.['d:drv/apl'].includes('1'),
                    create: DS || permissions?.['d:drv/apl'].includes('2'),
                    modify: DS || permissions?.['d:drv/apl'].includes('3'),
                    delete: DS || permissions?.['d:drv/apl'].includes('5'),
                },
                file: {
                    access: Object.keys(permissions).some(key => key.startsWith('f:drv')),
                },
            },
            aplAddress: `${res.hbs.addrBook.driver}/application/`,
            unscoped,
            stepLen: Application.list.step.length,
            sessionUser: {
                _id: sessionUser._id,
                DS: sessionUser.DS,
            },
        })
    } catch (err) {
        sendError.server(req, res, err)
    }
}