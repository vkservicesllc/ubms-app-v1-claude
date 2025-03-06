const router = require('express').Router()
const throwErr = require('../../tools/error').api

/* Assets */
import User from '../../assets/user.mjs'
import Team from '../../assets/team.mjs'
import Driver, { Application } from '../../assets/driver.mjs'



router.post('/session/team/:_id/switch', User.verify, async (req, res) => {
    try {
        let switched = false
        const { _id } = req.params
        const team = await Team.data(res.session, { _id })

        if (team) {
            req.session.team = _id
            switched = true
        }

        res.send(switched)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})




router.post('/drivers/applications', User.verify, Team.verify, Application.dtList)

router.get('/drivers/applications/companies', User.verify, Team.verify, async (req, res) => {
    try {
        const settings = await res.session.user.settings(res.session)
        const { teamCompanies } = settings?.carrier || {}
        const filter = {}

        if (teamCompanies && teamCompanies.includes('e'))
            filter.excluded = true

        res.send(await Application.companies(res.session, filter))
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router