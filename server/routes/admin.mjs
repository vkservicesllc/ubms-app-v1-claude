// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../tools/utils/error')


// ==== SETUP ==== //


//! This kinda setup is in User.mw.verify
router.use((req, res, next) => {
    res.session.user = {
        id: 1,
        status: 'A',
        location: 'US',
    }
    res.session.user.DS = res.session.user.status === 'D' || res.session.user.status == 'S'
    res.session.user.DSA = res.session.user.status !== 'U'
    if (res.session.user.DS) res.session.user.location = 'US'

    const { user } = res.session

    const status = ['D', 'S', 'A', 'U'].indexOf(user.status)
    const DS = +user.DS
    const DSA = +user.DSA
    const location = +(user.location === 'US')

    res.session.client = '' + status + DS + DSA + location

    next()
})



// ==== ROUTES ==== //



// ==== EXPORT ==== //

export default router