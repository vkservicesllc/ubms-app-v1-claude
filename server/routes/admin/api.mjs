const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import User, { Role, relTargets as userRelTargets } from '../../tools/core/user.mjs'
import Team, { relTargets as teamRelTargets } from '../../tools/core/team.mjs'
import Company, { Owner, relTargets as companyRelTargets } from '../../tools/core/company.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import { capitalizeFirst } from '../../../client/global/modules/tools/utils/string.mjs'
import { sortArrayByObjectKey } from '../../../client/global/modules/tools/utils/sorter.mjs'


const hideRawId = true



router.post('/log/:env/:_id', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { env, _id } = req.params
        let log

        switch (env) {

            case 'user':
                const user = await User.fetch(res.session, { _id })
                log = await user.report(res.session)
                break

        }

        res.send(log)
    } catch (err) {
        sendError.server(res, err, true)
    }
})


// router.post('/flush/:env/:_id/:target?', User.mw.verify, User.mw.developerOnly, async (req, res) => {
//     try {
//         const { env, _id, target } = req.params
//         let success = false

//         const Src = { User, Role, Team, Individual, Company, Owner, Carrier }[capitalizeFirst(env)]
//         const instance = await Src.fetch(res.session, { _id })
//         const [ result ] = await instance.flush(target)
//         if (result.affectedRows == 1) success = true

//         res.send({ success })
//     } catch (err) {
//         sendError.server(res, err, true)
//     }
// })



/* LIST */


router.post('/users', User.mw.verify, async (req, res) => {
    try {
        res.send({ data: await User.fetch(res.session, {}, { hideRawId, hideSensitive: false }) })
    } catch (err) {
        sendError.server(res, err, true)
    }
})


//? router.post('/roles/:roleCategory?', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
//     try {
//         const { roleCategory } = req.params
//         const catList = Company.list.category
//         let category, error, data = []
//         if (!roleCategory) category = 'def'
//         else
//             for (const key in catList) {
//                 if (roleCategory != catList[key].path[1]) continue

//                 category = key
//                 break
//             }

//         if (!category) error = 'Error: Category could not be udentified'
//         else data = await Role.fetch(res.session, { category }, { hideRawId })

//         res.send({ error, data })
//     } catch (err) {
//         sendError.server(res, err, true)
//     }
// })


router.post('/teams', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        res.send({ data: await Team.fetch(res.session, {}, { hideRawId }) })
    } catch (err) {
        sendError.server(res, err, true)
    }
})


router.post('/companies', User.mw.verify, async (req, res) => {
    try {
        const filter = {}
        const { user: sessionUser } = res.session

        if (!sessionUser.DS)
            filter.ids = await sessionUser.fetch('companies', { idsOnly: true })

        res.send({ data: await Company.fetch(res.session, filter, { hideRawId }) })
    } catch (err) {
        sendError.server(res, err, true)
    }
})


router.post('/company-owners', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        res.send({ data: await Owner.fetch(res.session, {}, { hideRawId }) })
    } catch (err) {
        sendError.server(res, err, true)
    }
})






/* USER */


router.post('/user/:_id', User.mw.verify, async (req, res) => {
    try {
        const { user: sessionUser } = res.session
        const { _id } = req.params

        const user = await User.fetch(res.session, { _id }, { hideRawId, hideSensitive: true })
        if (!user) return res.send({ data: {}, error: 'API Error: User not found' })
        if ((user.status === 'D' && sessionUser.status !== 'D') || (user.DS && ! sessionUser.DS))
            return res.send({ data: {}, error: 'Request Error: Immune User' })

        const roles = await user.fetch('roles')
        const locationRoles = roles.filter(role => role.location === user.location)
        user.count.locationRoles = locationRoles.length

        res.send({ data: user })
    } catch (err) {
        sendError.server(res, err, true)
    }
})


