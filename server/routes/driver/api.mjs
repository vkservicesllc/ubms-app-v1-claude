const router = require('express').Router()
const throwErr = require('../../tools/utils/error').api

/* Tools */
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'

/* Validators */
import { validateApplicantLogin } from '../../validators/driver.mjs'



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



export default router