// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../tools/utils/error')

/* Tools */
import Individual from '../tools/core/individual.mjs'
import User, { Role } from '../tools/core/user.mjs'
import Team from '../tools/core/team.mjs'
import Company, { Owner as CompanyOwner } from '../tools/core/company.mjs'
import Carrier from '../tools/core/carrier.mjs'
import Driver, { Application as DriverApplication, Citation, Accident } from '../tools/core/driver.mjs'
import { capitalizeFirst } from '../../client/global/modules/tools/utils/string.mjs'


// ==== SETUP ==== //


export const sessionDetails = (req, res) => {
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

        }

        res.json(data)
    } catch (err) {
        sendError.server(res, err, true)
    }
}



// ==== ROUTES ==== //


router.post('/login', User.mw.login)


router.get('/session/keep-alive', User.mw.verify, (req, res) => {
    if (req.session) req.session.touch()
    return res.sendStatus(204)
})


router.post('/session/:prop', User.mw.verify, sessionDetails)


router.post('/source/:source/:_id?', User.mw.verify, async (req, res) => {
    const { filter, self, call } = req.query
    const { source } = req.params
    let { _id } = req.params
    let Src, result

    switch (source) {

        case 'user':
            Src = User
            result = {
                statuses: User.list.status,
                locations: User.list.location,
            }
            if (self === 'true') _id = req.session.user
            break

        case 'company':
            Src = Company
            result = {
                categories: Company.list.category,
                types: Company.list.type,
            }
            break

        case 'driver':
            Src = Driver
            result = {
                positions: Driver.list.position,
            }
            break

        case 'driver-application':
            Src = DriverApplication
            result = {
                violations: Citation.list.violation,
                accidents: Accident.list.accident,
            }
            break

    }

    if (filter) {
        if (_id && Src) {
            const instance = await Src.data(res.session, { _id })
            result = call === 'true'
                ? await instance[filter](res.session)
                : instance[filter]
        } else
            result = result[filter]
    }

    res.json(result)
})


router.post('/unique/:src', User.mw.verify, async (req, res) => {
    try {
        const { src } = req.params
        const Src = {
            'user': User,
            'role': Role,
            'team': Team,
            'individual': Individual,
            'company': Company,
            'company-owner': CompanyOwner,
            'carrier': Carrier,
        }[src]

        const { _id } = req.body
        delete req.body._id

        let searchedInst = await Src.fetch(res.session, req.body)
        if (Array.isArray(searchedInst)) [ searchedInst ] = searchedInst
        if (!searchedInst) return res.json({ unique: true, original: false })

        if (!_id) return res.json({ unique: false, original: false })

        const inst = await Src.fetch(res.session, { _id })
        if (!inst) throw new Error(`${Src.name} not found`)

        res.json({ unique: false, original: searchedInst._id === inst._id })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


// router.post('/unique/:src', User.mw.verify, async (req, res) => {
//     try {
//         const { src } = req.params
//         const Src = {
//             'user': User,
//             'role': Role,
//             'team': Team,
//             'individual': Individual,
//             'company': Company,
//             'company-owner': CompanyOwner,
//             'carrier': Carrier,
//         }[src]
//         const response = { unique: true }

//         const { _id } = req.body
//         delete req.body._id

//         if (_id) {
//             const inst = await Src.fetch(res.session, { _id })
//             if (!inst || !inst.unique) throw new Error('Invalid instance')

//             return res.json(await inst.unique(req.body))
//         }

//         let data = await Src.fetch(res.session, req.body)
//         if (Array.isArray(data)) data = data[0]
//         response.unique = !data

//         res.json(response)
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })



// ==== EXPORT ==== //

export default router