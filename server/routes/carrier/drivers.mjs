const router = require('express').Router()
const throwErr = require('../../tools/utils/error').data

/* Tools */
import moment from 'moment'
import Person, { Relationship } from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import User, { Role } from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Company from '../../tools/core/company.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'
import createApplicationPdf from './mv/pdf/driver-application.mjs'
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



const navItems = (permissions, DS, activeIdx) => {
    const items = []

    const params = {
        'd:drv/lds': [ '/drivers/pre-applications', 'Pre-Applications' ],
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

        hbs.permissions = {
            applications: inPEnvironment('d:drv/apl', permissions, DS),
        }

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/files/application/:route?', User.verify, Team.verify, async (req, res) => {
    try {
        const { user } = res.session
        const { DS } = user

        const permissions = await user.permissions(res.session)
        if (!withPrivileges('d:drv/apl', 'create', permissions, DS))
            return respond404(res)

        const { route } = req.params
        const company = await Company.data(res.session, { route })
        let carrier
        if (company) {
            const { name, address, phone, fax, lastLogo } = company
            carrier = { name, address, phone, fax, lastLogo }
            carrier.address = carrier.address.physical
            carrier.companyId = await company.id()
        }

        const pdfBytes = await createApplicationPdf(carrier)

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'inline; filename=application.pdf"')
        res.send(Buffer.from(pdfBytes))
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

        const privs = ['create', 'delete']
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
        throwErr.server(res, null, err)
    }
})


router.get('/applicants', User.verify, Team.verify, async (req, res) => {
    try {
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!inPEnvironment('d:drv/apl', permissions, DS))
            return res.redirect(res.session.defUrl)

        const key = 'drivers.applicants'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Driver Position Applicants' })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, null))

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/application/:formId/files/application', async (req, res, next) => {
    const user = await User.verify(req, res)
    if (!user) return res.send('Your session has expired, so you can no longer view this file.<br/>Please log in using another tab and refresh this page to regain access.')

    res.session.user = user
    next()
}, Team.verify, async (req, res) => {
    const { formId } = req.params

    try {
        const aplUrl = '/drivers/applications'
        const { user, team } = res.session
        const { DS } = user

        const permissions = await user.permissions(res.session)
        if (!withPrivileges('f:drv/apl', 'view', permissions, DS))
            return res.redirect(aplUrl)

        const application = await Application.data(res.session, { formId })
        if (!application || application.condition !== 'c' || application._teamId !== team._id)
            return res.redirect(aplUrl)

        let carrier
        if (application._carrierId) {
            const { _carrierId: _id } = application
            carrier = await Carrier.data(res.session, { _id })

            const companyId = await carrier.companyId()
            const { name, address, phone, fax, lastLogo } = carrier
            carrier = { name, address, phone, fax, lastLogo }
            carrier.address = carrier.address.physical
            carrier.companyId = companyId
        }

        const addresses = (await application.data('addresses', res.session)).data
        const violations = (await application.data('citations', res.session)).data
        const accidents = (await application.data('accidents', res.session)).data
        const employers = (await application.data('employers', res.session)).data

        const pdfBytes = await createApplicationPdf(carrier, application, addresses, violations, accidents, employers)

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'inline; filename=application.pdf"')
        res.send(Buffer.from(pdfBytes))
    } catch (err) {
        throwErr.server(res, null, err)
        // res.redirect(`/drivers/application/${formId}/e-form`)
    }
})


