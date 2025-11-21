// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../tools/utils/error')


// ==== SETUP ==== //



// ==== ROUTES ==== //


router.post('/test', (req, res) => {
    const arr = []
    arr[1] = 'one'
    arr[5] = 5
    res.json(arr)
})



// ==== EXPORT ==== //

export default router