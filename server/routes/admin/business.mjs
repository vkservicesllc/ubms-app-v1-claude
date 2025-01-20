const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assets */
import User, { superAdminUserOnly } from '../../assets/user.mjs'

/* HTML Builders */
import { Label as CompanyLabel, Input as CompanyInput, Select as CompanySelect } from '../../html/company.mjs'

/* Registry */
import { formSelectors } from '../../../client/global/modules/registry/selectors.mjs'

/* Local Constants */
import { labelClass, labelClassRequired } from './constants.mjs'



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


router.get('/company-owners', User.verify, (req, res) => {
    try {
        const key = 'owners'
        let { hbs } = res
        hbs = hbs.set(key, { titlePfx: 'Company Owners' })

        const { deleteId } = formSelectors.owner

        hbs.label = {
            ownerUpdateSince: CompanyLabel.ownerUpdateSince({ class: labelClassRequired }),
            ownerFirstName: CompanyLabel.ownerName('f', { class: labelClassRequired }),
            ownerMiddleName: CompanyLabel.ownerName('m', { class: labelClass }),
            ownerLastName: CompanyLabel.ownerName('l', { class: labelClassRequired }),
            ownerSuffix: CompanyLabel.ownerName('s', { class: labelClass }),
            ownerGender: CompanyLabel.ownerGender({ class: labelClass }),
            ownerDob: CompanyLabel.ownerDob({ class: labelClassRequired }),
            ownerSsn: CompanyLabel.ownerSsn({ class: labelClass }),
        }
        hbs.input = {
            current: {
                ownerId: CompanyInput.ownerId(),
                ownerSsn: CompanyInput.ownerSsn({}, true),
                ownerDeleteId: CompanyInput.ownerId({ id: deleteId }),
            },
            ownerUpdateSince: CompanyInput.ownerUpdateSince({ class: 'input' }),
            ownerFirstName: CompanyInput.ownerName('f', { class: 'input' }),
            ownerMiddleName: CompanyInput.ownerName('m', { class: 'input' }),
            ownerLastName: CompanyInput.ownerName('l', { class: 'input' }),
            ownerDob: CompanyInput.ownerDob({ class: 'input' }),
            ownerSsn: CompanyInput.ownerSsn({ class: 'input' }),
        }
        hbs.select = {
            ownerSuffix: CompanySelect.ownerSuffix({ tabs: 8, options: { emptyOpt: '--' } }),
            ownerGender: CompanySelect.ownerGender({ tabs: 8, options: { emptyOpt: '--' } }),
        }

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