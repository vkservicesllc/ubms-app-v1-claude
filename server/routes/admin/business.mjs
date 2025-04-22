const router = require('express').Router()
const throwErr = require('../../tools/utils/error').data

/* Tools */
import User, { superAdminUserOnly } from '../../tools/core/user.mjs'

/* Forms */
import { OwnerForm } from '../../tools/form/company.mjs'

/* Middleware */
import { companyById, companyByCategoryAndRoute } from './mw/company.mjs'

/* Assets */
import { labelClass, labelClassRequired } from './assets.mjs'



router.get('/companies', User.verify, (req, res) => {
    try {
        const key = 'companies'
        let { hbs } = res
        hbs = hbs.set(key)

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/company/:_id', User.verify, superAdminUserOnly, companyById)


router.get('/:category/:route', User.verify, superAdminUserOnly, companyByCategoryAndRoute)


router.get('/company-owners', User.verify, (req, res) => {
    try {
        const key = 'owners'
        let { hbs } = res
        hbs = hbs.set(key, { titlePfx: 'Company Owners' })

        const options = {}
        const fields = [
            'firstName', 'middleName',
            'lastName', 'suffix', 'nameSince',
            'gender', 'dob', 'ssn', 'phone',
        ]
        fields.forEach(prop => {
            const form = OwnerForm[prop]
            const { required } = form.properties
            const keys = Object.keys(form).filter(key => !['properties', 'validate'].includes(key))
            options[prop] = {}

            keys.forEach(key => {
                options[prop][key] = {}
                options[prop][key].label = { class: required === true ? labelClassRequired : labelClass }
                if (key === 'text')
                    options[prop][key].input = { class: 'input' }
                else if (key === 'select')
                    options[prop][key].input = { tabs: 8 }
            })
        })

        hbs.form = new OwnerForm(options)

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/branches', User.verify, superAdminUserOnly, (req, res) => {
    try {
        const key = 'branches'
        let { hbs } = res
        hbs = hbs.set(key)

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router