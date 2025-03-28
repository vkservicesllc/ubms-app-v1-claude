const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assests */
import Team from '../../assets/team.mjs'
import Carrier from '../../assets/carrier.mjs'
import Driver, { Application } from '../../assets/driver.mjs'

/* Validators */
import validationCheck from '../../validators/default.mjs'
import { validateApplicant, validateApplicantLogin } from '../../validators/driver.mjs'



/* Application Resource */

router.post('/application/login/:formId', validateApplicantLogin, validationCheck, async (req, res) => {
    try {
        const { formId } = req.params
        const application = await Application.data({ ...res.session, user: true }, { formId })
        if (!application) return throwErr.server(res, 'Server Internal Error: Unidentified Application')

        const { phone, dob, pin } = req.body

        if (phone == application.phone && dob == application.dob && pin == application.ssn.slice(-4)) {
            const referer = req.headers.referer || req.headers.referrer
            req.session.application = application._id

            res.redirect(referer)
        } else throwErr.auth(res, 'Auth Error: Incorrect credentials used')
    } catch (err) {
        throwErr.server(res, null, err)
    }
})

router.post('/application/:_teamId/:_carrierId?', validateApplicant, validationCheck, async (req, res) => {
    try {
        const { _teamId, _carrierId } = req.params
        const session = { ...res.session, user: true }

        const team = await Team.data(session, { _id: _teamId })
        if (!team) return throwErr.server(res, 'Server Internal Error: Unidentified Environment')
        res.session.team = team

        if (_carrierId) {
            const carrier = await Carrier.data(session, { _id: _carrierId })
            if (!carrier) return throwErr.server(res, 'Server Internal Error: Unidentified Carrier')
            req.body.carrierId = await carrier.id()
        }

        const { error, url, data: application } = await Application.create(res.session, req.body)
        if (error) return throwErr.server(res, error, err)

        req.session.application = application._id

        res.redirect(res.hbs.addrBook.driver + url)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router