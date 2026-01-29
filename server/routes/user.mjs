// ==== IMPORT ==== //

const router = require('express').Router()
const mysql = require('../tools/utils/mysql')
const sendError = require('../tools/utils/error')

/* Settings */
import config from '../../config.mjs'
import { query } from '../settings/mysql.mjs'

/* Registry */
import length from '../../client/global/modules/registry/length.mjs'

/* Tools */
import moment from 'moment'
import Site from '../tools/core/site.mjs'
import User, { Token } from '../tools/core/user.mjs'
import { respond404 } from '../tools/utils/response.mjs'
import { capitalizeEach } from '../../client/global/modules/tools/utils/string.mjs'

/* Forms && Validators */
import UserForm from '../tools/form/user.mjs'
import validationCheck from '../tools/form/validator.mjs'


// ==== SETUP ==== //


router.use((req, res, next) => {

    if (req.session.user) {
        const active = 'class="item active"'

        res.hbs.nav = {
            active,

            profile: 'class="item" href="/profile"',
            account: 'class="item" href="/account"',
            security: 'class="item" href="/security"',
            apps: 'class="item" href="/apps"'
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
                'username',
                'firstName',
                'lastName',
                'alias',
                'gender',
                'email',
                'phone',
                'location',
                'status',
                'DS',
                'DSA',
                'avaSrc',
                'expansion',
            ]
            for (const prop of props)
                hbs.user[prop] = user[prop]
            hbs.user.name = user.fullName('AL')
        }

        return hbs
    }

    next()
})



// ==== GET ROUTES ==== //


