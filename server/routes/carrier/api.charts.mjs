const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Import: Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Driver, { Application, Employment } from '../../tools/core/driver.mjs'



router.post('/drivers', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        let team, teamId
        if (req.session.team) {
            team = await Team.fetch(res.session, { _id: req.session.team })
            teamId = team.id
        }

        res.send(await Application.chart(res.session, { teamId }))
    } catch (err) {
        sendError.server(req, res, err)
    }
})



/* Export */
export default router