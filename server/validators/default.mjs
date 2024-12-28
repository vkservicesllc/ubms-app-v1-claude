const { body, validationResult } = require('express-validator')

import inputLength from '../../client/global/modules/registry/length.mjs'
import patterns from '../../client/global/modules/registry/patterns.mjs'

import Person from '../../client/global/modules/assets/person.mjs'
import Address from '../../client/global/modules/assets/address.us.mjs'

import { calculateYearAge } from '../../client/global/modules/tools/date.mjs'
import strip from '../../client/global/modules/tools/formatter.mjs'
// import { stripTelephone } from '../../client/global/modules/tools/telephone.mjs'
// import { stripAccountNumber } from '../../client/global/modules/tools/license.mjs'
import { reformatDateString } from '../../client/global/modules/tools/date.mjs'
import { capitalizeFirst, capitalizeEach } from '../../client/global/modules/tools/string.mjs'


export default (req, res, next) => {
    const validationFails = validationResult(req)
    let { errors } = validationFails

    if (!validationFails.isEmpty()) {
        let errorList = '<pre>Validation Errors:<ol>'
        errors.forEach(error => {
            errorList += `<li>{ ${error.path}: "${error.value}" } ${error.msg}</li>`
        })
        errorList += '</ol></pre>'

        // errorList += '<pre><ul>'
        // for (const field in req.body) {
        //     const value = req.body[field]

        //     errorList += `<li>${field}: ${value}</li>`
        // }
        // errorList += '</ul></pre>'

        return res.status(400).send(errorList)
    }

    next()
}


export const validateDate = (field, required = false) => {
    let chain = body(field)
        .trim()
        .customSanitizer(date => {
            if (!date) return null

            return reformatDateString(date)
        })

    if (!required) chain = chain.optional({ nullable: true })
    else
        chain = chain
            .notEmpty()
                .withMessage('Date input is required')

        chain = chain
            .isDate()
                .withMessage('Input must be a valid date')
            .matches(/^\d{4}-\d{2}-\d{2}$/)
                .withMessage('Invalid date format')

    return chain
}


export const validateName = field => {
    const length = inputLength.person[field]
    const { min, max } = length

    let chain = body(field)
        .trim()
        .escape()
        .customSanitizer(value => patterns.replace(value, 'name'))
        .customSanitizer(value => value || null)

    if (field == 'firstName' || field == 'lastName')
        chain = chain
            .notEmpty()
                .withMessage(`${{firstName: 'First Name', lastName: 'Last Name'}[field]} must not be empty`)
    else
        chain = chain.optional({ nullable: true })

    chain = chain
        .isLength(length)
            .withMessage(`Person's name must be between ${min} and ${max} characters long`)

    return chain
}


export const validatePrefix = field => body(field || 'prefix')
    .trim()
    .escape()
    .customSanitizer(value => value || null)
    .optional({ nullable: true })
    .isIn(Object.keys(Person.prefix))
        .withMessage("Incorrect person's prefix value provided")


export const validateSuffix = field => body(field || 'suffix')
    .trim()
    .escape()
    .customSanitizer(value => value || null)
    .optional({ nullable: true })
    .isIn(Object.keys(Person.suffixList))
        .withMessage("Incorrect person's suffix value provided")


export const validateGender = field => body(field || 'sex')
    .isIn([ '0', '1', '', 'M', 'F' ])
        .withMessage('Incorrect gender values provided')
    .customSanitizer(value => {
        const options = [ 'F', 'M' ]
        if (options.includes(value)) value = options.indexOf(value)

        return (value !== '' && !isNaN(value)) ? +value : null
    })


export const validateDob = (field, maxAge = 16, ageErrMsg) => {
    let chain = validateDate(field || 'dob', true)

    chain = chain
        .custom(value => {
            if (calculateYearAge(value) < maxAge) {
                throw new Error(ageErrMsg || 'The registrant is too young')
            }

            return true
        })

    return chain
}


export const validateNumberId = (field, maxLength, required = false, numericOnly = true) => {
    let chain = body(field)
        .trim()
        .escape()
        .customSanitizer(value => value || null)

    if (!required) chain = chain.optional({ nullable: true })
    else chain = chain
        .notEmpty()
            .withMessage('Number ID must not be empty')

    if (numericOnly)
        chain = chain.isNumeric()
            .withMessage('Number ID must consist of digits only')
    else
        chain = chain
            .custom(value => {
                if (!/[A-Z0-9]/g.test(value)) {
                    throw new Error('Number ID must consist of digits and/or letters only')
                }

                return true
            })

    chain = chain.isLength({ max: maxLength })
        .withMessage(`Number ID must not exceed ${maxLength} characters in length`)

    return chain
}


