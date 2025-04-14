const router = require('express').Router()
const throwErr = require('../../tools/utils/error').data

/* Tools */
import User, { superAdminUserOnly } from '../../tools/core/user.mjs'
import permissions, { html as roleHtml } from '../../tools/core/user/permissions.mjs'
import carrierPermissions from '../../tools/core/user/permissions.carrier.mjs'

/* HTML Builders */
import { Label as UserLabel, Input as UserInput, Select as UserSelect } from '../../html/user.mjs'
import { Label as TeamLabel, Input as TeamInput, Select as TeamSelect } from '../../html/team.mjs'
import { Label as CompanyLabel, Input as CompanyInput, Select as CompanySelect } from '../../html/company.mjs'
import { Label as AddrLabel, Input as AddrInput, Select as AddrSelect } from '../../html/address.us.mjs'
import { Label as ContactLabel, Input as ContactInput } from '../../html/contacts.mjs'


/* Registry */
import { formSelectors } from '../../../client/global/modules/registry/selectors.mjs'
import inputLength from '../../../client/global/modules/registry/length.mjs'

/* Local Constants */
import { labelClass, labelClassRequired } from './assets.mjs'
import { respond404 } from '../../tools/response.mjs'



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

        const { user } = res.session
        const inputClass = 'input'
        const selectProps = { tab: 13 }
        const {
            mainFormId, deleteFormId, conditionFormId,
            roleId, carrierRoleId,
        } = formSelectors.user

        hbs.label = {
            status: UserLabel.status({ class: labelClassRequired }),
            location: UserLabel.location({ class: labelClassRequired }),
            email: UserLabel.email({ class: labelClassRequired }),
            phone: UserLabel.phone({ class: labelClass }),
            firstName: UserLabel.firstName({ class: labelClassRequired }),
            lastName: UserLabel.lastName({ class: labelClassRequired }),
            alias: UserLabel.alias({ class: labelClass }),
            gender: UserLabel.gender({ class: labelClass }),

            //! will be more added
            carrierRoleName: UserLabel.roleName({ target: 'crr', class: labelClassRequired }),
            carrierRoleLocation: UserLabel.roleLocation({ target: 'crr', class: labelClass }),
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

            //! will be more added
            carrierRoleId: UserInput.roleId({ target: 'crr' }),
            carrierRoleDeleteId: UserInput.roleId({ target: 'crr', id: `delete-${carrierRoleId}` }),
            carrierRoleName: UserInput.roleName({ target: 'crr', class: inputClass }),
        }
        hbs.select = {
            status: UserSelect.status(user, selectProps),
            location: UserSelect.location(user, selectProps),

            //! will be more added
            carrierRoleLocation: UserSelect.roleLocation({ target: 'crr', selectProps })
        }
        hbs.formId = {
            user: mainFormId,
            deleteUser: deleteFormId,
            userCondition: conditionFormId,
        }
        hbs.actionUrl = {
            user: '/resource/user',
            deleteUser: '/resource/user/delete',
            userCondition: '/resource/user/modify/condition',
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

        const {
            class: teamClass,
            id, busNameId, coTypeId, phoneId, emailId, websiteId,
            addr1Id, addr2Id, cityId, stateId, zipId,
        } = formSelectors.team

        hbs.label = {
            name: TeamLabel.name({ class: labelClassRequired }),
            category: TeamLabel.catId({ class: labelClassRequired }),
            description: TeamLabel.description({ class: labelClass }),
            busName: CompanyLabel.busName({ class: labelClassRequired, for: busNameId, content: 'Company Name' }),
            coType: CompanyLabel.coType({ class: labelClassRequired, for: coTypeId }),
            phone: ContactLabel.tel('phone', { class: labelClassRequired, addClass: 'required', for: phoneId }),
            email: ContactLabel.email({ class: labelClass, for: emailId }),
            website: CompanyLabel.website({ class: labelClass, for: websiteId }),
            address1: AddrLabel.address1({ class: labelClassRequired, for: addr1Id }),
            address2: AddrLabel.address2({ class: labelClass, for: addr2Id }, true),
            city: AddrLabel.city({ class: labelClassRequired, for: cityId }),
            state: AddrLabel.state({ class: labelClassRequired, for: stateId }),
            zip: AddrLabel.zip({ class: labelClassRequired, for: zipId }),
        }

        hbs.input = {
            current: {
                name: TeamInput.name({}, true),
            },
            id: TeamInput.id(),
            name: TeamInput.name({ class: 'input' }),
            description: TeamInput.description({ class: 'textarea' }),
            profileId: TeamInput.id(null, { id: `profile-${id}` }),
            busName: CompanyInput.busName({ class: 'input', id: busNameId, addClass: teamClass }),
            phone: ContactInput.tel('phone', { class: 'input', id: phoneId, addClass: teamClass, required: true }),
            email: ContactInput.email({ class: 'input', id: emailId, addClass: teamClass }),
            website: CompanyInput.website({ class: 'input', id: websiteId, addClass: teamClass }),
            address1: AddrInput.address1({ class: `input ${teamClass}`, id: addr1Id }),
            address2: AddrInput.address2({ class: `input ${teamClass}`, id: addr2Id }),
            city: AddrInput.city({ class: `input ${teamClass}`, id: cityId }),
            zip: AddrInput.zip({ class: `input ${teamClass}`, id: zipId }),
            settingsId: TeamInput.id(null, { id: `settings-${id}` }),
        }

        hbs.select = {
            category: TeamSelect.catId({ tabs: 13, options: { emptyOpt: '--' } }),
            coType: CompanySelect.coType({ tabs: 13, options: { emptyOpt: '--' }, id: coTypeId, addClass: teamClass }),
            state: AddrSelect.stateUS({ tabs: 13, options: { emptyOpt: '--', valOpt: true }, id: stateId, class: teamClass }),
        }

        hbs.descMaxChars = inputLength.team.desc.max

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router