const router = require('express').Router()
const { body } = require('express-validator')
const throwErr = require('../../tools/utils/error').data

/* Tools */
import moment from 'moment'
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'

/* Validators */
import validationCheck from '../../tools/form/validator.mjs'
import DriverForm, { ApplicationForm } from '../../tools/form/driver.mjs'

const validateApplicant = [], validateApplicantProfile = [], validateApplicantAddress = []
const applicantProfileFields = [
    'firstName', 'middleName', 'lastName', 'suffix',
    'gender', 'dob', 'ssn', 'marital', 'phone', 'email',
]
const applicantAddressFields = ['address1', 'address2', 'addrZip', 'addrCity', 'addrState', 'addrSince']
const applicantFields = [...applicantProfileFields, 'position', ...applicantAddressFields, 'status', 'statusExp']
applicantFields.forEach(prop => validateApplicant.push(ApplicationForm[prop].validate()))
applicantProfileFields.forEach(prop => validateApplicantProfile.push(ApplicationForm[prop].validate()))
applicantAddressFields.forEach(prop => validateApplicantAddress.push(ApplicationForm[prop].validate()))

const validateApplicantLogin = []
const applicantLoginFields = ['phone', 'dob', 'pin']
applicantLoginFields.forEach(prop => validateApplicantLogin.push(ApplicationForm[prop].validate()))

const validateApplicantDL = []
const applicantDlFields = [
    'dlCommercial', 'dlState', 'dlNumber', 'dlClass', 'dlIss', 'dlExp',
    'dlEndrs', 'dlRestr', 'dlDenied', 'dlRevoked', 'dlDeniedExpl', 'dlRevokedExpl',
]
applicantDlFields.forEach(prop => validateApplicantDL.push(ApplicationForm[prop].validate()))

const validateApplicantMEC = []
const applicantMecFields = ['noMec', 'mecExp', 'mecIss', 'mecNumber', 'underMeds', 'medList']
applicantMecFields.forEach(prop => validateApplicantMEC.push(ApplicationForm[prop].validate()))

const validateApplicantCompliance = []
const applicantComplianceFields = ['dui', 'duiInDecade', 'criminal', 'criminalExpl', 'dotDat', 'citations', '_citDate', '_citState', '_citReason', '_citOtherReason']
applicantComplianceFields.forEach(prop => validateApplicantCompliance.push(ApplicationForm[prop].validate()))

const validateApplicantSafety = []
const applicantSafetyFields = ['accidents', '_accType', '_accOtherType', '_accDate', '_accState', '_accInjuries', '_accFatalities']
applicantSafetyFields.forEach(prop => validateApplicantSafety.push(ApplicationForm[prop].validate()))


const validateApplicantExperience = []
const applicantExperienceFields = [
    'noExp', 'cmvExp', 'expStartDate', 'expEndDate', 'expMileage',
    'cdlSchool', 'schName', 'schPhone', 'schState', 'schEndDate', 'schDuration',
]
applicantExperienceFields.forEach(prop => validateApplicantExperience.push(ApplicationForm[prop].validate()))


const validateApplicantEmployers = []
const applicantEmployerFields = [
    'prevEmployed',
    '_prevEmployer', '_emplPhone', '_emplAddr1', '_emplAddr2', '_emplAddrZip', '_emplAddrCity', '_emplAddrState',
    '_emplStartDate', '_emplPosition', '_emplEarnings', '_emplFMCSR', '_emplDotDat', '_emplRFL', '_emplEndDate',
]
applicantEmployerFields.forEach(prop => validateApplicantEmployers.push(ApplicationForm[prop].validate()))


const validateApplicantPreference = []
const applicantPreferenceFields = ['operType', 'haulRegion', 'equipmentType', 'startPref']
applicantPreferenceFields.forEach(prop => validateApplicantPreference.push(ApplicationForm[prop].validate()))


const validateApplicantBusiness = []
const applicantBusinessFields = [
    'activeLLC', 'llcName', 'llcState', 'llcEin',
    'llcAssistance', 'llcProposedName',
]
applicantBusinessFields.forEach(prop => validateApplicantBusiness.push(ApplicationForm[prop].validate()))

