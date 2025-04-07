import Driver from '../assets/driver.mjs'
import inputLength from '../../client/global/modules/registry/length.mjs'
import patterns from '../../client/global/modules/registry/patterns.mjs'
import strip from '../../client/global/modules/tools/formatter.mjs'
import {
    validateName,
    validateSuffix,
    validateDob,
    validateSsn,
    validateGender,
    validateTel,
    validateDate,
    validateAddr1,
    validateAddr2,
    validateCity,
    validateStateUS,
    validateZip,
    validateYesNo,
} from './default.mjs'

const { body } = require('express-validator')


const validatePosition = () => body('position')
    .trim()
    .customSanitizer(value => strip(value) || null)
    .optional({ nullable: true })
    .isIn(Object.keys(Driver.positionList))
        .withMessage('Incorrect driver position provided')

const validateLegalStatus = () => body('status')
    .trim()
    .notEmpty()
        .withMessage("Applicant's legal status can not be empty")
    .isIn(['0', '1', '2'])
        .withMessage('Incorrect legal status provided')

const validatePin = () => body('pin')
    .trim()
    .notEmpty()
        .withMessage("Applicant's PIN can not be empty")
    .isNumeric()
        .withMessage("Applicant's PIN must be numberic")
    .isLength({ min: 4, max: 4 })
        .withMessage('Incorrect PIN length')

const validateDlNum = field => {
    const { min, max } = inputLength.driverLicense.number

    return body(field)
        .trim()
        .matches(/^[A-Za-z0-9-]+$/)
            .withMessage('Driver License must be alphanumeric with optional hyphens')
        .isLength({ min, max })
            .withMessage(`Driver License must be between ${min} and ${max} characters`)
}

const validateDlClass = field => {
    const list = []
    Driver.dlClassList.map(dlClass => list.push(dlClass.id))

    return body(field)
        .trim()
        .notEmpty()
            .withMessage('Driver License Class can not be empty')
        .isIn(list)
            .withMessage('Incorrect Driver License Class')
}


export const validateApplicant = [
    validateName('firstName'),
    validateName('middleName'),
    validateName('lastName'),
    validateSuffix(),
    validateDob('dob', 18, 'The Applicant must be at least 18 years of age'),
    validateGender(), //! optional for now
    validateSsn('ssn', true),
    validateTel('phone', true),
    validateDate('addrSince'),
    validateAddr1('address1'),
    validateAddr2('address2'),
    validateZip('zip'),
    validateCity('city'),
    validateStateUS('state'),
    validateLegalStatus(),
    validateDate('statusExpiresOn'),
    validatePosition(),
]

export const validateApplicantLogin = [
    validateDob(),
    validateTel('phone', true),
    validatePin(),
]

export const validateApplicantProfile = [
    validateName('firstName'),
    validateName('middleName'),
    validateName('lastName'),
    validateSuffix(),
    validateDob('dob', 18, 'The Applicant must be at least 18 years of age'),
    validateGender(), //! optional for now
    validateSsn('ssn', true),
    validateTel('phone', true),
    validatePosition(),
]

export const validateApplicantAddress = [
    validateDate('addrSince'),
    validateAddr1('address1'),
    validateAddr2('address2'),
    validateZip('zip'),
    validateCity('city'),
    validateStateUS('state'),
]

export const validateApplicantDL = [
    validateDlNum('driverLicense'),
    validateStateUS('DL_state', true),
    validateDlClass('DL_class'),
    validateDate('DL_issuedOn'),
    validateDate('DL_expiresOn'),
    validateYesNo('DL_denied'),
    validateYesNo('DL_revoked'),
]