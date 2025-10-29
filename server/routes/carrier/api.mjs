const router = require('express').Router()
const throwErr = require('../../tools/utils/error').api

/* Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Driver, { Application, Citation, Accident, Employment } from '../../tools/core/driver.mjs'
import { sortArrayByObjectKey } from '../../../client/global/modules/tools/utils/sorter.mjs'



router.post('/session/team/:_id/switch', User.verify, async (req, res) => {
    try {
        let switched = false
        const { _id } = req.params
        const team = await Team.data(res.session, { _id })

        if (team) {
            req.session.team = _id
            switched = true
        }

        res.send(switched)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/login/validation', async (req, res) => {
    let validated = false
    const { username } = req.body

    const user = await User.data(res.session, { username })
    if (user) {
        const { applied: teams } = await user.relationship({ user, ...res.session }, 'teams')
        //? const { applied: carriers } = await user.relationship({ user, ...res.session }, 'carriers')

        validated = (user.unscoped || teams.length > 0) //? && carriers.length > 0
    }

    res.send({ validated })
})



// router.post('/team/companies', User.verify, Team.verify, async (req, res) => {
//     try {
//         const { applied: companies } = (await res.session.team.data(res.session, 'companies')).companies

//         res.send(companies)
//     } catch (err) {
//         throwErr.server(res, null, err)
//     }
// })

router.post('/carriers', User.verify, Team.verify, (req, res) => {
    try {
        res.send(res.session.companies)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})

router.post('/teams', User.verify, Team.verify, async (req, res) => {
    try {
        const teams = await Team.list(res.session)
        let data = []

        teams.forEach(team => {
            const { _id, name } = team
            data.push({ _id, name })
        })
        data = sortArrayByObjectKey(data, 'name')

        res.send(data)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})




router.post('/drivers/application/:_id/:target?', User.verify, Team.verify, async (req, res) => {
    try {
        const { _id, target } = req.params

        const application = await Application.data(res.session, { _id })
        if (!application) return res.send({ error: 'Internal Server Error: Applicant not found' })

        if (!target) {
            const driver = await Driver.data(res.session, { _id: application._driverId })
            if (!driver) return res.send({ error: 'Internal Server Error: Driver not found' })

            const { formId } = application
            const { applications, count } = await driver.applications(res.session)
            const { unmatchedIdx } = applications.filter(application => application.formId === formId)[0]

            const identity = await application.identity(res.session)
            const log = await application.log()

            res.send({ data: { application, identity, count, unmatchedIdx, log } })
        } else {
            let Src

            switch (target) {
                case 'citations':
                    Src = Citation
                    break
                case 'accidents':
                    Src = Accident
                    break
                case 'employments':
                    Src = Employment
                    break
            }

            res.send({ data: await Src.list(res.session, { _aplId: application._id }) })
        }
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/drivers/applications/filters', User.verify, Team.verify, async (req, res) => {
    try {
        // const settings = await res.session.user.settings(res.session)
        // const { teamCompanies } = settings?.carrier || {}
        const filter = { companies: {}, users: {} }

        // if (teamCompanies && teamCompanies.includes('e'))
        //     filter.companies.excluded = true

        res.send({
            // companies: await Application.companies(res.session, filter.companies),
            companies: (await res.session.user.relationship(res.session, 'carriers')).applied,
            users: await Application.users(res.session, filter.users)
        })
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/drivers/applications/prev-employers', User.verify, Team.verify, async (req, res) => {
    try {
        const _teamId = res.session?.team?._id
        let data = await Employment.list(res.session, { condition: 'c', _teamId })

        data = sortArrayByObjectKey(data, 'startedOn', false)

        res.send({ data })
    } catch (err) {
        throwErr.server(res, null, err)
    }
})

router.post('/drivers/applications/prev-employer/:_id', User.verify, Team.verify, async (req, res) => {
    try {
        const { _id } = req.params
        res.send({ data: await Employment.data(res.session, { _id }) })
    } catch (err) {
        throwErr.server(res, null, err)
    }
})

router.post('/drivers/applications/source/:source', User.verify, Team.verify, (req, res) => {
    try {
        const { source } = req.params
        let data

        switch(source) {
            case 'violations':
                data = Application.violationList
                break
            case 'accidents':
                data = Application.accidentList
                break
        }

        res.send(data)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})

router.post('/drivers/applications/:source/:_id', User.verify, Team.verify, async (req, res) => {
    try {
        const { source } = req.params
        const { _id } = req.params
        let Src

        switch (source) {
            case 'citation':
                Src = Citation
                break
            case 'accident':
                Src = Accident
                break
        }

        res.send(await Src.data(res.session, { _id }))
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/drivers/applications/:archived?', User.verify, Team.verify, Application.dtList)


router.post('/drivers/charts', User.verify, Team.verify, async (req, res) => {
    try {
        let team, teamId
        if (req.session.team) {
            team = await Team.data(res.session, { _id: req.session.team })
            teamId = await team.id()
        }

        res.send(await Application.charts(res.session, { teamId }))
    } catch (err) {
        throwErr.server(res, null, err)
    }
})


router.post('/drivers/:blacklisted?', User.verify, Team.verify, Driver.dtList)



router.post('/resource/drivers/applications/:source', User.verify, Team.verify, async (req, res) => {
    try {
        const { source } = req.params
        const { _id } = req.body
        let Src, error

        switch (source) {
            case 'citation':
                Src = Citation
                break
            case 'accident':
                Src = Accident
                break
        }

        if (_id === 'new') error = (await Src.create(res.session, req.body)).error
        else {
            const instance = await Src.data(res.session, { _id })
            error = (await instance.modify(res.session, req.body)).error
        }

        res.send({ error })
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router