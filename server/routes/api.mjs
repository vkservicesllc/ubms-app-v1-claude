const router = require('express').Router()
const mysql = require('../tools/mysql')
const throwErr = require('../tools/error').api

/* Assests */
import Individual from '../assets/individual.mjs'
import User, { adminBranchOnly, superAdminUserOnly, developerOnly } from '../assets/user.mjs'
import Team from '../assets/team.mjs'
import Company, { Owner } from '../assets/company.mjs'
import Carrier from '../assets/carrier.mjs'
// import School from '../assets/school.mjs'

/* Tools */
import { capitalizeFirst } from '../../client/global/modules/tools/string.mjs'



router.get('/session/keep-alive', User.verify, (req, res) => res.send('OK'))


router.post('/login', User.login)


router.post('/session/:prop', User.verify, (req, res) => {
    try {
        const { prop } = req.params
        let data = {}

        switch (prop) {

            case 'current':
                const { maxAge, logoutUrl } = res.session
                data = { maxAge, logoutUrl }
                break

            default:
                data = res.session.user[req.params.prop]
                const { key } = req.query
                if (key) data = data[key]

        }

        res.send(data)
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/unique/:env', User.verify, async (req, res) => {
    try {
        const response = { unique: true }
        const { env } = req.params
        const src = { User, Team, Individual, Company, Owner, Carrier }  //! for later: School

        const { found, error } = await src[capitalizeFirst(env)].find(res.session, req.body)
        response.unique = !found
        response.error = error

        res.send(response)
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


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

        const Src = { User, Team, Individual, Company, Owner }[capitalizeFirst(env)]  //! for later: Carrier, School
        const instance = await Src.data(res.session, { _id })
        const [ result ] = await instance.flush(target)
        if (result.affectedRows == 1) success = true

        res.send({ success })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/assets/:source', User.verify, (req, res) => {
    const { source } = req.params
    const { filter } = req.query
    let result

    switch (source) {

        case 'company':
            result = {
                categories: Company.categoryList,
                types: Company.typeList,
            }
            break

    }

    if (filter) result = result[filter]

    res.send(result)
})



/* USER */


router.post('/users', User.verify, adminBranchOnly, async (req, res) => {
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


router.post('/company-owners', User.verify, adminBranchOnly, superAdminUserOnly, async (req, res) => {
    try {
        res.send({ data: await Owner.list(res.session) })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/company-owner/:_id', User.verify, adminBranchOnly, superAdminUserOnly, async (req, res) => {
    try {
        const { _id } = req.params

        res.send(await Owner.data(res.session, { _id }))
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})



/* TEAM */


router.post('/teams', User.verify, adminBranchOnly, superAdminUserOnly, async (req, res) => {
    try {
        res.send({ data: await Team.list(res.session) })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/team/:_id', User.verify, adminBranchOnly, superAdminUserOnly, async (req, res) => {
    try {
        const { _id } = req.params

        res.send({ data: await Team.data(res.session, { _id }) })
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.delete('/team/:_id', User.verify, adminBranchOnly, superAdminUserOnly, async (req, res) => {
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



export default router