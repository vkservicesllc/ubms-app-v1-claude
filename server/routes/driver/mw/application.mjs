const sendError = require('../../../tools/utils/error')

import moment from 'moment'

/* Tools */
import User from '../../../tools/core/user.mjs'
import Team from '../../../tools/core/team.mjs'
import Company, { RefSource } from '../../../tools/core/company.mjs'
import Carrier from '../../../tools/core/carrier.mjs'
import Individual from '../../../tools/core/individual.mjs'
import Driver, { Application } from '../../../tools/core/driver.mjs'
import Person, { Relationship } from '../../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../../client/global/modules/tools/core/address.us.mjs'
import Geography from '../../../../client/global/modules/tools/core/geography.mjs'
import { respond404 } from '../../../tools/utils/response.mjs'
import { tel as formatTel, ssn as formatSsn, ein as formatEin } from '../../../../client/global/modules/tools/utils/formatter.mjs'
import { maskEmail } from '../../../tools/utils/string.mjs'

/* Forms */
import { ApplicationForm, EmploymentForm } from '../../../tools/form/driver.mjs'
import { updateFormOptions } from '../../../tools/form/builder.mjs'

const formInstr = {
    labelClass: 'form-label fw-normal text-secondary', // 'form-label text-black-50',
    labelClassRequired: 'form-label',
    textClass: 'form-control',
    textareaClass: 'form-control',
    selectClass: 'form-select',
}

const checkProps = {
    input: { class: 'form-check-input' },
    label: { class: 'form-check-label' },
}



