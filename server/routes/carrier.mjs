// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../tools/utils/error')

/* Tools */
import User from '../tools/core/user.mjs'
import Team from '../tools/core/team.mjs'
import { inPGroup } from '../tools/core/user/permissions.mjs'
import { capitalizeEach } from '../../client/global/modules/tools/utils/string.mjs'

/* Forms */
import UserForm from '../tools/form/user.mjs'


// ==== SETUP ==== //


router.use((req, res, next) => {
    if (req.session.user) {
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
        let { inclKey, titlePfx } = params

        const includer = require('../includes/src')
        const includes = require('../includes/carrier')

        const { user, team } = res.session
        const hbs = { ...this }

        if (user) {
            hbs.user = {}

            const props = [
                '_id',
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
            hbs.user.name = user.fullName('AL')

            const permissions = await user.permissions(res.session)
            const { DS } = user
            hbs.PG = {
                vhl: inPGroup('d:vhl', permissions, DS),
                drv: inPGroup('d:drv', permissions, DS),
                dsp: inPGroup('d:dsp', permissions, DS),
                prl: inPGroup('d:prl', permissions, DS),
                rtx: inPGroup('d:rtx', permissions, DS),
            }

            if (user.unscoped) {
                hbs.teamDropdown = '<span class="item" id="team-item"><i class="universal access icon"></i> <small style="font-size: .55em;">Universal<br/>Access</small></span>'
                hbs.teamSelect = true
            } else if (team) {
                hbs.team = {}
                hbs.teamSelect = false
                hbs.teamDropdown = ''
                hbs.teamNav = true

                const props = [
                    'name',
                    'description',
                ]
                for (const prop of props)
                    hbs.team[prop] = team[prop]

                const settings = await user.settings()
                const teams = await user.fetch('jx.teams')

                if (teams.length <= 1) hbs.teamNav = false

                if (settings?.carrier?.teamSelect == '1') {
                    const t = `\t`.repeat(2)

                    hbs.teamSelect = true
                    hbs.teamDropdown = `<span class="item" id="team-item">${team.name}</span>`
                    if (teams.length > 1) {
                        hbs.teamDropdown = `<div class="ui inline dropdown item" id="team-item">`
                        hbs.teamDropdown += `\n${t}\t${team.name}`
                        hbs.teamDropdown += `\n${t}\t<i class="dropdown icon"></i>`
                        hbs.teamDropdown += `\n${t}\t<div class="menu">`
                        teams.forEach(item => {
                            if (item._id != team._id)
                                hbs.teamDropdown += `\n${t}\t\t<a class="item switch-team" data-team-id="${item._id}">${item.name}</a>`
                        })
                        hbs.teamDropdown += `\n${t}\t</div>`
                        hbs.teamDropdown += `\n${t}</div>`
                    }
                }
            }
        }

        if (!inclKey) inclKey = key
        if (!titlePfx) titlePfx = capitalizeEach(key.replace(/\./g, ' '))

        hbs.title = `${titlePfx} - ${hbs.title}`
        hbs.includes = includer.render(includes[inclKey])

        return hbs
    }

    next()
})



// ==== ROUTES ==== //



router.get('/', async (req, res, next) => {
    if (req.session.user) return next()

    try {
        const key = 'login'
        let { hbs } = res
        hbs = await hbs.set(key)

        const labelClass = 'ui primary tag label'

        hbs.label = {
            username: UserForm.username.text.label({ class: labelClass }),
            password: UserForm.password.text.label({ class: labelClass }),
        }
        hbs.input = {
            username: UserForm.username.text.input(),
            password: UserForm.password.text.input(),
        }

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
}, User.mw.verify, async (req, res) => {
    try {
        const { user } = res.session
        const { team } = req.session

        if (team || user.unscoped) {
            const settings = await user.settings()
            let url = user.events.lastUrl

            if ([0, '0', undefined].includes(settings?.carrier?.lastUrl)) url = '/dashboard'

            return res.redirect(url)
        }

        const teams = await user.fetch('jx.teams')
        if (teams.length === 1) {
            req.session.team = teams[0]._id
            return res.redirect('/')
        }

        const key = 'team'
        let { hbs } = res
        hbs = await hbs.set(key)
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
        sendError.server(req, res, err)
    }
})


router.post('/session/team/enter', User.mw.verify, async (req, res) => {
    const { _id } = req.body
    const team = await Team.fetch(res.session, { _id })

    if (team) req.session.team = _id

    res.redirect('/')
})


router.post('/session/team/exit', User.mw.verify, (req, res) => {
    if (req.session.team) delete req.session.team

    res.redirect('/')
})


router.get('/dashboard', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const key = 'dash'
        let { hbs } = res
        hbs = await hbs.set(key)

        const { active } = hbs.nav
        hbs.nav.left.dash = active

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/settings', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const key = 'settings'
        let { hbs } = res
        hbs = await hbs.set(key)

        res.render(`app/${key}`, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router