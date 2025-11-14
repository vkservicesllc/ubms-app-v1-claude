const router = require('express').Router()
const throwErr = require('../../tools/utils/error').data

/* Tools */
import User from '../../tools/core/user.mjs'



router.get('/data', User.mw.verify, User.mw.developerOnly, (req, res) => {
    try {
        let { hbs } = res
        hbs = hbs.set('devData')

        res.render('dev-data', hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.get('/logs', User.mw.verify, User.mw.developerOnly, (req, res) => {
    try {
        let { hbs } = res
        hbs = hbs.set('devLogs')

        res.render('dev-logs', hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router