const validateApplicantVehicle = []
const applicantVehicleFields = [
    'currentVhlType',
    'currentVhlMMT', 'currentVhlYear', 'currentVhlMake', 'currentVhlModel', 'currentVhlLen',
]
applicantVehicleFields.forEach(prop => validateApplicantVehicle.push(ApplicationForm[prop].validate()))

const validateApplicantBeneficiary = []
const applicantBeneficiaryFields = [
    'benefRelation', 'benefOtherRel',
    'benefFirstName', 'benefMiddleName', 'benefLastName', 'benefSuffix',
    'benefDob', 'benefGender', 'benefSsn',
    'benefPhone', 'benefAddress1', 'benefAddress2', 'benefAddrZip', 'benefAddrCity', 'benefAddrState',
]
applicantBeneficiaryFields.forEach(prop => validateApplicantBeneficiary.push(ApplicationForm[prop].validate()))

const validateApplicantEmergency = []
const applicantEmergencyFields = ['emergPhone', 'emergName', 'emergRelation']
applicantEmergencyFields.forEach(prop => validateApplicantEmergency.push(ApplicationForm[prop].validate()))

const validateApplicantPrevAddress = []
const validatePrevAddressFields = [
    'livedAbroad', 'country',
    '_addrSince', '_address1', '_address2',
    '_addrZip', '_addrCity', '_addrState', '_livedAbroad',
]
validatePrevAddressFields.forEach(prop => validateApplicantPrevAddress.push(ApplicationForm[prop].validate()))


const dynamicValidator = {
    applications: (req, res, next) => {
        const { step } = req.params
        let validators

        switch (step) {
            case 'profile':
                validators = validateApplicantProfile
                break
            case 'address':
                validators = validateApplicantAddress
                break
            case 'driver-license':
                validators = validateApplicantDL
                break
            case 'medical-card':
                validators = validateApplicantMEC
                break
            case 'legal-compliance':
                validators = validateApplicantCompliance
                break
            case 'safety':
                validators = validateApplicantSafety
                break
            case 'experience':
                validators = validateApplicantExperience
                break
            case 'pre-employment':
                validators = validateApplicantEmployers
                break
            case 'preference':
                validators = validateApplicantPreference
                break
            case 'business':
                validators = [ ...validateApplicantBusiness, ...validateApplicantVehicle ]
                break
            case 'beneficiary':
                validators = validateApplicantBeneficiary
                break
            case 'misc':
                validators = [ ...validateApplicantEmergency, ...validateApplicantPrevAddress ]
                break
        }

        Promise.all(validators.map(validator => validator.run(req)))
            .then(() => next())
            .catch(next)
    },
}



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


router.post('/application/form/:formId/:step', dynamicValidator.applications, validationCheck, async (req, res) => {
    try {
        const session = { ...res.session, user: true }
        const { formId, step } = req.params
        const application = await Application.data(session, { formId })
        if (!application) return throwErr.server(res, 'Server Internal Error: Unidentified Application')

        const { error } = await application.modify(session, step, req.body)
        if (error) return throwErr.server(res, error)

        res.redirect(`/application/${formId}`)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/application/:_teamId/:_carrierId?', validateApplicant, validationCheck, async (req, res) => {
    try {
        const { _teamId, _carrierId } = req.params
        const { dept: deptId } = req.query
        const session = { ...res.session, user: true }

        const team = await Team.data(session, { _id: _teamId })
        if (!team) return throwErr.server(res, 'Server Internal Error: Unidentified Environment')
        res.session.team = team

        if (_carrierId) {
            const carrier = await Carrier.data(session, { _id: _carrierId })
            if (!carrier) return throwErr.server(res, 'Server Internal Error: Unidentified Carrier')
            req.body.carrierId = await carrier.id()
        }

        if (deptId) req.body.deptId = deptId
        else req.body.deptId = team.settings.deptId[0]

        const { error, url, data: application } = await Application.create(res.session, req.body)
        if (error) return throwErr.server(res, error)

        req.session.application = application._id

        res.redirect(res.hbs.addrBook.driver + url)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router

export { validateApplicant, validateApplicantLogin }