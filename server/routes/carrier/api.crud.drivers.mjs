const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Import: Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'



//* GET *//


router.get('/applications', User.mw.verify, Team.mw.verify, Application.mw.dtList)


router.get('/applicants', User.mw.verify, Team.mw.verify, Driver.mw.dtList)


router.get('/applications/:_id', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { _id } = req.params
        const { sensitive = 'false' } = req.query
        const params = { hideRawId: true }
        if (sensitive === 'true') params.hideSensitive = false

        const application = await Application.fetch(res.session, { _id }, params)
        if (!application) throw new Error('Application not found')

        const driver = await Driver.fetch(res.session, { _id: application._driverId })
        if (!driver) throw new Error('Driver not found')

        const { formId } = application
        const identity = await application.identity()
        const log = await application.log()

        const applications = await driver.fetch('application.history')
        const count = applications.length
        const { unmatchedIdx } = applications.filter(application => application.formId === formId)[0]

        res.json({ data: { application, identity, count, unmatchedIdx, log } })
    } catch (err) {
        sendError.server(req, res, err)
    }
})



/* Export */
export default router