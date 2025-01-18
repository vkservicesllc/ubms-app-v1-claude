import User from '../assets/user.mjs'
import inputLength from '../../client/global/modules/registry/length.mjs'
import patterns from '../../client/global/modules/registry/patterns.mjs'
import { validateName, validateGender, validateEmail, validateTel } from './default.mjs'

const { body } = require('express-validator')



const validateUsername = () => {
    const { username } = inputLength.user
    const { min, max } = username

    return body('username')
        .trim()
        .escape()
        .notEmpty()
            .withMessage('Username can not be empty')
        .customSanitizer(value => patterns.replace(value, 'username'))
        .isLength(username)
            .withMessage(`Username must be between ${min} and ${max} characters long`)
}


const validatePassword = () => {
    const { password } = patterns.match

    return body('password')
        .notEmpty()
            .withMessage('Password can not be empty')
        .not().matches(/\s/)
        .matches(password)
            .withMessage(`Password rules violated`)
}


const validateToken = () => body('token')
    .trim()
    .escape()
    .notEmpty()
        .withMessage('Token can not be empty')
    .isNumeric()
        .withMessage('Token contains illegal characters')
    .isLength(inputLength.user.token)
        .withMessage(`Incorrect token length provided`)


const validateStatus = () => {
    const list = Object.keys(User.statusList)

    return body('status')
        .trim()
        .escape()
        .notEmpty()
            .withMessage('Status can not be empty')
        .isIn(list)
            .withMessage('Incorrect status value provided')
}


const validateLocation = () => body('location')
    .trim()
    .escape()
    .notEmpty()
        .withMessage('Location can not be empty')
    .isIn(Object.keys(User.locationList))
        .withMessage('Incorrect location value provided')


const validateCondition = () => {
    const list = Object.keys(User.conditionList).filter(item => item != 'L')

    return body('condition')
        .trim()
        .escape()
        .notEmpty()
            .withMessage('Location can not be empty')
        .isIn(list)
            .withMessage('Incorrect condition value provided')
}



export {
    validateUsername,
    validatePassword,
    validateCondition,
}

export const validateLocalAuth = [
    validateUsername(),
    validatePassword(),
]

export const validateSession = [
    validateToken(),
]

export const validateLocalReg = [
    validateUsername(),
    validatePassword(),
]


export const validateUser = [
    validateStatus(),
    validateLocation(),
    validateEmail('email', true),
    validateTel('phone'),
    validateName('firstName'),
    validateName('lastName'),
    validateName('alias'),
    validateGender(),
]