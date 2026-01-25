// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application, Employment } from '../../tools/core/driver.mjs'

/* Validators */
import validationCheck from '../../tools/form/validator.mjs'
import { EmploymentForm } from '../../tools/form/driver.mjs'
import { validateApplicantLogin } from './application.mjs'

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
                violations: Application.list.violation,
                accidents: Application.list.collision,
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


// router.post('/data/application/employer/:_id', async (req, res) => {
//     try {
//         const { _id } = req.params
//         res.json({ data: await Employment.fetch(res.session, { _id }) })
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })


// router.post('/data/application/:formId', async (req, res) => {
//     try {
//         const { formId } = req.params

//         const application = await Application.fetch(res.session, { formId }, { hideRawId: true })
//         if (!application) throw new Error('Application not found')

//         res.json({ data: application })
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })


// router.post('/data/application/:formId/:target', (req, res, next) => {
//     if (!req.session.application) return sendError.auth(req, res)

//     next()
// }, async (req, res) => {
//     try {
//         const { formId, target } = req.params

//         const application = await Application.fetch(res.session, { formId }, { hideRawId: true })
//         if (!application) throw new Error('Application not found')

//         res.json({ data: await application.data(target) })
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })


// router.post('/list/application/:formId/addresses', async (req, res) => {
//     try {
//         const { formId } = req.params
//         const application = await Application.fetch(res.session, { formId })
//         if (!application) throw new Error('Application not found')

//         const addresses = await application.fetch('addresses', { match: { since: { not: application.address.since } } })

//         res.json({ data: addresses })
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })


// router.post('/list/application/:formId/employers', async (req, res) => {
//     try {
//         const { formId } = req.params
//         const application = await Application.fetch(res.session, { formId })
//         if (!application) throw new Error('Application not found')

//         const employers = await Employment.fetch(res.session, { _appId: application._id })

//         res.json({ data: { application, employers } })
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })


// router.post('/list/application/:formId/:target', async (req, res) => {
//     try {
//         const { formId } = req.params
//         const application = await Application.fetch(res.session, { formId })
//         if (!application) throw new Error('Application not found')

//         const { target } = req.params
//         const data = await application.fetch(target)

//         res.json({ data })
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })



// ==== RESOURCE ROUTES ==== //


// router.post('/resource/application/:formId/employer', EmploymentForm.validate(), validationCheck, async (req, res) => {
//     try {
//         const { formId } = req.params
//         const application = await Application.fetch(res.session, { formId })
//         if (!application) throw new Error('Application not found')

//         await application.progress('prev-employer', req.body)

//         res.json({ status: 'OK' })
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })


// router.patch('/resource/application/employer/:_id', async (req, res) => {
//     try {
//         const { _id } = req.params
//         const employer = await Employment.fetch(res.session, { _id }, { hideRawId: false })
//         if (!employer) throw new Error('Employer not found')

//         await employer.update(req.body)

//         res.json({ status: 'OK' })
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })


// router.delete('/resource/application/employer/:_id', async (req, res) => {
//     try {
//         const { _id } = req.params
//         const employer = await Employment.fetch(res.session, { _id }, { hideRawId: false })
//         if (!employer) throw new Error('Employer not found')

//         // const { appId } = employer

//         await employer.delete()

//         // const employers = await Employment.fetch(res.session, { appId })
//         // if (!employers.length) {
//         //     const application = await Application.fetch(res.session, { id: appId })
//         //     if (!application) throw new Error('Application not found')

//         //     await application.update({ prevEmplGaps: null }) //! need to have a universal gap identifier in application like await application.reset('emplGaps')
//         // }

//         res.json({ status: 'OK' })
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })



// ==== EXPORT ==== //

export default router