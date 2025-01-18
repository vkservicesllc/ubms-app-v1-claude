const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assests */
import User, { superAdminUserOnly } from '../../assets/user.mjs'

/* Validators */
import validationCheck from '../../validators/default.mjs'
import { validateUser, validateCondition } from '../../validators/user.mjs'


const usersUrl = '/online/users'

const userErr = 'Server Internal Error: User not found'



router.post('/user/upsert', User.verify, User.devLock, validateUser, validationCheck, async (req, res) => {
    const { session } = res
    const { user: sessionUser } = session
    const sessionStatus = sessionUser.status[0]
    const sessionLocation = sessionUser.location[0]
    const { body } = req
    let error

    switch (true) {
        case body.location != 'US' && body.phone:
            delete body.phone
            break
        case body.status == 'D' && sessionStatus != 'D':
        case body.status == 'S' && !sessionUser.DS:
            error = 'Invalid Data: Illegal Status'
            break
        case body.status == 'S' && body.location != 'US':
        case sessionLocation != 'US' && body.location != sessionLocation:
            error = 'Invalid Data: Illegal Location'
            break
        case body.firstName == body.alias:
            error = 'Invalid Data: Illegal Name'
            break
    }

    if (error) return throwErr.data.server(res, error)

    try {
        const { _id } = body
        delete body._id

        if (!_id) {
            const { error } = await User.create(session, body)
            if (error) return throwErr.server(res, error)
        } else {
            const user = await User.data(session, { _id })
            if (!user) return throwErr.server(res, userErr)

            const { error } = await user.modify(session, body)
            if (error) return throwErr.server(res, error)
        }

        res.redirect(usersUrl)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/user/update/condition', User.verify, [ validateCondition() ], validationCheck, async (req, res) => {
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


router.post('/user/delete', User.verify, async (req, res) => {
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