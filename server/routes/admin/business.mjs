const router = require('express').Router()
const throwErr = require('../../tools/error').data

/* Assets */
import User, { superAdminUserOnly } from '../../assets/user.mjs'



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