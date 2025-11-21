// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../tools/utils/error')


// ==== SETUP ==== //



// ==== ROUTES ==== //


router.post('/test', (req, res) => {
    res.send('test')
})



// ==== EXPORT ==== //

export default router