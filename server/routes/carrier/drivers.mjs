// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import moment from 'moment'
import Person, { Relationship } from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import Geography from '../../../client/global/modules/tools/core/geography.mjs'
import Individual from '../../tools/core/individual.mjs'
import User, { Role } from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Company, { RefSource } from '../../tools/core/company.mjs'
import Driver, { Application, Employment } from '../../tools/core/driver.mjs'
import { privileges, inPGroup, inPEnvironment, withPrivileges } from '../../tools/core/user/permissions.mjs'
import carrierPrivs from '../../tools/core/user/permissions.carrier.mjs'
import { respond404 } from '../../tools/utils/response.mjs'
import { calculateYearAge } from '../../../client/global/modules/tools/utils/date.mjs'
import { navBuilder } from './tools.mjs'

/* Forms */
import { updateFormOptions } from '../../tools/form/builder.mjs'
import { ApplicationForm, ApplicationFileForm, EmploymentForm, vhlMMTData, descYears } from '../../tools/form/driver.mjs'


// ==== SETUP ==== //

const navItems = (permissions, DS, activeIdx) => {
    const items = []

    const params = {
        //! 'd:drv/lds': [ '/drivers/pre-applications', 'Pre-Applications' ],
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

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 0))

        const privs = ['create', 'modify', 'delete']
        hbs.permissions = {}
        privs.forEach(priv => hbs.permissions[priv] = withPrivileges('d:drv/apl', priv, permissions, DS))

        hbs.unscoped = user.unscoped

        if (hbs.permissions.create) {
            const settings = team ? await team.settings() : {}
            const cdl = Number(settings?.carrier?.application?.cdl !== 0)

            hbs.applicationUrl = `${hbs.addrBook.driver}/application?env=`
            hbs.applicationUrl += team ? `${req.session.team}` : 'global'
            hbs.applicationUrl += `&cdl=${cdl}`
            hbs.userSimpleId = user._simpleId

            //? if (!DS)
            if (true)
                hbs.applicationUrl += `&rec=${user._simpleId}`

            const driverPositions = Driver.list.position
            let carrierItems = '', teamItems = '', suffixItems = '', genderItems = '', maritalItems = '', positionItems = '', addrStateItems = ''
            let t = `\t`.repeat(9)

            const carriers = !DS
                ? await user.fetch('jx.companies', { filter: { category: 'crr', confirmed: true } })
                : await Company.fetch(res.session, { category: 'crr', confirmed: true })

            carriers.forEach(carrier => {
                const { externalId, route, name } = carrier
                carrierItems += `\n${t}<div class="item" data-value="${externalId._carrierId}" data-route="${route}">${name}</div>`
            })

            if (user.unscoped) {
                const filter = {}
                if (!user.DS) filter.scoped = false

                const teams = await Team.fetch(res.session, filter)
                teams.forEach(team => {
                    const { _id, name, scoped } = team
                    let teamName = name
                    if (scoped) teamName += ' <sup><i class="orange star outline icon"></i></sup>'

                    teamItems += `\n${t}<div class="item" data-value="${_id}">${teamName}</div>`
                })
            }

            for (const sfx in Individual.list.suffix)
                suffixItems += `<div class="item" data-value="${sfx}">${sfx}</div>`
            for (const gender in Individual.list.gender)
                genderItems += `<div class="item" data-value="${gender}">${Individual.list.gender[gender]}</div>`
            // for (const stat in Individual.list.marital)
            //     maritalItems += `<div class="item" data-value="${stat}">${Person.maritalList[stat]}</div>`
            for (const pos in driverPositions)
                positionItems += `<div class="item" data-value="${pos}" data-text="${pos}">${driverPositions[pos]}</div>`
            // for (const state in Address.list.state)
            //     addrStateItems += `<div class="item" data-value="${state}" data-text="${state}">${Address.list.state[state]}</div>`

            const statusClass = 'new-apl-eligibility new-apl-legal-status'

            let options = {
                email: { text: { input: { placeholder: "Applicant's Email" } } },
                // leadPosition: {
                //     radio: {
                //         input: {
                //             data: driverPositions,
                //         },
                //     },
                // },
                // status: {
                //     radio: {
                //         citizen: { input: { class: statusClass } },
                //         resident: { input: { class: statusClass } },
                //         authorized: { input: { class: statusClass } },
                //     },
                // },
            }

            const fields = [
                'firstName', 'middleName', 'lastName', 'suffix',
                'phone', 'gender', 'ssn_', 'position_',
                // 'dob', 'gender', 'ssn', 'marital', 'phone',
                // 'addrSince', 'address1', 'address2', 'addrZip', 'addrCity', 'addrState',
            ]
            options = updateFormOptions(options, ApplicationForm, fields, { disabled: true })

            hbs.form = new ApplicationForm(options)
            hbs.dropdown = {
                carrier: carrierItems,
                team: teamItems,
                suffix: suffixItems,
                gender: genderItems,
                position_: positionItems,
                // marital: maritalItems,
                // addrState: addrStateItems,
            }
        }

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/application/:formId/e-form', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const aplUrl = '/drivers/applications'
        const { user, team } = res.session
        const { DS, unscoped } = user
        const permissions = await user.permissions(res.session)
        if (!withPrivileges('d:drv/apl', 'modify', permissions, DS))
            return res.redirect(aplUrl)

        const { formId } = req.params
        const application = await Application.fetch(res.session, { formId }, { hideSensitive: false })

        if (!application || application.condition === 'h' || application.rehire) return res.redirect(aplUrl)
        if (team && application._teamId !== team._id) return res.redirect(aplUrl)

        if (user._id !== application.userId && !user.DS) respond404(res)

        const identity = await application.identity(res.session)

        const key = 'drivers.application.e-form'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Driver Form ' + formId })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 0))

        const { _carrierId, _userId, cdlRole, vhlCode, fullName } = application
        const vhlProp = vhlCode ? Application.list.vhlCode[vhlCode] : null

        if (_carrierId) {
            hbs.carrier = '<span class="ui red text"><i class="ui ban icon"></i> Failed to fetch carrier</span>'

            const carrier = await Carrier.fetch(res.session, { _id: _carrierId })
            if (carrier) hbs.carrier = carrier.name
        }

        if (_userId) {
            hbs.recruiter = '<span class="ui red text"><i class="ui ban icon"></i> Failed to fetch recruiter</span>'

            const user = await User.fetch(res.session, { _id: _userId })
            if (user) hbs.recruiter = user.name
        }

        const url = `/drivers/application/${formId}/e-form`
        const recUrl = `/resource/driver/application/${formId}/edit`

        hbs.linkUrl = {
            priorAddr: `${url}/prior-residence`,
            citations: `${url}/citations`,
            accidents: `${url}/accidents`,
            prevEmployment: `${url}/prev-employers`,
        }
        hbs.length = {}
        hbs.linkColor = {
            priorAddr: 'red',
            citations: 'blue',
            accidents: 'blue',
            prevEmployment: 'red',
        }

        const folderStyle = {
            open: '<i class="orange open folder icon"></i>',
            closed: '<i class="green folder icon"></i>',
        }
        const fileStyle = {
            blank: '<i class="grey file icon"></i>',
            pdf: '<i class="pdf file outline icon"></i>',
        }
        const checkStyle = {
            unchecked: '<i class="red close icon"></i>',
            waiting: '<i class="orange wait icon"></i>',
            skipped: '<i class="orange check icon"></i>',
            checked: '<i class="green check icon"></i>',
            doubleChecked: '<i class="green double check icon"></i>',
        }
        const status = {
            pending: '<span class="ui dark red text">Pending</span>',
            waiting: '<span class="ui dark orange text">Pending</span>',
            verified: '<span class="ui dark green text">Verified/Uploaded</span>',
            uploaded: '<span class="ui dark green text">Uploaded</span>',
            skipped: '<span class="ui dark orange text">Skipped</span>',
        }

        const filePath = `/files/pdf/driver/application/${formId}`
        hbs.downloadLinks = { //! index 3 is download name
            dl: [ `${filePath}/drivers-license`, "Driver's License", `[${formId}] Driver's License (${fullName})` ],
            mec: [ `${filePath}/medical-certificate`, 'Medical Certificate', `[${formId}] Medical Certificate (${fullName})` ],
            leg: [ `${filePath}/legal-document`, 'Legal Documents', `[${formId}] Legal Documents (${fullName})` ],
            ssc: [ `${filePath}/social-security-card`, 'Social Security Card', `[${formId}] Social Security Card (${fullName})` ],

            //
        }

        const uploaded = {
            dl: application?.checklist?.documents?.dl === 1,
            mec: application?.checklist?.documents?.mec === 1,
            leg: application?.checklist?.documents?.leg === 1,
            ssc: application?.checklist?.documents?.ssc === 1,
        }
        const skipped = {
            leg: application?.checklist?.skipped?.leg === 1,
            ssc: application?.checklist?.skipped?.ssc === 1,
        }

        const fileText = prop => uploaded[prop]
            ? `<span class="ui dark blue text"><a href="${hbs.downloadLinks[prop][0]}" target="_blank">${hbs.downloadLinks[prop][1]}</a></span>`
            : `<span class="ui grey text">${skipped[prop] ? `<s>${hbs.downloadLinks[prop][1]}</s>` : hbs.downloadLinks[prop][1]}</span>`

        hbs.folder = {
            driverQualification: folderStyle.open,
            applicationDocs: folderStyle.open,
            supportingDocs: folderStyle.open,
            personalDocs: folderStyle.open,
            vehicleDocs: folderStyle.open,
            backgroundCheck: folderStyle.open,
            mvr: folderStyle.open,
            psp: folderStyle.open,
            hiringProcess: folderStyle.open,
            orientation: folderStyle.open,
        }
        hbs.file = {
            dl: {
                uploaded: uploaded.dl,
                style: fileStyle[uploaded.dl ? 'pdf' : 'blank'],
                text: fileText('dl'),
            },
            mec: {
                uploaded: uploaded.mec,
                style: fileStyle[uploaded.mec ? 'pdf' : 'blank'],
                text: fileText('mec'),
            },
            leg: {
                uploaded: uploaded.leg,
                style: fileStyle[uploaded.leg ? 'pdf' : 'blank'],
                text: fileText('leg'),
            },
            ssc: {
                uploaded: uploaded.ssc,
                style: fileStyle[uploaded.ssc ? 'pdf' : 'blank'],
                text: fileText('ssc'),
            },
            //! continue...
        }

        hbs.step = {
            documents: '',
            vehicle: '',
            background: '',
            approval: '',
        }
        hbs.checklist = {
            dl: {
                check: uploaded.dl ? checkStyle.doubleChecked : checkStyle.unchecked,
                status: !uploaded.dl ? status.pending : status.verified,
            },
            mec: {
                check: uploaded.mec ? checkStyle.doubleChecked : checkStyle.unchecked,
                status: !uploaded.mec ? status.pending : status.verified,
            },
            ssc: {
                check: uploaded.ssc
                    ? checkStyle.doubleChecked
                    : (
                        skipped.ssc
                        ? checkStyle.skipped
                        : checkStyle.unchecked
                    ),
                status: uploaded.ssc
                    ? status.verified
                    : (
                        skipped.ssc
                        ? status.skipped
                        : status.pending
                    ),
            },
            leg: {
                check: uploaded.leg
                    ? checkStyle.doubleChecked
                    : (
                        skipped.leg
                        ? checkStyle.skipped
                        : checkStyle.unchecked
                    ),
                status: uploaded.leg
                    ? status.verified
                    : (
                        skipped.leg
                        ? status.skipped
                        : status.pending
                    ),
            },
            reg: {
                check: checkStyle.unchecked,
                status: status.pending,
            },
            trlReg: {
                check: checkStyle.unchecked,
                status: status.pending,
            },
            ch: {
                check: checkStyle.unchecked,
                status: status.pending,
            },
            cdlis: {
                check: checkStyle.unchecked,
                status: status.pending,
            },
            mvr: {
                check: checkStyle.unchecked,
                status: status.pending,
            },
            psp: {
                check: checkStyle.unchecked,
                status: status.pending,
            },
            ins: {
                check: checkStyle.waiting,
                status: status.waiting,
            },
            sft: {
                check: checkStyle.waiting,
                status: status.waiting,
            },
        }
        const passed = {
            dl: uploaded.dl,
            mec: uploaded.mec,
            leg: application.legalStatus[0] !== 2 || uploaded.leg,
            ssc: uploaded.ssc || skipped.ssc,
        }
        if (passed.dl || passed.mec || passed.leg || passed.ssc) {
            hbs.step.documents = ' active '
            if (passed.dl && passed.mec && passed.leg && passed.ssc)
                hbs.step.documents = ' completed '
        }

        let profileAction = 'profile'
        if (uploaded.dl || uploaded.ssn) {
            profileAction += '-lock'
            if (!uploaded.ssn) profileAction += 1
            if (!uploaded.dl) profileAction += 2
        }
        hbs.actionUrl = {
            workflow: `${recUrl}/workflow`,
            profile: `${recUrl}/${profileAction}`,
            address: `${recUrl}/address`,
            status: `${recUrl}/legal-status`,
            position: `${recUrl}/position`,
            dl: `${recUrl}/driver-license${uploaded.dl ? '-lock' : ''}`,
            mec: `${recUrl}/medical-card${uploaded.mec ? '-lock' : ''}`,
            legal: `${recUrl}/legal-compliance`,
            // safety: `${recUrl}/safety`,
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
        hbs.position = application.expansion.position
        if (vhlProp)
            hbs.position += ` <small>(${Application.list.vhlType[cdlRole][vhlProp]})</small>`
        hbs.posProp = application.position
        hbs.positionRole = cdlRole ? 'CDL Only' : 'Non-CDL'
        hbs.cdl = application.dl.commercial
        hbs.applicant = `<strong style="font-size: 1.2em;">${new Person(application).fullName('FMLs')}</strong>`
        hbs.applicant += ` <small>(${calculateYearAge(application.dob, application.finishedAt.split(' ')[0])} yo`
        hbs.applicant += ` / ***-**-${application.ssn.slice(-4)})</small>`
        // hbs.status = { '0': 'US Citizen', '1': 'Permanent Resident', '2': 'Work Authorization/Visa' }[application.legalStatus[0]]
        hbs.appliedAt = moment(application.appliedAt).format('lll')
        hbs.finishedAt = moment(application.finishedAt).format('lll')
        hbs.steps = [ ...Application.list.step ]
        hbs.steps[0][3] = 'Position' + (application.position === 'OO' ? ' / Vehicle' : '')
        hbs.steps[6] = 'Previous Employers'

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
            personalDox: checkMark.unchecked,
            mvrPsp: checkMark.unchecked,
            clearinghouse: checkMark.unchecked,
            vehicleDox: checkMark.unchecked,
            // ssc: checkMark.unchecked,
            // dl: checkMark.unchecked,
            // mec: checkMark.unchecked,
            drugTest: checkMark.unchecked,
            orientation: checkMark.unchecked,
            leaseAgreement: checkMark.unchecked,
            sta: checkMark.unchecked,
            prevEmployers: checkMark.unchecked,
        }

        let options = {}, fileOptions = {}, dropdown = {}, t = `\t`.repeat(13)

        // const legalDocs = [
        //     'US Passport (Card)',
        //     'Green Card',
        //     'Valid Work Visa/Authorization',
        // ]
        // hbs.legalStatusDocDesc = legalDocs[application.legalStatus[0]]

        const driverPositions = Driver.list.position
        dropdown.apprPosition = ''
        dropdown.position = ''

        for (const pos in driverPositions) {
            const option = `\n${t}<div class="item" data-value="${pos}">${driverPositions[pos]}</div>`
            dropdown.apprPosition += option
            dropdown.position += option
        }

        /* WORKFLOW */
        {
            dropdown.refSrc = ''
            dropdown.user = ''
            dropdown.carrier = ''
            dropdown.team = ''
            dropdown.condition = ''
            dropdown.experience = ''

            // const teamUsers = team ? (await team.fetch('jx.users')) : []
            // const allUsers = await User.fetch(res.session)
            // const users = []
            // const userId = []
            // const _ids = []

            // for (let user of teamUsers) {
            //     user = await User.fetch(res.session, { _id: user._id })
            //     _ids.push(user._id)
            //     userId.push(user.id)
            // }

            // const permissions = [] //! await Role.userPermissions(res.session, userId)
            // allUsers.forEach(user => {
            //     const { _id, DS, name } = user

            //     if (DS && _id === application._userId) users.push({ _id, name })
            //     else if (_ids.includes(_id)) {
            //         /* Accesses Team Users */
            //         permissions.forEach(row => {
            //             const { permissions: perms } = row
            //             const permIdx = perms['d:drv/apl']

            //             if (permIdx && [3, 4, '3', '4'].some(val => perms['d:drv/apl'].includes(val)))
            //                 users.push({ _id, name })
            //         })
            //     }
            // })
            // users.forEach(user => {
            //     const { _id, name } = user
            //     dropdown.user += `\n${t}<div class="item" data-value="${_id}">${name}</div>`
            // })

            options.refSrc = { select: { label: { content: 'Discovery Source' } } }
            if (application._refSrcId)
                options.refSrc.hidden = { input: { value: application._refSrcId } }

            let refSrc = await RefSource.fetch(res.session)

            if (application._userId)
                options.user = { hidden: { input: { value: application._userId } } }

            if (DS) {
                const carriers = await Carrier.fetch(res.session)
                carriers.forEach(carrier => {
                    const { _id, name } = carrier
                    dropdown.carrier += `\n${t}<div class="item" data-value="${_id}">${name}</div>`
                })
            } else {
                const companies = await user.fetch('jx.companies', { category: 'crr' })
                companies.forEach(company => {
                    const { name, externalId } = company
                    dropdown.carrier += `\n${t}<div class="item" data-value="${externalId._carrierId}">${name}</div>`
                })
            }
            if (application._carrierId)
                options.carrier = { hidden: { input: { value: application._carrierId } } }

            //? Should refSrc be modified based on company
            refSrc.map(src => {
                dropdown.refSrc += `\n${t}<div class="item" data-value="${src._id}">${src.name}</div>`
            })

            if (unscoped) {
                const filter = {}
                if (!user.DS) filter.scoped = false

                const teams = await Team.fetch(res.session, filter)
                teams.forEach(team => {
                    const { _id, name, scoped } = team
                    let teamName = name
                    if (scoped) teamName += ' <sup><i class="orange star outline icon"></i></sup>'

                    dropdown.team += `\n${t}<div class="item" data-value="${_id}">${teamName}</div>`
                })
            }
            if (application._teamId)
                options.team = { hidden: { input: { value: application._teamId } } }

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

            const experiences = Application.list.experience
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
            const { address1, address2, city, state, zip } = application.address
            let currentAddress = address1
            if (address2) currentAddress += `, ${address2}`
            currentAddress += `, ${city}, ${state} ${zip}`
            dropdown.confDlState = ''
            dropdown.confDlSuffix = ''
            dropdown.confDlGender = ''
            dropdown.confDlAddrState = ''
            dropdown.confDlAddresses = `\n${t}<div class="item" data-value="${application.address.since}" data-text='<span class="ui blue text"><b>${currentAddress}</b></span> <i class="dl-addr-verifying-txt">Verifying...</i>'>${currentAddress}</div>`

            const addresses = await application.fetch('addresses')
            addresses.map(address => {
                const { address1, address2, city, state, zip } = address
                let prevAddress = address1
                if (address2) prevAddress += `, ${address2}`
                prevAddress += `, ${city}, ${state} ${zip}`
                dropdown.confDlAddresses += `\n${t}<div class="item" data-value="${address.since}" data-text='<span class="ui blue text"><b>${prevAddress}</b></span> <i class="dl-addr-verifying-txt">Verifying...</i>'>${prevAddress}</div>`
            })

            if (hbs.fileTab) {
                const legalStatus = application.legalStatus[0]
                hbs.filePerms = {}
                hbs.fileLegalDoc = !!legalStatus
                if (hbs.fileLegalDoc) {
                    hbs.fileLegalPerm = legalStatus === 1
                    hbs.fileLegalTemp = legalStatus === 2
                    hbs.fileLegalType = legalStatus === 1 ? 'perm' : 'temp'
                }

                for (const prop in carrierPrivs['f:drv'].groups) {
                    hbs.filePerms[prop] = {}
                    const privs = carrierPrivs['f:drv'].groups[prop].privileges

                    if (privs === '*')
                        privileges.file.forEach(priv => hbs.filePerms[prop][priv] = withPrivileges(`f:drv/${prop}`, priv, permissions, DS))
                    else privs.forEach(idx => {
                        const priv = privileges.file[idx]
                        hbs.filePerms[prop][priv] = withPrivileges(`f:drv/${prop}`, priv, permissions, DS)
                    })
                }

                hbs.fileTrlReg = !!application?.vehicle?.trailer

                hbs.uploads = {}
                for (const prop in application.uploads)
                    hbs.uploads[prop] = application.uploads[prop][0]
                hbs.cancelUploadUrl = `/drivers/application/${formId}/e-form?files`

                fileOptions.dlEndrs = { text: { input: { rows: 1 } } }
                fileOptions.dlRestr = { text: { input: { rows: 1 } } }

                //! console.log(hbs.filePerms)
                // hbs.filePerms = {
                //     application: {
                //         download: withPrivileges('f:drv/apl', 'download', permissions, DS),
                //     },
                //     legal: {
                //         download: withPrivileges('f:drv/leg', 'download', permissions, DS),
                //         upload: withPrivileges('f:drv/leg', 'upload', permissions, DS),
                //     },
                // }
            }
        }

        /* PROFILE */
        {
            dropdown.suffix = ''
            dropdown.gender = ''
            dropdown.marital = ''

            for (const sfx in Individual.list.suffix) {
                dropdown.suffix += `\n${t}<div class="item" data-value="${sfx}">${sfx}</div>`
                dropdown.confDlSuffix += `\n${t}<div class="item" data-value="${sfx}">${sfx}</div>`
            }
            for (const gender in Individual.list.gender) {
                dropdown.gender += `\n${t}<div class="item" data-value="${gender}">${Individual.list.gender[gender]}</div>`
                dropdown.confDlGender += `\n${t}<div class="item" data-value="${gender}">${Individual.list.gender[gender]}</div>`
            }
            for (const stat in Individual.list.marital)
                dropdown.marital += `\n${t}<div class="item" data-value="${stat}">${Individual.list.marital[stat]}</div>`

            for (const prop in identity.mismatch) {
                if (identity.mismatch[prop] === true) {
                    checkList.application = checkMark.unchecked
                    break
                }
            }
        }

        /* ADDRESS */
        {
            dropdown.addrState = ''
            dropdown.country = ''
            for (const country in Geography.list.country) {
                dropdown.country += `\n${t}<div class="item" data-value="${country}">${Geography.list.country[country]}</div>`
            }

            const addresses = await application.fetch('addresses')
            hbs.addrLen = addresses.length
            hbs.addrMinDate = ''

            hbs.priorAddrCheck = 'close'
            if (hbs.addrLen) {
                hbs.addrMinDate = moment(addresses[0].since).clone().add(1, 'day').format('YYYY-MM-DD')
                hbs.linkColor.priorAddr = 'green'
                hbs.priorAddrCheck = 'check'
            }
        }

        /* LEGAL STATUS */
        {
            dropdown.status = ''
            options.status = { hidden: { input: { disabled: false } } }

            const legalStatuses = Application.list.legalStatus
            for (const status in legalStatuses)
                dropdown.status += `\n${t}<div class="item" data-value="${status}">${legalStatuses[status]}</div>`
        }

        /* POSITION */
        {
            dropdown.vehicleType = ''

            let typeData = Application.list.vhlType[cdlRole]
            if (vhlProp) typeData = { [vhlProp]: typeData[vhlProp] }

            for (const type in typeData)
                dropdown.vehicleType += `\n${t}\t<div class="item" data-value="${type}">${typeData[type]}</div>`

            if (!cdlRole) {
                const mmtData = vhlMMTData(vhlCode)
                const yearData = descYears()
                const lenData = Application.list.vhlLength.straightBox
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

        /* DRIVER's LICENSE */
        {
            if (cdlRole) options.dlCommercial2 = { checkbox: { input: { disabled: true } } }
            dropdown.dlState = ''
            options.dlEndrs = { text: { input: { rows: 2 } } }
            options.dlRestr = { text: { input: { rows: 2 } } }
            options.dlDeniedExpl = { text: { input: { rows: 2, placeholder: ' ' }, label: { content: 'Details' } } }
            options.dlRevokedExpl = { text: { input: { rows: 2, placeholder: ' ' }, label: { content: 'Details' } } }
        }

        /* MEDICAL CARD */
        {
            if (!application._mecId) {
                checkList.application = checkMark.halfChecked
                hbs.style.noMecRow = visibileRow
                hbs.style.mecDetailsRow = hiddenRow
            }
            options.noMec = { checkbox: { label: {
                content: '<span class="ui dark orange text"><i class="exclamation triangle icon"></i> Unavailable at the time of submission</span>',
            } } }
        }

        /* LEGAL COMPLIANCE */
        {
            options.criminalExpl = { text: { input: { rows: 2, placeholder: ' ' }, label: { content: 'Details' } } }
            hbs.length.citations = (await application.fetch('citations')).length
            if (hbs.length.citations) hbs.linkColor.citations = 'red'
        }

        /* SAFETY */
        {
            hbs.length.accidents = (await application.fetch('accidents')).length
            if (hbs.length.accidents) hbs.linkColor.accidents = 'red'
        }

        /* EXPERIENCE */
        {
            dropdown.schState = ''
            dropdown.schDuration = ''
            for (const key in Application.list.schoolDuration) {
                const option = Application.list.schoolDuration[key]
                dropdown.schDuration += `\n${t}<div class="item" data-value="${key}">${option}</div>`
            }

            const appliedOn = moment(application.appliedOn)
            let j = 8
            for (let i = 0; i < 7; i++) {
                const content = `${appliedOn.clone().subtract(--j, 'days').format('dddd/MMM D, YYYY')}`.replace('/', '<br/>')
                options[`expHours${i + 1}`] = {
                    text: {
                        label: { content },
                    },
                }
            }
        }

        /* PREVIOUS EMPLOYERS */
        {
            hbs.length.prevEmployment = (await Employment.fetch(res.session, { appId: application.id })).length
            if (hbs.length.prevEmployment) hbs.linkColor.prevEmployment = 'blue'
        }

        /* PREFERENCE */
        {
            // Desired Start Timeframe
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

            const relationData = Relationship.data(application.marital)

            for (const group in relationData) {
                dropdown.relationship += `\n${t}<div class="header"><span class="ui blue text">${group}:</span></div>`

                for (const relation in relationData[group])
                    dropdown.relationship += `\n${t}<div class="item" data-value="${relation}">${relation}</div>`
            }
        }

        for (const prop of ['confDlState', 'confDlAddrState', 'addrState', 'dlState', 'schState', 'llcState'])
            for (const state in Address.list.state)
                dropdown[prop] += `\n${t}<div class="item" data-value="${state}">${Address.list.state[state]}</div>`

        if (complete) {
            const { unchecked, halfChecked } = checkMark
            for (const step in checkList) {
                const check = checkList[step]

                if (check !== unchecked && check !== halfChecked) continue
                complete = false
            }
        }

        hbs.form = new ApplicationForm(options)
        hbs.fileForm = new ApplicationFileForm(fileOptions)
        hbs.dropdown = dropdown
        hbs.fullName = fullName
        hbs.originalFullName = identity.individual.fullName('FMLs')
        hbs.nameMismatch = (
            identity.mismatch.firstName ||
            identity.mismatch.middleName ||
            identity.mismatch.lastName ||
            identity.mismatch.sufix
        )
        hbs.checkList = checkList
        hbs.complete = complete
        hbs.unscoped = unscoped
        hbs.appCount = application.count

        res.render(key.replaceAll('.', '/'), hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/application/:formId/e-form/:target', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const aplUrl = '/drivers/applications'
        const { user, team } = res.session
        const { DS, unscoped } = user
        const permissions = await user.permissions(res.session)
        if (!withPrivileges('d:drv/apl', 'modify', permissions, DS))
            return res.redirect(aplUrl)

        const { formId, target } = req.params
        const application = await Application.fetch(res.session, { formId }, { hideSensitive: false })

        if (!application || application.condition === 'h') return res.redirect(aplUrl)
        if (team && application._teamId !== team._id) return res.redirect(aplUrl)

        if (user._id !== application.userId && !user.DS) respond404(res)

        const key = `drivers.application.e-form.${target}`
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Driver Form ' + formId })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 0))

        hbs._id = application._id
        hbs.formId = formId
        hbs.position = application.expansion.position
        if (application.vhlCode)
            hbs.position += ` <small>(${Application.list.vhlType[application.cdlRole][Application.list.vhlCode[application.vhlCode]]})</small>`
        hbs.positionRole = application.cdlRole ? 'CDL Only' : 'Non-CDL'
        hbs.cdl = application.dl.commercial
        hbs.applicant = `<strong style="font-size: 1.2em;">${new Person(application).fullName('FMLs')}</strong>`
        hbs.applicant += ` <small>(${calculateYearAge(application.dob, application.finishedAt.split(' ')[0])} yo`
        hbs.applicant += ` / ***-**-${application.ssn.slice(-4)})</small>`
        hbs.appliedAt = moment(application.appliedAt).format('lll')
        hbs.finishedAt = moment(application.finishedAt).format('lll')
        hbs.appCount = application.count
        hbs.actionUrl = {}

        const backLinkQuery = {
            'prior-residence': 'address',
            citations: 'legal-compliance',
            accidents: 'safety',
            'prev-employers': 'prev-employment',
        }[target]
        const backLinkName = {
            'prior-residence': '<i class="angle double left icon"></i> Current Residence',
            citations: '<i class="angle double left icon"></i> Legal Compliance',
            accidents: '<i class="angle double left icon"></i> Safety',
            'prev-employers': '<i class="angle double left icon"></i> Application',
        }[target]
        hbs.backLink = `<a href="/drivers/application/${formId}/e-form?${backLinkQuery}">${backLinkName}</a>`

        let options = {}
        const dropdown = { state: '' }, t = `\t`.repeat(10)

        for (const state in Address.list.state)
            dropdown.state += `\n${t}<div class="item" data-value="${state}">${Address.list.state[state]}</div>`

        switch (target) {

            case 'prior-residence':
                if (application.address.enough) return respond404(res)
                //! IMPORTANT
                //? if not enough and country before current address (DO NOT ACCEPT) --- later

                {
                    const fields = ['_address1', '_address2', '_addrZip', '_addrCity', '_addrSince']
                    fields.forEach(field => {
                        options[field] = { text: { input: { disabled: false } } }
                    })
                    options._addrState = { hidden: { input: { disabled: false } } }
                }
                dropdown.country = ''
                for (const country in Geography.list.country) {
                    dropdown.country += `\n\t\t\t\t\t\t\t<div class="item" data-value="${country}">${Geography.list.country[country]}</div>`
                }
                hbs.addrMaxDate = moment(application.address.since).clone().subtract(1, 'day').format('YYYY-MM-DD')
                hbs.actionUrl.priorResidence = `/resource/driver/application/${formId}/prior-residence`
                break

            case 'citations':
                dropdown.violation = ''
                for (const category in Application.list.violation) {
                    const items = Application.list.violation[category]
                    dropdown.violation += `\n${t}<div class="header"><span class="ui teal text">${category}</span></div>`

                    for (const item in items)
                        dropdown.violation += `\n${t}<div class="item" data-value="${item}">${items[item]}</div>`
                }
                options._citOtherReason = { text: { input: { id: null, disabled: true } } }
                break

            case 'accidents':
                dropdown.accident = ''
                for (const category in Application.list.collision) {
                    const items = Application.list.collision[category]
                    dropdown.accident += `\n${t}<div class="header"><span class="ui teal text">${category}</span></div>`

                    for (const item in items)
                        dropdown.accident += `\n${t}<div class="item" data-value="${item}">${items[item]}</div>`
                }
                options._accOtherType = { text: { input: { id: null, disabled: true } } }
                break

            case 'prev-employers':
                dropdown.addrState = ''
                for (const state in Address.list.state)
                    dropdown.addrState += `\n${t}<div class="item" data-value="${state}">${Address.list.state[state]}</div>`

                let emplOptions = {}
                const fields = [
                    'employer', 'startDate', 'endDate2', 
                    'phone', 'address1', 'address2', 'addrZip', 'addrCity', [ 'addrState', 'hidden' ],
                    'position', 'earnings', 'RFL', //'gapExpl',
                ]
                fields.forEach(field => {
                    let prop = 'text'
                    if (Array.isArray(field))
                        [ field, prop ] = field

                    emplOptions[field] = { [prop]: { input: { disabled: false } } }
                })
                emplOptions.RFL.text.input.rows = 2,
                emplOptions.RFL.text.input.placeholder = ' '

                // const fields = [
                //     '_prevEmployer', '_emplPhone', '_emplStartDate', '_emplEndDate',
                //     '_emplAddr1', '_emplAddr2', '_emplAddrZip', '_emplAddrCity', ['_emplAddrState', 'hidden'],
                //     '_emplPosition', '_emplEarnings', '_emplRFL',
                // ]
                // fields.forEach(field => {
                //     let prop = 'text'
                //     if (Array.isArray(field))
                //         [ field, prop ] = field

                //     options[field] = { [prop]: { input: { disabled: false } } }
                // })
                // options._emplEndDate.text.label = { content: 'Left on' }
                // options._emplRFL.text.input.rows = 2,
                // options._emplRFL.text.input.placeholder = ' '
                hbs.cdl = application?.dl?.commercial === true
                hbs.emplForm = new EmploymentForm(emplOptions)
                break

        }

        hbs.form = new ApplicationForm(options)
        hbs.dropdown = dropdown

        res.render(key.replaceAll('.', '/'), hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== APPLICANT ROUTES ==== //


router.get('/applicants', User.mw.verify, Team.mw.verify, async (req, res) => {
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
        sendError.server(req, res, err)
    }
})



// ==== EMPLOYER ROUTES ==== //


router.get('/previous-employments', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { user } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!inPEnvironment('d:drv/emp', permissions, DS))
            return res.redirect(res.session.defUrl)

        const key = 'drivers.previous-employments'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: "Applicants' Previous Employments" })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 1))

        const privs = ['create', 'modify', 'update']
        hbs.permissions = {}
        privs.forEach(priv => hbs.permissions[priv] = withPrivileges('d:drv/emp', priv, permissions, DS))

        if (hbs.permissions.create || hbs.permissions.modify || hbs.permissions.update) {
            let options = {}, dropdown = {}, t = `\t`.repeat(9)

            if (hbs.permissions.create || hbs.permissions.modify) {
                dropdown.addrState = ''
                for (const state in Address.list.state)
                    dropdown.addrState += `\n${t}<div class="item" data-value="${state}">${Address.list.state[state]}</div>`
                const fields = [
                    'employer', 'startDate', 'endDate2', 
                    'phone', 'address1', 'address2', 'addrZip', 'addrCity', [ 'addrState', 'hidden' ],
                    'position', 'earnings', 'RFL', 'usdot',  //'gapExpl',
                    'urEmployer', 'urUsdot', 'urPhone', 'urAddress1', 'urAddress2', 'urAddZip', 'urAddrCity', [ 'urAddrState', 'hidden' ],
                ]
                fields.forEach(field => {
                    let prop = 'text'
                    if (Array.isArray(field))
                        [ field, prop ] = field

                    options[field] = { [prop]: { input: { disabled: false } } }
                })
                options.RFL.text.input.rows = 3,
                options.RFL.text.input.placeholder = ' '
            } else {
                // make html info only
            }

            if (hbs.permissions.update) {
                dropdown.inquiryMethod = ''
                dropdown.inquiryResponse = ''
                dropdown.phoneVerifTermType = ''
                dropdown.phoneVerifRehire = ''

                const methods = Employment.list.inquiryMethod, responses = Employment.list.inquiryResponse
                for (const prop in methods)
                    dropdown.inquiryMethod += `<div class="item" data-value="${prop}">${methods[prop]}</div>`
                for (const prop in responses)
                    dropdown.inquiryResponse += `<div class="item" data-value="${prop}">${responses[prop]}</div>`

                const termTypes = Employment.list.termType, rehireTypes = Employment.list.rehire
                for (const type in termTypes)
                    dropdown.phoneVerifTermType += `<div class="item" data-value="${type}">${termTypes[type]}</div>`
                for (const type in rehireTypes)
                    dropdown.phoneVerifRehire += `<div class="item" data-value="${type}">${rehireTypes[type]}</div>`

                // const fields = [
                //     // [ 'inquiryMethod', 'hidden' ],
                //     // [ 'inquiryResponse', 'hidden' ],
                //     'fax', 'email', 'inquryNote',
                // ]

                if (withPrivileges('f:drv/apl', 'download', permissions, DS)) {
                    // show link to prev-employment file
                }
            }

            hbs.form = new EmploymentForm(options)
            hbs.cdl = true
            hbs.dropdown = dropdown
        }

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


// ==== HIRED DRIVERS ROUTES ==== //


router.get('/hired', User.mw.verify, Team.mw.verify, async (req, res) => {
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

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 2))

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


// ==== DRIVER PAY AGREEMENTS ROUTES ==== //


router.get('/pay-agreements', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!inPEnvironment('d:drv/drv', permissions, DS))
            return res.redirect(res.session.defUrl)

        const key = 'drivers.pay-agreements'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Driver Pay Agreements' })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 3))

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


// ==== LEAVING DRIVERS ROUTES ==== //


router.get('/leaving', User.mw.verify, Team.mw.verify, async (req, res) => {
    try {
        const { user, team } = res.session
        const { DS } = user
        const permissions = await user.permissions(res.session)
        if (!inPEnvironment('d:drv/drv', permissions, DS))
            return res.redirect(res.session.defUrl)

        const key = 'drivers.leaving'
        let { hbs } = res
        hbs = await hbs.set(key, { titlePfx: 'Leaving Contractors' })

        const { active } = hbs.nav
        hbs.nav.left.drivers = active

        hbs.nav.top.items = navBuilder.simple(navItems(permissions, DS, 4))

        res.render(key.replace('.', '/'), hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})




// ==== EXPORT ==== //

export default router