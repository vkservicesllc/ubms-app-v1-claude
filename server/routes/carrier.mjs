const router = require('express').Router()
const throwErr = require('../tools/error').data

/* Registry */
import length from '../../client/global/modules/registry/length.mjs'
import { formSelectors } from '../../client/global/modules/registry/selectors.mjs'

/* Assets */
import User from '../assets/user.mjs'
import Team from '../assets/team.mjs'

/* HTML Builders */
import { Label, Input, Button } from '../html/user.mjs'

/* Tools */
import { capitalizeEach } from '../../client/global/modules/tools/string.mjs'



router.use((req, res, next) => {

    if (req.session.user) {}

    res.hbs.set = function(key, params = {}) {
        let { inclKey, navKey, titlePfx } = params

        const includer = require('../includes/src')
        const includes = require('../includes/carrier')

        const { user } = res.session
        const hbs = { ...this }
        const { nav } = hbs

        if (user) {
            hbs.user = {}

            const props = [
                'name',
                'username',
                'firstName',
                'lastName',
                'alias',
                'sex',
                'email',
                'phone',
                'location',
                'status',
                'DS',
                'DSA',
                'avaSrc',
            ]
            for (const prop of props)
                hbs.user[prop] = user[prop]
        }

        if (!inclKey) inclKey = key
        if (!titlePfx) titlePfx = capitalizeEach(key.replace(/\-/g, ' '))

        hbs.title = `${titlePfx} - ${hbs.title}`
        hbs.includes = includer.render(includes[inclKey])

        return hbs
    }

    next()
})



router.get('/', (req, res, next) => {
    if (req.session.user) return next()

    try {
        const key = 'login'
        let { hbs } = res
        hbs = hbs.set(key)

        const labelClass = 'ui primary tag label'

        hbs.label = {
            username: Label.username({ class: labelClass }),
            password: Label.password({ class: labelClass }),
        }
        hbs.input = {
            username: Input.username(),
            password: Input.password(),
        }
        hbs.button = {
            login: Button.login({ class: 'ui fluid big primary submit button' }),
        }

        hbs.formId = formSelectors.user.loginFormId

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
}, User.verify, async (req, res) => {
    try {
        const { user } = res.session
        const key = 'home'
        let { hbs } = res
        hbs = hbs.set(key)

        const { applied: teams } = await user.teams(res.session)
        const t = `\t`.repeat(8)
        let menu = ''

        teams.forEach(team => menu += `\n${t}<div class="item" data-value="${team._id}">${team.name}</div>`)
        hbs.dropdown = {
            menu: {
                teams: menu,
            },
        }

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/session/team', User.verify, async (req, res) => {
    const { _id } = req.body
    const team = await Team.data(res.session, { _id })
console.log(res.session) //!TEMP
    res.send(team)
    res.redirect('/')
})



export default router