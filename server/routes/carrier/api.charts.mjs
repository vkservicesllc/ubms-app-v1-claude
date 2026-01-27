const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Import: Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Driver, { Application, Employment } from '../../tools/core/driver.mjs'



router.post('/drivers/applications', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        res.send(await Application.chart(res.session, { _teamId: req.session.team }))
    } catch (err) {
        sendError.server(req, res, err)
    }
})



/* Export */
export default router