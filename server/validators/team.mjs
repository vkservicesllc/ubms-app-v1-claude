import inputLength from '../../client/global/modules/registry/length.mjs'
import { validateCatId } from './company.mjs'

const { body } = require('express-validator')



const validateName = () => {
    const { min, max } = inputLength.team.name

    return body('name')
        .trim()
        .escape()
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
        .escape()
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