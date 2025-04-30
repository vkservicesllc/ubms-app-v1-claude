const router = require('express').Router()
const throwErr = require('../../tools/utils/error').data

/* Tools */
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Driver from '../../tools/core/driver.mjs'
import { inPEnvironment } from '../../tools/core/user/permissions.mjs'
import { sortObjectByKey } from '../../../client/global/modules/tools/utils/sorter.mjs'
import { respond404 } from '../../tools/utils/response.mjs'
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
    res.send('PRE-APPLICATIONS')
})


router.get('/applications', User.verify, Team.verify, async (req, res) => {
    const key = 'drivers.applications'
    let { hbs } = res
    hbs = await hbs.set(key, { titlePfx: 'Driver Applications' })

    const { user, team } = res.session
    const { DS } = user
    const permissions = await user.permissions(res.session)
    if (!inPEnvironment('d:drv/apl', permissions, DS))
        return res.redirect(res.session.defUrl)

    const { active } = hbs.nav
    hbs.nav.left.drivers = active

    hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 1))

    hbs.permissions = {
        create: DS || permissions['d:drv/apl'].includes('2'),
        delete: DS || permissions['d:drv/apl'].includes('5'),
    }

    if (hbs.permissions.create) {
        hbs.applicationUrl = `${hbs.addrBook.driver}/application?env=${req.session.team}`

        const driverPositions = team.list.drivers.positions
        let suffixItems = '', genderItems = '', positionItems = '', addrStateItems = ''
        const t = `\t`.repeat(11)

        for (const sfx in Person.suffixList)
            suffixItems += `\n${t}<div class="item" data-value="${sfx}">${sfx}</div>`
        for (const sex in Person.genderList)
            genderItems += `\n${t}<div class="item" data-value="${sex}">${Person.genderList[sex]}</div>`
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
            'dob', 'gender', 'ssn', 'phone',
            'addrSince', 'address1', 'address2', 'addrZip', 'addrCity', 'addrState',
        ]
        options = updateFormOptions(options, ApplicationForm, fields, { disabled: true })

        hbs.form = new ApplicationForm(options)
        hbs.dropdown = {
            suffix: suffixItems,
            gender: genderItems,
            position: positionItems,
            addrState: addrStateItems,
        }
    }

    res.render(key.replace('.', '/'), hbs)
})



export default router