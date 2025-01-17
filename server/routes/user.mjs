const router = require('express').Router()
const mysql = require('../tools/mysql')
const throwErr = require('../tools/error').data

/* Settings */
import config from '../../config.mjs'
import db from '../settings/mysql.mjs'

/* Registry */
import length from '../../client/global/modules/registry/length.mjs'
import { formSelectors } from '../../client/global/modules/registry/selectors.mjs'

/* Assets */
import Site from '../assets/site.mjs'
import User from '../assets/user.mjs'
import { formInput } from '../../client/global/modules/assets/html.mjs'

/* Tools */
import Query from '../tools/query.mjs'
import { respond404 } from '../tools/response.mjs'
import { calculateHourAge } from '../../client/global/modules/tools/date.mjs'
import { capitalizeEach } from '../../client/global/modules/tools/string.mjs'

/* HTML Builders */
import { Label, Input, Button } from '../html/user.mjs'

/* Validators */
import validationCheck, { validateName, validateGender, validateEmail, validateTel } from '../validators/default.mjs'


const query = {
    users: new Query(db.online, 'users'),
    registration: new Query(db.online, 'user_registration'),
}



router.use((req, res, next) => {

    if (req.session.user) {
        const active = 'class="item active"'

        res.hbs.nav = {
            active,

            profile: 'class="item" href="/profile"',
            account: 'class="item" href="/account"',
            security: 'class="item" href="/security"',
        }
        res.hbs.style = {
            page: 'max-width: 640px; margin: 0 auto;',
        }
    }

    res.hbs.set = function(key, params = {}) {
        let { inclKey, navKey, titlePfx } = params

        const includer = require('../includes/src')
        const includes = require('../includes/user')

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

        return hbs
    }

    next()
})


router.get('/authenticate', async (req, res) => {
    try {
        const { branch: _branch, user: _id, site: _siteId, status } = req.query
        if (!_branch || !_siteId) return respond404(res)

        const siteId = +atob(_siteId)
        const branch = atob(_branch)

        const key = 'auth'
        let { hbs } = res
        hbs = hbs.set(key, { titlePfx: 'User Authentication' })

        const user = await User.data({ ...res.session, user: true }, { _id })
        const site = await new Site(branch, siteId)

        if (!user || !site) return respond404(res)

        const { address } = site
        const { sessionUrl, tokenAge } = config.session
        const { clientIp } = req.session
        const { token, verified } = await user.token({ clientIp })
        let value = config.notification.email.authToken
            ? ''
            : token

        hbs.status = status
        hbs.actionUrl = address + sessionUrl
        hbs.tokenAge = `${tokenAge} minute${tokenAge > 1 ? 's' : ''}`
        hbs.userValue = _id
        hbs.script = `$('.container').show()`

        if (verified) {
            value = token
            hbs.script = `$('form').submit()`
        }

        hbs.formId = formSelectors.user.authFormId
        hbs.input = {
            token: Input.token({ placeholder: 'Token', value }),
        }
        hbs.button = {
            auth: Button.authenticate({ class: 'fluid ui blue button' }),
        }

        return res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router