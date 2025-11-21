const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import User from '../../tools/core/user.mjs'
import permissions, { html as roleHtml } from '../../tools/core/user/permissions.mjs'
import carrierPermissions from '../../tools/core/user/permissions.carrier.mjs'
import { respond404 } from '../../tools/utils/response.mjs'

/* Forms */
import { updateFormOptions } from '../../tools/form/builder.mjs'
import UserForm, { RoleForm } from '../../tools/form/user.mjs'
import TeamForm from '../../tools/form/team.mjs'

/* Registry */
import inputLength from '../../../client/global/modules/registry/length.mjs'

/* Local Constants */
import { labelClass, labelClassRequired } from './assets.mjs'



router.get('/domains', User.mw.verify, User.mw.superAdminOnly, (req, res) => {
    try {
        const key = 'domains'
        let { hbs } = res
        hbs = hbs.set(key)

        res.render(key, hbs)
    } catch (err) {
        sendError.server(res, err)
    }
})


router.get('/users', User.mw.verify, (req, res) => {
    try {
        const key = 'users'
        let { hbs } = res
        hbs = hbs.set(key)

        const instr = { labelClass, labelClassRequired, textClass: 'input' }
        const fields = {
            user: [
                'status', 'location', 'condition',
                'email', 'phone',
                'firstName', 'lastName', 'alias', 'gender',
            ],
            role: [
                'roleName', 'roleLocation',
                'carrierRoleName', 'carrierRoleLocation',
            ],
        }
        const options = {
            user: updateFormOptions({}, UserForm, fields.user, { ...instr, tabs: 13 }),
            role: updateFormOptions({}, RoleForm, fields.role, { ...instr, tabs: 10 }),
        }

        hbs.form = {
            ...new UserForm(options.user),
            ...new RoleForm(options.role),
        }

        hbs.roleTables = {
            default: roleHtml('default', permissions),
            carrier: roleHtml('carrier', carrierPermissions, 6),
        }

        res.render(key, hbs)
    } catch (err) {
        sendError.server(res, err)
    }
})


router.get('/user/:identifier', User.mw.verify, async (req, res) => {
    try {
        const key = 'user'
        let { hbs } = res
        hbs = hbs.set(key)

        const { active } = hbs.nav
        hbs.nav.users = active

        try {
            const { identifier } = req.params
            let user = await User.fetch(res.session, { username: identifier }, { hideSensitive: false })
            if (!user) user = await User.fetch(res.session, { _id: identifier })
            const { email, username, status, condition, unscoped, sex, expansion } = user

            const sessionUser = res.session.user

            if (sessionUser.status === 'A' && user.DS) return respond404(res)

            const display = {
                name: `<span class="has-text-weight-bold">${user.fullName('FAL')}</span>`,
                condition: username ? expansion.condition : 'Not Registered',
                status: (status === 'U' ? 'Basic ' : '') + expansion.status,
                location: expansion.location,
                gender: sex === null ? '<span class="has-text-danger-70">Not specified</span>' : expansion.gender,
            }
            display.name += ` <small><i>(${email})</i></small>`
            if (!username || ['I', 'L'].includes(condition))
                display.condition = `<span class="has-text-danger-70">${display.condition}</span>`

            const input = {
                id: UserForm.id.hidden.input({ value: user._id }),
            }
            const checked = {
                unscoped: unscoped ? ' checked' : '',
            }

            hbs.display = display
            hbs.data = user
            hbs.input = input
            hbs.checked = checked
            hbs.self = user._id == sessionUser._id
            hbs.sessionUser = { ...sessionUser }
            hbs.sessionUser.status = sessionUser.status
        } catch (err) {
            return respond404(res)
        }

        res.render(key, hbs)
    } catch (err) {
        sendError.server(res, err)
    }
})


router.get('/teams', User.mw.verify, User.mw.superAdminOnly, (req, res) => {
    try {
        const key = 'teams'
        let { hbs } = res
        hbs = hbs.set(key)

        const fields = [
            'teamName',
            //? 'category',
            'desc',
            //? 'crrDept',
            'busName', 'coType',
            'phone', 'email', 'website',
            'address1', 'address2', 'addrZip', 'addrCity', 'addrState',
        ]
        const options = updateFormOptions({}, TeamForm, fields, {
            labelClass,
            labelClassRequired,
            textClass: 'input',
            textareaClass: 'textarea',
            tabs: 13,
        })

        //! Temporary
        // options.category.select.input.value = 'crr'

        hbs.form = new TeamForm(options)
        hbs.descMaxChars = inputLength.team.desc.max

        res.render(key, hbs)
    } catch (err) {
        sendError.server(res, err)
    }
})



export default router