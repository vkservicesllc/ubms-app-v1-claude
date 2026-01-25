const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Import: Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Driver, { Application, Employment } from '../../tools/core/driver.mjs'

/* Middleware */
import { dtDriverList, dtApplicationList } from './mw/drivers.mjs'



//* POST QUERY (DataTable Server-Side) *//


router.post('/applications/query', User.mw.verify, Team.mw.verify, dtApplicationList)


router.post('/applicants/query', User.mw.verify, Team.mw.verify, dtDriverList)



//* GET *//

const hideRawId = true


router.get('/applications/prev-employments', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const _teamId = res.session?.team?._id

        res.json({ data: await Employment.fetch(res.session, { condition: 'c', _teamId }, { hideRawId }) })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/applications/:_id', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { _id } = req.params
        const { sensitive = 'false' } = req.query
        const params = { hideRawId }
        if (sensitive === 'true') params.hideSensitive = false

        const application = await Application.fetch(res.session, { _id }, params)
        if (!application) throw new Error('Application not found')

        const driver = await Driver.fetch(res.session, { _id: application._driverId })
        if (!driver) throw new Error('Driver not found')

        const { formId } = application
        const identity = await application.identity()
        const log = await application.log()

        const applications = await Application.fetch(res.session, { driverId: driver.id }) // await driver.fetch('application.history')
        const count = applications.length
        const { unmatchedIdx } = applications.filter(application => application.formId === formId)[0]

        res.json({ data: { application, identity, count, unmatchedIdx, log } })
    } catch (err) {
        sendError.server(req, res, err)
    }
})



//* DELETE *//


router.delete('/applications/:_id', User.mw.verify, Team.mw.verify, async (req, res) => {
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



/* Export */
export default router