const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import { inPEnvironment } from '../../tools/core/user/permissions.mjs'
import { respond404 } from '../../tools/utils/response.mjs'
import { navBuilder } from './tools.mjs'



router.get('/', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const key = 'vehicles'
        let { hbs } = res
        hbs = await hbs.set(key)
        const { vhl } = hbs.PG

        if (!vhl) return res.redirect(res.session.defUrl)

        const { active } = hbs.nav
        hbs.nav.left.vehicles = active

        hbs.nav.top.items = navBuilder.simple([
            [ '/vehicles/trucks', 'Trucks' ],
            [ '/vehicles/trailer', 'Trailers' ],
            [ '/vehicles/vans', 'Vans' ],
        ])

        res.render(key, hbs)
    } catch (err) {
        sendError.server(res, err)
    }
})



export default router