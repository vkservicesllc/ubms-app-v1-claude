const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assests */
import User, { superAdminUserOnly } from '../../assets/user.mjs'

/* Validators */
import validationCheck, { validateName, validateGender, validateEmail, validateTel } from '../../validators/default.mjs'
import { validateCondition, validateLocation, validateStatus } from '../../validators/user.mjs'


const usersUrl = '/online/users'



// router.post('/user', User.verify, [
//     validateStatus(),
//     validateLocation(),
//     validateEmail('email', true),
//     validateTel('phone'),
//     validateName('firstName', true),
//     validateName('lastName', true),
//     validateName('alias'),
//     validateGender(),
// ], validationCheck, User.post, (req, res) => {
//     res.redirect(usersUrl)
// })


// router.patch('/user', User.verify, [
//     validateStatus(),
//     validateLocation(),
//     validateCondition(),
//     validateEmail(),
//     validateTel('phone'),
//     validateName('firstName'),
//     validateName('lastName'),
//     validateName('alias'),
//     validateGender(),
// ], validationCheck, User.post, (req, res) => {
//     res.redirect(usersUrl)
// })


// router.delete('/user', User.verify, User.delete, (req, res) => {
//     res.redirect(usersUrl)
// })



export default router