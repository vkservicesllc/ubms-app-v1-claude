// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application, Employment } from '../../tools/core/driver.mjs'

/* Validators */
import validationCheck from '../../tools/form/validator.mjs'
import { validateApplicantLogin } from './application.mjs'

/* API */
import { sessionDetails } from '../api.mjs'



// ==== ROUTES ==== //


router.post('/local-session/:prop', (req, res, next) => {
    if (req.session.application) return next()

    return sendError.auth(req, res)
}, sessionDetails)


router.post('/login/application/:formId', validateApplicantLogin, async (req, res) => {
    try {
        const { formId } = req.params
        const application = await Application.fetch({ ...res.session, user: true }, { formId }, { hideSensitive: false })
        if (!application) throw new Error('Application not found')

        const { phone, dob, pin } = req.body
        const passed = phone === application.phone && dob === application.dob && pin === application.ssn.slice(-4)

        res.json({ passed })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/resend-pin/application/:formId', async (req, res) => {
    try {
        const { formId } = req.params
        const application = await Application.fetch({ ...res.session, user: true }, { formId })
        if (!application) throw new Error('Application not found')

        await application.pin()

        res.send('OK')
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router