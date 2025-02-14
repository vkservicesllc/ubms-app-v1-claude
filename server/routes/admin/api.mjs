const router = require('express').Router()
const throwErr = require('../../tools/error').api

/* Assets */
import User, { superAdminUserOnly, developerOnly } from '../../assets/user.mjs'
import Team from '../../assets/team.mjs'
import Company, { Owner } from '../../assets/company.mjs'
import Carrier from '../../assets/carrier.mjs'

/* Tools */
import { capitalizeFirst } from '../../../client/global/modules/tools/string.mjs'



router.post('/log/:env/:_id', User.verify, superAdminUserOnly, async (req, res) => {
    try {
        const { env, _id } = req.params
        let log

        switch (env) {

            case 'user':
                const user = await User.data(res.session, { _id })
                log = await user.report(res.session)
                break

        }

        res.send(log)
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/flush/:env/:_id/:target?', User.verify, developerOnly, async (req, res) => {
    try {
        const { env, _id, target } = req.params
        let success = false

        const Src = { User, Team, Individual, Company, Owner, Carrier }[capitalizeFirst(env)]
        const instance = await Src.data(res.session, { _id })
        const [ result ] = await instance.flush(target)
        if (result.affectedRows == 1) success = true

        res.send({ success })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})



/* USER */


router.post('/users', User.verify, async (req, res) => {
    try {
        //! It may be necessary to remove the branch restriction, since other branches may also need this info
        res.send({ data: await User.list(res.session) })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/user/:_id', User.verify, async (req, res) => {
    try {
        const { _id } = req.params
        const { status } = res.session.user
        let data = await User.data(res.session, { _id })

        if (!data || (data.status[0] == 'D' && status[0] != 'D')) data = {}

        res.send(data)
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})



/* COMPANY */


router.post('/companies', User.verify, async (req, res) => {
    try {
        //! It may be necessary to apply filters when requested in branches other than admin
        res.send({ data: await Company.list(res.session) })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/company/:_id/teams', User.verify, superAdminUserOnly, async (req, res) => {
    try {
        const { _id } = req.params
        const company = await Company.data(res.session, { _id })
        const companyTeams = await company.teams(res.session)

        res.send({ data: companyTeams })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/company-owners', User.verify, superAdminUserOnly, async (req, res) => {
    try {
        res.send({ data: await Owner.list(res.session) })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/company-owner/:_id', User.verify, superAdminUserOnly, async (req, res) => {
    try {
        const { _id } = req.params

        res.send(await Owner.data(res.session, { _id }))
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})



/* TEAM */


router.post('/teams', User.verify, superAdminUserOnly, async (req, res) => {
    try {
        res.send({ data: await Team.list(res.session) })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/team/:_id', User.verify, superAdminUserOnly, async (req, res) => {
    try {
        const { _id } = req.params

        res.send({ data: await Team.data(res.session, { _id }) })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.delete('/team/:_id', User.verify, superAdminUserOnly, async (req, res) => {
    try {
        let deleted = false, error
        const { _id } = req.params
        const team = await Team.data(res.session, { _id })

        try {
            ({ deleted, error } = await team.delete(res.session))
        } catch (err) {
            console.error(err)
            error = 'DB Error: Failed to delete Team'
        }

        res.send({ deleted, error })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/team/:_id/:relType', User.verify, superAdminUserOnly, async (req, res) => {
    try {
        let error
        const { _id, relType } = req.params
        const team = await Team.data(res.session, { _id })

        let data = await team.data(res.session, relType)

        res.send({ data: { team, data } })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/team/:_id/:relType/:_relId', User.verify, superAdminUserOnly, async (req, res) => {
    try {
        const { _id, relType, _relId } = req.params
        const { action } = req.body
        const team = await Team.data(res.session, { _id })

        const { modified, error } = await team.manage(res.session, relType, action, _relId)

        res.send({ modified, error })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})



export default router