router.get('/', async (req, res) => {
    try {
        const verified = await User.mw.verify(req, res)
        if (verified) return res.redirect('/profile')

        res.redirect('/login')
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/login', async (req, res) => {
    try {
        const verified = await User.mw.verify(req, res)
        if (verified) return res.redirect('/profile')

        const key = 'login'
        let { hbs } = res
        hbs = hbs.set(key)

        const labelClass = 'ui teal tag label'

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
})


router.get('/profile', User.mw.verify, (req, res) => {
    try {
        const key = 'profile'
        let { hbs } = res
        hbs = hbs.set(key)

        const { firstName, lastName, alias, gender, DSA } = hbs.user
        const readOnly = !DSA

        hbs.input = {
            firstName: UserForm.firstName.text.input({ placeholder: 'Real First Name', value: firstName, readOnly }),
            alias: UserForm.alias.text.input({ placeholder: 'Alias', value: alias, readOnly }),
            lastName: UserForm.lastName.text.input({ placeholder: 'Last Name', value: lastName, readOnly }),
            genderMale: UserForm.gender.radio.male.input({ checked: gender === 'M' }),
            genderFemale: UserForm.gender.radio.female.input({ checked: gender === 'F' }),
        }

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/account', User.mw.verify, (req, res) => {
    try {
        const key = 'account'
        let { hbs } = res
        hbs = hbs.set(key)

        const { username, email, phone, location } = hbs.user

        hbs.label = {
            username: UserForm.username.text.label(),
            email: UserForm.email.text.label(),
            phone: UserForm.phone.text.label(),
        }
        hbs.input = {
            username: UserForm.username.text.input({ value: username, disabled: false }),
            email: UserForm.email.text.input({ value: email }),
            phone: UserForm.phone.text.input({ value: phone }),
        }
        hbs.nonUS = location !== 'US'

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/security', User.mw.verify, (req, res) => {
    try {
        const key = 'security'
        let { hbs } = res
        hbs = hbs.set(key)

        hbs.label = {}
        hbs.input = {}
        for (const prop of ['password', 'createPassword', 'confirmPassword']) {
            hbs.label[prop] = UserForm[prop].text.label()
            hbs.input[prop] = UserForm[prop].text.input({ disabled: false })
        }
        hbs.label.password = hbs.label.password.replace('>Password<', '>Current Password<')

        hbs.length = {
            password: length.user.password,
        }

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/apps', User.mw.verify, (req, res) => {
    try {
        const key = 'apps'
        let { hbs } = res
        hbs = hbs.set(key)

        hbs.actionUrl = `/apps`

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
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

        const user = await User.fetch(res.session, { _id }, { offline: true })
        const site = await new Site(branch, siteId)

        if (!user || !site) return respond404(res)

        const { address } = site
        const { sessionUrl, tokenAge } = config.session
        const { clientIp } = req.session

        const token = await Token.fetch({ userId: user.id, clientIp })

        const { key: tokenKey, verified } = token
        let value = config.notification.email.authToken ? '' : tokenKey

        hbs.status = status
        hbs.actionUrl = address + sessionUrl
        hbs.tokenAge = `${tokenAge} minute${tokenAge > 1 ? 's' : ''}`
        hbs.userValue = _id
        hbs.script = `$('.container').show()`

        if (verified) {
            value = tokenKey
            hbs.script = `$('form').submit()`
        }

        hbs.input = {
            token: UserForm.token.text.input({ placeholder: 'Token', value }),
        }

        return res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
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

        const user = await User.fetch(res.session, { _id }, { offline: true, hideEvents: false })
        if (!user) return respond404(res)

        if (user.username) hbs.userRegistered = true
        else if (!formId || user.events.declinedAt) hbs.validForm = false

        else {
            const userId = user.id
            const [ rows ] = await mysql.execute(query.user.registration.select('invitedAt', {
                match: { formId, userId },
            }))

            if (!rows.length) hbs.validForm = false
            else {
                const { invitedAt } = rows[0]

                const weekDay = new Date(invitedAt).getDay()
                let limit = 24
                if (weekDay === 4) limit = 72
                if (weekDay === 5) limit = 48
                const difference = moment().diff(moment(invitedAt, 'YYYY-MM-DD HH:mm:ss'), 'hours')

                if (difference > limit) hbs.expiredForm = true
                else {
                    hbs.user = {}

                    const props = [ 'name' ]
                    for (const prop of props)
                        hbs.user[prop] = user[prop]

                    hbs.label = {}
                    hbs.input = {
                        hiddenId: UserForm.id.hidden.input({ value: _id }),
                    }

                    for (const prop of ['newUsername', 'createPassword', 'confirmPassword']) {
                        hbs.label[prop] = UserForm[prop].text.label()
                        hbs.input[prop] = UserForm[prop].text.input({ disabled: false })
                    }

                    hbs.length = {
                        password: length.user.password,
                    }
                }
            }
        }

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/pass-reset/:_id', async (req, res) => {
    try {
        const { _id } = req.params
        const { form: resetId } = req.query

        const user = await User.fetch(res.session, { _id }, { offline: true })
        if (!user || !resetId) return respond404(res)

        const [ result ] = await mysql.execute(query.user.passReset.select('userId', {
            match: { userId: user.id, resetId },
        }))
        if (!result.length) return respond404(res)

        const key = 'reset'
        let { hbs } = res
        hbs = hbs.set(key)

        hbs.label = {}
        hbs.input = {
            hiddenId: UserForm.id.hidden.input({ value: _id }),
        }

        for (const prop of ['newUsername', 'createPassword', 'confirmPassword']) {
            hbs.label[prop] = UserForm[prop].text.label()
            hbs.input[prop] = UserForm[prop].text.input({ disabled: false })
        }

        hbs.length = {
            password: length.user.password,
        }

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== POST ROUTES ==== //


router.post('/profile', User.mw.verify, [
    UserForm.firstName.validate(),
    UserForm.lastName.validate(),
    UserForm.alias.validate(),
    UserForm.gender.validate(),
], validationCheck, async (req, res) => {
    try {
        res.session.user.update(req.body)
        res.redirect('/profile')
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/account', User.mw.verify, [
    UserForm.newUsername.validate(),
    UserForm.email.validate(),
    UserForm.phone.validate(),
], validationCheck, async(req, res) => {
    try {
        res.session.user.update(req.body)
        res.redirect('/account')
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/register', [
    UserForm.newUsername.validate(),
    UserForm.createPassword.validate(),
], validationCheck, User.mw.register)


router.post('/pass-reset', [
    UserForm.createPassword.validate(),
], validationCheck, User.mw.reset)



// ==== EXPORT ==== //

export default router