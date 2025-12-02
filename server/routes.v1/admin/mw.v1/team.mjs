/* Assets */
import Team from '../../../tools/core/team.mjs'

const sendError = require('../../../tools/utils/error')

const url = '/online/teams'
const errMsg = 'Server Internal Error: Team not found'



export default class {


    static upsert = async (req, res) => {
        try {
            const { _id } = req.body
            delete req.body._id

            if (_id) {
                const team = await Team.fetch(res.session, { _id })
                await team.update(req.body)
            } else {
                const team = await Team.create(res.session, req.body)
                if (!team) return sendError.server(res, 'Resource Error: Failed to create team')
            }

            res.redirect(url)
        } catch (err) {
            sendError.server(res, err)
        }
    }


    static upsertProfile = async (req, res) => {
        try {
            const { _id } = req.body
            delete req.body._id

            const team = await Team.fetch(res.session, { _id })
            await team.update(req.body, 'profiles')

            if (error) return sendError.server(res, error)

            res.redirect(url)
        } catch (err) {
            sendError.server(res, err)
        }
    }


    static upsertSettings = async (req, res) => {
        try {
            const { _id } = req.body
            delete req.body._id

            const team = await Team.fetch(res.session, { _id })
            const { error } = await team.settingsData(res.session, req.body)

            if (error) return sendError.server(res, error)

            res.redirect(url)
        } catch (err) {
            sendError.server(res, err)
        }
    }


    static delete = async (req, res) => {
        try {
            const { _id } = req.body
            const team = await Team.fetch(res.session, { _id })
            if (!team) return sendError.server(res, errMsg)

            const { error } = await team.delete(res.session)
            if (error) return sendError.server(res, error)

            res.redirect(url)
        } catch (err) {
            sendError.server(res, err)
        }
    }


}