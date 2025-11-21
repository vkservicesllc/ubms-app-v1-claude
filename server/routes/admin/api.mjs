// ==== IMPORT ==== //
import User, { Role } from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'

const router = require('express').Router()
const sendError = require('../../tools/utils/error')


// ==== SETUP ==== //

const hideRawId = true



// ==== ROUTES ==== //


// ---- Lists ---- //


router.post('/users', async (req, res) => {
    try {
        const { user: sessionUser, client } = res.session
        const filter = {}

        if (sessionUser?.location) {
            const { location } = sessionUser
            if (location !== 'US') filter.location = location
        }

        const users = await User.fetch(res.session, filter, { hideRawId, hideSensitive: false })

        res.json({ client, data: users })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


router.post('/roles', async (req, res) => {
    try {
        const { client } = res.session
        const roles = await Role.fetch(res.session, {}, { hideRawId })

        res.json({ client, data: roles })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


router.post('/teams', async (req, res) => {
    try {
        const { client } = res.session
        const teams = await Team.fetch(res.session, {}, { hideRawId })

        res.json({ client, data: teams })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


// ---- Data ---- //


router.post('/user/:id/:target?', async (req, res) => {
    try {
        const { client } = res.session
        const { id, target } = req.params

        const user = await User.fetch(res.session, { id }, { hideRawId })

        if (target === 'relationship') {
            // return all relationships
        }

        res.json({ client, data: user })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


router.post('/role/:id/:target?', async (req, res) => {
    try {
        const { client } = res.session
        const { id } = req.params

        const role = await Role.fetch(res.session, { id }, { hideRawId })

        res.json({ client, data: role })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


router.post('/team/:id/:target?', async (req, res) => {
    try {
        const { client } = res.session
        const { id, target } = req.params
console.log({ id, target })
        const team = await Team.fetch(res.session, { id }, { hideRawId })

        res.json({ client, data: team })
    } catch(err) {
        sendError.server(req, res, err)
    }
})




// ==== EXPORT ==== //

export default router