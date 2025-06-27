const router = require('express').Router()
const throwErr = require('../../tools/utils/error').data

/* Tools */
import moment from 'moment'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'
import { inPEnvironment } from '../../tools/core/user/permissions.mjs'
import { sortObjectByKey } from '../../../client/global/modules/tools/utils/sorter.mjs'
import Query from '../../tools/utils/query.mjs'
import { respond404 } from '../../tools/utils/response.mjs'
import { encrypt } from '../../tools/utils/crypto.mjs'
import { calculateYearAge } from '../../../client/global/modules/tools/utils/date.mjs'
import { navBuilder } from './tools.mjs'

/* Forms */
import { updateFormOptions } from '../../tools/form/builder.mjs'
import DriverForm, { ApplicationForm } from '../../tools/form/driver.mjs'



const navItems = (permissions, DS, activeIdx) => {
    const items = []

    const params = {
        'd:drv/lds': [ '/drivers/pre-applications', 'Pre-Applications' ],
        'd:drv/apl': [ '/drivers/applications', 'Applications' ],
        'd:drv/emp': [ '/drivers/pre-employments', 'Pre-Employments' ],
        'd:drv/drv': [ '/drivers/hired', 'Hired Contractors' ],
        'd:drv/agr': [ '/drivers/pay-agreements', 'Pay Agreements' ],
        'd:drv/lvn': [ '/drivers/leaving', 'Leaving Process' ],
        'd:drv/lft': [ '/drivers/former', 'Former Contractors' ],
    }
    let i = 0

    for (const env in params) {
        if (inPEnvironment(env, permissions, DS)) {
            if (activeIdx === i) params[env].push(true)
            items.push(params[env])
        }

        i++
    }

    return items
}


