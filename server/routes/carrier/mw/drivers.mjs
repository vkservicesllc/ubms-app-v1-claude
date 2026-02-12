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



export const dtDriverList = async (req, res) => {
    try {} catch (err) {
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

        //* Params and Filters

        const { draw, start, length, columns, search, filter } = req.body
        let { archived } = req.query
        archived = archived === 'true'
        //* As of Archived it is never unfiltered

        const searchableColumns = columns
            .filter(column => column.data && column.data !== 'function' && column.searchable === 'true')
            .map(column => column.data)

        const limit = [ start, length ]

        //! Complication based on LIKE search
        //! THE SEARCH IS TEMPORARY UNAVAILABLE

        //

    } catch (err) {
        sendError.server(req, res, err)
    }
}