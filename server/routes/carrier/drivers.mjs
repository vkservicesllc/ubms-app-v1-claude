const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assets */
import User from '../../assets/user.mjs'
import Team from '../../assets/team.mjs'



router.get('/', User.verify, Team.verify, (req, res) => {
    try {
        const key = 'drivers'
        let { hbs } = res
        hbs = hbs.set(key)

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        const items = [
            [ '/drivers/pre-applications', 'Pre-Applications' ],
            [ '/drivers/applications', 'Applications' ],
        ]
        items.forEach(item => hbs.nav.top.items += `\n\t\t\t<a class="item" href="${item[0]}">${item[1]}</a>`)

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