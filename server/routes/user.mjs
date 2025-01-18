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
import { validateUsername, validatePassword, validateLocalReg } from '../validators/user.mjs'


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


router.get('/', async (req, res) => {
    try {
        const verified = await User.verify(req, res)
        if (verified) return res.redirect('/profile')

        res.redirect('/login')
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/login', async (req, res) => {
    try {
        const verified = await User.verify(req, res)
        if (verified) return res.redirect('/profile')

        const key = 'login'
        let { hbs } = res
        hbs = hbs.set(key)

        const labelClass = 'ui teal tag label'

        hbs.label = {
            username: Label.username({ class: labelClass }),
            password: Label.password({ class: labelClass }),
        }
        hbs.input = {
            username: Input.username(),
            password: Input.password(),
        }
        hbs.button = {
            login: Button.login({ class: 'ui fluid teal submit button' }),
        }

        hbs.formId = formSelectors.user.loginFormId

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/profile', User.verify, (req, res) => {
    try {
        const key = 'profile'
        let { hbs } = res
        hbs = hbs.set(key)

        const { firstName, lastName, alias, sex, DSA } = hbs.user
        const readOnly = !DSA

        hbs.formId = formSelectors.user.profileFormId
        hbs.input = {
            firstName: Input.firstName({ placeholder: 'Real First Name', value: firstName, readOnly }),
            alias: Input.alias({ placeholder: 'Alias', value: alias, readOnly }),
            lastName: Input.lastName({ placeholder: 'Last Name', value: lastName, readOnly }),
            genderM: Input.gender('m', { checked: sex === 1 }),
            genderF: Input.gender('f', { checked: sex === 0 }),
        }
        hbs.actionUrl = `/profile`

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/profile', User.verify, [
    validateName('firstName'),
    validateName('lastName'),
    validateName('alias'),
    validateGender(),
], validationCheck, async (req, res) => {
    try {
        const { error } = await res.session.user.modify(res.session, req.body)
        if (error) return throwErr.server(res, null, error)

        res.redirect('/profile')
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/account', User.verify, (req, res) => {
    try {
        const key = 'account'
        let { hbs } = res
        hbs = hbs.set(key)

        const { username, email, phone, location } = hbs.user

        hbs.formId = formSelectors.user.accountFormId
        hbs.label = {
            username: Label.username({ addClass: 'required' }),
            email: Label.email(),
            phone: Label.phone(),
        }
        hbs.input = {
            username: Input.username({ value: username, disabled: false }),
            email: Input.email({ value: email }),
            phone: Input.phone({ value: phone }),
        }
        hbs.actionUrl = `/account`
        hbs.nonUS = location[0] != 'US'

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/account', User.verify, [
    validateUsername(),
    validateEmail(),
    validateTel('phone'),
], validationCheck, async(req, res) => {
    try {
        const { error } = await res.session.user.modify(res.session, req.body)
        if (error) return throwErr.server(res, null, error)

        res.redirect('/account')
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/security', User.verify, (req, res) => {
    try {
        const key = 'security'
        let { hbs } = res
        hbs = hbs.set(key)

        hbs.formId = formSelectors.user.securityFormId
        hbs.actionUrl = `/security`

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/security', User.verify, [ validatePassword() ], validationCheck, async(req, res) => {
    try {
        //
    } catch (err) {
        throwErr.server(res, null, err)
    }
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


router.get('/register/:_id', async (req, res) => {
    try {
        const { _id } = req.params
        const { form: formId } = req.query

        const key = 'register'
        let { hbs } = res
        hbs = hbs.set(key)
        hbs.userRegistered = false
        hbs.validForm = true
        hbs.expiredForm = false

        const user = await User.data(res.session, { _id })
        if (!user) return respond404(res)

        if (user.username) hbs.userRegistered = true
        else if (!formId || user.decliner) hbs.validForm = false

        else {
            const userId = await user.id()
            const [ rows ] = await mysql.execute(query.registration.select('invitedAt', {
                match: { formId, userId },
            }))

            if (!rows.length) hbs.validForm = false
            else {
                const { invitedAt } = rows[0]
                const weekDay = new Date(invitedAt).getDay()
                let limit = 24
                if (weekDay == 4) limit = 72
                if (weekDay == 5) limit = 48

                if (calculateHourAge(invitedAt) > limit) hbs.expiredForm = true
                else {
                    hbs.user = {}

                    const props = [ 'name' ]
                    for (const prop of props)
                        hbs.user[prop] = user[prop]

                    hbs.formId = formSelectors.user.registerFormId
                    hbs.label = {
                        username: Label.username({ content: 'Create Username' }),
                        newPassword: Label.password({ purpose: 'new' }),
                        confPassword: Label.password({ purpose: 'repeat' }),
                    }
                    hbs.input = {
                        id: Input.id(_id),
                        formId: formInput({
                            type: 'hidden',
                            id: 'form-id',
                            name: 'formId',
                            value: formId,
                        }),
                        username: Input.username(),
                        newPassword: Input.password({ purpose: 'new' }),
                        confPassword: Input.password({ purpose: 'repeat' }),
                    }
                    hbs.length = {
                        password: length.user.password,
                    }
                }
            }
        }

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/register', validateLocalReg, validationCheck, User.register)



export default router