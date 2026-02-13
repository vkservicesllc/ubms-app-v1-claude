// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Company from '../../tools/core/company.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'
import { ApplicationForm, EmploymentForm } from '../../tools/form/driver.mjs'
import { inPEnvironment, withPrivileges } from '../../tools/core/user/permissions.mjs'

/* Validators */
import validationCheck from '../../tools/form/validator.mjs'
import { dynamicValidator as dynamicApplicantValidator } from '../driver/resource.mjs'


// ==== SETUP ==== //

const url = {
    drivers: {
        applications: '/drivers/applications',
    },
}

const validateApplicantEmployers = []
const applicantEmployerFields = [
    'employer', 'phone', 'address1', 'address2', 'addrZip', 'addrCity', 'addrState',
    'startDate', 'position', 'earnings', 'FMCSR', 'dotDat', 'RFL', 'endDate',
]
applicantEmployerFields.forEach(prop => validateApplicantEmployers.push(EmploymentForm[prop].validate()))



// ==== SETTINGS ROUTES ==== //


router.post('/user/:_id/app/settings', User.mw.verify, async (req, res) => {
    try {
        const { _id } = req.params
        if (_id != res.session.user._id) throw new Error('Invalid User')

        const user = await User.fetch(res.session, { _id })
        await user.settings('update', req.body)

        res.redirect('/settings')
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== DRIVERS ROUTES ==== //


const validateApplicantInvitation = [], validateApplicant = [], validateLead = []
const applicantInvitationFields = ['carrier', 'team', 'email']
const applicantFields = [
    ...applicantInvitationFields,
    'firstName', 'middleName', 'lastName', 'suffix',
    'gender', 'phone', 'position_',
]
const leadFields = ['leadFirstName', 'leadMiddleName', 'leadLastName', 'leadSuffix', 'leadGender', 'leadPhone', 'leadPosition']
applicantInvitationFields.forEach(prop => validateApplicantInvitation.push(ApplicationForm[prop].validate()))
applicantFields.forEach(prop => validateApplicant.push(ApplicationForm[prop].validate()))
leadFields.forEach(prop => validateLead.push(ApplicationForm[prop].validate()))


router.post('/drivers/invite/applicant', User.mw.verify, Team.mw.verify, validateApplicantInvitation, validationCheck, async (req, res) => {
    try {
        await Application.invite(res.session, req.body)
        res.redirect('/drivers/applications')
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/drivers/reinvite/applicant', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { _id } = req.query
        if (!_id) throw new Error('Application parameters not supplied')

        const applicant = await Application.fetch(res.session, { _id })
        if (!applicant) throw new Error('Applicant not found')

        const { userId } = applicant

        if (userId) {
            const user = await User.fetch(res.session, { id: userId })
            if (!user) throw new Error('Assigned user not found')

            applicant._userSimpleId = user._simpleId
        }

        await Application.invite(res.session, applicant, applicant.formId)
        res.redirect('/drivers/applications')
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/drivers/insert/applicant', User.mw.verify, Team.mw.verify, validateApplicant, validationCheck, async (req, res) => {
    try {
        await Application.create(res.session, req.body)
        res.redirect('/drivers/applications')
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/drivers/update/applicant', User.mw.verify, Team.mw.verify, validateLead, validationCheck, async (req, res) => {
    try {
        const { _id } = req.body
        delete req.body._id

        const applicant = await Application.fetch(res.session, { _id })
        if (!applicant) throw new Error('Applicant not found')

        await applicant.update(req.body)
        res.redirect('/drivers/applications')
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/drivers/delete/application', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { user } = res.session
        const permissions = await user.permissions(res.session)
        if (!withPrivileges('d:drv/apl', 'delete', permissions, user.DS)) return sendError.auth(req, res)

        const { _id } = req.body
        const application = await Application.fetch(res.session, { _id })
        if (!application) throw new Error('Application not found')

        await application.delete()

        res.redirect('/drivers/applications')
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/driver/application/:formId/edit/:step', User.mw.verify, Team.mw.verify,
    dynamicApplicantValidator.applications, //! validationCheck, // validationCheck returns error when checkbox is unchecked
    async (req, res) => {
        try {
            const { user } = res.session
            const { DS } = user
            const permissions = await user.permissions(res.session)
            // if (!withPrivileges('d:drv/apl', ['modify', 'update'], permissions, DS))
            //! NOT sure about update permission
            if (!withPrivileges('d:drv/apl', 'modify', permissions, DS)) return sendError.auth(req, res)

            const { formId, step } = req.params
            const application = await Application.fetch(res.session, { formId })
            if (!application) throw new Error('Application not found')

            await application.progress(step, req.body)

            res.redirect(`/drivers/application/${formId}/e-form?${step}`)
        } catch (err) {
            sendError.server(req, res, err)
        }
    }
)


// ==== EXPORT ==== //

export default router