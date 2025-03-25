/* Assets */
import Team from '../../../assets/team.mjs'

const throwErr = require('../../../tools/error').data

const url = '/online/teams'
const errMsg = 'Server Internal Error: Team not found'



export default class {


    static upsert = async (req, res) => {
        try {
            const { _id } = req.body
            delete req.body._id

            let error

            if (_id) {
                const team = await Team.data(res.session, { _id })
                if (!team) return throwErr.server(res, errMsg)
                else {
                    ({ error } = await team.modify(res.session, req.body))
                }
            } else {
                ({ error } = await Team.create(res.session, req.body))
            }

            if (error) return throwErr.server(res, error)

            res.redirect(url)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static upsertProfile = async (req, res) => {
        try {
            const { _id } = req.body
            delete req.body._id

            const team = await Team.data(res.session, { _id })
            const { error } = await team.profileData(res.session, req.body)

            if (error) return throwErr.server(res, error)

            res.redirect(url)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static upsertSettings = async (req, res) => {
        try {
            const { _id } = req.body
            delete req.body._id

            const team = await Team.data(res.session, { _id })
            const { error } = await team.settingsData(res.session, req.body)

            if (error) return throwErr.server(res, error)

            res.redirect(url)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static delete = async (req, res) => {
        try {
            const { _id } = req.body
            const team = await Team.data(res.session, { _id })
            if (!team) return throwErr.server(res, errMsg)

            const { error } = await team.delete(res.session)
            if (error) return throwErr.server(res, error)

            res.redirect(url)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


}