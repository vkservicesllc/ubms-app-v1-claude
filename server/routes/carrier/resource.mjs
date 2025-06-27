const router = require('express').Router()
const throwErr = require('../../tools/utils/error').data

/* Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Company from '../../tools/core/company.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'
import { inPEnvironment } from '../../tools/core/user/permissions.mjs'

/* Validators */
import validationCheck from '../../tools/form/validator.mjs'
import { validateApplicant } from '../driver/resource.mjs'

const url = {
    drivers: {
        applications: '/drivers/applications',
    },
}



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
        const { user } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!DS && !inPEnvironment('d:drv/apl', permissions, DS) && !permissions['d:drv/apl'].includes('2'))
            return throwErr.auth(res)

        const { company: route } = req.body
        delete req.body.company

        if (route) {
            const carrier = await Carrier.data(res.session, { route })
            req.body.carrierId = await carrier.id()
        }

        if (req.body.lastName) next()
        else {
            const { email, carrierId } = req.body
            await Application.invite(res.session, email, carrierId)

            res.redirect(url.drivers.applications)
        }
    } catch (err) {
        throwErr.server(res, null, err)
    }
}, validateApplicant, validationCheck, async (req, res) => {
    try {
        const { status, statusExpiresOn } = req.body
        if (status == 2 && !statusExpiresOn)
            return throwErr.server(res, 'DB Error: Invalid data provided', err)

        const { team } = res.session

        req.body.selfAssign = !!req.body.selfAssign

        //! There is no Department Switch, therefore identifying department by Team Settings
        req.body.deptId = team.settings.deptId[0]

        const { error } = await Application.create(res.session, req.body)
        if (error) return throwErr.server(res, error, err)

        res.redirect(url.drivers.applications)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})

router.post('/driver/application/delete', User.verify, Team.verify, async (req, res) => {
    try {
        const { user } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!DS && !inPEnvironment('d:drv/apl', permissions, DS) && !permissions['d:drv/apl'].includes('5'))
            return throwErr.auth(res)

        const { _id } = req.body
        const application = await Application.data(res.session, { _id })

        const { error } = await application.delete(res.session)
        if (error) return throwErr.server(res, error)

        res.redirect(url.drivers.applications)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router