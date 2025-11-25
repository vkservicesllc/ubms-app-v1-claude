// ==== IMPORT ==== //

import User, { Role } from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Individual from '../../tools/core/individual.mjs'
import Company, { Owner } from '../../tools/core/company.mjs'

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


router.post('/list/companies', User.mw.verify, async (req, res) => {
    try {
        const { user: sessionUser, client } = res.session
        let closed, confirmed // combine active/closed & confirmed/unconfirmed

        if (!sessionUser.DS)
            return res.json({ client, data: await sessionUser.fetch('jx.companies', { hideRawId, filter: { closed } }) })

        res.json({ client, data: await Company.fetch(res.session, { closed, confirmed }, { hideRawId }) })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


router.post('/list/individuals', User.mw.verify, User.mw.developerOnly, async (req, res) => {
    try {
        const { client } = res.session

        res.json({ client, data: await Individual.fetch(res.session, {}, { hideRawId }) })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


router.post('/list/roles/:category?', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { client } = res.session
        let { category = null } = req.params
        const catList = Company.list.category

        if (category)
            for (const key in catList) {
                if (category !== catList[key].path[1]) continue
                category = key
                break
            }

        res.json({ client, data: await Role.fetch(res.session, { category }, { hideRawId }) })
    } catch(err) {
        sendError.server(req, res, err)
    }  
})


router.post('/list/teams', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { client } = res.session

        res.json({ client, data: await Team.fetch(res.session, {}, { hideRawId }) })
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

//! UNFINISHED (Not tested)
router.post('/data/company-owner/:id', async (req, res) => {
    try {
        const { client } = res.session
        const { id } = req.params

        res.json({ client, data: await Owner.fetch(res.session, {}, { hideRawId, hideSensitive }) })
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



// ---- HISTORY ROUTES ---- //




// ==== EXPORT ==== //

export default router