export const validateSsn = (field, required = false) => {
    let chain = body(field || 'ssn')
        .trim()
        .escape()
        .customSanitizer(value => value ? strip(value) : null)

    if (!required) chain = chain.optional({ nullable: true })
    else chain = chain
        .notEmpty()
            .withMessage('SSN must not be empty')

    chain = chain
        .isNumeric()
            .withMessage('SSN must contain digits only')
        .isLength({ min: 9, max: 9 })
            .withMessage('SSN must be 9 digits long')

    return chain
}


export const validateEmail = (field, required = false) => {
    let chain = body(field || 'email')
        .trim()
        .escape()
        .customSanitizer(value => value ? patterns.replace(value, 'email') : null)

    if (!required) chain = chain.optional({ nullable: true })
    else chain = chain
        .notEmpty()
            .withMessage('Email must not be empty')

    chain = chain
        .isEmail()
            .withMessage('Incorrect email address provided')
        .isLength(inputLength.contact.email)
        .normalizeEmail()  /* Removes dots from Gmail addresses */

    return chain
}


export const validateTel = (field, required = false) => {
    let chain = body(field)
        .trim()
        .escape()
        .customSanitizer(value => value ? strip(value) : null)

    if (!required) chain = chain.optional({ nullable: true })
    else chain = chain
        .notEmpty()
            .withMessage(`${capitalizeFirst(field)} can not be empty`)

    chain = chain
        .isNumeric()
            .withMessage(`${capitalizeFirst(field)} must contain digits only`)
        .isLength({ min: 10, max: 10 })
            .withMessage(`${capitalizeFirst(field)} must be 10 digits long`)

    return chain
}


export const validateAddr1 = (field, required = true) => {
    /* Required by default but can be set to optional if form assumes optional address */
    let chain = body(field)
        .trim()
        .escape()
        .customSanitizer(value => {
            if (!value) return null

            const addr2Patt = patterns.match.addr2

            value = capitalizeEach(value)
            value = patterns.replace(value, 'addr1')
            value = value.replace(addr2Patt, '').trim()

            return value
        })

    if (!required) chain = chain.optional({ nullable: true })
    else chain = chain
        .notEmpty()
            .withMessage(`Street/Mail Address can not be empty`)

    return chain
}


export const validateAddr2 = field => body(field)
    .trim()
    .escape()
    .customSanitizer(value => {
        if (!value) return null

        value = capitalizeEach(value)
        value = patterns.replace(value, 'addr2')

        return value
    })
    .optional({ nullable: true })


export const validateZip = (field, required = true) => {
    let chain = body(field)
        .trim()
        .escape()
        .customSanitizer(value => {
            if (!value) return null

            value = patterns.replace(value, 'zip')

            return value
        })

    if (!required) chain = chain.optional({ nullable: true })
    else chain = chain
        .notEmpty()
            .withMessage('Zip Code can not be empty')

    const { min, max } = inputLength.address.zip

    chain = chain
        .isNumeric()
            .withMessage('Zip Code must contain digits only')
        .isLength({ min, max })
            .withMessage(`Zip Code must be between ${min} and ${max} digits long`)

    return chain
}


export const validateCity = (field, required = true) => {
    let chain = body(field)
        .trim()
        .escape()
        .customSanitizer(value => {
            if (!value) return null

            value = capitalizeEach(value)
            value = patterns.replace(value, 'city')

            return value
        })

    if (!required) chain = chain.optional({ nullable: true })
    else chain = chain
        .notEmpty()
            .withMessage('City can not be empty')

    return chain
}


export const validateStateUS = (field, required = true) => {
    let chain = body(field)
        .trim()
        .escape()
        .customSanitizer(value => value || null)

    if (!required) chain = chain.optional({ nullable: true })
    else chain = chain
        .notEmpty()
            .withMessage('US State can not be empty')

    chain = chain
        .isIn(Object.keys(Address.stateList))
            .withMessage('Incorrect US State value provided')

    return chain
}