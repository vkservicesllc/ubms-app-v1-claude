// ==== IMPORT ==== //

import User from '../../tools/core/user.mjs'

const router = require('express').Router()
const sendError = require('../../tools/utils/error')


// ==== SETUP ==== //



// ==== ROUTES ==== //


router.get('/data', User.mw.verify, User.mw.developerOnly, (req, res) => {
    try {
        const key = 'devData'
        let { hbs } = res
        hbs = hbs.set(key)

        res.render('dev-data', hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/logs', User.mw.verify, User.mw.developerOnly, (req, res) => {
    try {
        const key = 'devLogs'
        let { hbs } = res
        hbs = hbs.set(key)

        res.render('dev-logs', hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router