const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assets */
import User from '../../assets/user.mjs'
import Team from '../../assets/team.mjs'
import { inPEnvironment } from '../../assets/user/permissions.carrier.mjs'

/* Tools */
import { respond404 } from '../../tools/response.mjs'

/* Constants */
import { navBuilder } from './constants.mjs'



const navItems = (permissions, DS, activeIdx) => {
    const items = []

    const params = {
        'd:drv/lds': [ '/drivers/pre-applications', 'Pre-Applications' ],
        'd:drv/apl': [ '/drivers/applications', 'Applications' ],
        'd:drv/emp': [ '/drivers/pre-employments', 'Pre-Employments' ],
        'd:drv/drv': [ '/drivers/hired', 'Hired Contractors' ],
        'd:drv/agr': [ '/drivers/pay-agreements', 'Pay Agreements' ],
        'd:drv/lvn': [ '/drivers/leaving', 'Leaving Process' ],
    }
    let i = 0

    for (const env in params) {
        if (inPEnvironment(env, permissions, DS)) {
            if (activeIdx === i) params[env].push(true)
            items.push(params[env])
        }

        i++
    }

    return items
}


router.get('/', User.verify, Team.verify, async (req, res) => {
    try {
        const key = 'drivers'
        let { hbs } = res
        hbs = await hbs.set(key)
        const { drv } = hbs.PG

        if (!drv) return res.redirect(res.session.defUrl)

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        const { user } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS))

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/pre-applications', User.verify, Team.verify, async (req, res) => {
    res.send('PRE-APPLICATIONS')
})


router.get('/applications', User.verify, Team.verify, async (req, res) => {
    const key = 'drivers.applications'
    let { hbs } = res
    hbs = await hbs.set(key)

    const { user } = res.session
    const { DS } = user
    const permissions = await user.permissions(res.session)
    if (!inPEnvironment('d:drv/apl', permissions, DS))
        return res.redirect(res.session.defUrl)

    const { active } = hbs.nav
    hbs.nav.left.drivers = active

    hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 1))

    hbs.permissions = {
        create: DS || permissions['d:drv/apl'].includes('2'),
    }

    res.render(key.replace('.', '/'), hbs)
})



export default router