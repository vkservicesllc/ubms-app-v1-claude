const router = require('express').Router()
const throwErr = require('../tools/utils/error').api

/* Tools */
import Individual from '../tools/core/individual.mjs'
import User, { Role } from '../tools/core/user.mjs'
import Team from '../tools/core/team.mjs'
import Company, { Owner } from '../tools/core/company.mjs'
import Carrier from '../tools/core/carrier.mjs'
import Driver from '../tools/core/driver.mjs'
import { capitalizeFirst } from '../../client/global/modules/tools/utils/string.mjs'




router.post('/login', User.login)


router.post('/login/validation', async (req, res) => {
    let validated = false
    const { username } = req.body

    const user = await User.data(res.session, { username })
    if (user) {
        const { applied: teams } = await user.teams({ user, ...res.session })
        validated = teams.length > 0
    }

    res.send({ validated })
})


router.get('/session/keep-alive', User.verify, (req, res) => res.send('OK'))


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


router.post('/unique/original/:env', User.verify, async (req, res) => {
    try {
        const { env } = req.params
        const { _id } = req.body
        delete req.body._id

        const Src = { Role }[capitalizeFirst(env)]
        let response = {}

        if (_id) {
            const instance = await Src.data(res.session, { _id })
            response = await instance.unique(res.session, req.body)
        } else {
            const { found, error } = await Src.find(res.session, req.body)
            response.unique = !found
            response.error = error
        }

        res.send(response)
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/source/:source/:_id?', User.verify, async (req, res) => {
    const { filter, self, call } = req.query
    const { source } = req.params
    let{ _id } = req.params
    let Src, result

    switch (source) {

        case 'user':
            Src = User
            result = {
                statuses: User.statusList,
                locations: User.locationList,
            }
            if (self == 'true') _id = req.session.user
            break

        case 'company':
            Src = Company
            result = {
                categories: Company.categoryList,
                types: Company.typeList,
            }
            break

        case 'driver':
            Src = Driver
            result = {
                positions: Driver.positionList,
            }
            break
    }

    if (filter) {
        if (_id && Src) {
            const instance = await Src.data(res.session, { _id })
            result = call == 'true'
                ? await instance[filter](res.session)
                : instance[filter]
        } else
            result = result[filter]
    }

    res.send(result)
})



export default router