// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../tools/utils/error')

/* Tools */
import Individual from '../tools/core/individual.mjs'
import User, { Role } from '../tools/core/user.mjs'
import Team from '../tools/core/team.mjs'
import Company, { Owner } from '../tools/core/company.mjs'
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

        res.send(data)
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



// ==== EXPORT ==== //

export default router