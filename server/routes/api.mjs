const router = require('express').Router()
const throwErr = require('../tools/error').api

/* Assets */
import Individual from '../assets/individual.mjs'
import User, { Role } from '../assets/user.mjs'
import Team from '../assets/team.mjs'
import Company, { Owner } from '../assets/company.mjs'
import Carrier from '../assets/carrier.mjs'

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


router.post('/unique/original/:env', User.verify, async (req, res) => {
    try {
        const { env } = req.params
        const { _id } = req.body
        delete req.body._id

        const Src = { Role }[capitalizeFirst(env)]
        const instance = await Src.data(res.session, { _id })

        res.send(await instance.unique(res.session, req.body))
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



export default router