router.get('/', User.verify, Team.verify, async (req, res) => {
    try {
        const key = 'drivers'
        let { hbs } = res
        hbs = await hbs.set(key)
        const { drv } = hbs.PG

        if (!drv) return res.redirect(res.session.defUrl)

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        const { user } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS))

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/pre-applications', User.verify, Team.verify, async (req, res) => {
    try {
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!inPEnvironment('d:drv/lds', permissions, DS))
            return res.redirect(res.session.defUrl)

        const key = 'drivers.pre-applications'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Driver Pre-Applications' })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 0))

        //! More stuff to be added...

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/applications', User.verify, Team.verify, async (req, res) => {
    try {
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!inPEnvironment('d:drv/apl', permissions, DS))
            return res.redirect(res.session.defUrl)

        const key = 'drivers.applications'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Driver Applications' })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 1))

        hbs.permissions = {
            create: DS || permissions['d:drv/apl'].includes('2'),
            delete: DS || permissions['d:drv/apl'].includes('5'),
        }

        if (hbs.permissions.create) {
            hbs.applicationUrl = `${hbs.addrBook.driver}/application?env=${req.session.team}`
            hbs.userSimpleId = user._simpleId
            //! if the team has more than 1 departments, add the first (default) department id (integer) to the query += `&dept${deptId}`
            //! in this case an additional dropdown to be added for deparment selection with the default department selected
            //? if (!DS)
            if (true)
                hbs.applicationUrl += `&rec=${user._simpleId}`

            const driverPositions = team.list.drivers.positions
            let suffixItems = '', genderItems = '', maritalItems = '', positionItems = '', addrStateItems = ''
            const t = `\t`.repeat(11)

            for (const sfx in Person.suffixList)
                suffixItems += `\n${t}<div class="item" data-value="${sfx}">${sfx}</div>`
            for (const sex in Person.genderList)
                genderItems += `\n${t}<div class="item" data-value="${sex}">${Person.genderList[sex]}</div>`
            for (const stat in Person.maritalList)
                maritalItems += `\n${t}<div class="item" data-value="${stat}">${Person.maritalList[stat]}</div>`
            for (const pos in driverPositions)
                positionItems += `\n${t}<div class="item" data-value="${pos}" data-text="${pos}">${driverPositions[pos]}</div>`
            for (const state in Address.stateList)
                addrStateItems += `\n${t}<div class="item" data-value="${state}" data-text="${state}">${Address.stateList[state]}</div>`

            const statusClass = 'new-apl-eligibility new-apl-legal-status'

            let options = {
                email: { text: { input: { placeholder: "Applicant's Email" } } },
                status: {
                    radio: {
                        citizen: { input: { class: statusClass } },
                        resident: { input: { class: statusClass } },
                        authorized: { input: { class: statusClass } },
                    },
                },
            }

            const fields = [
                'firstName', 'middleName', 'lastName', 'suffix',
                'dob', 'gender', 'ssn', 'marital', 'phone',
                'addrSince', 'address1', 'address2', 'addrZip', 'addrCity', 'addrState',
            ]
            options = updateFormOptions(options, ApplicationForm, fields, { disabled: true })

            hbs.form = new ApplicationForm(options)
            hbs.dropdown = {
                suffix: suffixItems,
                gender: genderItems,
                marital: maritalItems,
                position: positionItems,
                addrState: addrStateItems,
            }
        }

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/application-form/:formId', User.verify, Team.verify, async (req, res) => {
    try {
        const aplUrl = '/drivers/applications'
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!DS && !permissions['d:drv/apl'].includes('3'))
            return res.redirect(aplUrl)

        const { formId } = req.params
        const application = await Application.data(res.session, { formId })
        if (!application || application.condition !== 'c' || application._teamId !== team._id)
            return res.redirect(aplUrl)
console.log(application.createdAt, application.finishedAt)

        const key = 'drivers.application-form'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Driver Form ' + formId })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 1))

        const { _carrierId, _userId } = application

        if (_carrierId) {
            hbs.carrier = '<span class="ui red text"><i class="ui ban icon"></i> Failed to fetch carrier</span>'

            const carrier = await Carrier.data(res.session, { _id: _carrierId })
            if (carrier) hbs.carrier = carrier.name
        }

        if (_userId) {
            hbs.recruiter = '<span class="ui red text"><i class="ui ban icon"></i> Failed to fetch recruiter</span>'

            const user = await User.data(res.session, { _id: _userId })
            if (user) hbs.recruiter = user.name
        }

        hbs.formId = formId
        hbs.position = application.position[1]
        hbs.applicant = new Person(application).fullName('FMLs') + ` <small>(${calculateYearAge(application.dob)})</small>`
        // hbs.status = { '0': 'US Citizen', '1': 'Permanent Resident', '2': 'Work Authorization/Visa' }[application.legalStatus[0]]
        hbs.appliedAt = moment(application.appliedAt).format('lll')
        hbs.finishedAt = moment(application.finishedAt).format('lll')
        hbs.steps = [ ...Application.stepList ]
        hbs.steps[6] = 'Pre-Employments'
        if (application.position[0] === 'OO') hbs.steps[8] = 'Business / Vehicle'

        let options = {}, dropdown = {}, t = `\t`.repeat(10)

        /* PROFILE */
        {
            dropdown.suffix = ''
            dropdown.gender = ''
            dropdown.marital = ''
            // dropdown.addrState = ''

            for (const sfx in Person.suffixList)
                dropdown.suffix += `\n${t}<div class="item" data-value="${sfx}">${sfx}</div>`
            for (const sex in Person.genderList)
                dropdown.gender += `\n${t}<div class="item" data-value="${sex}">${Person.genderList[sex]}</div>`
            for (const stat in Person.maritalList)
                dropdown.marital += `\n${t}<div class="item" data-value="${stat}">${Person.maritalList[stat]}</div>`
            // for (const state in Address.stateList)
            //     dropdown.addrState += `\n${t}<div class="item" data-value="${state}" data-text="${state}">${Address.stateList[state]}</div>`

            const fields = [
                'firstName', 'middleName', 'lastName', 'suffix',
                'dob', 'gender', 'ssn', 'marital', 'phone', 'email',
                // 'addrSince', 'address1', 'address2', 'addrZip', 'addrCity', 'addrState',
            ]
            options = updateFormOptions(options, ApplicationForm, fields)
        }

        hbs.form = new ApplicationForm(options)
        hbs.dropdown = dropdown

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/pre-employments', User.verify, Team.verify, async (req, res) => {
    try {
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!inPEnvironment('d:drv/emp', permissions, DS))
            return res.redirect(res.session.defUrl)

        const key = 'drivers.pre-employments'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Driver Pre-Employments' })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 2))

        //! More stuff to be added...

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/hired', User.verify, Team.verify, async (req, res) => {
    try {
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!inPEnvironment('d:drv/drv', permissions, DS))
            return res.redirect(res.session.defUrl)

        const key = 'drivers.hired'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Hired Contractors' })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 3))

        //! More stuff to be added...

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/pay-agreements', User.verify, Team.verify, async (req, res) => {
    try {
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!inPEnvironment('d:drv/agr', permissions, DS))
            return res.redirect(res.session.defUrl)

        const key = 'drivers.pay-agreements'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Driver Pay Agreements' })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 4))

        //! More stuff to be added...

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/leaving', User.verify, Team.verify, async (req, res) => {
    try {
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!inPEnvironment('d:drv/lvn', permissions, DS))
            return res.redirect(res.session.defUrl)

        const key = 'drivers.leaving'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Driver Leaving Process' })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 5))

        //! More stuff to be added...

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/former', User.verify, Team.verify, async (req, res) => {
    try {
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!inPEnvironment('d:drv/lft', permissions, DS))
            return res.redirect(res.session.defUrl)

        const key = 'drivers.former'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Former Contractors' })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 6))

        //! More stuff to be added...

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router