import Company from '../assets/company.mjs'
import inputLength from '../../client/global/modules/registry/length.mjs'
import patterns from '../../client/global/modules/registry/patterns.mjs'
import strip from '../../client/global/modules/tools/formatter.mjs'
import {
    validateDate,
    validateName,
    validateSuffix,
    validateGender,
    validateDob,
    validateSsn,
    validateAddr1,
    validateAddr2,
    validateZip,
    validateCity,
    validateStateUS,
    validateTel,
    validateEmail,
    validateUrl,
} from './default.mjs'

const { body } = require('express-validator')



export const validateCatId = () => body('catId')
    .trim()
    .notEmpty()
        .withMessage('Category can not be empty')
    .isIn(Object.keys(Company.categoryList))
        .withMessage('Invalid Category ID')

const validateEin = () => body('ein')
    .trim()
    .notEmpty()
        .withMessage('EIN can not be empty')
    .customSanitizer(value => strip(value))
    .isNumeric()
        .withMessage('EIN must contain digits only')
    .isLength({ min: 9, max: 9 })
        .withMessage('EIN must be 9 digits long')

const validateDuns = () => body('duns')
    .trim()
    .customSanitizer(value => strip(value) || null)
    .optional({ nullable: true })
    .isNumeric()
        .withMessage('DUNS must contain digits only')
    .isLength({ min: 9, max: 9 })
        .withMessage('DUNS must be 9 digits long')

const validateBusName = () => {
    const { busName } = inputLength.company
    const { min, max } = busName

    return body('busName')
        .trim()
        .customSanitizer(value => patterns.replace(value, 'busName'))
        .notEmpty()
            .withMessage('Busness name can not be empty')
        .isLength(busName)
            .withMessage(`Busness name must be between ${min} and ${max} characters long`)
}

const validateCoType = () => body('coType')
    .trim()
    .notEmpty()
        .withMessage('Company type can not be empty')
    .isIn(Object.keys(Company.typeList.full()))
        .withMessage('Invalid Company Type')

const validateAlias = () => {
    const { alias } = inputLength.company
    const { min, max } = alias

    return body('alias')
        .trim()
        .customSanitizer(value => value.replace(/[^A-Za-z]/, '').toUpperCase())
        .notEmpty()
            .withMessage('Alias name can not be empty')
        .isLength(alias)
            .withMessage(`Alias name must be between ${min} and ${max} characters long`)
}


export const validateCompany = [
    validateCatId(),
    validateEin(),
    validateDuns(),
    validateBusName(),
    validateCoType(),
    validateAlias(),
    validateUrl('website'),
    validateDate('since', true),
]

export const validateCompanyOwner = [
    validateName('firstName'),
    validateName('middleName'),
    validateName('lastName'),
    validateSuffix(),
    validateGender(),
    validateDob(),
    validateSsn(),
]

export const validateCompanyOwnerUpdate = [
    validateName('firstName'),
    validateName('middleName'),
    validateName('lastName'),
    validateSuffix(),
    validateDate('since', true)
]

export const validateCompanyAddress = [
    validateAddr1('physical[address1]'),
    validateAddr2('physical[address2]'),
    validateCity('physical[city]'),
    validateStateUS('physical[state]'),
    validateZip('physical[zip]'),
    validateAddr1('mail[address1]', false),
    validateAddr2('mail[address2]'),
    validateCity('mail[city]', false),
    validateStateUS('mail[state]', false),
    validateZip('mail[zip]', false),
]

export const validateCompanyContacts = [
    validateTel('phone', true),
    validateTel('fax'),
    validateEmail(),
]