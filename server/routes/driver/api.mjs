const router = require('express').Router()
const throwErr = require('../../tools/utils/error').api

/* Tools */
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'

/* Validators */
import { validateApplicantLogin } from './resource.mjs'

/* API */
import { sessionDetails } from '../api.mjs'



router.post('/local-session/:prop', (req, res, next) => {
    if (req.session.application) return next()

    return throwErr.auth(res)
}, sessionDetails)


router.post('/local-source/:source', (req, res) => {
    const { filter } = req.query
    const { source } = req.params

    let result

    switch (source) {
        case 'application':
            result = {
                citations: Application.citationList,
            }
            break
    }

    if (filter) result = result[filter]

    res.send(result)
})


router.post('/application/login/:formId', validateApplicantLogin, async (req, res) => {
    try {
        const { formId } = req.params
        const application = await Application.data({ ...res.session, user: true }, { formId })
        if (!application) return throwErr.server(res, 'Server Internal Error: Unidentified Application')

        const { phone, dob, pin } = req.body
        let passed = false

        if (phone == application.phone && dob == application.dob && pin == application.ssn.slice(-4))
            passed = true

        res.send({ passed })
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/application/:formId/:target', (req, res, next) => {
    if (!req.session.application) return throwErr.auth(res)

    next()
}, async (req, res) => {
    const { formId, target } = req.params

    const application = await Application.data(res.session, { formId })
    if (!application) return res.send({ error: 'DB Error: Application not found' })

    res.send({ data: (await application.data(target, { ...res.session, user: true })).data })
})



export default router