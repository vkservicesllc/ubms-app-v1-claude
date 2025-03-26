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



router.get('/application/:param?', async (req, res) => {
    try {
        const { env } = req.query
        let { hbs } = res

        const labelProps = { class: 'form-label' }
        const inputProps = { class: 'form-control' }
        const selectProps = { class: 'form-select', tabs: 8 }

        const team = await Team.data({ ...res.session, user: true }, { _id: env })
        if (!team) {
            const { param: formId } = req.params

            const application = await Application.data(res.session, { formId })
            if (!application) return respond404(res)

            if (req.session.application) return res.redirect(`/application/${formId}/${application.step}`)

            const key = 'application.login'
            hbs = hbs.set(key, { title: 'Driver Application Sign-in' })

            hbs.label = {
                phone: DriverLabel.phone(labelProps),
                dob: DriverLabel.dob(labelProps),
                ssn: DriverLabel.ssn({ ...labelProps, content: 'Last 4 of SSN' }),
            }
            hbs.input = {
                phone: DriverInput.phone({ ...inputProps, placeholder: '(###) ###-####' }),
                dob: DriverInput.dob({ ...inputProps, placeholder: 'MM/DD/YYYY' }),
                ssn: DriverInput.ssn({ ...inputProps, placeholder: '####' }),
            }

            return res.render('application/login', hbs)
        }

        const key = 'application'
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

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/application/:formId/:step', async (req, res) => {
    if (req.session.application) {
        // redirect else proceed with apl login

        return res.send({
            session: true,
            application: await Application.data(res.session, { _id: req.session.application }),
        })
    }

    const { formId } = req.params
    const application = await Application.data(res.session, { formId })

    res.send({
        session: false,
        application,
    })
})



export default router