const router = require('express').Router()
const moment = require('moment')
const throwErr = require('../tools/utils/error').data

/* Registry */
import { formSelectors } from '../../client/global/modules/registry/selectors.mjs'

/* HTML Builders */
import { Label as DriverLabel, Input as DriverInput, Select as DriverSelect } from '../html/driver.mjs'
import { Label as AddrLabel, Input as AddrInput, Select as AddrSelect } from '../html/address.us.mjs'

/* Tools */
import Team from '../tools/core/team.mjs'
import Carrier from '../tools/core/carrier.mjs'
import Driver, { Application } from '../tools/core/driver.mjs'
import escapeHTML from '../../client/global/modules/tools/utils/html.mjs'
import { respond404 } from '../tools/utils/response.mjs'
import { capitalizeEach } from '../../client/global/modules/tools/utils/string.mjs'
import { tel as formatTel, ssn as formatSsn } from '../../client/global/modules/tools/utils/formatter.mjs'

/* Forms */
import DriverForm, { ApplicationForm } from '../tools/form/driver.mjs'
import { updateFormOptions } from '../tools/form/builder.mjs'

const formInstr = {
    labelClass: 'form-label text-black-50',
    labelClassRequired: 'form-label',
    textClass: 'form-control',
    selectClass: 'form-select',
}



router.use((req, res, next) => {
    res.hbs.set = function(key, params = {}) {
        let { inclKey, title } = params

        const includer = require('../includes/src')
        const includes = require('../includes/driver')

        const hbs = { ...this }
        
        if (!inclKey) inclKey = key
        if (!title) title = `${capitalizeEach(key.replace(/\./g, ' '))} - ${hbs.title}`

        hbs.title = title
        hbs.includes = includer.render(includes[inclKey])

        return hbs
    }

    next()
})



