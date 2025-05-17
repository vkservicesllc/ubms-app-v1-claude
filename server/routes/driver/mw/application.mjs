const throwErr = require('../../../tools/utils/error').data

import moment from 'moment'

/* Tools */
import Team from '../../../tools/core/team.mjs'
import Carrier from '../../../tools/core/carrier.mjs'
import { Application } from '../../../tools/core/driver.mjs'
import { respond404 } from '../../../tools/utils/response.mjs'
import { tel as formatTel, ssn as formatSsn } from '../../../../client/global/modules/tools/utils/formatter.mjs'

/* Forms */
import { ApplicationForm } from '../../../tools/form/driver.mjs'
import { updateFormOptions } from '../../../tools/form/builder.mjs'

const formInstr = {
    labelClass: 'form-label text-black-50',
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
        const { env } = req.query
        if (!env) return next()

        const team = await Team.data({ ...res.session, user: true }, { _id: env })
        if (!team) return respond404(res)

        const { settings } = team
        const key = 'application.registration'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application' })
        hbs.company = false

        const { param: route } = req.params
        let _carrierId

        if (route) {
            const carrier = await Carrier.data({ ...res.session, user: true }, { route })

            if (!carrier) return respond404(res)

            _carrierId = carrier._id
            hbs.company = {
                name: carrier.name,
                address: carrier.address.physical.html({ inline: false }),
                phone: formatTel(carrier.phone),
            }
        } else if (team.profile) 
            hbs.company = {
                name: team.profile.company,
                address: team.profile.address.html({ inline: false }),
                phone: formatTel(team.profile.phone),
            }

        hbs.text = {
            requiredDL: "driver's license",
        }
        if (settings?.drivers?.cdl) hbs.text.requiredDL = `commercial ${hbs.text.requiredDL}`

        let options = {}
        const placeholders = {
            dob: 'MM/DD/YYYY',
            ssn: '###-##-####',
            phone: '(###) ###-####',
            addrSince: 'MM/DD/YYYY',
            statusExp: 'MM/DD/YYYY',
        }
        const fields = [
            'firstName', 'middleName', 'lastName', 'suffix',
            'gender', 'dob', 'ssn', 'phone', 'email',
            'address1', 'address2', 'addrZip', 'addrCity', 'addrState', 'addrSince',
            'statusExp', 'position',
        ]
        options = updateFormOptions(options, ApplicationForm, fields, { ...formInstr, tabs: 8 })
        Object.keys(placeholders).forEach(prop => options[prop].text.input.placeholder = placeholders[prop])
        options.position.select.label.content = 'Desired Position'
        options.addrState.select.input.options = { valOpt: true }
        options.position.select.input.data = team.list.drivers.positions
        options.marital = { radio: { label: { class: formInstr.labelClassRequired } } }
        options.status = { radio: { label: { class: formInstr.labelClassRequired } } }

        for (const prop of ['single', 'married', 'divorced', 'separated', 'widowed']) {
            options.marital.radio[prop] = { input: {}, label: {} }
            options.marital.radio[prop].input.class = 'form-check-input status-radio'
            options.marital.radio[prop].label.class = 'form-check-label'
        }

        for (const prop of ['citizen', 'resident', 'authorized']) {
            options.status.radio[prop] = { input: {}, label: {} }
            options.status.radio[prop].input.class = 'form-check-input status-radio'
            options.status.radio[prop].label.class = 'form-check-label'
        }

        hbs.form = new ApplicationForm(options)

        hbs.formUrl = `/resource/application/${team._id}`
        if (_carrierId) hbs.formUrl += `/${_carrierId}`

        res.render('application/registration', hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
}


export const applicationLogin = async (req, res, next) => {
    try {
        const { param: formId } = req.params

        const application = await Application.data(res.session, { formId })
        if (!application) return respond404(res)

        res.session.application = application
        if (req.session.application) return next()

        const key = 'application.login'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application Sign-in' })

        let options = {}
        const placeholders = {
            phone: 'Phone',
            dob: 'Date of Birth',
            pin: 'PIN',
        }
        const fields = Object.keys(placeholders)
        options = updateFormOptions(options, ApplicationForm, fields, formInstr)
        fields.forEach(prop => options[prop].text.input.placeholder = placeholders[prop])
        options.phone.text.label.content = 'Phone'

        hbs.form = new ApplicationForm(options)
        hbs.formUrl = `/resource/application/login/${formId}`

        return res.render('application/login', hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
}


export const applicationProgress = async (req, res) => {
    try {
        const { application } = res.session
        const { formId } = application

        const { application: _id } = req.session
        if (!_id || _id !== application._id) {
            delete req.session.application

            return res.redirect(`/application/${formId}`)
        }

        const team = await Team.data({ ...res.session, user: true }, { _id: application._teamId })
        if (!team) return throwErr.server(res, 'Internal Server Error: Unidentified Environment')

        const depts = team.depts.join(', ')
        let agency = team?.profile?.company
        if (agency) agency = `<span title="${depts}">${agency}</span>`
        let carrier = application?.carrier?.name
        if (carrier) carrier = `<span title="${depts}">${carrier}</span>`

        const { step } = application
        const { settings } = team
        const steps = [ ...Application.stepList ]
        const key = 'application'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application' })

        const recUrl = `/resource/application/form/${formId}`

        const buttonProps = {
            next: { class: 'primary', text: 'Next' },
            save: { class: 'success', text: 'Save Changes' }
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
            address: `${recUrl}/address`,
            dl: `${recUrl}/driver-license`,
            mec: `${recUrl}/medical-card`,
            legal: `${recUrl}/legal-compliance`,
        }

        for (const ct of ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']) {
            hbs.button[ct] = buttonProps.next
            hbs.accordion[ct] = accordionProps.pending
        }

        let options = {
            appliedOn: {
                hidden: {
                    input: {
                        value: application.appliedOn,
                    },
                },
            },
        }

        {
            const { firstName, middleName, lastName, suffix, email } = application
            const { address1, address2, zip: addrZip, city: addrCity } = application.address
            const values = {
                firstName, middleName, lastName, suffix,
                gender: application.gender[0],
                dob: moment(application.dob).format('MM/DD/YYYY'),
                ssn: formatSsn(application.ssn),
                marital: application.marital,
                phone: formatTel(application.phone),
                email, position: application.position?.[0],
                address1, address2, addrZip, addrCity,
                addrState: application.address.state[0],
                addrSince: moment(application.address.since).format('MM/DD/YYYY'),
            }
            const placeholders = {
                dob: 'MM/DD/YYYY',
                ssn: '###-##-####',
                phone: '(###) ###-####',
                addrSince: 'MM/DD/YYYY',
            }

            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr, tabs: 12 })
            Object.keys(placeholders).forEach(prop => options[prop].text.input.placeholder = placeholders[prop])
            options.addrState.select.input.options = { valOpt: true }
        }

        const commercial = settings?.drivers?.cdl === true

        if (step >= 1) { /* DRIVER LICENSE */
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
                dlIss: 'MM/DD/YYYY',
                dlExp: 'MM/DD/YYYY',
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

            if ((commercial && application?.dl?.commercial === undefined) || !application.medCard) {
                options.dlCommercial.radio.yes.input.disabled = true
                options.dlCommercial.radio.no.input.disabled = true
                options.dlCommercial.radio[application.medCard ? 'yes' : 'no'].input.checked = true
            } else {
                options.dlCommercial.radio.yes.input.checked = application?.dl?.commercial === true
                options.dlCommercial.radio.no.input.checked = application?.dl?.commercial === false
            }

            if (options.dlCommercial.radio.yes.input.checked) options.dlEndrs.text.input.disabled = false
            options.dlDenied.radio.yes.input.checked = application?.dl?.denied === true
            options.dlDenied.radio.no.input.checked = application?.dl?.denied === false
            options.dlRevoked.radio.yes.input.checked = application?.dl?.revoked === true
            options.dlRevoked.radio.no.input.checked = application?.dl?.revoked === false
            if (values.dlDeniedExpl) options.dlDeniedExpl.text.input.disabled = false
            if (values.dlRevokedExpl) options.dlRevokedExpl.text.input.disabled = false
        }

        if (step >= 2) { /* MEDICAL CARD */
            hbs.button.one = buttonProps.save
            hbs.accordion.one = accordionProps.finished
            hbs.medCard = application.dl.commercial === false
            hbs.medCardDisplay = ''
            hbs.medListDisplay = ' style="display: none;"'

            const values = {
                mecIss: application?.mec?.issuedOn ? moment(application.mec.issuedOn).format('MM/DD/YYYY') : null,
                mecExp: application?.mec?.expiresOn ? moment(application.mec.expiresOn).format('MM/DD/YYYY') : null,
                mecNumber: application?.mec?.nrcme,
                medList: application.medList,
            }
            const placeholders = {
                mecIss: 'MM/DD/YYYY',
                mecExp: 'MM/DD/YYYY',
            }

            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr })
            Object.keys(placeholders).forEach(prop => options[prop].text.input.placeholder = placeholders[prop])
            options.noMec = { checkbox: { input: { ...checkProps.input }, label: { ...checkProps.label } } }
            options.underMeds = { radio: {} }
            for (const prop of ['yes', 'no'])
                options.underMeds.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
            options.underMeds.radio.yes.input.checked = application.underMeds === true
            options.underMeds.radio.no.input.checked = application.underMeds === false
            options.medList.text.label.content = 'List medications <small>(names only)</small>'

            const fields = Object.keys(values).filter(key => !['medList'].includes(key))
            if (hbs.medCard && !application.medCard) {
                hbs.medCardDisplay = ' style="display: none;"'

                fields.forEach(prop => {
                    options[prop].text.input.value = null
                    options[prop].text.input.disabled = true
                })
                options.noMec.checkbox.input.checked = true
            } else
                fields.forEach(prop => options[prop].text.input.disabled = false)
            if (values.medList) {
                options.medList.text.input.disabled = false
                hbs.medListDisplay = ''
            }
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
            options.citations = { radio: {} }

            for (const prop of ['yes', 'no']) {
                options.dui.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options.duiInDecade.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options.criminal.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options.citations.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
            }

            options.dui.radio.yes.input.checked = application.dui === true
            options.dui.radio.no.input.checked = application.dui === false
            options.criminal.radio.yes.input.checked = application.criminal === true
            options.criminal.radio.no.input.checked = application.criminal === false
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

            const fields = [ '_citDate', '_citState', '_citReason', '_citOtherReason' ]
            options = updateFormOptions(options, ApplicationForm, fields, { ...formInstr, tabs: 7 })
            options._citState.select.input.options = { valOpt: true }

            const placeholders = {
                _citDate: 'MM/DD/YYYY',
            }
            Object.keys(placeholders).forEach(prop => options[prop].text.input.placeholder = placeholders[prop])
        }

        hbs.form = new ApplicationForm(options)
        hbs.agency = agency
        hbs.carrier = carrier
        hbs.progress = Math.round(step / steps.length * 100)
        hbs.step = step
        hbs.steps = steps
        hbs.formId = formId
        hbs.applicantName = application.fullName
        hbs.position = application.position[1]
        hbs.startedAt = moment(application.appliedAt).format('MMM D, YYYY hh:mm A') + ' ET' //! Test time accuracy on live server

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
}