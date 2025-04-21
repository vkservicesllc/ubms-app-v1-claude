const router = require('express').Router()
const throwErr = require('../../tools/utils/error').data

/* Tools */
import User, { superAdminUserOnly } from '../../tools/core/user.mjs'
import permissions, { html as roleHtml } from '../../tools/core/user/permissions.mjs'
import carrierPermissions from '../../tools/core/user/permissions.carrier.mjs'
import { respond404 } from '../../tools/utils/response.mjs'

/* Forms */
import UserForm, { RoleForm } from '../../tools/form/user.mjs'
import TeamForm from '../../tools/form/team.mjs'

/* HTML Builders */
import { Label as UserLabel, Input as UserInput, Select as UserSelect } from '../../html/user.mjs'

/* Registry */
import { formSelectors } from '../../../client/global/modules/registry/selectors.mjs'
import inputLength from '../../../client/global/modules/registry/length.mjs'

/* Local Constants */
import { labelClass, labelClassRequired } from './assets.mjs'



router.get('/domains', User.verify, superAdminUserOnly, (req, res) => {
    try {
        const key = 'domains'
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

        const options = {}
        const fields = [
            'status', 'location', 'condition',
            'email', 'phone',
            'firstName', 'lastName', 'alias', 'gender',
            'roleName', 'roleLocation',
            'carrierRoleName', 'carrierRoleLocation',
        ]
        fields.forEach(prop => {
            const form = UserForm[prop] || RoleForm[prop]
            const { required } = form.properties
            const keys = Object.keys(form).filter(key => !['properties', 'validate'].includes(key))
            options[prop] = {}

            keys.forEach(key => {
                options[prop][key] = {}
                options[prop][key].label = { class: required === true ? labelClassRequired : labelClass }
                if (key === 'text')
                    options[prop][key].input = { class: 'input' }
                else if (key === 'select')
                    options[prop][key].input = { tabs: 13 }
            })
        })

        hbs.form = {
            ...new UserForm(options),
            ...new RoleForm(options),
        }

        const { user } = res.session
        const inputClass = 'input'
        const selectProps = { tab: 13 }
        const {
            mainFormId, deleteFormId, conditionFormId,
            roleId, carrierRoleId,
        } = formSelectors.user

        hbs.label = {
            // status: UserLabel.status({ class: labelClassRequired }),
            // location: UserLabel.location({ class: labelClassRequired }),
            // email: UserLabel.email({ class: labelClassRequired }),
            // phone: UserLabel.phone({ class: labelClass }),
            // firstName: UserLabel.firstName({ class: labelClassRequired }),
            // lastName: UserLabel.lastName({ class: labelClassRequired }),
            // alias: UserLabel.alias({ class: labelClass }),
            // gender: UserLabel.gender({ class: labelClass }),

            //! will be more added
            carrierRoleName: UserLabel.roleName({ target: 'crr', class: labelClassRequired }),
            carrierRoleLocation: UserLabel.roleLocation({ target: 'crr', class: labelClass }),
        }
        hbs.input = {
            // id: UserInput.id(null, true),
            // usernameHidden: UserInput.username({ type: 'hidden' }),
            // emailHidden: UserInput.email({ type: 'hidden' }),
            // email: UserInput.email({ class: inputClass }),
            // phone: UserInput.phone({ class: inputClass, disabled: user.location[0] != 'US' }),
            // firstName: UserInput.firstName({ class: inputClass, placeholder: 'As shown on ID' }),
            // lastName: UserInput.lastName({ class: inputClass }),
            // alias: UserInput.alias({ class: inputClass, placeholder: 'Nickname' }),
            // genderM: UserInput.gender('m'),
            // genderF: UserInput.gender('f'),
            // conditionA: UserInput.condition(),
            // conditionI: UserInput.condition({ value: 'I' }),
            // conditionL: UserInput.condition({ value: 'L' }),

            //! will be more added
            carrierRoleId: UserInput.roleId({ target: 'crr' }),
            carrierRoleDeleteId: UserInput.roleId({ target: 'crr', id: `delete-${carrierRoleId}` }),
            carrierRoleName: UserInput.roleName({ target: 'crr', class: inputClass }),
        }
        hbs.select = {
            // status: UserSelect.status(user, selectProps),
            // location: UserSelect.location(user, selectProps),

            //! will be more added
            carrierRoleLocation: UserSelect.roleLocation({ target: 'crr', selectProps })
        }
        // hbs.formId = {
        //     user: mainFormId,
        //     deleteUser: deleteFormId,
        //     userCondition: conditionFormId,
        // }
        hbs.actionUrl = {
            // user: '/resource/user',
            // deleteUser: '/resource/user/delete',
            // userCondition: '/resource/user/modify/condition',
            deleteRole: '/resource/role/delete',

            //! will be more added
            carrierRole: '/resource/role/carrier',
        }

        hbs.roleTables = {
            default: roleHtml('default', permissions),
            carrier: roleHtml('carrier', carrierPermissions, 6),
        }

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/user/:identifier', User.verify, async (req, res) => {
    try {
        const key = 'user'
        let { hbs } = res
        hbs = hbs.set(key)

        const { active } = hbs.nav
        hbs.nav.users = active

        try {
            const { identifier } = req.params
            let user = await User.data(res.session, { username: identifier })
            if (!user) user = await User.data(res.session, { _id: identifier })
            const { name, email, username, condition, status, location } = user
            const sessionUser = res.session.user

            if (sessionUser.status[0] == 'A' && user.DS) return respond404(res)

            const display = {
                name: `<span class="has-text-weight-bold">${name}</span>`,
                condition: username ? condition[1] : 'Not Registered',
                status: status[1],
                location: location[1],
            }
            display.name += ` <small><i>(${email})</i></small>`
            if (!username || ['I', 'L'].includes(condition[0]))
                display.condition = `<span class="has-text-danger-70">${display.condition}</span>`

            const input = {
                id: UserInput.id(user._id),
            }

            hbs.display = display
            hbs.data = user
            hbs.input = input
            hbs.self = user._id == sessionUser._id
        } catch (err) {
            return respond404(res)
        }

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/teams', User.verify, superAdminUserOnly, (req, res) => {
    try {
        const key = 'teams'
        let { hbs } = res
        hbs = hbs.set(key)

        const options = {}
        const fields = [
            'teamName', 'category', 'desc',
            'busName', 'coType',
            'phone', 'email', 'website',
            'address1', 'address2', 'addrZip', 'addrCity', 'addrState'
        ]
        fields.forEach(prop => {
            const form = TeamForm[prop]
            const { required, initialType } = form.properties
            const keys = Object.keys(form).filter(key => !['properties', 'validate'].includes(key))
            options[prop] = {}

            keys.forEach(key => {
                options[prop][key] = {}
                options[prop][key].label = { class: required === true ? labelClassRequired : labelClass }
                if (['text', 'textarea'].includes(initialType))
                    options[prop][key].input = { class: initialType === 'text' ? 'input' : initialType }
                else if (key === 'text')
                    options[prop][key].input = { class: 'input' }
                else if (key === 'select')
                    options[prop][key].input = { tabs: 13 }
            })
        })

        hbs.form = new TeamForm(options)
        hbs.descMaxChars = inputLength.team.desc.max

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router