export const applicationStart = async (req, res, next) => {
    try {
        const { env, cdl, vhl: vhlCode, rec: _userId, form: formId } = req.query

        const application = await Application.fetch(res.session, { formId })
        if ((formId && !application) || application?._driverId) return res.redirect(`/application/${formId}`)

        if (!formId && (!env || !cdl || !['0', '1'].includes(cdl))) return next()

        const { session } = res
        session.user = { id: 1 }

        const team = env === 'global' ? null : await Team.fetch(session, { _id: env })

        if (_userId) {
            const user = await User.fetch(session, { _simpleId: _userId })
            if (!user) return respond404(res)
        }

        const key = 'application.start'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application' })
        hbs.bodyAttrs = ' data-bs-theme="dark"'
        hbs.company = false
        hbs.refSrcDisplay = ''

        const { param: route } = req.params
        let _carrierId
        let refSrc = await RefSource.fetch(res.session)

        if (route) {
            const carrier = await Carrier.fetch(session, { route })
            if (!carrier) return respond404(res)

            _carrierId = carrier._id
            hbs.company = {
                name: carrier.name,
                address: carrier.address.physical.html({ inline: false }),
                phone: formatTel(carrier.phone),
            }

            const company = await Company.fetch(res.session, { _id: carrier._companyId })
            refSrc = await company.fetch('jx.refsources')
        } else if (team?.profile) 
            hbs.company = {
                name: team.profile.company,
                address: team.profile.address.html({ inline: false }),
                phone: formatTel(team.profile.phone),
            }

        hbs.text = {
            requiredDL: "driver's license",
        }
        if (cdl === '1') hbs.text.requiredDL = `commercial ${hbs.text.requiredDL}`

        const positionList = Driver.list.position

        let options = {}
        const refSrcData = {}
        refSrc.map(src => refSrcData[src._id] = src.name)
        if (!refSrc.length) hbs.refSrcDisplay = ' style="display: none;"'

        const fields = [ 'position', 'ssn', 'dob', 'refSrc' ] // 'ssnConf' ]
        options = updateFormOptions(options, ApplicationForm, fields, { ...formInstr, tab: 8 })
        options.position.select.label.content = 'Desired Position'
        options.ssn.text.label.content = 'Social Security Number'
        options.refSrc.select.input.data = refSrcData

        const t = `\t\t\t\t\t\t\t`
        const positionDesc = {
            CD: 'You drive a truck that belongs to the company. The company covers the vehicle, maintenance, and insurance.',
            OO: 'You drive your own truck under the company’s authority. You are responsible for your truck’s expenses and upkeep.',
            OD: 'You drive a truck that belongs to an Owner-Operator (not the company). The truck owner is responsible for the vehicle.',
            LP: 'You lease a truck from the company with the option to own it after payments are completed.',
        }
        hbs.positionDesc = ''

        for (const position in positionList) {
            const title = positionList[position]
            const desc = positionDesc[position]

            hbs.positionDesc += `\n${t}<dt class="text-success">${title}</dt>`
            hbs.positionDesc += `\n${t}<dd class="text-secondary"><small>${desc}</small></dd>`
        }

        hbs.form = new ApplicationForm(options)

        hbs.formUrl = '/resource/application/start'

        if (formId) hbs.formUrl += `?form=${formId}`
        else {
            hbs.formUrl += team ? `/${team._id}` : '/global'
            if (_carrierId) hbs.formUrl += `/${_carrierId}`
            hbs.formUrl += `?cdl=${cdl}`
            if (vhlCode) hbs.formUrl += `&vhl=${vhlCode}`
            if (_userId) hbs.formUrl += `&rec=${_userId}`
        }

        res.render('application/start', hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
}


export const applicationRegistration = async (req, res, next) => {
    try {
        const { formId } = req.params
        const { id: _id } = req.query
        const application = await Application.fetch(res.session, { formId }, { hideSensitive: false })
        if (!application || application._id !== _id || application.driverId || application.rehire)
            return res.redirect(`/application/${formId}`)

        const key = 'application.registration'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application' })
        hbs.bodyAttrs = ' data-bs-theme="dark"'

        let options = {}
        const fields = [
            'firstName', 'middleName', 'lastName', 'suffix',
            'gender', 'dob', 'phone', 'email', 'statusExp',
            'address1', 'address2', 'addrZip', 'addrCity', 'addrState', 'addrSince',
        ]
        options = updateFormOptions(options, ApplicationForm, fields, { ...formInstr, tabs: 8 })

        options.phone.text.label.content = 'U.S. Phone'
        options.addrState.select.input.options = { valOpt: true }
        options.statusExp.text.label.content = 'Expiration Date'
        options.marital = { radio: { label: { class: formInstr.labelClassRequired } } }
        options.status = { radio: { label: { class: formInstr.labelClassRequired } } }

        for (const prop of ['single', 'married', 'divorced', 'separated', 'widowed']) {
            options.marital.radio[prop] = { input: {}, label: {} }
            options.marital.radio[prop].input.class = 'form-check-input status-radio'
            options.marital.radio[prop].label.class = 'form-check-label'
        }

        for (const prop of ['citizen', 'resident', 'authorized']) {
            options.status.radio[prop] = { input: { disabled: false }, label: {} }
            options.status.radio[prop].input.class = 'form-check-input status-radio'
            options.status.radio[prop].label.class = 'form-check-label'
        }

        hbs._id = application._id
        hbs.carrier = application?.carrier?.name || null
        hbs.agency = !hbs.carrier ? application?.team?.name : null
        hbs.formId = application.formId
        hbs.position = application.expansion.position
        hbs.maskedSsn = formatSsn(application.lead.ssn, '*')
        hbs.dob = moment(application.lead.dob).format('ll')
        hbs.lead = application.lead
        hbs.form = new ApplicationForm(options)

        res.render('application/registration', hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
}


export const applicationLogin = async (req, res, next) => {
    try {
        const { param: formId } = req.params

        const application = await Application.fetch(res.session, { formId }, { hideSensitive: false })
        if (!application || !application._driverId) return respond404(res)

        res.session.application = application
        if (req.session.application) return next()

        if (application.condition !== 'p') {
            const key = 'application.submitted'
            let { hbs } = res
            hbs = hbs.set(key, { title: 'Driver Application Complete' })
            hbs.bodyAttrs = ' data-bs-theme="dark"'

            hbs.formId = formId

            return res.render('application/submitted', hbs)
        }

        const key = 'application.login'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application Sign-in' })
        hbs.bodyAttrs = ' data-bs-theme="dark"'

        let options = {}
        const placeholders = {
            phone: 'Phone',
            dob: 'Date of Birth',
            pin: 'PIN',
        }
        const fields = Object.keys(placeholders)
        options = updateFormOptions(options, ApplicationForm, fields, formInstr)
        fields.forEach(prop => {
            options[prop].text.input.placeholder = placeholders[prop]
            options[prop].text.input.autoComplete = 'off'
        })

        hbs.firstName = application.firstName
        hbs.maskedEmail = maskEmail(application.email)
        hbs.form = new ApplicationForm(options)
        hbs.formUrl = `/application/auth/login/${formId}`

        return res.render('application/login', hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
}


export const applicationProgress = async (req, res, next) => {
    try {
        const { session } = res
        session.user = { id: 1 }

        const { application } = session
        if (application.rehire) return next()

        const { formId, cdlRole, _teamId, step } = application

        const { application: _id } = req.session
        if (!_id || _id !== application._id || application.condition !== 'p') {
            delete req.session.application

            return res.redirect(`/application/${formId}`)
        }

        // const driver = await Driver.fetch(session, { _id: application._driverId })
        // if (!driver) return sendError.server(req, res, new Error('Unidentified Driver'))

        // const team = _teamId ? await Team.fetch(session, { _id: _teamId }) : null
        // if (_teamId && !team) return sendError.server(req, res, new Error('Unidentified Environment'))

        // let agency = team?.profile?.company
        // let carrier = application?.carrier?.name

        if (step === 12) return res.redirect(`/application/${formId}/agreement`)

        const steps = [ ...Application.list.step ]
        const key = 'application'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application' })
        hbs.bodyAttrs = ' data-bs-theme="dark"'

        const recUrl = `/resource/application/progress/${formId}`

        const buttonProps = {
            next: { class: 'primary bg-primary-subtle', text: 'Next' },
            save: { class: 'success bg-success-subtle', text: 'Save Changes' }
        }

        const accordionProps = {
            pending: {
                state: 'far fa-clock',
                head: '',
                body: ' show',
            },
            finished: {
                state: 'fa fa-check',
                head: ' collapsed',
                body: '',
            },
        }

        hbs.button = {}
        hbs.accordion = {}

        hbs.actionUrl = {
            profile: `${recUrl}/profile`,
            address: `${recUrl}/residence`,
            dl: `${recUrl}/driver-license`,
            mec: `${recUrl}/medical-card`,
            legal: `${recUrl}/legal-compliance`,
            safety: `${recUrl}/safety`,
            experience: `${recUrl}/experience`,
            prevEmployment: `${recUrl}/prev-employment`,
            prevEmployer: `${recUrl}/prev-employer`,
            preference: `${recUrl}/preference`,
            business: `${recUrl}/business`,
            beneficiary: `${recUrl}/beneficiary`,
            misc: `${recUrl}/misc`,
        }
        hbs.href = {
            summary: `/application/${formId}/summary`,
        }

        for (const ct of ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']) {
            hbs.button[ct] = buttonProps.next
            hbs.accordion[ct] = accordionProps.pending
        }

        const scrollAttr = ' data-scroll-point="#"'
        hbs.scrollPoint = {}

        let options = {
            appliedOn: {
                hidden: {
                    input: {
                        value: application.appliedOn,
                    },
                },
            },
        }
        let emplOptions = {}, expDate, noExp = true

        {
            const { firstName, middleName, lastName, suffix, email } = application
            const { address1, address2, zip: addrZip, city: addrCity } = application.address
            const values = {
                firstName, middleName, lastName, suffix,
                gender: application.gender,
                dob: moment(application.dob).format('MM/DD/YYYY'),
                // ssn: formatSsn(application.ssn),
                marital: application.marital,
                phone: formatTel(application.phone),
                email, position: application.position,
                address1, address2, addrZip, addrCity,
                addrState: application.address.state,
                addrSince: moment(application.address.since).format('MM/DD/YYYY'),
                addrEnough: application.address.enough ? '1' : '0',
                addrCurrentSince: application.address.since,
            }

            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr, tabs: 12 })
            options.addrState.select.input.options = { valOpt: true }
        }

        if (step >= 0) { /* PRIOR RESIDENCE */
            hbs.priorResidenceDisplay = ' style="display: none;"'
            hbs.countryDisplay = ' style="display: none;"'

            options.livedAbroad = { radio: {} }
            options._livedAbroad = { radio: {} }
            for (const prop of ['yes', 'no']) {
                options.livedAbroad.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options._livedAbroad.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
            }

            const fields = [
                '_address1', '_address2', '_addrZip',
                '_addrCity', '_addrState', '_addrSince',
            ]
            const values = {
                country: null,
            }
            fields.forEach(field => values[field] = null)

            if (application.address.enough === false) {
                hbs.priorResidenceDisplay = ''

                options.livedAbroad.radio.yes.input.disabled = false
                options.livedAbroad.radio.no.input.disabled = false
                options.livedAbroad.radio.yes.input.checked = application.address.livedAbroad === true
                options.livedAbroad.radio.no.input.checked = application.address.livedAbroad === false

                values.country = application.address.country

                if (application.address.livedAbroad === null) hbs.scrollPoint.priorAddr = scrollAttr
            }

            updateFormOptions(options, ApplicationForm, values, { ...formInstr, tabs: 13 })
            options._addrState.select.input.options = { valOpt: true }
            options._addrEnough = { hidden: { input: { class: 'driver-application-prev-addr-enough-hidden-input' } } }
            options._addrCurrentSince = { hidden: { input: { class: 'driver-application-prev-addr-since-hidden-input' } } }

            if (values.country) {
                hbs.countryDisplay = ''
                options.country.select.input.disabled = false
            }
        }

        if (step >= 1) { /* DRIVER LICENSE */
            hbs.button.zero = buttonProps.save
            hbs.accordion.zero = accordionProps.finished

            const values = {
                dlState: application?.dl?.state,
                dlNumber: application?.dl?.number,
                dlClass: application?.dl?.class,
                dlIss: application?.dl?.issuedOn ? moment(application.dl.issuedOn).format('MM/DD/YYYY') : null,
                dlExp: application?.dl?.expiresOn ? moment(application.dl.expiresOn).format('MM/DD/YYYY') : null,
                dlEndrs: application?.dl?.endorsement,
                dlRestr: application?.dl?.restriction,
                dlDeniedExpl: application?.dl?.deniedExpl,
                dlRevokedExpl: application?.dl?.revokedExpl,
            }
            const placeholders = {
                dlEndrs: 'None',
                dlRestr: 'None',
            }

            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr, tabs: 6 })
            Object.keys(placeholders).forEach(prop => options[prop].text.input.placeholder = placeholders[prop])
            options.dlState.select.input.options = { valOpt: true }
            options.dlEndrs.text.label.content = 'Endorsements <small>(if any)</small>'
            options.dlRestr.text.label.content = 'Restrictions <small>(if any)</small>'
            options.dlCommercial = { radio: { label: { class: formInstr.labelClassRequired } } }
            options.dlDenied = { radio: {} }
            options.dlRevoked = { radio: {} }

            for (const prop of ['yes', 'no']) {
                options.dlCommercial.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options.dlDenied.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options.dlRevoked.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
            }

            if (cdlRole) {
                options.dlCommercial.radio.yes.input.disabled = true
                options.dlCommercial.radio.no.input.disabled = true
                options.dlCommercial.radio.yes.input.checked = true
            }
            // else {
            //     if (application._mecId) {
            //         options.dlCommercial.radio.yes.input.disabled = true
            //         options.dlCommercial.radio.no.input.disabled = true
            //         options.dlCommercial.radio[application._mecId ? 'yes' : 'no'].input.checked = true
            //     } else if (application?.experience?.cmv || application?.experience?.cdlSchool) {
            //         options.dlCommercial.radio.yes.input.disabled = true
            //         options.dlCommercial.radio.no.input.disabled = true
            //         options.dlCommercial.radio.yes.input.checked = true
            //     } else {
            //         options.dlCommercial.radio.yes.input.checked = application?.dl?.commercial === true
            //         options.dlCommercial.radio.no.input.checked = application?.dl?.commercial === false
            //     }
            // }

            if (options.dlCommercial.radio.yes.input.checked) options.dlEndrs.text.input.disabled = false
            options.dlDenied.radio.yes.input.checked = application?.dl?.denied === true
            options.dlDenied.radio.no.input.checked = application?.dl?.denied === false
            options.dlRevoked.radio.yes.input.checked = application?.dl?.revoked === true
            options.dlRevoked.radio.no.input.checked = application?.dl?.revoked === false
            if (values.dlDeniedExpl) options.dlDeniedExpl.text.input.disabled = false
            if (values.dlRevokedExpl) options.dlRevokedExpl.text.input.disabled = false

            if (!values.dlState) hbs.scrollPoint.dl = scrollAttr
        }

        if (step >= 2) { /* MEDICAL CARD */
            hbs.button.one = buttonProps.save
            hbs.accordion.one = accordionProps.finished
            hbs.medCard = application.dl.commercial === false
            hbs.medCardDisplay = ''
            hbs.noMecDisplay = ' style="display: none;"'
            hbs.medListDisplay = ' style="display: none;"'

            const values = {
                mecExp: application?.mec?.expiresOn ? moment(application.mec.expiresOn).format('MM/DD/YYYY') : null,
                mecIss: application?.mec?.issuedOn ? moment(application.mec.issuedOn).format('MM/DD/YYYY') : null,
                mecNumber: application?.mec?.nrcme,
                medList: application.medList,
            }

            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr })
            options.noMec = { checkbox: { input: { ...checkProps.input }, label: { ...checkProps.label } } }
            options.underMeds = { radio: {} }
            for (const prop of ['yes', 'no'])
                options.underMeds.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
            options.underMeds.radio.yes.input.checked = application.underMeds === true
            options.underMeds.radio.no.input.checked = application.underMeds === false
            options.medList.text.label.content = 'List medications <small>(names only)</small>'

            const fields = Object.keys(values).filter(key => !['medList'].includes(key))
            if (hbs.medCard && step > 2 && !application._mecId) {
                hbs.medCardDisplay = ' style="display: none;"'

                fields.forEach(prop => {
                    options[prop].text.input.value = null
                    options[prop].text.input.disabled = true
                })
                options.noMec.checkbox.input.checked = true
                hbs.noMecDisplay = ''
            } else
                fields.forEach(prop => { if (options[prop].text) options[prop].text.input.disabled = false })
            if (values.medList) {
                options.medList.text.input.disabled = false
                hbs.medListDisplay = ''
            }

            if (application.underMeds === null) hbs.scrollPoint.mec = scrollAttr
        }

        if (step >= 3) { /* LEGAL COMPLIANCE */
            hbs.button.two = buttonProps.save
            hbs.accordion.two = accordionProps.finished
            hbs.criminalExplDisplay = ' style="display: none;"'
            hbs.duiInDecadeDisplay = ' style="display: none;"'
            hbs.citationsDisplay = ' style="display: none;"'

            const values = {
                criminalExpl: application.criminalExpl,
            }
            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr })

            options.dui = { radio: {} }
            options.duiInDecade = { radio: {} }
            options.criminal = { radio: {} }
            options.dotDat = { radio: {} }
            options.citations = { radio: {} }

            for (const prop of ['yes', 'no']) {
                options.dui.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options.duiInDecade.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options.criminal.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options.dotDat.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options.citations.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
            }

            options.dui.radio.yes.input.checked = application.dui === true
            options.dui.radio.no.input.checked = application.dui === false
            options.criminal.radio.yes.input.checked = application.criminal === true
            options.criminal.radio.no.input.checked = application.criminal === false
            options.dotDat.radio.yes.input.checked = application.dotDat === true
            options.dotDat.radio.no.input.checked = application.dotDat === false
            options.citations.radio.yes.input.checked = application.citations === true
            options.citations.radio.no.input.checked = application.citations === false

            if (application.dui === true) {
                options.duiInDecade.radio.yes.input.disabled = false
                options.duiInDecade.radio.no.input.disabled = false
                options.duiInDecade.radio.yes.input.checked = application.duiInDecade === true
                options.duiInDecade.radio.no.input.checked = application.duiInDecade === false
                hbs.duiInDecadeDisplay = ''
            }
            if (values.criminalExpl) {
                options.criminalExpl.text.input.disabled = false
                hbs.criminalExplDisplay = ''
            }
            if (application.citations === true)
                hbs.citationsDisplay = ''

            const fields = ['_citReason', '_citOtherReason', '_citDate', '_citState']
            options = updateFormOptions(options, ApplicationForm, fields, { ...formInstr, tabs: 7 })

            if (application.citations === null) hbs.scrollPoint.legal = scrollAttr
        }

        if (step >= 4) { /* SAFETY */
            hbs.button.three = buttonProps.save
            hbs.accordion.three = accordionProps.finished
            hbs.accidentsDisplay = ' style="display: none;"'

            options.accidents = { radio: {} }
            options._accInjuries = { radio: {} }
            options._accFatalities = { radio: {} }
            for (const prop of ['yes', 'no']) {
                options.accidents.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options._accInjuries.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options._accFatalities.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
            }
            options.accidents.radio.yes.input.checked = application.accidents === true
            options.accidents.radio.no.input.checked = application.accidents === false

            if (application.accidents === true)
                hbs.accidentsDisplay = ''

            let { labelClassRequired } = formInstr
            labelClassRequired += ' input-required'
            const fields = ['_accType', '_accOtherType', '_accDate', '_accState' ]
            options = updateFormOptions(options, ApplicationForm, fields, { ...formInstr, tabs: 7 })
            options._accInjuries.radio.label = { class: labelClassRequired }
            options._accFatalities.radio.label = { class: labelClassRequired }

            if (application.accidents === null) hbs.scrollPoint.safety = scrollAttr
        }

        if (step >= 5) { /* DRIVING EXPERIENCE */
            hbs.button.four = buttonProps.save
            hbs.accordion.four = accordionProps.finished
            hbs.vhlExpColWidth = cdlRole && application.dl.commercial ? 4 : 6
            hbs.expDetailsDisplay = ''
            hbs.cmvExpDisplay = ''
            hbs.schoolDisplay = ' style="display: none;"'

            let { labelClassRequired } = formInstr
            let disabled = false

            options.noExp = { checkbox: { input: { ...checkProps.input }, label: { ...checkProps.label } } }
            options.cmvExp = { radio: {} }
            options.cdlSchool = { radio: {} }

            if (application.experience === false) {
                options.noExp.checkbox.input.checked = true
                hbs.expDetailsDisplay = ' style="display: none;"'
                disabled = true
            }

            for (const prop of ['yes', 'no']) {
                options.cmvExp.radio[prop] = { input: { ...checkProps.input, disabled }, label: { ...checkProps.label } }
                options.cdlSchool.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
            }

            options.straightExp = { checkbox: { label: { class: labelClassRequired } } }
            options.semiExp = { checkbox: { label: { class: labelClassRequired } } }

            for (const prop in Application.list.vehicle.straight) {
                const checked = application?.experience?.vehicles?.straight?.includes(prop)
                options.straightExp.checkbox[prop] = { input: { ...checkProps.input, checked, disabled }, label: { ...checkProps.label } }
            }

            for (const prop in Application.list.vehicle.semi) {
                const checked = application?.experience?.cmv === true && application?.experience?.vehicles?.semi?.includes(prop)
                options.semiExp.checkbox[prop] = { input: { ...checkProps.input, checked, disabled }, label: { ...checkProps.label } }
            }

            options.vanExp = { checkbox: {
                input: { ...checkProps.input, disabled, checked: application?.experience?.vehicles?.misc?.includes('van') },
                label: { ...checkProps.label },
            }}
            options.hotshotExp = { checkbox: {
                input: { ...checkProps.input, disabled, checked: application?.experience?.vehicles?.misc?.includes('hotshot') },
                label: { ...checkProps.label },
            }}
            options.tandemExp = { checkbox: {
                input: {
                    ...checkProps.input,
                    disabled,
                    checked: application?.experience?.cmv === true && application?.experience?.vehicles?.misc?.includes('tandem'),
                },
                label: { ...checkProps.label },
            }}

            options.cmvExp.radio.yes.input.checked = application?.experience?.cmv === true
            options.cmvExp.radio.no.input.checked = application?.experience?.cmv === false

            options.cdlSchool.radio.yes.input.checked = !!application.cdlSchool
            options.cdlSchool.radio.no.input.checked = application.cdlSchool === false

            const values = {
                expStartDate: application?.experience?.firstDate
                    ? moment(application.experience.firstDate).format('MM/DD/YYYY')
                    : null,
                // expEndDate: application?.experience?.lastDate
                //     ? moment(application.experience.lastDate).format('MM/DD/YYYY')
                //     : null,
                expMileage: application?.experience?.mileage?.toLocaleString(),
                schName: application?.cdlSchool?.name,
                schPhone: application?.cdlSchool?.phone
                    ? formatTel(application.cdlSchool.phone)
                    : null,
                schState: application?.cdlSchool?.state,
                schEndDate: application?.cdlSchool?.endDate
                    ? moment(application.cdlSchool.endDate).format('MM/DD/YYYY')
                    : null,
                schDuration: application?.cdlSchool?.duration,
            }

            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr, disabled, tabs: 8 })
            options.schState.select.input.options = { valOpt: true }

            // const appliedOn = moment(application.appliedOn)
            // let j = 8
            // for (let i = 0; i < 7; i++) {
            //     const content = `<small>${appliedOn.clone().subtract(--j, 'days').format('dddd/MMM D, YYYY')}</small>`.replace('/', '<br/>')
            //     let hours = application?.experience?.hours?.[i]
            //     if (hours === 0) hours = `${hours}`

            //     options[`expHours${i + 1}`] = {
            //         text: {
            //             input: {
            //                 class: formInstr.textClass,
            //                 value: hours || null,
            //                 disabled,
            //             },
            //             label: {
            //                 class: formInstr.labelClassRequired,
            //                 content,
            //             },
            //         },
            //     }
            // }

            if (!!application.cdlSchool) hbs.schoolDisplay = ''
            if (application?.experience?.cmv === false) hbs.cmvExpDisplay = ' style="display: none;"'

            if (application.experience === null) hbs.scrollPoint.experience = scrollAttr
        }




        if (step >= 6) { /* PREVIOUS EMPLOYMENT */
            hbs.button.five = buttonProps.save
            hbs.accordion.five = accordionProps.finished
            hbs.employedDisplay = ''

            if (application.experience) {
                hbs.employedDisplay = ' style="display: none;"'
                noExp = false
                const firstDate = moment(application.experience.firstDate)
                const appliedOn = moment(application.appliedOn)
                const expYears = appliedOn.diff(firstDate, 'years')

                if (expYears < 10) expDate = firstDate.format('ll')
            }

            options.prevEmployed = { radio: {} }
            emplOptions.FMCSR = { radio: {} }
            emplOptions.dotDat = { radio: {} }
            for (const prop of ['yes', 'no']) {
                options.prevEmployed.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                emplOptions.FMCSR.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                emplOptions.dotDat.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
            }
            options.prevEmployed.radio.yes.input.checked = application.prevEmployed === true
            options.prevEmployed.radio.no.input.checked = application.prevEmployed === false

            const fields = [
                'employer', 'startDate',
                'phone', 'address1', 'address2', 'addrZip', 'addrCity', 'addrState',
                'position', 'earnings', 'usdot', 'endDate', 'RFL', 'gapExpl',
            ]
            emplOptions = updateFormOptions(emplOptions, EmploymentForm, fields, { ...formInstr, tabs: 7 })
            
                    //? Should i make changes in disabled prop here
                    //! It's happening because of validator
                    emplOptions.FMCSR.radio.yes.input.disabled = false
                    emplOptions.FMCSR.radio.no.input.disabled = false
            // const fields = [
            //     '_prevEmployer', '_emplPhone',
            //     '_emplAddr1', '_emplAddr2', '_emplAddrZip',
            //     '_emplAddrCity', '_emplAddrState', '_emplStartDate',
            //     '_emplPosition', '_emplEarnings',
            //     '_emplEndDate', '_emplRFL',
            // ]
            // options = updateFormOptions(options, ApplicationForm, fields, { ...formInstr, tabs: 7 })
            // // options._emplAddr1.text.input.placeholder = 'Type full address...'
            // // options._emplAddrState.select.input.options = { valOpt: true }

            if (step === 6) hbs.scrollPoint.employment = scrollAttr
        }




        if (step >= 7) { /* DRIVING PREFERENCES */
            hbs.button.six = buttonProps.save
            hbs.accordion.six = accordionProps.finished
            hbs.partnerDisplay = ' style="display: none;"'

            options.operType = {
                radio: {
                    solo: { input: { ...checkProps.input, checked: application?.preference?.operType === 's' }, label: { ...checkProps.label } },
                    team: { input: { ...checkProps.input, checked: application?.preference?.operType === 't' }, label: { ...checkProps.label } },
                },
            }

            options.haulRegion = { checkbox: {} }
            options.equipmentType = { checkbox: {} }

            for (const prop in Application.list.haulRegion) {
                const checked = application?.preference?.haulRegion?.includes(prop)
                options.haulRegion.checkbox[prop] = { input: { ...checkProps.input, checked }, label: { ...checkProps.label } }
            }

            for (const prop in Application.list.vehicle.semi) {
                const checked = application?.preference?.equipmentType?.includes(prop)
                options.equipmentType.checkbox[prop] = { input: { ...checkProps.input, checked }, label: { ...checkProps.label } }
            }

            const values = {
                teamName: application?.preference?.teamName,
                teamPhone: application?.preference?.teamPhone ? formatTel(application?.preference?.teamPhone) : null,
                startPref: application?.preference?.startPref,
            }
            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr, tabs: 6 })

            if (application?.preference?.operType === 't') {
                hbs.partnerDisplay = ''
                options.teamName.text.input.disabled = false
                options.teamPhone.text.input.disabled = false
            }

            if (!application?.preference?.startPref) hbs.scrollPoint.preference = scrollAttr
        }

        if (step >= 8) { /* BUSINESS / OWNERSHIP */
            if (application.position === 'OO') steps[8] = 'Business / Ownership'
            hbs.button.seven = buttonProps.save
            hbs.accordion.seven = accordionProps.finished
            hbs.llcDetailsDisplay = ' style="display: none;"'
            // hbs.llcAssistanceDisplay = ' style="display: none;"'
            // hbs.llcProposedDisplay = ' style="display: none;"'

            options.activeLLC = { radio: {} }
            // options.llcAssistance = { radio: {} }
            for (const prop of ['yes', 'no']) {
                options.activeLLC.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                // options.llcAssistance.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
            }

            const values = {
                llcName: application?.business?.busName,
                llcState: application?.business?.state,
                llcEin: application?.business?.ein,
                // llcProposedName: application?.business?.proposedName,
            }

            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr })

            if (application.activeBusiness === true) {
                options.activeLLC.radio.yes.input.checked = true
                hbs.llcDetailsDisplay = ''
                options.llcName.text.input.disabled = false
                options.llcState.select.input.disabled = false
                options.llcEin.text.input.disabled = false
            }

            if (application.activeBusiness === false) {
                options.activeLLC.radio.no.input.checked = true
                // hbs.llcAssistanceDisplay = ''

                // if (application.businessAssist === true) {
                //     options.llcAssistance.radio.yes.input.checked = true
                //     options.llcProposedName.text.input.disabled = false
                //     hbs.llcProposedDisplay = ''
                // } else
                //     options.llcAssistance.radio.no.input.checked = true

                // options.llcAssistance.radio.yes.input.disabled = false
                // options.llcAssistance.radio.no.input.disabled = false
            }

            if (application.position === 'OO') {
                const values = {
                    currentVhlType: application?.vehicle?.type,
                }

                const vhlTypeData = Application.list.vhlType[cdlRole]

                if (!cdlRole) {
                    values.currentVhlMMT = application?.vehicle?.mmt
                    values.currentVhlMake = application?.vehicle?.make
                    values.currentVhlModel = application?.vehicle?.model
                    values.currentVhlYear = application?.vehicle?.year
                    values.currentVhlLen = application?.vehicle?.length
                    hbs.currentVhlLenDisplay = values.currentVhlLen ? '' : ' style="display: none;"'

                    if (values.currentVhlMMT && values.currentVhlMMT !== 'other') {
                        const [ type, make, model ] = values.currentVhlMMT.split(':')

                        values.currentVhlType = type
                        values.currentVhlMake = make
                        values.currentVhlModel = model
                    }
                    if (values.currentVhlYear) values.currentVhlYear = ':' + values.currentVhlYear
                }

                options = updateFormOptions(options, ApplicationForm, values, { ...formInstr, tabs: 7 })
                options.currentVhlType.select.input.data = vhlTypeData

                if (!cdlRole) {
                    if (values.currentVhlMMT !== 'other') {
                        options.currentVhlType.select.input.disabled = true
                        options.currentVhlMake.text.input.disabled = true
                        options.currentVhlModel.text.input.disabled = true
                    }

                    if (values.currentVhlType !== 'straightBox')
                        options.currentVhlLen.select.input.disabled = true

                    options.currentVhlLen.select.input.data = Application.list.vhlLength.straightBox
                }
            }

            if (application.activeBusiness === null) hbs.scrollPoint.business = scrollAttr
        }

        if (step >= 9) { /* BENEFICIARY */
            hbs.button.eight = buttonProps.save
            hbs.accordion.eight = accordionProps.finished
            hbs.benefOtherRelDisplay = ' style="display: none;"'

            const values = {
                benefRelation: application?.beneficiary?.relation,
                benefOtherRel: application?.beneficiary?.otherRel,
                benefFirstName: application?.beneficiary?.firstName,
                benefMiddleName: application?.beneficiary?.middleName,
                benefLastName: application?.beneficiary?.lastName,
                benefSuffix: application?.beneficiary?.suffix,
                // benefDob: application?.beneficiary?.dob
                //     ? moment(application.beneficiary.dob).format('MM/DD/YYYY')
                //     : null,
                // benefGender: application?.beneficiary?.gender,
                benefPhone: application?.beneficiary?.phone,
                // benefAddress1: application?.beneficiary?.address1,
                // benefAddress2: application?.beneficiary?.address2,
                // benefAddrZip: application?.beneficiary?.zip,
                // benefAddrCity: application?.beneficiary?.city,
                // benefAddrState: application?.beneficiary?.state,
                benefSsn: application?.beneficiary?.ssn, //! may need to format
            }
            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr, tabs: 6 })
            options.benefMiddleName.text.label.content = 'Middle Name/Initial'
            // options.benefAddrState.select.input.options = { valOpt: true }

            if (values.benefOtherRel) {
                hbs.benefOtherRelDisplay = ''
                options.benefOtherRel.text.input.disabled = false
            }

            const relationData = Relationship.data(application.marital)
            options.benefRelation.select.input.data = relationData

            if (!application.beneficiary) hbs.scrollPoint.beneficiary = scrollAttr
        }

        if (step >= 10) { /* MISC */
            hbs.button.nine = buttonProps.save
            hbs.accordion.nine = accordionProps.finished

            const values = {
                emergPhone: application?.emergency?.phone,
                emergName: application?.emergency?.name,
                emergRelation: application?.emergency?.relation,
            }
            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr, tabs: 7 })

            if (!application.emergency) hbs.scrollPoint.misc = scrollAttr
        }

        if (step >= 11) {
            hbs.button.ten = buttonProps.save
            hbs.accordion.ten = accordionProps.finished

            if (!('edit' in req.query)) return res.redirect(`/application/${formId}/summary`)
        }


        hbs.form = new ApplicationForm(options)
        hbs.emplForm = new EmploymentForm(emplOptions)
        hbs.formId = formId
        hbs.agency = application?.team?.name
        hbs.carrier = application?.carrier?.name
        hbs.maskedSsn = formatSsn(application.ssn, '*')
        hbs.progress = Math.round(step / steps.length * 100)
        hbs.progressBg = hbs.progress === 100 ? 'success' : 'secondary'
        hbs.step = step
        hbs.steps = steps
        hbs.cdlRole = cdlRole
        hbs.applicantName = application.fullName
        hbs.applicantPosition = application.expansion.position
        hbs.position = application.position
        hbs.addrEnough = application.address.enough
        hbs.cdl = application?.dl?.commercial === true
        hbs.noExp = noExp
        hbs.expDate = expDate
        hbs.startedAt = moment(application.appliedAt).format('MMM D, YYYY hh:mm A') + ' ET'
        hbs.emplExpStartDate = application?.experience?.firstDate || ''

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
}


