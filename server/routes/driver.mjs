const router = require('express').Router()
const moment = require('moment')
const throwErr = require('../tools/error').data

/* Registry */
import { formSelectors } from '../../client/global/modules/registry/selectors.mjs'

/* Assets */
import Team from '../assets/team.mjs'
import Carrier from '../assets/carrier.mjs'
import Driver, { Application } from '../assets/driver.mjs'
import escapeHTML from '../../client/global/modules/assets/html.mjs'

/* HTML Builders */
import { formLabel, formInput } from '../../client/global/modules/assets/html.mjs'
import { Input as ContactInput } from '../html/contacts.mjs'
import { Label as DriverLabel, Input as DriverInput, Select as DriverSelect } from '../html/driver.mjs'
import { Label as AddrLabel, Input as AddrInput, Select as AddrSelect } from '../html/address.us.mjs'

/* Tools */
import { respond404 } from '../tools/response.mjs'
import { capitalizeEach } from '../../client/global/modules/tools/string.mjs'
import { tel as formatTel, ssn as formatSsn } from '../../client/global/modules/tools/formatter.mjs'



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

        const { labelProps, inputProps, selectProps, addrInputProps, addrSelectProps } = res.constants
        const { addr1Id, addr2Id, zipId, cityId, stateId } = formSelectors.driver

        hbs.label = {
            firstName: DriverLabel.name('f', labelProps),
            middleName: DriverLabel.name('m', labelProps),
            lastName: DriverLabel.name('l', labelProps),
            suffix: DriverLabel.name('s', labelProps),
            gender: DriverLabel.gender(labelProps),
            dob: DriverLabel.dob(labelProps),
            ssn: DriverLabel.ssn(labelProps),
            phone: DriverLabel.phone({ ...labelProps }),
            email: DriverLabel.email(labelProps),
            address1: AddrLabel.address1({ ...labelProps, for: addr1Id }),
            address2: AddrLabel.address2({ ...labelProps, for: addr2Id }),
            zip: AddrLabel.zip({ ...labelProps, for: zipId }),
            city: AddrLabel.city({ ...labelProps, for: cityId }),
            state: AddrLabel.state({ ...labelProps, for: stateId }),
            addrSince: DriverLabel.addrSince(labelProps),
            position: DriverLabel.position(labelProps),
            statusExp: DriverLabel.statusExp(labelProps),
        }

        hbs.input = {
            firstName: DriverInput.name('f', inputProps),
            middleName: DriverInput.name('m', inputProps),
            lastName: DriverInput.name('l', inputProps),
            dob: DriverInput.dob({ ...inputProps, placeholder: 'MM/DD/YYYY' }),
            ssn: DriverInput.ssn({ ...inputProps, placeholder: '###-##-####' }),
            phone: DriverInput.phone({ ...inputProps, placeholder: '(###) ###-####' }),
            email: DriverInput.email(inputProps),
            address1: AddrInput.address1({ ...addrInputProps, id: addr1Id }),
            address2: AddrInput.address2({ ...addrInputProps, id: addr2Id }),
            zip: AddrInput.zip({ ...addrInputProps, id: zipId }),
            city: AddrInput.city({ ...addrInputProps, id: cityId }),
            addrSince: DriverInput.addrSince({ ...inputProps, placeholder: 'MM/DD/YYYY' }),
            statusExp: DriverInput.statusExp({ ...inputProps, placeholder: 'MM/DD/YYYY' }),
        }

        hbs.select = {
            suffix: DriverSelect.suffix(selectProps),
            gender: DriverSelect.gender(selectProps),
            state: AddrSelect.stateUS({
                ...addrSelectProps,
                id: stateId,
                options: { valOpt: true, emptyOpt: '--' },
            }),
            position: DriverSelect.position({
                ...selectProps,
                options: {
                    emptyOpt: 'Decide later...',
                },
            }, team.list.drivers.positions),
        }

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

        const { labelProps, inputProps } = res.constants
        labelProps.addClass = ''

        hbs.label = {
            phone: DriverLabel.phone(labelProps),
            dob: DriverLabel.dob(labelProps),
            pin: DriverLabel.pin(labelProps),
        }
        hbs.input = {
            phone: DriverInput.phone({ ...inputProps, placeholder: 'Phone' }),
            dob: DriverInput.dob({ ...inputProps, placeholder: 'Date of Birth' }),
            pin: DriverInput.pin({ ...inputProps, placeholder: 'PIN' }),
        }
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

        hbs.label = {
            firstName: DriverLabel.name('f', labelProps),
            middleName: DriverLabel.name('m', labelProps),
            lastName: DriverLabel.name('l', labelProps),
            suffix: DriverLabel.name('s', labelProps),
            dob: DriverLabel.dob(labelProps),
            ssn: DriverLabel.ssn({ ...labelProps, content: 'SSN' }),
            phone: DriverLabel.phone({ ...labelProps }),
            email: DriverLabel.email(labelProps),
            position: DriverLabel.position(labelProps),
            address1: AddrLabel.address1({ ...labelProps, for: addr1Id }),
            address2: AddrLabel.address2({ ...labelProps, for: addr2Id }),
            zip: AddrLabel.zip({ ...labelProps, for: zipId }),
            city: AddrLabel.city({ ...labelProps, for: cityId }),
            state: AddrLabel.state({ ...labelProps, for: stateId }),
            addrSince: DriverLabel.addrSince(labelProps),
        }

        hbs.input = {
            firstName: DriverInput.name('f', { ...inputProps, value: application.firstName }),
            middleName: DriverInput.name('m', { ...inputProps, value: application.middleName }),
            lastName: DriverInput.name('l', { ...inputProps, value: application.lastName }),
            dob: DriverInput.dob({ ...inputProps, placeholder: 'MM/DD/YYYY', value: moment(application.dob).format('MM/DD/YYYY') }),
            ssn: DriverInput.ssn({ ...inputProps, placeholder: '###-##-####', value: formatSsn(application.ssn) }),
            phone: DriverInput.phone({ ...inputProps, placeholder: '(###) ###-####', value: formatTel(application.phone) }),
            email: DriverInput.email({ ...inputProps, value: application.email }),
            address1: AddrInput.address1({ ...addrInputProps, id: addr1Id, value: application.address.address1 }),
            address2: AddrInput.address2({ ...addrInputProps, id: addr2Id, value: application.address.address2 }),
            zip: AddrInput.zip({ ...addrInputProps, id: zipId, value: application.address.zip }),
            city: AddrInput.city({ ...addrInputProps, id: cityId, value: application.address.city }),
            addrSince: DriverInput.addrSince({ ...inputProps, value: moment(application.address.since).format('MM/DD/YYYY') })
        }

        hbs.select = {
            suffix: DriverSelect.suffix({ ...selectProps, value: application.suffix }),
            position: DriverSelect.position({
                ...selectProps,
                value: application.position?.[0],
                options: {
                    emptyOpt: 'Decide later...',
                },
            }, team.list.drivers.positions),
            state: AddrSelect.stateUS({
                ...addrSelectProps,
                id: stateId,
                value: application.address.state[0],
                options: { valOpt: true },
            }),
        }

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
            hbs.select.dlClass = DriverSelect.dlClass({
                ...selectProps,
                value: application?.dl?.class,
                options: { emptyOpt: !application?.dl?.class ? '--' : null },
            }, commercial)
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

            // if CDL Class C (Non-CDL), D, then applicant should be able to select No Medical Card

            hbs.label.mecNum = DriverLabel.mecNum(labelProps)
            hbs.label.mecIss = DriverLabel.mecIss(labelProps)
            hbs.label.mecExp = DriverLabel.mecExp(labelProps)

            hbs.input.mecNum = DriverInput.mecNum({ ...inputProps, value: application?.mec?.nrcme })
            hbs.input.mecIss = DriverInput.mecIss({
                ...inputProps,
                placeholder: 'MM/DD/YYYY',
                value: application?.mec?.issuedOn ? moment(application.mec.issuedOn).format('MM/DD/YYYY') : null,
            })
            hbs.input.mecExp = DriverInput.mecExp({
                ...inputProps,
                placeholder: 'MM/DD/YYYY',
                value: application?.mec?.expiresOn ? moment(application.mec.expiresOn).format('MM/DD/YYYY') : null,
            })
        }

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