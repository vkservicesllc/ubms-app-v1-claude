// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Driver, { Application, Citation, Accident, Employment } from '../../tools/core/driver.mjs'
import { sortArrayByObjectKey } from '../../../client/global/modules/tools/utils/sorter.mjs'


// ==== SETUP ==== //



// ==== ROUTES ==== //


router.post('/session/team/:_id/switch', User.mw.verify, async (req, res) => {
    try {
        let switched = false
        const { _id } = req.params
        const team = await Team.fetch(res.session, { _id })

        if (team) {
            req.session.team = _id
            switched = true
        }

        res.send(switched)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/login/validation', async (req, res) => {
    try {
        let validated = false
        const { username } = req.body

        const user = await User.fetch(res.session, { username }, { offline: true })
        if (!user) throw new Error('User not found')

        if (user.unscoped) validated = true

        if (!user.DS) {
            const teams = await user.fetch('jx.teams')
            validated = teams.length > 0
        }

        res.send({ validated })
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router