// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application, Citation, Accident, Employment } from '../../tools/core/driver.mjs'

/* Validators */

/* Validators */
import validationCheck from '../../tools/form/validator.mjs'
import { validateApplicantLogin } from './application.mjs'
import { validateApplicantEmployer } from './resource.mjs'

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

    res.json(result)
})


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


router.post('/data/application/employer/:_id', async (req, res) => {
    try {
        const { _id } = req.params
        res.json({ data: await Employment.fetch(res.session, { _id }) })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/data/application/:formId', async (req, res) => {
    try {
        const { formId } = req.params

        const application = await Application.fetch(res.session, { formId }, { hideRawId: true })
        if (!application) throw new Error('Application not found')

        res.json({ data: application })
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

        res.json({ data: await application.data(target) })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/list/application/:formId/addresses', async (req, res) => {
    try {
        const { formId } = req.params
        const application = await Application.fetch(res.session, { formId })
        if (!application) throw new Error('Application not found')

        const addresses = await application.fetch('address.history', { filter: { match: { since: { not: application.address.since } } } })

        res.json({ data: addresses })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/list/application/:formId/employers', async (req, res) => {
    try {
        const { formId } = req.params
        const application = await Application.fetch(res.session, { formId })
        if (!application) throw new Error('Application not found')

        const data = await Employment.fetch(res.session, { _appId: application._id })

        res.json({ data })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/list/application/:formId/:target', async (req, res) => {
    try {
        const { formId } = req.params
        const application = await Application.fetch(res.session, { formId })
        if (!application) throw new Error('Application not found')

        let { target } = req.params
        target = { citations: 'citation', accidents: 'accident' }[target]
        target += '.history'

        const data = await application.fetch(target)

        res.json({ data })
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== RESOURCE ROUTES ==== //


router.post('/resource/application/:formId/employer', validateApplicantEmployer, validationCheck, async (req, res) => {
    try {
        const { formId } = req.params
        const application = await Application.fetch(res.session, { formId }, { hideSensitive: false })
        if (!application) throw new Error('Application not found')

        await application.progress('prev-employer', req.body)

        res.send({ status: 'OK' })
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router