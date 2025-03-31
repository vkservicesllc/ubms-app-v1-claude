const router = require('express').Router()
const throwErr = require('../tools/error').data

/* Assets */
import Team from '../assets/team.mjs'
import Carrier from '../assets/carrier.mjs'
import Driver, { Application } from '../assets/driver.mjs'
import escapeHTML from '../../client/global/modules/assets/html.mjs'

/* HTML Builders */
import { formLabel, formInput } from '../../client/global/modules/assets/html.mjs'
import { Input as ContactInput } from '../html/contacts.mjs'
import { Label as DriverLabel, Input as DriverInput, Select as DriverSelect } from '../html/driver.mjs'

/* Tools */
import { respond404 } from '../tools/response.mjs'
import { capitalizeEach } from '../../client/global/modules/tools/string.mjs'
import { tel as formatTel } from '../../client/global/modules/tools/formatter.mjs'



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
    res.constants = {
        labelProps: { class: 'form-label' },
        inputProps: { class: 'form-control' },
        selectProps: { class: 'form-select', tabs: 8 },
    }

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

        const { labelProps, inputProps, selectProps } = res.constants

        hbs.label = {
            firstName: DriverLabel.name('f', labelProps),
            middleName: DriverLabel.name('m', labelProps),
            lastName: DriverLabel.name('l', labelProps),
            suffix: DriverLabel.name('s', labelProps),
            dob: DriverLabel.dob(labelProps),
            ssn: DriverLabel.ssn(labelProps),
            phone: DriverLabel.phone({ ...labelProps, content: 'US Phone' }),
            email: DriverLabel.email(labelProps),
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
            statusExp: DriverInput.statusExp({ ...inputProps, placeholder: 'MM/DD/YYYY' }),
        }

        hbs.select = {
            suffix: DriverSelect.suffix(selectProps),
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

        hbs.label = {
            phone: DriverLabel.phone(labelProps),
            dob: DriverLabel.dob(labelProps),
            ssn: DriverLabel.pin(labelProps),
        }
        hbs.input = {
            phone: DriverInput.phone({ ...inputProps, placeholder: '(###) ###-####' }),
            dob: DriverInput.dob({ ...inputProps, placeholder: 'MM/DD/YYYY' }),
            ssn: DriverInput.pin(inputProps),
        }
        hbs.formUrl = `/resource/application/login/${formId}`

        return res.render('application/login', hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
}, async (req, res) => {
    try {
        const { application } = res.session

        const { application: _id } = req.session
        if (!_id || _id != application._id) {
            delete req.session.application

            return res.redirect(`/application/${application.formId}`)
        }

        const team = await Team.data({ ...res.session, user: true }, { _id: application._teamId })
        if (!team) return throwErr.server(res, 'Internal Server Error: Unidentified Environment')

        const { step } = application
        const { settings } = team
        const steps = Application.stepList
        const key = 'application'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application' })

        switch (step) {

            case 1:
                const commercial = settings?.drivers?.cdl === true
                if (commercial) steps[step] = 'Commercial ' + steps[step]
                break

        }

        hbs.steps = steps
        hbs.formId = application.formId

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router