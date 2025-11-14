const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import User from '../../tools/core/user.mjs'



router.get('/data', User.mw.verify, User.mw.developerOnly, (req, res) => {
    try {
        let { hbs } = res
        hbs = hbs.set('devData')

        res.render('dev-data', hbs)
    } catch (err) {
        sendError.server(res, err)
    }
})


router.get('/logs', User.mw.verify, User.mw.developerOnly, (req, res) => {
    try {
        let { hbs } = res
        hbs = hbs.set('devLogs')

        res.render('dev-logs', hbs)
    } catch (err) {
        sendError.server(res, err)
    }
})



export default router