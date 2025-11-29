// ==== IMPORT ==== //

import User, { Role } from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Individual from '../../tools/core/individual.mjs'
import Company, { Owner } from '../../tools/core/company.mjs'

const router = require('express').Router()
const sendError = require('../../tools/utils/error')


// ==== SETUP ==== //

const hideRawId = true
const hideSensitive = false



// ==== LIST ROUTES ==== //


router.post('/list/users', User.mw.verify, async (req, res) => {
    try {
        const { user: sessionUser, client } = res.session
        const { location } = sessionUser

        const filter = {}
        if (location !== 'US') filter.location = location

        res.json({ client, data: await User.fetch(res.session, filter, { hideRawId, hideSensitive, hideEvents: false }) })
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
        if (category) category = Company.list.category.key(category)

        res.json({ client, data: await Role.fetch(res.session, { category }, { hideRawId }) })
    } catch(err) {
        sendError.server(req, res, err)
    }  
})


router.post('/list/:src', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { client } = res.session
        const { src } = req.params
        const Src = { teams: Team, 'company-owners': Owner }[src]

        res.json({ client, data: await Src.fetch(res.session, {}, { hideRawId }) })
    } catch(err) {
        sendError.server(req, res, err)
    }
})



// ---- DATA ROUTES ---- //


router.post('/data/user/:_id/:target?', User.mw.verify, async (req, res) => {
    try {
        const { user: sessionUser, client } = res.session
        const { _id, target } = req.params
        const relationship = target === 'relationship'
        const toggleUnscoped = target === 'toggle-unscoped'
        if (target && !relationship && !toggleUnscoped) throw new Error('Invalid user target')

        const user = await User.fetch(res.session, { _id }, { hideRawId, hideSensitive })
        if (!user) throw new Error('User not found')

        if (relationship) {
            const data = {}
            const targets = User.config().jxTargets

            for (const target in targets) {
                const Src = targets[target][2]
                const sorts = Src.config().sorts
                const filter = {}
                data[target] = {}

                if (target === 'roles') filter.location = [ user.location, null ]

                data[target].all = await Src.fetch(res.session, filter, { hideRawId, sorts })
                data[target].applied = await user.fetch(`jx.${target}`, { hideRawId })

                if (!sessionUser.DS) {
                    const sessData = await sessionUser.fetch(`jx.${target}`)

                    data[target].all = data[target].all.filter(row => sessData.some(sessRow => sessRow._id === row._id))
                    data[target].applied = data[target].applied.filter(row => sessData.some(sessRow => sessRow._id === row._id))
                }

                data[target].available = data[target].all.filter(row => !data[target].applied.some(appliedRow => appliedRow._id === row._id))
            }

            return res.json({ client, data })
        }

        if (toggleUnscoped) {
            let { unscoped } = req.body
            unscoped = unscoped === 'true'

            await user.update({ unscoped })
        }

        res.json({ client, data: user })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


router.post('/data/company-owner/:_id', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { client } = res.session
        const { _id } = req.params

        res.json({ client, data: await Owner.fetch(res.session, { _id }, { hideRawId, hideSensitive }) })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


router.post('/data/:src/:_id/:target?', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { client } = res.session
        const { src, _id, target } = req.params
        const [ PriSrc ] = { role: [ Role ], team: [ Team ], company: [ Company ] }[src]
        if (!PriSrc) throw new Error('Invalid data requested')

        const inst = await PriSrc.fetch(res.session, { _id }, { hideRawId })
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

            data.all = await Src.fetch(res.session, filter, { hideRawId, hideSensitive, sorts })
            data.applied = await inst.fetch(`jx.${target}`, { hideRawId, hideSensitive })
            data.available = data.all.filter(row => !data.applied.some(appliedRow => appliedRow._id === row._id))

            return res.json({ client, data })
        }

        res.json({ client, data: inst })
    } catch(err) {
        sendError.server(req, res, err)
    }
})



// ---- HISTORY ROUTES ---- //



// ---- MISC ROUTES ---- //


router.post('/invite/user/:_id', User.mw.verify, User.mw.invite)




// ==== EXPORT ==== //

export default router