router.post('/user/:_id/relationships', User.mw.verify, async (req, res) => {
    try {
        const { user: sessionUser } = res.session
        const { _id } = req.params

        const user = await User.fetch(res.session, { _id })
        if (!user) return res.send({ data: {}, error: 'API Error: User not found' })
        if ((user.status === 'D' && sessionUser.status !== 'D') || (user.DS && ! sessionUser.DS))
            return res.send({ data: {}, error: 'Request Error: Immune User' })

        const data = {}
        const targets = userRelTargets('main')

        for (const target in targets) {
            const Src = targets[target][0]
            const sorts = targets[target][3]
            data[target] = {}

            data[target].all = await Src.fetch(res.session, {}, { hideRawId, sorts })
            data[target].applied = await user.fetch(target, { hideRawId })

            if (!sessionUser.DS) {
                const sessData = await sessionUser.fetch(target)

                //! reduce data.all and data.applied to whatever session user has
            }

            data[target].available = data[target].all.filter(row => !data[target].applied.some(appliedRow => appliedRow._id === row._id))
        }

        res.send({ data })
    } catch (err) {
        sendError.server(res, err, true)
    }
})


router.post('/user/:_id/toggle-unscoped', User.mw.verify, async (req, res) => {
    try {
        const { _id } = req.params
        let { unscoped } = req.body
        unscoped = unscoped === 'true'

        const user = await User.fetch(res.session, { _id })

        const { error } = await user.update(res.session, { unscoped })
        res.send({ error })
    } catch (err) {
        sendError.server(res, err, true)
    }
})



/* ROLE */


router.post('/role/:_id', User.mw.verify, async (req, res) => {
    try {
        const { _id } = req.params

        res.send({ data: await Role.fetch(res.session, { _id }) })
    } catch (err) {
        sendError.server(res, err, true)
    }
})



/* TEAM */


router.post('/team/:_id', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { _id } = req.params

        res.send({ data: await Team.fetch(res.session, { _id }, { hideRawId }) })
    } catch (err) {
        sendError.server(res, err, true)
    }
})


router.delete('/team/:_id', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        let deleted = false, error
        const { _id } = req.params
        const team = await Team.fetch(res.session, { _id })

        try {
            ({ deleted, error } = await team.delete(res.session))
        } catch (err) {
            console.error(err)
            error = 'DB Error: Failed to delete Team'
        }

        res.send({ deleted, error })
    } catch (err) {
        sendError.server(res, err, true)
    }
})


//! router.post('/team/:_id/:relType', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
//     try {
//         let error
//         const { _id, relType } = req.params
//         const team = await Team.fetch(res.session, { _id })

//         let data = await team.fetch(relType, { hideRawId })
// console.log(data)
//         res.send({ data: { team, data } })
//     } catch (err) {
//         sendError.server(res, err, true)
//     }
// })


//! router.post('/team/:_id/:relType/:_relId', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
//     try {
//         const { _id, relType, _relId } = req.params
//         const { action } = req.body
//         const team = await Team.fetch(res.session, { _id })

//         const { modified, error } = await team.manage(res.session, relType, action, _relId)

//         res.send({ modified, error })
//     } catch (err) {
//         sendError.server(res, err, true)
//     }
// })



/* COMPANY */


router.post('/company/:_id/:target', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { _id, target } = req.params
        const { sensitive } = req.query
        const hideSensitive = !(sensitive && (sensitive === 'true' || sensitive == '1'))
        const filter = {}

        const targets = companyRelTargets('main')
        const Src = targets[target][0]
        const sorts = targets[target][3]

        if (target === 'users') filter.status = ['U', 'A']

        const company = await Company.fetch(res.session, { _id })
        const data = {
            all: await Src.fetch(res.session, filter, { hideRawId, hideSensitive, sorts }),
            applied: await company.fetch(target, { hideRawId, hideSensitive }),
        }
        data.available = data.all.filter(row => !data.applied.some(appliedRow => appliedRow._id === row._id))

        res.send({ data })
    } catch (err) {
        sendError.server(res, err, true)
    }
})


router.post('/company-owner/:_id', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { _id } = req.params

        res.send(await Owner.fetch(res.session, { _id }))
    } catch (err) {
        sendError.server(res, err, true)
    }
})



export default router