const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assets */
import User from '../../assets/user.mjs'
import Team from '../../assets/team.mjs'

/* Constants */
import { navBuilder } from './constants.mjs'



router.get('/', User.verify, Team.verify, async (req, res) => {
    try {
        const key = 'vehicles'
        let { hbs } = res
        hbs = await hbs.set(key)

        const { active } = hbs.nav
        hbs.nav.left.vehicles = active

        hbs.nav.top.items = navBuilder.simple([
            [ '/vehicles/trucks', 'Trucks' ],
            [ '/vehicles/trailer', 'Trailers' ],
            [ '/vehicles/vans', 'Vans' ],
        ])

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router