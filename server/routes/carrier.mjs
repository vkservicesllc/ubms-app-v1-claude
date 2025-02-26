const router = require('express').Router()
const throwErr = require('../tools/error').data

/* Assets */
import User from '../assets/user.mjs'

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

        if (!inclKey) inclKey = key
        if (!titlePfx) titlePfx = capitalizeEach(key.replace(/\-/g, ' '))

        hbs.title = `${titlePfx} - ${hbs.title}`
        hbs.includes = includer.render(includes[inclKey])

        return hbs
    }

    next()
})



router.get('/', (req, res) => {
    try {
        const key = 'login'
        let { hbs } = res
        hbs = hbs.set(key)

        hbs.input = {
            username: Input.username(),
            password: Input.password(),
        }
        hbs.label = {
            username: Label.username(),
            password: Label.password(),
        }
        hbs.bodyAttrs = ' class="light-blue lighten-5"'

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router