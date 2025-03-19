const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assests */
import User from '../../assets/user.mjs'
import Team from '../../assets/team.mjs'
import Company from '../../assets/company.mjs'
import Carrier from '../../assets/carrier.mjs'

/* Validators */
import validationCheck from '../../validators/default.mjs'
import { validateApplicant } from '../../validators/driver.mjs'



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



/* Driver Application Resource */

router.post('/driver/application/new', User.verify, Team.verify, async (req, res, next) => {
    try {
        const { company: route } = req.body
        delete req.body.company

        if (route) {
            const carrier = await Carrier.data(res.session, { route })
            req.body.carrierId = await carrier.id()
        }

        if (req.body.lastName) next()
        else res.send({
            mw: 'primary form',
            body: req.body,
        })
    } catch (err) {
        throwErr.server(res, null, err)
    }
}, validateApplicant, async (req, res) => {
    try {
        const { legalStatus, LS_expiresOn } = req.body
        if (legalStatus == 2 && !LS_expiresOn)
            return throwErr.server(res, 'DB Error: Invalid data provided', err)

        res.send({
            mw: 'extra form',
            body: req.body,
        })
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router