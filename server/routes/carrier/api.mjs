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

        if (user.unscoped || user.DS) validated = true
        else {
            const teams = await user.fetch('jx.teams')
            validated = teams.length > 0
        }

        res.send({ validated })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


// ==== ROUTES ==== //


router.post('/lists', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { filter, priv } = req.query
        let response = { users: [], teams: [], carriers: [] }

        if (filter)
            switch(filter) {

                case 'driver-applications':
                    response = await Application.assigned(res.session)
                    break

            }

        //* filter === "driver-applications"
        // users: filter application by their conditions and where user not null and make unique list of users
        // carriers: filter applications by their conditions and where carriers not null and exclude carriers not in self jx relationship

        // users: all users
        // user in team: filter by specific team
        // user by priv: filter by specific permissions

        //* sessionUser.DS === true
        // carriers: all carrier by category 'crr'
        //* sessionUser.DS !== true
        // carriers in sessionUser jx relationships

        res.json(response)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


// ==== DRIVERS ROUTES ==== //


router.post('/drivers/dt-list/applications/:archived?', User.mw.verify, Team.mw.verify, Application.mw.dtList)


router.post('/data/drivers/application/:_id/:target?', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { _id, target } = req.params

        const application = await Application.fetch(res.session, { _id })
        if (!application) throw new Error('Application not found')

        if (target) {
            return res.json({})
        }

        res.json({ data: { application } })

        // if (!target) {
        //     const driver = await Driver.fetch(res.session, { _id: application._driverId })
        //     if (!driver) throw new Error('Applicant not found')

        //     const { formId } = application
        //     const { applications, count } = await driver.applications(res.session)
        //     const { unmatchedIdx } = applications.filter(application => application.formId === formId)[0]

        //     const identity = await application.identity(res.session)
        //     const log = await application.log()

        //     res.send({ data: { application, identity, count, unmatchedIdx, log } })
        // } else {
        //     let Src

        //     switch (target) {
        //         case 'addresses':
        //             return res.send(await application.data(target, res.session))
        //             break
        //         case 'citations':
        //             Src = Citation
        //             break
        //         case 'accidents':
        //             Src = Accident
        //             break
        //         case 'employments':
        //             Src = Employment
        //             break
        //     }

        //     res.send({ data: await Src.list(res.session, { _aplId: application._id }) })
        // }
    } catch (err) {
        sendError.server(res, err, true)
    }
})


router.delete('/data/drivers/application/:_id', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { _id } = req.params
        const application = await Application.fetch(res.session, { _id })
        if (!application) throw new Error('Application not found')

        const { deleted } = await application.delete()

        res.json({ deleted })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


// ==== EXPORT ==== //

export default router