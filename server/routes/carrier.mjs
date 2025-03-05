const router = require('express').Router()
const throwErr = require('../tools/error').data

/* Registry */
import length from '../../client/global/modules/registry/length.mjs'
import { formSelectors } from '../../client/global/modules/registry/selectors.mjs'

/* Assets */
import User from '../assets/user.mjs'
import Team from '../assets/team.mjs'
import { inPGroup } from '../assets/user/permissions.carrier.mjs'

/* HTML Builders */
import { Label, Input, Button } from '../html/user.mjs'

/* Tools */
import { capitalizeEach } from '../../client/global/modules/tools/string.mjs'



router.use((req, res, next) => {

    if (req.session.user && req.session.team) {
        const active = 'active '
        const inactive = ''

        res.hbs.nav = {
            active,

            left: {
                dash: inactive,
                vehicles: inactive,
                drivers: inactive,
                dispatch: inactive,
                payroll: inactive,
                ifta: inactive,
            },
            top: {
                items: '',
            },
        }
    }

    res.hbs.set = async function(key, params = {}) {
        let { inclKey, navKey, titlePfx } = params

        const includer = require('../includes/src')
        const includes = require('../includes/carrier')

        const { user, team } = res.session
        const hbs = { ...this }
        const { nav } = hbs

        if (user) {
            hbs.user = {}

            const props = [
                '_id',
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

            const permissions = await user.permissions(res.session)
            const { DS } = user
            hbs.PG = {
                vhl: inPGroup('d:vhl', permissions, DS),
                drv: inPGroup('d:drv', permissions, DS),
                dsp: inPGroup('d:dsp', permissions, DS),
                prl: inPGroup('d:prl', permissions, DS),
                rtx: inPGroup('d:rtx', permissions, DS),
            }
        }

        if (team) {
            hbs.team = {}

            const props = [
                'name',
                'description',
            ]
            for (const prop of props)
                hbs.team[prop] = team[prop]
        }

        if (!inclKey) inclKey = key
        if (!titlePfx) titlePfx = capitalizeEach(key.replace(/\./g, ' '))

        hbs.title = `${titlePfx} - ${hbs.title}`
        hbs.includes = includer.render(includes[inclKey])

        return hbs
    }

    next()
})



router.get('/', async (req, res, next) => {
    if (req.session.user) return next()

    try {
        const key = 'login'
        let { hbs } = res
        hbs = await hbs.set(key)

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
            login: Button.login({
                class: 'ui fluid big primary submit right labeled icon button',
                content: 'Sign in <i class="sign in alternate icon"></i>',
            }),
        }

        hbs.formId = formSelectors.user.loginFormId

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
}, User.verify, async (req, res) => {
    try {
        const { user } = res.session
        const { team } = req.session
        if (team) return res.redirect(user.lastUrl)

        const key = 'team'
        let { hbs } = res
        hbs = await hbs.set(key)

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


router.post('/session/team/enter', User.verify, async (req, res) => {
    let { lastUrl } = res.session.user
    const { _id } = req.body
    const team = await Team.data(res.session, { _id })

    if (team) {
        if (!lastUrl || lastUrl == '/') lastUrl = 'dashboard'
        req.session.team = _id
    }

    res.redirect(lastUrl)
})


router.post('/session/team/exit', User.verify, (req, res) => {
    if (req.session.team) delete req.session.team

    res.redirect('/')
})


router.get('/dashboard', User.verify, Team.verify, async (req, res) => {
    try {
        const key = 'dash'
        let { hbs } = res
        hbs = await hbs.set(key)

        const { active } = hbs.nav
        hbs.nav.left.dash = active

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/settings', User.verify, Team.verify, async (req, res) => {
    try {
        const key = 'settings'
        let { hbs } = res
        hbs = await hbs.set(key)

        res.render(`app/${key}`, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router