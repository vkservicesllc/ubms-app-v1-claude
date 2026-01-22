// ==== IMPORT ==== //

const router = require('express').Router()
const { body } = require('express-validator')
const sendError = require('../../tools/utils/error')

/* Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'

/* Validators */
import validationCheck from '../../tools/form/validator.mjs'
import DriverForm, { ApplicationForm, EmploymentForm } from '../../tools/form/driver.mjs'


// ==== SETUP ==== //

const validateApplicantPreemployment = []
const applicantPreemploymentFields = [ 'prevEmployed' ]
applicantPreemploymentFields.forEach(prop => validateApplicantPreemployment.push(ApplicationForm[prop].validate()))


const validateApplicantEmployer = []
const applicantEmployerFields = [
    'employer', 'phone', 'address1', 'address2', 'addrZip', 'addrCity', 'addrState',
    'startDate', 'position', 'earnings', 'FMCSR', 'dotDat', 'RFL', 'endDate',
]
applicantEmployerFields.forEach(prop => validateApplicantEmployer.push(EmploymentForm[prop].validate()))



const dynamicValidator = {
    applications: (req, res, next) => {
        const { step } = req.params
        let validators

        switch (step) {
            case 'workflow':
                validators = ApplicationForm.validate('workflow')
                break
            case 'profile':
                validators = ApplicationForm.validate('profile')
                break
            case 'legal-status':
                validators = ApplicationForm.validate('legal')
                break
            case 'position':
                validators = ApplicationForm.validate('position/vehicle')
                break
            case 'residence':
                validators = ApplicationForm.validate('residence')
                break
            case 'driver-license':
                validators = ApplicationForm.validate('license')
                break
            case 'medical-card':
                validators = ApplicationForm.validate('medical')
                break
            case 'legal-compliance':
                validators = ApplicationForm.validate('compliance')
                break
            case 'safety':
                validators = ApplicationForm.validate('safety')
                break
            case 'experience':
                validators = ApplicationForm.validate('experience')
                break
            case 'prev-employment':
                validators = validateApplicantPreemployment
                break
            case 'prev-employer':
                validators = validateApplicantEmployer
                break
            case 'preference':
                validators = ApplicationForm.validate('preference')
                break
            case 'business':
                validators = ApplicationForm.validate('business/vehicle')
                break
            case 'beneficiary':
                validators = ApplicationForm.validate('beneficiary')
                break
            case 'misc':
                validators = ApplicationForm.validate('emergency')
                break
            case 'certify':
                validators = []
                break
        }

        Promise.all(validators.map(validator => validator.run(req)))
            .then(() => next())
            .catch(next)
    },
}



// ==== ROUTES ==== //


router.post('/application/start/:_teamId/:_carrierId?', ApplicationForm.validate('registration'), validationCheck, async (req, res) => {
    try {
        let { form: formId } = req.query
        const { address: addrBody } = req.body
        delete req.body.address

        let application

        if (formId) {
            application = await Application.fetch(res.session, { formId })
            if (!application) throw new Error('Application not found')

            await application.update(req.body)
        } else {
            const { _teamId, _carrierId } = req.params
            const { cdl: cdlRole, rec: _userId } = req.query

            req.body.cdlRole = +cdlRole

            let team
            if (_teamId !== 'global') {
                team = await Team.fetch(res.session, { _id: _teamId }, { offline: true })
                if (!team) throw new Error('Team not found')

                res.session.team = team
                req.body.teamId = team.id
            }

            if (_carrierId) {
                const carrier = await Carrier.fetch({ ...res.session, user: { id: 1 } }, { _id: _carrierId })
                if (!carrier) throw new Error('Carrier not found')

                req.body.carrierId = carrier.id
            }

            if (_userId) {
                const user = await User.fetch(res.session, { _simpleId: _userId }, { offline: true })
                if (!user) throw new Error('User not found')

                req.body.userId = user.id
            }

            const result = await Application.create(res.session, req.body)
            application = result.data
            if (!application) throw new Error('Failed to create application')

            formId = application.formId
        }

        await application.add('address', addrBody)
        await application.welcome()

        if (!addrBody.enough) await application.update({ step: 0 })
        await application.update({ addrComplete: !!addrBody.enough })

        req.session.application = application._id

        res.redirect(`/application/${formId}`)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/application/progress/:formId/:step', dynamicValidator.applications, validationCheck, async (req, res) => {
    try {
        const { formId, step } = req.params
        const application = await Application.fetch(res.session, { formId }, { hideSensitive: false })
        if (!application) throw new Error('Application not found')
// return res.send({
//     step,
//     body: req.body,
//     formId,
//     id: application.id,
// })
        await application.progress(step, req.body)

        res.redirect(`/application/${formId}`)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/application/submit/:formId', async (req, res) => {
    try {
        const { formId } = req.params
        const application = await Application.fetch(res.session, { formId })
        if (!application) throw new Error('Application not found')

        await application.submit()

        res.redirect(`/application/${formId}`)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router

export { dynamicValidator, validateApplicantEmployer }