const router = require('express').Router()
const throwErr = require('../../tools/utils/error').api

/* Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'
import { sortArrayByObjectKey } from '../../../client/global/modules/tools/utils/sorter.mjs'



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



// router.post('/team/companies', User.verify, Team.verify, async (req, res) => {
//     try {
//         const { applied: companies } = (await res.session.team.data(res.session, 'companies')).companies

//         res.send(companies)
//     } catch (err) {
//         throwErr.server(res, null, err)
//     }
// })

router.post('/carriers', User.verify, Team.verify, (req, res) => {
    try {
        res.send(res.session.companies)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})

router.post('/teams', User.verify, Team.verify, async (req, res) => {
    try {
        const teams = await Team.list(res.session)
        let data = []

        teams.forEach(team => {
            const { _id, name } = team
            data.push({ _id, name })
        })
        data = sortArrayByObjectKey(data, 'name')

        res.send(data)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})




router.post('/drivers/application/:_id', User.verify, Team.verify, async (req, res) => {
    try {
        const { _id } = req.params

        const application = await Application.data(res.session, { _id })
        if (!application) return res.send({ error: 'Internal Server Error: Applicant not found' })

        const driver = await Driver.data(res.session, { _id: application._driverId })
        if (!driver) return res.send({ error: 'Internal Server Error: Driver not found' })

        const { formId } = application
        const { applications, count } = await driver.applications(res.session)
        const { unmatchedIdx } = applications.filter(application => application.formId === formId)[0]

        const identity = await application.identity(res.session)
        const log = await application.log()

        res.send({ data: { application, identity, count, unmatchedIdx, log } })
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


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


router.post('/drivers/applications/:archived?', User.verify, Team.verify, Application.dtList)


router.post('/drivers/charts', User.verify, Team.verify, async (req, res) => {
    try {
        let team, teamId
        if (req.session.team) {
            team = await Team.data(res.session, { _id: req.session.team })
            teamId = await team.id()
        }

        res.send(await Application.charts(res.session, { teamId }))
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/drivers/:blacklisted?', User.verify, Team.verify, Driver.dtList)



export default router