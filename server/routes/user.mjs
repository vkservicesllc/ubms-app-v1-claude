const router = require('express').Router()
const mysql = require('../tools/utils/mysql')
const throwErr = require('../tools/utils/error').data

/* Settings */
import config from '../../config.mjs'
import db from '../settings/mysql.mjs'

/* Registry */
import length from '../../client/global/modules/registry/length.mjs'

/* Tools */
import Site from '../tools/core/site.mjs'
import User, { query } from '../tools/core/user.mjs'
import { respond404 } from '../tools/utils/response.mjs'
import { calculateHourAge } from '../../client/global/modules/tools/utils/date.mjs'
import { capitalizeEach } from '../../client/global/modules/tools/utils/string.mjs'

/* Forms && Validators */
import UserForm from '../tools/form/user.mjs'
import validationCheck from '../tools/form/validator.mjs'



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
        const verified = await User.mw.verify(req, res)
        if (verified) return res.redirect('/profile')

        res.redirect('/login')
    } catch (err) {
        throwErr.server(res, null, err)
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
        throwErr.server(res, null, err)
    }
})


router.get('/profile', User.mw.verify, (req, res) => {
    try {
        const key = 'profile'
        let { hbs } = res
        hbs = hbs.set(key)

        const { firstName, lastName, alias, sex, DSA } = hbs.user
        const readOnly = !DSA

        hbs.input = {
            firstName: UserForm.firstName.text.input({ placeholder: 'Real First Name', value: firstName, readOnly }),
            alias: UserForm.alias.text.input({ placeholder: 'Alias', value: alias, readOnly }),
            lastName: UserForm.lastName.text.input({ placeholder: 'Last Name', value: lastName, readOnly }),
            genderMale: UserForm.gender.radio.male.input({ checked: sex === 1 }),
            genderFemale: UserForm.gender.radio.female.input({ checked: sex === 0 }),
        }

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/profile', User.mw.verify, [
    UserForm.firstName.validate(),
    UserForm.lastName.validate(),
    UserForm.alias.validate(),
    UserForm.gender.validate(),
], validationCheck, async (req, res) => {
    try {
        const { error } = await res.session.user.modify(res.session, req.body)
        if (error) return throwErr.server(res, null, error)

        res.redirect('/profile')
    } catch (err) {
        throwErr.server(res, null, err)
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
        hbs.nonUS = location[0] !== 'US'

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/account', User.mw.verify, [
    UserForm.newUsername.validate(),
    UserForm.email.validate(),
    UserForm.phone.validate(),
], validationCheck, async(req, res) => {
    try {
        const { error } = await res.session.user.modify(res.session, req.body)
        if (error) return throwErr.server(res, null, error)

        res.redirect('/account')
    } catch (err) {
        throwErr.server(res, null, err)
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

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/security', User.mw.verify, [
    UserForm.password.validate(),
    UserForm.createPassword.validate(),
], validationCheck, async(req, res) => {
    try {
        //
    } catch (err) {
        throwErr.server(res, null, err)
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

        hbs.input = {
            token: UserForm.token.text.input({ placeholder: 'Token', value }),
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
                if (weekDay === 4) limit = 72
                if (weekDay === 5) limit = 48

                if (calculateHourAge(invitedAt) > limit) hbs.expiredForm = true
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
        throwErr.server(res, null, err)
    }
})


// router.post('/register', [
//     UserForm.newUsername.validate(),
//     UserForm.createPassword.validate(),
// ], validationCheck, User.register)


router.get('/pass-reset/:_id', async (req, res) => {
    try {
        const { _id } = req.params
        const { form: resetId } = req.query

        const user = await User.data(res.session, { _id })
        if (!user || !resetId) return respond404(res)

        const [ result ] = await mysql.execute(query.passReset.select('userId', {
            userId: await user.id(), resetId,
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
        throwErr.server(res, null, err)
    }
})


// router.post('/pass-reset', [
//     UserForm.createPassword.validate(),
// ], validationCheck, User.reset)



export default router