export const applicationRehireProgress = async (req, res) => {}


export const applicationSummary = async (req, res) => {
    try {
        const { application: _id } = req.session
        const { formId } = req.params

        if (!_id) {
            delete req.session.application

            return res.redirect(`/application/${formId}`)
        }

        const application = await Application.fetch(res.session, { _id }, { hideSensitive: false })
        if (!application) return respond404(res)

        if (formId !== application.formId) {
            delete req.session.application

            return res.redirect(`/application/${formId}`)
        }

        if (application.step !== 11) return res.redirect(`/application/${formId}`)

        const key = 'application.summary'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application Summary' })
        hbs.bodyAttrs = ' data-bs-theme="dark"'

        const na = (txt = 'None') => `<small class="text-danger">${txt}</small>`

        hbs.href = {
            form: `/application/${formId}?edit`,
            dox: `/application/${formId}/documents`,
            agreement: `/application/${formId}/agreement`,
        }
        hbs.actionUrl = {
            certify: `/resource/application/progress/${formId}/certify`,
        }

        hbs.application = application

        hbs.application.fullLastName = application.lastName
        if (!application.middleName) hbs.application.middleName = na()
        if (application.suffix) hbs.application.fullLastName += `, ${application.suffix}`

        hbs.application.dob = moment(application.dob).format('ll')
        hbs.application.ssn = formatSsn(application.ssn)
        hbs.application.maritalStatus = Individual.list.marital[application.marital]

        hbs.application.phone = formatTel(application.phone)
        hbs.application.emergency.phone = formatTel(application.emergency.phone)
        if (application.emergency.relation) hbs.application.emergency.relation = ` <small>(${application.emergency.relation})</small>`

        hbs.application.fullAddress = application.address.html({ inline: false })
        hbs.application.address.since = moment(application.address.since).format('ll')
        if (application.address.country)
            hbs.application.address.country = Geography.list.country[application.address.country]

        hbs.application.dl.type = application.dl.commercial ? 'Commercial' : 'Non-Commercial'
        hbs.application.dl.state = Address.list.state[application.dl.state]
        if (!application.dl.class) hbs.application.dl.class = na
        hbs.application.dl.issuedOn = moment(application.dl.issuedOn).format('ll')
        hbs.application.dl.expiresOn = moment(application.dl.expiresOn).format('ll')
        if (!application.dl.endorsement) hbs.application.dl.endorsement = na()
        if (!application.dl.restriction) hbs.application.dl.restriction = na()
        if (!application.dl.deniedExpl) hbs.application.dl.deniedExpl = 'Never'
        if (!application.dl.revokedExpl) hbs.application.dl.revokedExpl = 'Never'

        if (application.mecId) {
            if (application.mec.expiresOn)
                hbs.application.mec.expiresOn = moment(application.mec.expiresOn).format('ll')
            hbs.application.mec.issuedOn = application.mec.issuedOn ? moment(application.mec.issuedOn).format('ll') : na('N/A')
            if (!application.mec.nrcme) hbs.application.mec.nrcme = na('N/A')
        }
        if (!application.medList) hbs.application.medList = na()

        hbs.application.dui = !application.dui
            ? 'Never'
            : (application.duiInDecade ? 'Within past 10 years' : 'Before 10 years ago')
        hbs.application.criminal = application.criminalExpl || na()
        hbs.application.dotDat = application.dotDat
            ? 'Refused/failed in the past 5 years'
            : 'Never failed/refused in the past 5 years'

        if (application.experience !== false) {
            let { firstDate, lastDate } = application.experience
            firstDate = moment(firstDate).format('ll')
            // lastDate = moment(lastDate).format('ll')

            if (application.experience.cmv !== null)
                hbs.application.experience.cmv = application.experience.cmv ? 'Yes' : 'No'

            hbs.application.experience.vehicleList = na()
            if (application.experience.vehicles) {
                const miscList = Application.list.vehicle.misc // { van: 'Cargo Van', tandem: 'Tandem Semi Tractor/Trailer' }
                const groups = { straight: 'Straight Truck', semi: 'Semi Trailer', misc: null }
                const { vehicles } = application.experience
                let html = ''

                for (let group in vehicles) {
                    const array = vehicles[group], list = []
                    const data = group !== 'misc' ? Application.list.vehicle[group] : miscList
                    const type = group === 'straight' ? ' Truck' : ''

                    if (html) html += '<br/>'
                    if (group !== 'misc') html += `<small class="text-secondary"><b>${groups[group]}:</b></small><br/>`

                    array.forEach(prop => list.push(data[prop] + type))
                    html += list.join(', ')
                }

                hbs.application.experience.vehicleList = html
            }

            // hbs.application.experience.period = `${firstDate} — ${lastDate}`
            hbs.application.experience.firstDate = firstDate
            if (application.experience.mileage)
                hbs.application.experience.mileage = application.experience.mileage.toLocaleString()
            if (application.experience.hours) {
                let total = 0
                application.experience.hours.forEach(hours => total += +hours)
                hbs.application.experience.hourList = application.experience.hours.join(' + ') + ' = ' + total
            }
        }

        if (application.cdlSchool !== null) {
            if (application.cdlSchool !== false) {
                hbs.application.cdlSchool.phone = formatTel(application.cdlSchool.phone)
                hbs.application.cdlSchool.state = Address.list.state[application.cdlSchool.state]
                hbs.application.cdlSchool.duration = Application.list.schoolDuration[application.cdlSchool.duration]
                hbs.application.cdlSchool.endDate = moment(application.cdlSchool.endDate).format('ll')
            } else hbs.application.cdlSchool = { name: 'Never attended' }
        }

        // hbs.application.preference.operType = { s: 'Solo', t: 'Team' }[application.preference.operType]
        hbs.application.preference.teamName = application.preference.teamName || na()
        hbs.application.preference.teamPhone = application.preference.teamPhone ? formatTel(application.preference.teamPhone) : na()
        if (application.preference?.haulRegion) {
            const haulRegionList = []
            application.preference.haulRegion.forEach(region => haulRegionList.push(Application.list.haulRegion[region]))
            hbs.application.preference.haulRegionList = haulRegionList.join(', ')
        }
        if (application.preference?.haulRegion) {
            const equipmentList = []
            application.preference.equipmentType.forEach(type => equipmentList.push(Application.list.vehicle.semi[type]))
            hbs.application.preference.equipmentList = equipmentList.join(', ')
        }
        hbs.application.preference.startPref = Application.list.startPref[application.preference.startPref]

        if (application.activeBusiness) {
            hbs.application.business.state = Address.list.state[application.business.state]
            hbs.application.business.ein = formatEin(application.business.ein) || na('N/A')
        } // else {
        //     hbs.application.businessAssist = application.businessAssist
        //         ? `<small>Proposed name</small><br/>"${application.business.proposedName}, LLC"`
        //         : 'Not needed'
        // }

        hbs.application.beneficiary.relationship = application.beneficiary.otherRel || application.beneficiary.relation
        hbs.application.beneficiary.fullName = new Person(application.beneficiary).fullName('FMLs')
        hbs.application.beneficiary.phone = formatTel(application.beneficiary.phone)
        hbs.application.beneficiary.ssn = application.beneficiary.ssn ? formatSsn(application.beneficiary.ssn) : na('N/A')

        if (application.vehicle) {
            if (application?.vehicle?.mmt && application?.vehicle?.mmt !== 'other') {
                const [ type, make, model ] = application.vehicle.mmt.split(':')

                application.vehicle.type = type
                hbs.application.vehicle.make = make
                hbs.application.vehicle.model = model
            }
            hbs.application.vehicle.type = Application.list.vhlType[application.cdlRole][application.vehicle.type]
        }

        res.render('application/summary', hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
}


export const applicationDocuments = async (req, res) => {
    try {
        const { application: _id } = req.session
        const { formId } = req.params

        if (!_id) {
            delete req.session.application

            return res.redirect(`/application/${formId}`)
        }

        const application = await Application.fetch(res.session, { _id })
        if (!application) return respond404(res)

        if (formId !== application.formId) {
            delete req.session.application

            return res.redirect(`/application/${formId}`)
        }

        if (application.step !== 11) return res.redirect(`/application/${formId}`)

        const key = 'application.documents'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application Documents' })
        hbs.bodyAttrs = ' data-bs-theme="dark"'

        hbs.href = {
            summary: `/application/${formId}/summary`,
        }
        hbs.actionUrl = {
            certify: `/resource/application/progress/${formId}/certify`,
        }

        res.render('application/documents', hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
}


export const applicationAgreement = async (req, res) => {
    try {
        const { application: _id } = req.session
        const { formId } = req.params

        if (!_id) {
            delete req.session.application

            return res.redirect(`/application/${formId}`)
        }

        const application = await Application.fetch(res.session, { _id })
        if (!application) return respond404(res)

        if (formId !== application.formId) {
            delete req.session.application

            return res.redirect(`/application/${formId}`)
        }

        if (application.step !== 12) return res.redirect(`/application/${formId}`)

        const key = 'application.agreement'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application Agreement' })
        hbs.bodyAttrs = ' data-bs-theme="dark"'

        hbs.actionUrl = {
            submit: `/resource/application/submit/${formId}`,
        }

        res.render('application/agreement', hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
}