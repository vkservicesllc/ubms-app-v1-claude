const router = require('express').Router()
const throwErr = require('../tools/error').data

/* Assets */
import Team from '../assets/team.mjs'
import Carrier from '../assets/carrier.mjs'
import escapeHTML from '../../client/global/modules/assets/html.mjs'

/* HTML Builders */
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



router.get('/application/:carrierRoute?', async (req, res) => {
    try {
        const { env } = req.query
        const team = await Team.data({ ...res.session, user: true }, { _id: env })
        if (!team) return respond404(res)

        const key = 'application'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application' })
        hbs.carrier = false

        const { carrierRoute: route } = req.params
        if (route) {
            const carrier = await Carrier.data({ ...res.session, user: true }, { route })

            if (!carrier) return respond404(res)
            hbs.carrier = {
                name: escapeHTML(carrier.name),
                address: carrier.address.physical.html({ inline: false }),
                phone: formatTel(escapeHTML(carrier.phone)),
            }
        }

        const labelProps = { class: 'form-label' }
        const inputProps = { class: 'form-control' }
        const selectProps = { class: 'form-select', tabs: 8 }

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
        }
        hbs.input = {
            firstName: DriverInput.name('f', inputProps),
            middleName: DriverInput.name('m', inputProps),
            lastName: DriverInput.name('l', inputProps),
            dob: DriverInput.dob({ ...inputProps, placeholder: 'MM/DD/YYYY' }),
            ssn: DriverInput.ssn({ ...inputProps, placeholder: '###-##-####' }),
            phone: DriverInput.phone({ ...inputProps, placeholder: '(###) ###-####' }),
            email: DriverInput.email(inputProps)
        }
        hbs.select = {
            suffix: DriverSelect.suffix(selectProps),
            position: DriverSelect.position({
                ...selectProps,
                options: {
                    emptyOpt: 'Decide later...',
                },
            }),
        }

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router