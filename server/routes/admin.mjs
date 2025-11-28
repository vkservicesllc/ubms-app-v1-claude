const router = require('express').Router()
const sendError = require('../tools/utils/error')

/* Tools */
import User from '../tools/core/user.mjs'
import { capitalizeEach } from '../../client/global/modules/tools/utils/string.mjs'

/* Middleware */
import login from './admin/mw/login.mjs'



router.use((req, res, next) => {
    res.hbs.docAttrs = ''

    const theme = req.cookies['document.theme']

    if (!theme) res.cookie('document.theme', '', { maxAge: 1000 * 60 * 60 * 24 * 365 })
    else res.hbs.docAttrs = ` data-theme="${theme}"`

    if (req.session.user) {
        const active = ' class="is-active"'
        const inactive = ''

        res.hbs.nav = {
            active,

            'dash': inactive,
            'charts': inactive,
            'companies': inactive,
            'owners': inactive,
            'branches': inactive,
            'sites': inactive,
            'users': inactive,
            'teams': inactive,

            'devData': inactive,
            'devLogs': inactive,
        }
    }

    res.hbs.set = function(key, params = {}) {
        let { inclKey, navKey, titlePfx } = params

        const includer = require('../includes/src')
        const includes = require('../includes/admin')

        const { user } = res.session
        const hbs = { ...this }
        const { nav } = hbs

        if (!inclKey) inclKey = key
        if (!titlePfx) titlePfx = capitalizeEach(key.replace(/\-/g, ' '))

        hbs.title = `${titlePfx} - ${hbs.title}`
        hbs.includes = includer.render(includes[inclKey])

        if (nav) {
            if (!navKey) navKey = key
            const { active } = nav

            nav[navKey] = active
        }
        if (user) {
            const { _id, username, avaSrc, status, DS, DSA } = user
            hbs.user = { _id, name: user.fullName('AL'), username, avaSrc, status: status[1], DS, DSA }
            hbs.user.D = user.status[0] == 'D'
        }

        return hbs
    }

    next()
})


router.get('/init', User.mw.initialize)


router.get('/', login, User.mw.verify, async (req, res) => {
    try {
        const key = 'dash'
        let { hbs } = res
        hbs = hbs.set(key)

        res.render(key, hbs)
    } catch (err) {
        sendError.server(res, err)
    }
})


router.get('/charts', User.mw.verify, (req, res) => {
    try {
        const key = 'charts'
        let { hbs } = res
        hbs = hbs.set(key)

        res.render(key, hbs)
    } catch (err) {
        sendError.server(res, err)
    }
})


router.get('/settings', User.mw.verify, (req, res) => {
    try {
        const key = 'settings'
        let { hbs } = res
        hbs = hbs.set(key)

        res.render(key, hbs)
    } catch (err) {
        sendError.server(res, err)
    }
})



export default router