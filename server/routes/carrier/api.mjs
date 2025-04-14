const router = require('express').Router()
const throwErr = require('../../tools/utils/error').api

/* Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'



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



router.post('/team/companies', User.verify, Team.verify, async (req, res) => {
    try {
        const { applied: companies } = (await res.session.team.data(res.session, 'companies')).companies

        res.send(companies)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})




router.post('/drivers/application/:_id', User.verify, Team.verify, async (req, res) => {
    try {
        const { _id } = req.params

        const data = await Application.data(res.session, { _id })
        if (!data) return res.send({ error: 'Internal Server Error: Applicant not found' })

        res.send({ data, log: await data.log() })
    } catch (err) {
        throwErr.server(res, null, err)
    }
})

router.post('/drivers/applications', User.verify, Team.verify, Application.dtList)

router.post('/drivers/applications/filters', User.verify, Team.verify, async (req, res) => {
    try {
        const settings = await res.session.user.settings(res.session)
        const { teamCompanies } = settings?.carrier || {}
        const filter = { companies: {}, users: {} }

        if (teamCompanies && teamCompanies.includes('e'))
            filter.companies.excluded = true

        res.send({
            companies: await Application.companies(res.session, filter.companies),
            users: await Application.users(res.session, filter.users)
        })
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router