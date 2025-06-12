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
        const { env, dept: deptId } = req.query
        if (!env) return next()

        const team = await Team.data({ ...res.session, user: true }, { _id: env })
        if (!team) return respond404(res)

        const { settings } = team
        if (settings.deptId.length > 1 && !deptId) return respond404(res)

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
        if (deptId) hbs.formUrl += `?dept=${deptId}`

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
        const { formId, deptId } = application

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
            safety: `${recUrl}/safety`,
            experience: `${recUrl}/experience`,
            preEmployment: `${recUrl}/pre-employment`,
            preference: `${recUrl}/preference`,
            business: `${recUrl}/business`,
            beneficiary: `${recUrl}/beneficiary`,
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

            //! Rework this logic
            if ((commercial && application?.dl?.commercial === undefined) || !application.medCard) {
                options.dlCommercial.radio.yes.input.disabled = true
                options.dlCommercial.radio.no.input.disabled = true
                options.dlCommercial.radio[application.medCard ? 'yes' : 'no'].input.checked = true
            } else if (application?.experience?.cmv || application?.experience?.cdlSchool) {
                options.dlCommercial.radio.yes.input.disabled = true
                options.dlCommercial.radio.no.input.disabled = true
                options.dlCommercial.radio.yes.input.checked = true
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

            const placeholders = {
                _citDate: 'MM/DD/YYYY',
            }
            Object.keys(placeholders).forEach(prop => options[prop].text.input.placeholder = placeholders[prop])
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

            const placeholders = {
                _accDate: 'MM/DD/YYYY',
            }
            Object.keys(placeholders).forEach(prop => options[prop].text.input.placeholder = placeholders[prop])
        }

        if (step >= 5) { /* DRIVING EXPERIENCE */
            hbs.button.four = buttonProps.save
            hbs.accordion.four = accordionProps.finished
            hbs.vhlExpColWidth = application.deptId === 0 && application.dl.commercial ? 4 : 6
            hbs.expDetailsDisplay = ''
            hbs.cmvExpDisplay = ''
            hbs.schoolDisplay = ' style="display: none;"'

            let { labelClassRequired } = formInstr
            let disabled = false

            options.noExp = { checkbox: { input: { ...checkProps.input }, label: { ...checkProps.label } } }
            if (application.experience === false) {
                options.noExp.checkbox.input.checked = true
                hbs.expDetailsDisplay = ' style="display: none;"'
                disabled = true
            }

            options.cmvExp = { radio: {} }
            options.cdlSchool = { radio: {} }
            for (const prop of ['yes', 'no']) {
                options.cmvExp.radio[prop] = { input: { ...checkProps.input, disabled }, label: { ...checkProps.label } }
                options.cdlSchool.radio[prop] = { input: { ...checkProps.input, disabled }, label: { ...checkProps.label } }
            }
            options.cmvExp.radio.yes.input.checked = application?.experience?.cmv === true
            options.cmvExp.radio.no.input.checked = application?.experience?.cmv === false
            options.cdlSchool.radio.yes.input.checked = application?.experience?.cdlSchool === true
            options.cdlSchool.radio.no.input.checked = application?.experience?.cdlSchool === false

            options.straightExp = { checkbox: { label: { class: labelClassRequired } } }
            options.semiExp = { checkbox: { label: { class: labelClassRequired } } }

            for (const prop in Application.vehicleList.straight) {
                const checked = application?.experience?.vehicles?.straight?.includes(prop)
                options.straightExp.checkbox[prop] = { input: { ...checkProps.input, checked, disabled }, label: { ...checkProps.label } }
            }

            for (const prop in Application.vehicleList.semi) {
                const checked = application?.experience?.cmv === true && application?.experience?.vehicles?.semi?.includes(prop)
                options.semiExp.checkbox[prop] = { input: { ...checkProps.input, checked, disabled }, label: { ...checkProps.label } }
            }

            options.vanExp = { checkbox: {
                input: { ...checkProps.input, disabled, checked: application?.experience?.vehicles?.misc?.includes('van') },
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

            const values = {
                expStartDate: application?.experience?.firstDate
                    ? moment(application.experience.firstDate).format('MM/DD/YYYY')
                    : null,
                expEndDate: application?.experience?.lastDate
                    ? moment(application.experience.lastDate).format('MM/DD/YYYY')
                    : null,
                expMileage: application?.experience?.mileage?.toLocaleString(),
                schName: application?.experience?.schName,
                schPhone: application?.experience?.schPhone
                    ? formatTel(application.experience.schPhone)
                    : null,
                schState: application?.experience?.schState,
                schEndDate: application?.experience?.schEndDate
                    ? moment(application.experience.schEndDate).format('MM/DD/YYYY')
                    : null,
                schDuration: application?.experience?.schDuration,
            }
            const placeholders = {
                expStartDate: 'MM/DD/YYYY',
                expEndDate: 'MM/DD/YYYY',
                schEndDate: 'MM/DD/YYYY',
                schPhone: '(###) ###-####',
            }

            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr, disabled, tabs: 8 })
            Object.keys(placeholders).forEach(prop => options[prop].text.input.placeholder = placeholders[prop])
            options.schState.select.input.options = { valOpt: true }

            const appliedOn = moment(application.appliedOn)
            let j = 8
            for (let i = 0; i < 7; i++) {
                const content = `<small>${appliedOn.clone().subtract(--j, 'days').format('dddd/MMM D, YYYY')}</small>`.replace('/', '<br/>')
                let hours = application?.experience?.hours?.[i]
                if (hours === 0) hours = `${hours}`

                options[`expHours${i + 1}`] = {
                    text: {
                        input: {
                            class: formInstr.textClass,
                            value: hours || null,
                            disabled,
                        },
                        label: {
                            class: formInstr.labelClassRequired,
                            content,
                        },
                    },
                }
            }

            if (application?.experience?.cdlSchool === true) hbs.schoolDisplay = ''
            if (application?.experience?.cmv === false) hbs.cmvExpDisplay = ' style="display: none;"'

        }

        if (step >= 6) { /* PREVIOUS EMPLOYMENT */
            hbs.button.five = buttonProps.save
            hbs.accordion.five = accordionProps.finished
            hbs.preemplDisplay = ' style="display: none;"'

            options.prevEmployed = { radio: {} }
            options._emplFMCSR = { radio: {} }
            options._emplDotDat = { radio: {} }
            for (const prop of ['yes', 'no']) {
                options.prevEmployed.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options._emplFMCSR.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options._emplDotDat.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
            }
            options.prevEmployed.radio.yes.input.checked = application.prevEmployed === true
            options.prevEmployed.radio.no.input.checked = application.prevEmployed === false

            const fields = [
                '_prevEmployer', '_emplPhone',
                '_emplAddr1', '_emplAddr2', '_emplAddrZip',
                '_emplAddrCity', '_emplAddrState', '_emplStartDate',
                '_emplPosition', '_emplEarnings',
                '_emplEndDate', '_emplRFL',
            ]
            options = updateFormOptions(options, ApplicationForm, fields, { ...formInstr, tabs: 7 })
            options._emplAddrState.select.input.options = { valOpt: true }

            const placeholders = {
                _emplPhone: '(###) ###-####',
                _emplStartDate: 'MM/DD/YYYY',
                _emplEndDate: 'MM/DD/YYYY',
            }
            Object.keys(placeholders).forEach(prop => options[prop].text.input.placeholder = placeholders[prop])
        }

        if (step >= 7) { /* DRIVING PREFERENCES */
            hbs.button.six = buttonProps.save
            hbs.accordion.six = accordionProps.finished

            options.operType = {
                radio: {
                    solo: { input: { ...checkProps.input, checked: application?.preference?.operType === 's' }, label: { ...checkProps.label } },
                    team: { input: { ...checkProps.input, checked: application?.preference?.operType === 't' }, label: { ...checkProps.label } },
                },
            }

            options.haulRegion = { checkbox: {} }
            options.equipmentType = { checkbox: {} }

            for (const prop in Application.haulRegionList) {
                const checked = application?.preference?.haulRegion?.includes(prop)
                options.haulRegion.checkbox[prop] = { input: { ...checkProps.input, checked }, label: { ...checkProps.label } }
            }

            for (const prop in Application.vehicleList.semi) {
                const checked = application?.preference?.equipmentType?.includes(prop)
                options.equipmentType.checkbox[prop] = { input: { ...checkProps.input, checked }, label: { ...checkProps.label } }
            }

            const values = {
                startPref: application?.preference?.startPref,
            }
            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr, tabs: 6 })
        }

        if (step >= 8) { /* BUSINESS / OWNERSHIP */
            if (application.position[0] === 'OO') steps[8] += ' / Ownership'
            hbs.button.seven = buttonProps.save
            hbs.accordion.seven = accordionProps.finished
            hbs.llcDetailsDisplay = ' style="display: none;"'
            hbs.llcAssistanceDisplay = ' style="display: none;"'
            hbs.llcProposedDisplay = ' style="display: none;"'

            options.activeLLC = { radio: {} }
            options.llcAssistance = { radio: {} }
            for (const prop of ['yes', 'no']) {
                options.activeLLC.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
                options.llcAssistance.radio[prop] = { input: { ...checkProps.input }, label: { ...checkProps.label } }
            }

            const values = {
                llcName: application?.business?.busName,
                llcState: application?.business?.state,
                llcEin: application?.business?.ein,
                llcProposedName: application?.business?.proposedName,
            }
            const placeholders = {
                llcEin: '##-#######',
            }

            options = updateFormOptions(options, ApplicationForm, values, { ...formInstr })
            Object.keys(placeholders).forEach(prop => options[prop].text.input.placeholder = placeholders[prop])

            if (application.activeBusiness === true) {
                options.activeLLC.radio.yes.input.checked = true
                hbs.llcDetailsDisplay = ''
                options.llcName.text.input.disabled = false
                options.llcState.select.input.disabled = false
                options.llcEin.text.input.disabled = false
            }

            if (application.activeBusiness === false) {
                options.activeLLC.radio.no.input.checked = true
                hbs.llcAssistanceDisplay = ''

                if (application.businessAssist === true) {
                    options.llcAssistance.radio.yes.input.checked = true
                    options.llcProposedName.text.input.disabled = false
                    hbs.llcProposedDisplay = ''
                } else
                    options.llcAssistance.radio.no.input.checked = true

                options.llcAssistance.radio.yes.input.disabled = false
                options.llcAssistance.radio.no.input.disabled = false
            }

            if (application.position[0] === 'OO') {
                const values = {
                    currentVhlType: application?.vehicle?.type,
                }
                let vhlTypeData = {}

                if (application.deptId === 0) vhlTypeData = Application.vhlTypeList.truckLoad
                if (application.deptId === 1) {
                    vhlTypeData = Application.vhlTypeList.expedite
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

                if (application.deptId === 1) {
                    
                    if (values.currentVhlMMT !== 'other') {
                        options.currentVhlType.select.input.disabled = true
                        options.currentVhlMake.text.input.disabled = true
                        options.currentVhlModel.text.input.disabled = true
                    }

                    if (values.currentVhlType !== 'straightBox')
                        options.currentVhlLen.select.input.disabled = true

                    options.currentVhlLen.select.input.data = { //? Temporary data (until other type require lengths as well)
                        //! Box Truck Only for now
                        '10': '10 ft (Small)',
                        '12': '12 ft (Medium-Small)',
                        '14': '14 ft (Medium)',
                        '16': '16 ft (Mid-Large)',
                        '20': '20 ft (Large)',
                        '24': '24 ft (Extra Large)',
                        '26': '26 ft (Heavy Duty)',
                    }
                }
            }
        }

        if (step >= 9) { /* BENEFICIARY */
            hbs.button.eight = buttonProps.save
            hbs.accordion.eight = accordionProps.finished
        }


        hbs.form = new ApplicationForm(options)
        hbs.agency = agency
        hbs.carrier = carrier
        hbs.progress = Math.round(step / steps.length * 100)
        hbs.step = step
        hbs.steps = steps
        hbs.formId = formId
        hbs.deptId = deptId
        hbs.applicantName = application.fullName
        hbs.applicantPosition = application.position[1]
        hbs.position = application.position[0]
        hbs.cdl = application?.dl?.commercial === true
        hbs.startedAt = moment(application.appliedAt).format('MMM D, YYYY hh:mm A') + ' ET' //! Test time accuracy on live server

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
}