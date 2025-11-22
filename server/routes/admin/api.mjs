// ==== IMPORT ==== //

import User, { Role } from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Company from '../../tools/core/company.mjs'

const router = require('express').Router()
const sendError = require('../../tools/utils/error')


// ==== SETUP ==== //

const hideRawId = true



// ==== LIST ROUTES ==== //


router.post('/list/users', User.mw.verify, async (req, res) => {
    try {
        const { user: sessionUser, client } = res.session
        const { location } = sessionUser

        const filter = {}
        if (location !== 'US') filter.location = location

        res.json({ client, data: await User.fetch(res.session, filter, { hideRawId, hideSensitive: false }) })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


router.post('/list/:src', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { client } = res.session
        const { src } = req.params
        const Src = { roles: Role, teams: Team }[src]

        res.json({ client, data: await Src.fetch(res.session, {}, { hideRawId }) })
    } catch(err) {
        sendError.server(req, res, err)
    }
})



// ---- DATA ROUTES ---- //

//! UNFINISHED
router.post('/data/user/:id/:target?', async (req, res) => {
    try {
        const { user: sessionUser, client } = res.session
        const { id, target } = req.params
        const relationship = target === 'relationship'
        if (target && !relationship) throw new Error('Invalid user target')

        const user = await User.fetch(res.session, { id }, { hideRawId })
        if (!user) throw new Error('User not found')

        if (relationship) {
            const data = {}
            const targets = User.config().jxTargets

            for (const target in targets) {
                const Src = targets[target][2]
                const sorts = Src.config().sorts
                data[target] = {}

                data[target].all = await Src.fetch(res.session, {}, { hideRawId, sorts })
                data[target].applied = await user.fetch(`jx.${target}`, { hideRawId })

                if (!sessionUser.DS) {
                    const sessData = await sessionUser.fetch(target)

                    //! reduce data.all and data.applied to whatever session user has
                }

                data[target].available = data[target].all.filter(row => !data[target].applied.some(appliedRow => appliedRow._id === row._id))
            }

            return res.json({ client, data })
        }

        res.json({ client, data: user })
    } catch(err) {
        sendError.server(req, res, err)
    }
})

//! UNFINISHED (Not tested on company yet)
router.post('/data/:src/:id/:target?', async (req, res) => {
    try {
        const { client } = res.session
        const { src, id, target } = req.params
        const [ PriSrc ] = { role: [ Role ], team: [ Team ], company: [ Company ] }[src]
        if (!PriSrc) throw new Error('Invalid data requested')

        const inst = await PriSrc.fetch(res.session, { id }, { hideRawId })
        if (!inst) throw new Error(`${PriSrc.name} not found`)

        if (target) {
            const targets = PriSrc.config().jxTargets
            if (!Object.keys(targets).includes(target)) throw new Error(`Invalid ${PriSrc.name.toLowerCase()} target`)

            const Src = targets[target][2]
            const sorts = Src.config().sorts
            const data = {}, filter = {}

            switch (target) {
                case 'users':
                    filter.status = ['U', 'A']
                    break
            }

            data.all = await Src.fetch(res.session, filter, { hideRawId, sorts })
            data.applied = await inst.fetch(`jx.${target}`, { hideRawId })
            data.available = data.all.filter(row => !data.applied.some(appliedRow => appliedRow._id === row._id))

            return res.json({ client, data })
        }

        res.json({ client, data: inst })
    } catch(err) {
        sendError.server(req, res, err)
    }
})




// ==== EXPORT ==== //

export default router