router.get('/application/:param?', async (req, res, next) => {
    const { class: aplClass } = formSelectors.driver
    const labelProps = { class: 'form-label' }
    const inputProps = { class: 'form-control' }
    const addrInputProps = { ...inputProps, class: `${inputProps.class} ${aplClass}` }
    const selectProps = { class: 'form-select', tabs: 8, options: { emptyOpt: '--' } }
    const addrSelectProps = { ...selectProps, class: `${inputProps.class} ${aplClass}` }

    res.constants = { labelProps, inputProps, addrInputProps, selectProps, addrSelectProps }

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
        Object.keys(placeholders).map(prop => options[prop].text.input.placeholder = placeholders[prop])
        options.addrState.select.input.options = { valOpt: true }
        options.position.select.input.data = team.list.drivers.positions
        options.status = { radio: { label: { class: formInstr.labelClassRequired } } }

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
}, async (req, res, next) => {
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
        fields.map(prop => options[prop].text.input.placeholder = placeholders[prop])
        options.phone.text.label.content = 'Phone'

        hbs.form = new ApplicationForm(options)
        hbs.formUrl = `/resource/application/login/${formId}`

        return res.render('application/login', hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
}, async (req, res) => {
    try {
        const { application } = res.session
        const { formId } = application

        const { application: _id } = req.session
        if (!_id || _id != application._id) {
            delete req.session.application

            return res.redirect(`/application/${formId}`)
        }

        const team = await Team.data({ ...res.session, user: true }, { _id: application._teamId })
        if (!team) return throwErr.server(res, 'Internal Server Error: Unidentified Environment')

        const { step } = application
        const { settings } = team
        const steps = [ ...Application.stepList ]
        const key = 'application'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application' })

        const { addr1Id, addr2Id, zipId, cityId, stateId } = formSelectors.driver
        const buttonProps = {
            next: { class: 'primary', text: 'Next' },
            save: { class: 'success', text: 'Save Changes' }
        }
        const { labelProps, inputProps, selectProps, addrInputProps, addrSelectProps } = res.constants
        selectProps.tabs = 12
        addrSelectProps.tabs = 12

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


        //? NEW
        let options = {}

        {
            const { firstName, middleName, lastName, suffix, email } = application
            const { address1, address2, zip: addrZip, city: addrCity } = application.address
            const values = {
                firstName, middleName, lastName, suffix,
                gender: application.gender[0],
                dob: moment(application.dob).format('MM/DD/YYYY'),
                ssn: formatSsn(application.ssn),
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
            Object.keys(placeholders).map(prop => options[prop].text.input.placeholder = placeholders[prop])
            options.position.select.input.data = team.list.drivers.positions
            options.addrState.select.input.options = { valOpt: true }
        }


        //! NEW


        hbs.label = {}

        hbs.input = {}

        hbs.select = {}

        const recUrl = `/resource/application/form/${formId}`
        hbs.actionUrl = {
            profile: `${recUrl}/profile`,
            address: `${recUrl}/address`,
            dl: `${recUrl}/driver-license`,
            mec: `${recUrl}/medical-card`
        }

        hbs.button = {
            one: buttonProps.save,
            two: buttonProps.next,
            three: buttonProps.next,
        }

        hbs.accordion = {
            one: accordionProps.pending,
            two: accordionProps.pending,
            three: accordionProps.pending,
        }

        const commercial = settings?.drivers?.cdl === true

        if (step >= 1) {
            hbs.label.dlState = DriverLabel.dlState(labelProps)
            hbs.label.dlNum = DriverLabel.dlNum(labelProps)
            hbs.label.dlClass = DriverLabel.dlClass(labelProps)
            hbs.label.gender = DriverLabel.gender(labelProps)
            hbs.label.dlIss = DriverLabel.dlIss(labelProps)
            hbs.label.dlExp = DriverLabel.dlExp(labelProps)
            hbs.label.dlEndorse = DriverLabel.dlEndorse({
                ...labelProps,
                content: 'Endorsements <small class="text-muted">(if any)</small>',
            })
            hbs.label.dlRestr = DriverLabel.dlRestr({
                ...labelProps,
                content: 'Restrictions <small class="text-muted">(if any)</small>',
            })
            hbs.label.dlDenied = {}
            hbs.label.dlRevoked = {}

            hbs.input.dlNum = DriverInput.dlNum({ ...inputProps, value: application?.dl?.number })
            hbs.input.dlClass = DriverInput.dlClass({ ...inputProps, value: application?.dl?.class })
            hbs.input.dlIss = DriverInput.dlIss({
                ...inputProps,
                placeholder: 'MM/DD/YYYY',
                value: application?.dl?.issuedOn ? moment(application.dl.issuedOn).format('MM/DD/YYYY') : null,
            })
            hbs.input.dlExp = DriverInput.dlExp({
                ...inputProps,
                placeholder: 'MM/DD/YYYY',
                value: application?.dl?.expiresOn ? moment(application.dl.expiresOn).format('MM/DD/YYYY') : null,
            })
            hbs.input.dlEndorse = DriverInput.dlEndorse({ ...inputProps, value: application?.dl?.endorsement, placeholder: 'None' })
            hbs.input.dlRestr = DriverInput.dlRestr({ ...inputProps, value: application?.dl?.restriction, placeholder: 'None' })
            hbs.input.dlDenied = {}
            hbs.input.dlRevoked = {}

            hbs.select.dlState = DriverSelect.dlState({
                ...selectProps,
                value: application?.dl?.state,
                options: { valOpt: true, emptyOpt: !application?.dl?.state ? '--' : null },
            })
            // hbs.select.dlClass = DriverSelect.dlClass({
            //     ...selectProps,
            //     value: application?.dl?.class,
            //     options: { emptyOpt: !application?.dl?.class ? '--' : null },
            // }, commercial)
            hbs.select.gender = DriverSelect.gender({
                ...selectProps,
                value: application.gender?.[0],
                options: { emptyOpt: !application.gender ? '--' : null },
            })

            const tags = ['yes', 'no', 'expl']
            tags.forEach(tag => {
                const props = {
                    label: labelProps,
                    input: {
                        denied: { ...inputProps },
                        revoked: { ...inputProps },
                    },
                }

                if (tag != 'expl') {
                    props.label = { class: 'form-check-label' }
                    props.input = {
                        denied: { class: 'form-check-input' },
                        revoked: { class: 'form-check-input' },
                    }

                    if (application.dl) {
                        const { denied, revoked } = application.dl

                        if ((denied && tag == 'yes') || (!denied && tag == 'no'))
                            props.input.denied.checked = true
                        if ((revoked && tag == 'yes') || (!revoked && tag == 'no'))
                            props.input.revoked.checked = true
                    }
                } else {
                    if (application.dl) {
                        const { deniedExpl, revokedExpl } = application.dl

                        if (deniedExpl) props.input.denied.value = deniedExpl
                        if (revokedExpl) props.input.revoked.value = revokedExpl
                    }
                }

                hbs.label.dlDenied[tag] = DriverLabel.problem('dl-denied', tag, props.label)
                hbs.label.dlRevoked[tag] = DriverLabel.problem('dl-revoked', tag, props.label)

                hbs.input.dlDenied[tag] = DriverInput.problem('dl-denied', tag, props.input.denied)
                hbs.input.dlRevoked[tag] = DriverInput.problem('dl-revoked', tag, props.input.revoked)
            })
        }

        if (step >= 2) {
            hbs.button.one = buttonProps.save
            hbs.accordion.one = accordionProps.finished

            let disabled = false

            // if CDL Class C (Non-CDL), D, then applicant should be able to select No Medical Card
            hbs.medCard = application.dl.commercial === false
            if (hbs.medCard) {
                disabled = application.medCard === false
                hbs.label.medCard = DriverLabel.medCard({ class: 'form-check-label' })
                hbs.input.medCard = DriverInput.medCard({ class: 'form-check-input', checked: disabled })
            }
            hbs.medCardDisplay = disabled ? ' style="display: none;"' : ''

            hbs.label.mecNum = DriverLabel.mecNum(labelProps)
            hbs.label.mecIss = DriverLabel.mecIss(labelProps)
            hbs.label.mecExp = DriverLabel.mecExp(labelProps)
            hbs.label.underMeds = {
                yes: DriverLabel.problem('med', 'yes', { class: 'form-check-label' }),
                no: DriverLabel.problem('med', 'no', { class: 'form-check-label' }),
            }
            hbs.label.medList = DriverLabel.problem('med', 'expl', { ...labelProps, content: 'List medications <small class="text-muted">(names only)</small>' })

            hbs.input.mecNum = DriverInput.mecNum({ ...inputProps, value: application?.mec?.nrcme, disabled })
            hbs.input.mecIss = DriverInput.mecIss({
                ...inputProps,
                placeholder: 'MM/DD/YYYY',
                value: application?.mec?.issuedOn ? moment(application.mec.issuedOn).format('MM/DD/YYYY') : null,
                disabled,
            })
            hbs.input.mecExp = DriverInput.mecExp({
                ...inputProps,
                placeholder: 'MM/DD/YYYY',
                value: application?.mec?.expiresOn ? moment(application.mec.expiresOn).format('MM/DD/YYYY') : null,
                disabled,
            })
            hbs.input.underMeds = {
                yes: DriverInput.problem('med', 'yes', { class: 'form-check-input', checked: application.underMeds === true }),
                no: DriverInput.problem('med', 'no', { class: 'form-check-input', checked: application.underMeds === false }),
            }
            hbs.input.medList = DriverInput.problem('med', 'expl', { ...inputProps, value: application.medList })
        }

        hbs.form = new ApplicationForm(options)
        hbs.progress = Math.round(step / steps.length * 100)
        hbs.step = step
        hbs.steps = steps
        hbs.formId = formId
        hbs.addrEnough = application.address.enough
        hbs.applicantName = application.fullName
        hbs.startedAt = moment(application.appliedAt).format('MMM D, YYYY hh:mm A') //! Test time accuracy on live server

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router