const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Registry */
import { formSelectors } from '../../../client/global/modules/registry/selectors.mjs'

/* Assets */
import Person from '../../../client/global/modules/assets/person.mjs'
import Address from '../../../client/global/modules/assets/address.us.mjs'
import User from '../../assets/user.mjs'
import Team from '../../assets/team.mjs'
import Driver from '../../assets/driver.mjs'
import { inPEnvironment } from '../../assets/user/permissions.mjs'

/* HTML Builders */
import { Input as ContactInput } from '../../html/contacts.mjs'
import { Label as DriverLabel, Input as DriverInput } from '../../html/driver.mjs'
import { Label as AddrLabel, Input as AddrInput } from '../../html/address.us.mjs'

/* Tools */
import { sortObjectByKey } from '../../../client/global/modules/tools/sorter.mjs'
import { respond404 } from '../../tools/response.mjs'

/* Constants */
import { navBuilder } from './constants.mjs'



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

    const inputProps = { disabled: true }
    const { class: aplClass, addr1Id, addr2Id, zipId, cityId, stateId } = formSelectors.driver

    hbs.label = {
        firstName: DriverLabel.name('f'),
        middleName: DriverLabel.name('m'),
        lastName: DriverLabel.name('l'),
        suffix: DriverLabel.name('s'),
        dob: DriverLabel.dob(),
        gender: DriverLabel.gender(),
        ssn: DriverLabel.ssn(),
        phone: DriverLabel.phone(),
        addrSince: DriverLabel.addrSince(),
        address1: AddrLabel.address1({ for: addr1Id }),
        address2: AddrLabel.address2({ for: addr2Id }),
        zip: AddrLabel.zip({ for: zipId }),
        city: AddrLabel.city({ for: cityId }),
        state: AddrLabel.state({ for: stateId }),
        position: DriverLabel.position(),
        statusExp: DriverLabel.statusExp({ addClass: 'required' }),
    }
    hbs.input = {
        firstName: DriverInput.name('f', inputProps),
        middleName: DriverInput.name('m', inputProps),
        lastName: DriverInput.name('l', inputProps),
        suffix: DriverInput.name('s', inputProps),
        dob: DriverInput.dob(inputProps),
        gender: DriverInput.gender(inputProps),
        ssn: DriverInput.ssn({ ...inputProps, placeholder: '###-##-####' }),
        phone: DriverInput.phone({ ...inputProps, placeholder: '(###) ###-####' }),
        addrSince: DriverInput.addrSince(inputProps),
        address1: AddrInput.address1({ ...inputProps, id: addr1Id, class: aplClass, name: 'address1' }),
        address2: AddrInput.address2({ ...inputProps, id: addr2Id, class: aplClass, name: 'address2' }),
        zip: AddrInput.zip({ ...inputProps, id: zipId, class: aplClass, name: 'zip' }),
        city: AddrInput.city({ ...inputProps, id: cityId, class: aplClass, name: 'city' }),
        state: DriverInput.state(inputProps),
        position: DriverInput.position(inputProps),
        statusExp: DriverInput.statusExp(inputProps),
    }
    hbs.dropdown = {
        suffix: suffixItems,
        gender: genderItems,
        position: positionItems,
        addrState: addrStateItems,
    }

    hbs.permissions = {
        create: DS || permissions['d:drv/apl'].includes('2'),
        delete: DS || permissions['d:drv/apl'].includes('5'),
    }

    if (hbs.permissions.create) {
        hbs.applicationUrl = `${hbs.addrBook.driver}/application?env=${req.session.team}`

        const { emailId } = formSelectors.driver

        hbs.input.email = ContactInput.email({ id: emailId, placeholder: "Applicant's Email", required: true })
    }

    res.render(key.replace('.', '/'), hbs)
})



export default router