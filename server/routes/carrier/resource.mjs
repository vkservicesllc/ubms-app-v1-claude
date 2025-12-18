// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Company from '../../tools/core/company.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application, Citation, Accident, Employment } from '../../tools/core/driver.mjs'
import { ApplicationForm } from '../../tools/form/driver.mjs'
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
    '_prevEmployer', '_emplPhone', '_emplAddr1', '_emplAddr2', '_emplAddrZip', '_emplAddrCity', '_emplAddrState',
    '_emplStartDate', '_emplPosition', '_emplEarnings', '_emplFMCSR2', '_emplDotDat2', '_emplRFL', '_emplEndDate',
]
applicantEmployerFields.forEach(prop => validateApplicantEmployers.push(ApplicationForm[prop].validate()))



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

            applicant._userSimpleId = user._userSimpleId
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



// ==== EXPORT ==== //

export default router