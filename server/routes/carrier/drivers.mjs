const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assets */
import User from '../../assets/user.mjs'
import Team from '../../assets/team.mjs'

/* Constants */
import { navBuilder } from './constants.mjs'



router.get('/', User.verify, Team.verify, (req, res) => {
    try {
        const key = 'drivers'
        let { hbs } = res
        hbs = hbs.set(key)

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple([
            [ '/drivers/pre-applications', 'Pre-Applications' ],
            [ '/drivers/applications', 'Applications' ],
        ])

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/pre-applications', User.verify, Team.verify, (req, res) => {
    res.send('PRE-APPLICATIONS')
})


router.get('/applications', User.verify, Team.verify, (req, res) => {
    res.send('APPLICATIONS')
})



export default router