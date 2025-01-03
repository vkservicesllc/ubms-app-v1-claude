const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assests */
import User, { superAdminUserOnly } from '../../assets/user.mjs'

/* Validators */
import validationCheck from '../../validators/default.mjs'
import { validateUser, validateCondition } from '../../validators/user.mjs'


const usersUrl = '/online/users'

const userErr = 'Server Internal Error: User not found'



router.post('/user', User.verify, validateUser, validationCheck, User.dataCheck, async (req, res) => {
    delete req.body._method_

    try {
        delete req.body._id

        const { error } = await User.create(res.session, req.body)
        if (error) return throwErr.server(res, error)

        res.redirect(usersUrl)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.patch('/user', User.verify, validateUser, validationCheck, User.dataCheck, async (req, res) => {
    delete req.body._method_

    try {
        const { _id } = req.body
        delete req.body._id

        const user = await User.data(res.session, { _id })
        if (!user) return throwErr.server(res, userErr)

        const { error } = await user.modify(res.session, req.body)
        if (error) return throwErr.server(res, error)

        res.redirect(usersUrl)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.patch('/user/condition', User.verify, [ validateCondition() ], validationCheck, async (req, res) => {
    try {
        const { _id, condition } = req.body

        const user = await User.data(res.session, { _id })
        if (!user) return throwErr.server(res, userErr)

        const { error } = await user.modify(res.session, { condition })
        if (error) return throwErr.server(res, error)

        res.redirect(usersUrl)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.delete('/user', User.verify, async (req, res) => {
    try {
        const { _id } = req.body

        const user = await User.data(res.session, { _id })
        if (!user) return throwErr.server(res, userErr)

        const { error } = await user.delete(res.session)
        if (error) return throwErr.server(res, error)

        res.redirect(usersUrl)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router