router.get('/application/:formId/e-form', User.verify, Team.verify, async (req, res) => {
    try {
        const aplUrl = '/drivers/applications'
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!withPrivileges('d:drv/apl', 'modify', permissions, DS))
            return res.redirect(aplUrl)

        const { formId } = req.params
        const application = await Application.data(res.session, { formId })
        if (!application || application.condition === 'h' || application._teamId !== team._id)
            return res.redirect(aplUrl)

        const identity = await application.identity(res.session)

        const key = 'drivers.application.e-form'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Driver Form ' + formId })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 1))

        const { _carrierId, _userId, cdlRole } = application

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

        const recUrl = `/resource/driver/application/${formId}/edit`
        hbs.actionUrl = {
            workflow: `${recUrl}/workflow`,
            profile: `${recUrl}/profile`,
            status: `${recUrl}/legal-status`,
            position: `${recUrl}/position`,
            residence: `${recUrl}/residence`,
            dl: `${recUrl}/driver-license`,
            mec: `${recUrl}/medical-card`,
            legal: `${recUrl}/legal-compliance`,
            safety: `${recUrl}/safety`,
            experience: `${recUrl}/experience`,
            prevEmployment: `${recUrl}/prev-employment`,
            preference: `${recUrl}/preference`,
            business: `${recUrl}/business`,
            beneficiary: `${recUrl}/beneficiary`,
            misc: `${recUrl}/misc`,
        }

        hbs._id = application._id
        hbs.formId = formId
        hbs.cdlRole = cdlRole
        hbs.position = application.position[1]
        hbs.positionRole = cdlRole ? 'CDL Only' : 'Non-CDL'
        hbs.applicant = `<strong style="font-size: 1.2em;">${new Person(application).fullName('FMLs')}</strong>`
        hbs.applicant += ` <small>(${calculateYearAge(application.dob, application.finishedAt.split(' ')[0])} yo`
        hbs.applicant += ` / ***-**-${application.ssn.slice(-4)})</small>`
        // hbs.status = { '0': 'US Citizen', '1': 'Permanent Resident', '2': 'Work Authorization/Visa' }[application.legalStatus[0]]
        hbs.appliedAt = moment(application.appliedAt).format('lll')
        hbs.finishedAt = moment(application.finishedAt).format('lll')
        hbs.steps = [ ...Application.stepList ]
        hbs.steps[0][3] = 'Position' + (application.position[0] === 'OO' ? ' / Vehicle' : '')
        hbs.steps[6] = 'Pre-Employments'

        const visibileRow = 'margin-top: 5px;'
        const hiddenRow = 'margin-top: 5px; display: none;'
        hbs.style = {
            noMecRow: hiddenRow,
            mecDetailsRow: visibileRow,
            inactiveLlcRow: hiddenRow,
            llcDetailsRow: visibileRow,
        }

        let complete = true
        const checkMark = {
            unchecked: 'red times',
            halfChecked: 'orange check',
            checked: 'green check',
            doubleChecked: 'green double check',
        }

        const checkList = {
            application: checkMark.checked,
            legalDox: checkMark.unchecked,
            ssc: checkMark.unchecked,
            dl: checkMark.unchecked,
            mec: checkMark.unchecked,
            prevEmployers: checkMark.unchecked,
        }

        let options = {}, dropdown = {}, t = `\t`.repeat(11)

        const legalStatuses = Application.legalStatusList
        const legalDocs = [
            'US Passport (Card)',
            'Green Card',
            'Valid Work Visa/Authorization',
        ]
        hbs.legalStatusDocDesc = legalDocs[application.legalStatus[0]]

        const driverPositions = team.list.drivers.positions
        dropdown.apprPosition = ''
        dropdown.position = ''
        for (const pos in driverPositions) {
            const option = `\n${t}<div class="item" data-value="${pos}">${driverPositions[pos]}</div>`
            dropdown.apprPosition += option
            dropdown.position += option
        }

        /* WORKFLOW */
        {
            dropdown.user = ''
            dropdown.carrier = ''
            dropdown.condition = ''
            dropdown.experience = ''

            const { applied: teamUsers } = (await team.data(res.session, 'users')).users
            const allUsers = await User.list(res.session)
            const users = []
            const userId = []
            const _ids = []
            for (let user of teamUsers) {
                user = await User.data(res.session, { _id: user._id })
                _ids.push(user._id)
                userId.push(await user.id())
            }

            const permissions = await Role.userPermissions(res.session, userId)
            allUsers.forEach(user => {
                const { _id, DS, name } = user

                if (DS && _id === application._userId) users.push({ _id, name })
                else if (_ids.includes(_id)) {
                    /* Accesses Team Users */
                    permissions.forEach(row => {
                        const { permissions: perms } = row
                        const permIdx = perms['d:drv/apl']

                        if (permIdx && [3, 4, '3', '4'].some(val => perms['d:drv/apl'].includes(val)))
                            users.push({ _id, name })
                    })
                }
            })
            users.forEach(user => {
                const { _id, name } = user
                dropdown.user += `\n${t}<div class="item" data-value="${_id}">${name}</div>`
            })
            if (application._userId)
                options.user = { hidden: { input: { value: application._userId } } }

            const carriers = (await user.relationship(res.session, 'carriers')).applied //! await team.data(res.session, 'carriers')

            carriers.forEach(carrier => { //! This list will not include the current carrier if it was removed from the team
                const { _carrierId: _id, name } = carrier
                dropdown.carrier += `\n${t}<div class="item" data-value="${_id}">${name}</div>`
            })
            if (application._carrierId)
                options.carrier = { hidden: { input: { value: application._carrierId } } }

            const conditions = {
                a: '<span class="ui dark green text"><i class="thumbs up icon"></i> Approved</span>',
                r: '<span class="ui orange text"><i class="hourglass half icon"></i> Waiting List</span>',
                b: '<span class="ui red text"><i class="thumbs down icon"></i> Disqualified</span>',
            }
            for (const c in conditions) {
                const condition = conditions[c]
                dropdown.condition += `\n${t}<div class="item" data-value="${c}">${condition}</div>`
            }
            if (!['p', 'c'].includes(application.condition))
                options.condition = { hidden: { input: { value: application.condition } }}

            const experiences = Application.experienceList
            for (const e in experiences) {
                const experience = experiences[e]
                dropdown.experience += `\n${t}<div class="item" data-value="${e}">${experience}</div>`
            }
            if (application?.decision?.experience)
                options.experience = { hidden: { input: { value: application.decision.experience } } }
            if (application?.decision?.position)
                options.apprPosition = { hidden: { input: { value: application.decision.position } } }
        }

        /* FILES */
        {
            hbs.fileTab = inPGroup('f:drv', permissions, DS)
            hbs.filePerms = {
                application: withPrivileges('f:drv/apl', 'view', permissions, DS),
            }
        }

        /* PROFILE */
        {
            dropdown.suffix = ''
            dropdown.gender = ''
            dropdown.marital = ''

            for (const sfx in Person.suffixList)
                dropdown.suffix += `\n${t}<div class="item" data-value="${sfx}">${sfx}</div>`
            for (const sex in Person.genderList)
                dropdown.gender += `\n${t}<div class="item" data-value="${sex}">${Person.genderList[sex]}</div>`
            for (const stat in Person.maritalList)
                dropdown.marital += `\n${t}<div class="item" data-value="${stat}">${Person.maritalList[stat]}</div>`

            for (const prop in identity.mismatch) {
                if (identity.mismatch[prop] === true) {
                    checkList.application = checkMark.unchecked
                    break
                }
            }
        }

        /* LEGAL STATUS */
        {
            dropdown.status = ''
            options.status = { hidden: { input: { disabled: false } } }

            for (const status in legalStatuses)
                dropdown.status += `\n${t}<div class="item" data-value="${status}">${legalStatuses[status]}</div>`
        }

        /* POSITION */
        {
            dropdown.vehicleType = ''

            const typeData = Application.vhlTypeList[cdlRole]

            for (const type in typeData)
                dropdown.vehicleType += `\n${t}\t<div class="item" data-value="${type}">${typeData[type]}</div>`

            if (!cdlRole) {
                const mmtData = currentExpediteVhlMMTData()
                const yearData = descYears()
                const lenData = Application.vhlLengthList.straightBox
                dropdown.vehicleMMT = ''
                dropdown.vehicleYear = ''
                dropdown.vehicleLength = ''

                for (const group in mmtData) {
                    dropdown.vehicleMMT += `\n${t}\t<div class="header"><span class="ui blue text">${group}:</span></div>`

                    for (const mmt in mmtData[group])
                        dropdown.vehicleMMT += `\n${t}\t<div class="item" data-value="${mmt}">${mmtData[group][mmt]}</div>`
                }

                for (const year in yearData)
                    dropdown.vehicleYear += `\n${t}\t<div class="item" data-value="${year}">${yearData[year]}</div>`

                for (const len in lenData) {
                    const option = lenData[len].replace('(', '<small><span class="ui text grey">(').replace(')', ')</span></small>')
                    dropdown.vehicleLength += `\n${t}\t<div class="item" data-value="${len}">${option}</div>`
                }
            }
        }

        /* RESIDENCE */
        {
            dropdown.addrState = ''

            for (const state in Address.stateList)
                dropdown.addrState += `\n${t}<div class="item" data-value="${state}" data-text="${state}">${Address.stateList[state]}</div>`
        }

        /* DRIVER's CARD */
        {
            if (cdlRole) options.dlCommercial2 = { checkbox: { input: { disabled: true } } }
            dropdown.dlState = ''
            options.dlEndrs = { text: { input: { rows: 2 } } }
            options.dlRestr = { text: { input: { rows: 2 } } }
            options.dlDeniedExpl = { text: { input: { rows: 2 }, label: { content: 'Details' } } }
            options.dlRevokedExpl = { text: { input: { rows: 2 }, label: { content: 'Details' } } }
        }

        /* MEDICAL CARD */
        {
            if (!application.medCard) {
                checkList.application = checkMark.halfChecked
                hbs.style.noMecRow = visibileRow
                hbs.style.mecDetailsRow = hiddenRow
            }
            options.noMec = { checkbox: { label: {
                content: '<span class="ui dark orange text"><i class="exclamation triangle icon"></i> Unavailable at the time of submission</span>',
            } } }
        }

        /* BUSINESS */
        {
            if (!application.activeBusiness) {
                checkList.application = checkMark.halfChecked
                hbs.style.inactiveLlcRow = visibileRow
                hbs.style.llcDetailsRow = hiddenRow
            }
            options.inactiveLLC = { checkbox: { label: {
                content: '<span class="ui dark orange text"><i class="exclamation triangle icon"></i> No currently active LLC</span>',
            } } }
            options.llcState = { hidden: { input: { disabled: true } } }
            dropdown.llcState = ''
        }

        /* BENEFICIARY */
        {
            dropdown.relationship = ''

            const relationData = { ...Relationship.data() }
            switch (application.marital) {
                case 'm':
                    delete relationData['Other']['Fiancé(e)']
                    delete relationData['Other']['Domestic Partner']
                    if (application.gender[0] === 'M') delete relationData['Spouse']['Husband']
                    if (application.gender[0] === 'F') delete relationData['Spouse']['Wife']

                    const { sex } = application
                    let { relation, otherRel } = application.beneficiary
                    relation = relation.toLowerCase().trim()
                    if (otherRel) otherRel = otherRel.toLowerCase().trim()
                    if (
                        ((relation === 'husband' || otherRel === 'husband') && sex === 1) ||
                        ((relation === 'wife' || otherRel === 'wife') && sex === 0)
                    ) checkList.application = checkMark.unchecked
                    break
                default:
                    delete relationData['Spouse']
                    delete relationData['Immediate In-Law']
            }

            for (const group in relationData) {
                dropdown.relationship += `\n${t}<div class="header"><span class="ui blue text">${group}:</span></div>`

                for (const relation in relationData[group])
                    dropdown.relationship += `\n${t}<div class="item" data-value="${relation}">${relation}</div>`
            }
        }

        for (const prop of ['dlState', 'llcState'])
            for (const state in Address.stateList) {
                dropdown[prop] += `\n${t}<div class="item" data-value="${state}">${Address.stateList[state]}</div>`
            }

        if (complete) {
            const { unchecked, halfChecked } = checkMark
            for (const step in checkList) {
                const check = checkList[step]

                if (check !== unchecked && check !== halfChecked) continue
                complete = false
            }
        }

        hbs.form = new ApplicationForm(options)
        hbs.dropdown = dropdown
        hbs.fullName = application.fullName
        hbs.originalFullName = identity.individual.fullName('FMLs')
        hbs.nameMismatch = (
            identity.mismatch.firstName ||
            identity.mismatch.middleName ||
            identity.mismatch.lastName ||
            identity.mismatch.sufix
        )
        hbs.checkList = checkList
        hbs.complete = complete

        res.render(key.replaceAll('.', '/'), hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/previous-employments', User.verify, Team.verify, async (req, res) => {
    try {
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!inPEnvironment('d:drv/emp', permissions, DS))
            return res.redirect(res.session.defUrl)

        const key = 'drivers.previous-employments'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: "Applicants' Previous Employments" })

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