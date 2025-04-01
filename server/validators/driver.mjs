import Driver from '../assets/driver.mjs'
import inputLength from '../../client/global/modules/registry/length.mjs'
import patterns from '../../client/global/modules/registry/patterns.mjs'
import strip from '../../client/global/modules/tools/formatter.mjs'
import {
    validateName,
    validateSuffix,
    validateDob,
    validateSsn,
    validateTel,
    validateDate,
} from './default.mjs'

const { body } = require('express-validator')


const validatePosition = () => body('position')
    .trim()
    .customSanitizer(value => strip(value) || null)
    .optional({ nullable: true })
    .isIn(Object.keys(Driver.positionList))
        .withMessage('Incorrect driver position provided')

const validateLegalStatus = () => body('legalStatus')
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


export const validateApplicant = [
    validateName('firstName'),
    validateName('middleName'),
    validateName('lastName'),
    validateSuffix(),
    validateDob('dob', 18, 'The Applicant must be at least 18 years of age'),
    validateSsn('ssn', true),
    validateTel('phone', true),
    validatePosition(),
    validateLegalStatus(),
    validateDate('LS_expiresOn'),
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
    validateSsn('ssn', true),
    validateTel('phone', true),
    validatePosition(),
]