const router = require('express').Router()
const throwErr = require('../../tools/utils/error').data

/* Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Company from '../../tools/core/company.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application, Citation, Accident, Employment } from '../../tools/core/driver.mjs'
import { inPEnvironment, withPrivileges } from '../../tools/core/user/permissions.mjs'

/* Validators */
import validationCheck from '../../tools/form/validator.mjs'
import { validateApplicant, dynamicValidator as dynamicApplicantValidator } from '../driver/resource.mjs'

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
        if (!withPrivileges('d:drv/apl', 'create', permissions, DS))
            return throwErr.auth(res)

        const { company: route } = req.body
        delete req.body.company

        if (route) {
            const carrier = await Carrier.data(res.session, { route })
            req.body.carrierId = await carrier.id()
        }

        if (req.body.lastName) next()
        else {
            const { email, _teamId, cdlRole, carrierId, selfAssign } = req.body
            let { team } = res.session
            if (!team && _teamId) team = await Team.data(res.session, { _id: _teamId })

            await Application.invite({ ...res.session, team }, email, cdlRole, carrierId, selfAssign === 'on')

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

        // const { team } = res.session

        req.body.cdlRole = +req.body.cdlRole
        req.body.selfAssign = !!req.body.selfAssign

        //! There is no Department Switch, therefore identifying department by Team Settings
        // req.body.deptId = team.settings.deptId[0]

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
        if (!withPrivileges('d:drv/apl', 'delete', permissions, DS))
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

router.post('/driver/application/prev-employer/delete', User.verify, Team.verify, async (req, res) => {
    try {
        const { _id } = req.body
        const employment = await Employment.data(res.session, { _id })
        const { formId } = employment

        const { error } = await employment.delete(res.session)
        if (error) return res.send(error)

        res.redirect(`/drivers/application/${formId}/e-form/prev-employers`)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})

router.post('/driver/application/:formId/edit/:step', User.verify, Team.verify,
    dynamicApplicantValidator.applications, validationCheck,
    async (req, res) => {
        try {
            const { user } = res.session
            const { DS } = user
            const permissions = await user.permissions(res.session)
            // if (!withPrivileges('d:drv/apl', ['modify', 'update'], permissions, DS))
            //! NOT sure about update permission
            if (!withPrivileges('d:drv/apl', 'modify', permissions, DS))
                return throwErr.auth(res)

            const { formId, step } = req.params
            const application = await Application.data(res.session, { formId })
            if (!application) return throwErr.server(res, 'Server Internal Error: Unidentified Application')

            const { error } = await application.modify(res.session, step, req.body)
            if (error) return throwErr.server(res, error)

            res.redirect(`/drivers/application/${formId}/e-form?${step}`)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }
)

router.post('/driver/application/:formId/delete/:target', User.verify, Team.verify, async (req, res) => {
    try {
        const { user } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!withPrivileges('d:drv/apl', 'modify', permissions, DS))
            return throwErr.auth(res)

        const { target } = req.params
        const { _id } = req.body
        let formId, dir, error

        switch (target) {
            case 'citation':
                const citation = await Citation.data(res.session, { _id })
                error = (await citation.delete(res.session)).error
                if (error) return throwErr.data(error)

                formId = citation.formId
                dir = 'citations'
                break
            case 'accident':
                const accident = await Accident.data(res.session, { _id })
                error = (await accident.delete(res.session)).error
                if (error) return throwErr.data(error)

                formId = accident.formId
                dir = 'accidents'
                break
        }

        res.redirect(`/drivers/application/${formId}/e-form/${dir}`)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router