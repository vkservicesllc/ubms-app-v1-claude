const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assests */
import User from '../../assets/user.mjs'

/* Validators */
import validationCheck from '../../validators/default.mjs'



/* User Resource */

router.post('/user/:_id/app/settings', User.verify, async (req, res) => {
    try {
        const { _id } = req.params
        if (_id != res.session.user._id)
            return throwErr.server(res, 'Server Internal Error: Invalid User')

        const user = await User.data(res.session, { _id })
        await user.settings(res.session, req.body)

        res.redirect('/settings')
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router