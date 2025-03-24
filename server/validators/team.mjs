import inputLength from '../../client/global/modules/registry/length.mjs'
import { validateCatId, validateBusName, validateCoType } from './company.mjs'
import {
    validateEmail, validateUrl, validateTel,
    validateAddr1, validateAddr2, validateCity, validateStateUS, validateZip,
} from './default.mjs'

const { body } = require('express-validator')



const validateName = () => {
    const { min, max } = inputLength.team.name

    return body('name')
        .trim()
        .customSanitizer(value => value.replace('&amp;', '&').replace('&#x27;', "'"))
        .notEmpty()
            .withMessage('Team Name can not be empty')
        .isLength({ min, max })
            .withMessage(`Team Name must be between ${min} and ${max} characters long`)
}

const validateDesc = () => {
    const { max } = inputLength.team.desc

    return body('description')
        .trim()
        .customSanitizer(value => value || null)
        .optional({ nullable: true })
        .isLength({ max })
            .withMessage(`Team Description must not exceed ${max} characters`)
}



export const validateTeam = [
    validateName(),
    validateCatId(),
    validateDesc(),
]


export const validateTeamProfile = [
    validateBusName(),
    validateCoType(),
    validateTel('phone', true),
    validateEmail(),
    validateUrl('website'),
    validateAddr1('address1'),
    validateAddr2('address2'),
    validateZip('zip'),
    validateCity('city'),
    validateStateUS('state'),
]