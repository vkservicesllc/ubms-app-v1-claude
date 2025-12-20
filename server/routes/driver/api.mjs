// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application, Citation, Accident } from '../../tools/core/driver.mjs'

/* Validators */
import { validateApplicantLogin } from './resource.mjs'

/* API */
import { sessionDetails } from '../api.mjs'



// ==== ROUTES ==== //


router.post('/local-session/:prop', (req, res, next) => {
    if (req.session.application) return next()

    return sendError.auth(req, res)
}, sessionDetails)


router.post('/local-source/:source', (req, res) => {
    const { filter } = req.query
    const { source } = req.params

    let result

    switch (source) {
        case 'application':
            result = {
                violations: Citation.list.violation,
                accidents: Accident.list.collision,
            }
            break
    }

    if (filter) result = result[filter]

    res.send(result)
})


router.post('/login/application/:formId', validateApplicantLogin, async (req, res) => {
    try {
        const { formId } = req.params
        const application = await Application.fetch({ ...res.session, user: true }, { formId })
        if (!application) throw new Error('Application not found')

        const { phone, dob, pin } = req.body
        let passed = false

        if (phone === application.phone && dob === application.dob && pin === application.ssn.slice(-4))
            passed = true

        res.send({ passed })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/data/application/:formId', async (req, res) => {
    try {
        const { formId } = req.params

        const application = await Application.fetch(res.session, { formId }, { hideRawId: true })
        if (!application) throw new Error('Application not found')

        res.send({ data: application })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/data/application/:formId/:target', (req, res, next) => {
    if (!req.session.application) return sendError.auth(req, res)

    next()
}, async (req, res) => {
    try {
        const { formId, target } = req.params

        const application = await Application.fetch(res.session, { formId }, { hideRawId: true })
        if (!application) throw new Error('Application not found')

        res.send({ data: await application.data(target) })
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router