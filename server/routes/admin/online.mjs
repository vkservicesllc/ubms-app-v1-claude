const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assets */
import User, { superAdminUserOnly } from '../../assets/user.mjs'

/* HTML Builders */
import { Label as UserLabel, Input as UserInput, Select as UserSelect } from '../../html/user.mjs'

/* Registry */
import { formSelectors } from '../../../client/global/modules/registry/selectors.mjs'



router.get('/sites', User.verify, superAdminUserOnly, (req, res) => {
    try {
        const key = 'sites'
        let { hbs } = res
        hbs = hbs.set(key)

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/users', User.verify, (req, res) => {
    try {
        const key = 'users'
        let { hbs } = res
        hbs = hbs.set(key)

        const { user } = res.session
        const inputClass = 'input'
        const selectProps = { tab: 13 }
        const { mainFormId, deleteFormId, conditionFormId } = formSelectors.user

        hbs.label = {
            status: UserLabel.status({ class: labelClassRequired }),
            location: UserLabel.location({ class: labelClassRequired }),
            email: UserLabel.email({ class: labelClassRequired }),
            phone: UserLabel.phone({ class: labelClass }),
            firstName: UserLabel.firstName({ class: labelClassRequired }),
            lastName: UserLabel.lastName({ class: labelClassRequired }),
            alias: UserLabel.alias({ class: labelClass }),
            gender: UserLabel.gender({ class: labelClass })
        }
        hbs.input = {
            id: UserInput.id(null, true),
            usernameHidden: UserInput.username({ type: 'hidden' }),
            emailHidden: UserInput.email({ type: 'hidden' }),
            email: UserInput.email({ class: inputClass }),
            phone: UserInput.phone({ class: inputClass, disabled: user.location[0] != 'US' }),
            firstName: UserInput.firstName({ class: inputClass, placeholder: 'As shown on ID' }),
            lastName: UserInput.lastName({ class: inputClass }),
            alias: UserInput.alias({ class: inputClass, placeholder: 'Nickname' }),
            genderM: UserInput.gender('m'),
            genderF: UserInput.gender('f'),
            conditionA: UserInput.condition(),
            conditionI: UserInput.condition({ value: 'I' }),
            conditionL: UserInput.condition({ value: 'L' }),
        }
        hbs.select = {
            status: UserSelect.status(user, selectProps),
            location: UserSelect.location(user, selectProps),
        }
        hbs.formId = {
            user: mainFormId,
            deleteUser: deleteFormId,
            userCondition: conditionFormId,
        }
        hbs.actionUrl = {
            user: '/resource/user',
            deleteUser: '/data/user/delete',
            userCondition: '/data/user/condition',
        }

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/teams', User.verify, superAdminUserOnly, (req, res) => {
    try {
        const key = 'sites'
        let { hbs } = res
        hbs = hbs.set(key)

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router