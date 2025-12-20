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
import DriverForm, { ApplicationForm } from '../../tools/form/driver.mjs'


// ==== SETUP ==== //

const validateApplicationWorkflow = []
const applicantWorkflowFields = ['user', 'carrier', 'condition', 'experience', 'apprPosition']
applicantWorkflowFields.forEach(prop => validateApplicationWorkflow.push(ApplicationForm[prop].validate()))

const validateApplicant = [], validateApplicantProfile = [], validateApplicantAddress = []
const applicantProfileFields = [
    'firstName', 'middleName', 'lastName', 'suffix',
    'gender', 'dob', 'ssn', 'marital', 'phone', 'email',
]
const applicantAddressFields = ['address1', 'address2', 'addrZip', 'addrCity', 'addrState', 'addrSince', 'addrEnough']
const applicantFields = [...applicantProfileFields, 'position', ...applicantAddressFields, 'status', 'statusExp']
applicantFields.forEach(prop => validateApplicant.push(ApplicationForm[prop].validate()))
applicantProfileFields.forEach(prop => validateApplicantProfile.push(ApplicationForm[prop].validate()))
applicantAddressFields.forEach(prop => validateApplicantAddress.push(ApplicationForm[prop].validate()))

const validateApplicantPrevAddress = []
const validatePrevAddressFields = [
    'livedAbroad', 'country',
    '_addrSince', '_addrEnough', '_address1', '_address2',
    '_addrZip', '_addrCity', '_addrState', '_livedAbroad',
]
validatePrevAddressFields.forEach(prop => validateApplicantPrevAddress.push(ApplicationForm[prop].validate()))

const validateApplicantLegalStatus = []
const validateLegalStatusFields = ['status', 'statusExp']
validateLegalStatusFields.forEach(prop => validateApplicantLegalStatus.push(ApplicationForm[prop].validate()))

const validateApplicantPosition = []
const validatePositionFields = ['position']
validatePositionFields.forEach(prop => validateApplicantPosition.push(ApplicationForm[prop].validate()))

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
const applicantPreferenceFields = ['operType', 'teamName', 'teamPhone', 'haulRegion', 'equipmentType', 'startPref']
applicantPreferenceFields.forEach(prop => validateApplicantPreference.push(ApplicationForm[prop].validate()))


const validateApplicantBusiness = []
const applicantBusinessFields = [
    'activeLLC', 'inactiveLLC', 'llcName', 'llcState', 'llcEin',
    // 'llcAssistance', 'llcProposedName',
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
    // 'benefDob', 'benefGender',
    'benefPhone', // 'benefAddress1', 'benefAddress2', 'benefAddrZip', 'benefAddrCity', 'benefAddrState',
    'benefSsn',
]
applicantBeneficiaryFields.forEach(prop => validateApplicantBeneficiary.push(ApplicationForm[prop].validate()))

const validateApplicantEmergency = []
const applicantEmergencyFields = ['emergPhone', 'emergName', 'emergRelation']
applicantEmergencyFields.forEach(prop => validateApplicantEmergency.push(ApplicationForm[prop].validate()))


const dynamicValidator = {
    applications: (req, res, next) => {
        const { step } = req.params
        let validators

        switch (step) {
            case 'workflow':
                validators = validateApplicationWorkflow
                break
            case 'profile':
                validators = validateApplicantProfile
                break
            case 'legal-status':
                validators = validateApplicantLegalStatus
                break
            case 'position':
                validators = [ ...validateApplicantPosition, ...validateApplicantVehicle ]
                break
            case 'residence':
                validators = [ ...validateApplicantAddress, ...validateApplicantPrevAddress ]
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
            case 'prev-employment':
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
                validators = validateApplicantEmergency
                break
        }

        Promise.all(validators.map(validator => validator.run(req)))
            .then(() => next())
            .catch(next)
    },
}



// ==== ROUTES ==== //


router.post('/application/start/:_teamId/:_carrierId?', validateApplicant, validationCheck, async (req, res) => {
    try {
        let { form: formId } = req.query
        const { address: addrBody } = req.body
        delete req.body.address
return res.send({
    body: req.body,
    addrBody,
}) //!TEMP

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
                const carrier = await Carrier.fetch(session, { _id: _carrierId })
                if (!carrier) throw new Error('Carrier not found')

                req.body.carrierId = carrier.id
            }

            if (_userId) {
                const user = await User.fetch(res.session, { _id: _userId }, { offline: true })
                if (!user) throw new Error('User not found')

                req.body.userId = user.id
            }

            const result = await Application.create(res.session, req.body)
            application = result.data
            if (!application) throw new Error('Failed to create application')
        }

        await application.add('address', addrBody)

        res.session.application = application
        // create redirect url
        let url = '/' //!TEMP

        res.send(url)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router

export { validateApplicant, validateApplicantLogin, dynamicValidator }