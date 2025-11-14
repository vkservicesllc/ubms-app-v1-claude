const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import User, { Role } from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Company, { Owner } from '../../tools/core/company.mjs'
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
//         const instance = await Src.data(res.session, { _id })
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


//? router.post('/companies', User.mw.verify, async (req, res) => {
//     try {
//         //! It may be necessary to apply filters when requested in branches other than admin
//         const filter = {}

//         const { user } = res.session
//         if (!user.DS)
//             filter.ids = await user.relIds(res.session, 'companies')

//         res.send({ data: await Company.list(res.session, filter) })
//     } catch (err) {
//         sendError.server(res, err, true)
//     }
// })


//? router.post('/company-owners', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
//     try {
//         res.send({ data: await Owner.list(res.session) })
//     } catch (err) {
//         sendError.server(res, err, true)
//     }
// })






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

        res.send({ data: [] })
    } catch (err) {
        sendError.server(res, err, true)
    }
})


router.post('/user/:_id/:target', User.mw.verify, async (req, res) => {
    try {
        const { user: sessionUser } = res.session
        const { _id, target } = req.params

        const user = await User.fetch(res.session, { _id }, { hideRawId, hideSensitive: true })
        if (!user) return res.send({ data: {}, error: 'API Error: User not found' })
        if ((user.status === 'D' && sessionUser.status !== 'D') || (user.DS && ! sessionUser.DS))
            return res.send({ data: {}, error: 'Request Error: Immune User' })

        //! ... reconsider
        const [ Src, sortBy ] = { roles: [ Role, 'name' ], teams: [ Team, 'name' ], companies: [ Company, 'name' ] }[target]

        const data = {
            all: await Src.fetch(res.session, {}, { hideRawId }),
            applied: await user.fetch(target, { hideRawId }),
        }

        if (!sessionUser.DS) {
            const sessData = await sessionUser.fetch(target)

            //! reduce data.all and data.applied to whatever session user has
        }

        data.available = data.all.filter(row => !data.applied.some(appliedRow => appliedRow._id === row._id))

        data.all = sortArrayByObjectKey(data.all, sortBy)
        data.applied = sortArrayByObjectKey(data.applied, sortBy)
        data.available = sortArrayByObjectKey(data.available, sortBy)

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

        const { error } = await user.modify(res.session, { unscoped })
        res.send({ error })
    } catch (err) {
        sendError.server(res, err, true)
    }
})



/* ROLE */


router.post('/role/:_id', User.mw.verify, async (req, res) => {
    try {
        const { _id } = req.params

        res.send({ data: await Role.data(res.session, { _id }) })
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
        const team = await Team.data(res.session, { _id })

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
//         const team = await Team.data(res.session, { _id })

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
        const company = await Company.data(res.session, { _id })
        const companyTeams = await company.relationship(res.session, target)

        res.send({ data: companyTeams })
    } catch (err) {
        sendError.server(res, err, true)
    }
})


router.post('/company-owner/:_id', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { _id } = req.params

        res.send(await Owner.data(res.session, { _id }))
    } catch (err) {
        sendError.server(res, err, true)
    }
})



export default router