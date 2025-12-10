// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import moment from 'moment'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import Geography from '../../../client/global/modules/tools/core/geography.mjs'
import { Relationship } from '../../tools/core/individual.mjs'
import User, { Role } from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Company from '../../tools/core/company.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'
// import createApplicationPdf from './mv/pdf/driver-application.mjs'
import { inPGroup, inPEnvironment, withPrivileges } from '../../tools/core/user/permissions.mjs'
import { sortObjectByKey } from '../../../client/global/modules/tools/utils/sorter.mjs'
import Query from '../../tools/utils/query.mjs'
import { respond404 } from '../../tools/utils/response.mjs'
import { encrypt } from '../../tools/utils/crypto.mjs'
import { calculateYearAge } from '../../../client/global/modules/tools/utils/date.mjs'
import { navBuilder } from './tools.mjs'

/* Forms */
import { updateFormOptions } from '../../tools/form/builder.mjs'
import DriverForm, { ApplicationForm, currentExpediteVhlMMTData, descYears } from '../../tools/form/driver.mjs'


// ==== SETUP ==== //

const navItems = (permissions, DS, activeIdx) => {
    const items = []

    const params = {
        // 'd:drv/lds': [ '/drivers/pre-applications', 'Pre-Applications' ],
        'd:drv/apl': [ '/drivers/applications', 'Applications' ],
        'd:drv/emp': [ '/drivers/previous-employments', 'Previous Employments' ],
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



// ==== ROUTES ==== //


router.get('/', User.mw.verify, Team.mw.verify, async (req, res) => {
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
        const permissions = await user.permissions()

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS))

        hbs.permissions = {
            applications: inPEnvironment('d:drv/apl', permissions, DS),
        }

        res.render(key, hbs)
    } catch (err) {
        sendError.server(res, err)
    }
})


// ==== LIST ROUTES === //


router.get('/applications', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions()
        if (!inPEnvironment('d:drv/apl', permissions, DS))
            return res.redirect(res.session.defUrl)

        const key = 'drivers.applications'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Driver Applications' })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 1))

        const privs = ['create', 'modify', 'delete']
        hbs.permissions = {}
        privs.forEach(priv => hbs.permissions[priv] = withPrivileges('d:drv/apl', priv, permissions, DS))

        hbs.unscoped = user.unscoped

        if (hbs.permissions.create) {
            const cdl = Number(team?.settings?.carrier?.application?.cdl !== 0)

            hbs.applicationUrl = `${hbs.addrBook.driver}/application?env=`
            hbs.applicationUrl += team ? `${req.session.team}` : 'global'
            hbs.applicationUrl += `&cdl=${cdl}`
            hbs.userSimpleId = user._simpleId

            //? if (!DS)
            if (true)
                hbs.applicationUrl += `&rec=${user._simpleId}`

            const driverPositions = Driver.positionList
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
        sendError.server(res, err)
    }
})



// ==== EXPORT ==== //

export default router