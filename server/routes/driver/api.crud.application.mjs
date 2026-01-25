const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Import: Tools */
import Driver, { Application, Employment } from '../../tools/core/driver.mjs'

/* Import: Validators */
import validationCheck from '../../tools/form/validator.mjs'
import { ApplicationForm, EmploymentForm } from '../../tools/form/driver.mjs'
import { validateApplicantLogin } from './application.mjs'



//* GET *//


const hideRawId = true


router.get('/:formId/:target?/:_id?', async (req, res) => {
    try {
        const { formId, target, _id } = req.params
        const application = await Application.fetch(res.session, { formId }, { hideRawId: true, hideSensitive: true })
        if (!application) throw new Error('Application not found')

        if (!target) return res.json({ data: application })

        if (!req.session.application) return sendError.auth(req, res)

        if (target === 'employers')
            return res.json({
                data: await Employment.fetch(res.session, { _appId: application._id, _id }),
                resource: application,
            })

        const match = { _id }
        if (target === 'addresses') match.since = { not: application.address.since }

        res.json({ data: await application.fetch(target, { match }), resource: application })
    } catch (err) {
        sendError.server(req, res, err)
    }
})



/* Export */
export default router