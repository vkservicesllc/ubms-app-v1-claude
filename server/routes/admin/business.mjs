const router = require('express').Router()
const throwErr = require('../../tools/utils/error').data

/* Tools */
import User from '../../tools/core/user.mjs'

/* Forms */
import { updateFormOptions } from '../../tools/form/builder.mjs'
import { OwnerForm } from '../../tools/form/company.mjs'

/* Middleware */
import { companyById, companyByCategoryAndRoute } from './mw/company.mjs'

/* Assets */
import { labelClass, labelClassRequired } from './assets.mjs'



router.get('/companies', User.mw.verify, (req, res) => {
    try {
        const key = 'companies'
        let { hbs } = res
        hbs = hbs.set(key)

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/company/:_id', User.mw.verify, User.mw.superAdminOnly, companyById)


router.get('/:category/:route', User.mw.verify, User.mw.superAdminOnly, companyByCategoryAndRoute)


router.get('/company-owners', User.mw.verify, (req, res) => {
    try {
        const key = 'owners'
        let { hbs } = res
        hbs = hbs.set(key, { titlePfx: 'Company Owners' })

        const fields = [
            'firstName', 'middleName',
            'lastName', 'suffix', 'nameSince',
            'gender', 'dob', 'ssn', 'phone',
        ]
        const options = updateFormOptions({}, OwnerForm, fields, {
            labelClass,
            labelClassRequired,
            textClass: 'input',
            tabs: 7,
        })

        hbs.ownerForm = new OwnerForm(options)

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/branches', User.mw.verify, User.mw.superAdminOnly, (req, res) => {
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