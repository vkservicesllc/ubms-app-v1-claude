// ==== IMPORT ==== //
import User, { Role } from '../../tools/core/user.mjs'

const router = require('express').Router()
const sendError = require('../../tools/utils/error')


// ==== SETUP ==== //



// ==== ROUTES ==== //


router.post('/users', async (req, res) => {
    try {
        const { client } = res.session
        const users = await User.fetch(res.session)

        res.send({ client, data: users })
    } catch(err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router