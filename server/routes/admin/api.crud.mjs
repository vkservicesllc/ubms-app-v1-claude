const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Import: Tools */
import User, { Role } from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Individual from '../../tools/core/individual.mjs'
import Company, { Owner, RefSource } from '../../tools/core/company.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import { Application as DriverApplication } from '../../tools/core/driver.mjs'

/* Import: Validators */
import validationCheck from '../../tools/form/validator.mjs'
import UserForm, { RoleForm } from '../../tools/form/user.mjs'
import TeamForm from '../../tools/form/team.mjs'
import CompanyForm, { OwnerForm } from '../../tools/form/company.mjs'
import CarrierForm from '../../tools/form/carrier.mjs'



//* GET *//


const hideRawId = true


router.get('/users/:_id?/:target?', User.mw.verify, async (req, res) => {
    try {
        const { _id, target } = req.params
        const { user: sessionUser } = res.session
        const options = { hideRawId, hideSensitive: false }

        if (!_id) {
            const filter = {}
            if (sessionUser.location !== 'US') filter.location = sessionUser.location
            options.hideEvents = false

            return res.json({ data: await User.fetch(res.session, filter, options) })
        }

        const relationships = target === 'relationships'
        if (target && !relationships) throw new Error('Invalid user target supplied')

        const user = await User.fetch(res.session, { _id }, options)
        if (!user) return res.status(404).end()

        if (relationships) {
            const data = {}
            const targets = User.config().jxTargets

            for (const target in targets) {
                const Src = targets[target][2]
                const sorts = Src.config().sorts
                const filter = {}
                data[target] = {}

                if (target === 'roles') filter.location = [ user.location, null ]
                if (target === 'companies') filter.confirmed = true

                data[target].all = await Src.fetch(res.session, filter, { hideRawId, sorts })
                data[target].applied = await user.fetch(`jx.${target}`)

                if (!sessionUser.DS) {
                    const sessData = await sessionUser.fetch(`jx.${target}`)

                    data[target].all = data[target].all.filter(row => sessData.some(sessRow => sessRow._id === row._id))
                    data[target].applied = data[target].applied.filter(row => sessData.some(sessRow => sessRow._id === row._id))
                }

                data[target].available = data[target].all.filter(row => !data[target].applied.some(appliedRow => appliedRow._id === row._id))
            }

            return res.json({ data, resource: user })
        }

        res.json({ data: user })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/companies', User.mw.verify, async (req, res) => {
    try {
        const { user: sessionUser } = res.session
        const options = { hideRawId }, filter = {}

        if (!sessionUser.DS) {
            filter.closed = false
            filter.confirmed = true

            return res.json({ data: await sessionUser.fetch('jx.companies', filter, options) })
        }

        res.json({ data: await Company.fetch(res.session, filter, options) })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/individuals', User.mw.verify, User.mw.developerOnly, async (req, res) => {
    try {
        res.json({ data: await Individual.fetch(res.session, {}, { hideRawId }) })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


router.get('/roles', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        let { category = null } = req.query
        if (category) category = Company.list.category.key(category)

        res.json({ data: await Role.fetch(res.session, { category }, { hideRawId }) })
    } catch(err) {
        sendError.server(req, res, err)
    }  
})


router.get('/:src', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { src } = req.params
        const Src = { teams: Team, 'company-owners': Owner, refsources: RefSource }[src]

        res.json({ data: await Src.fetch(res.session, {}, { hideRawId }) })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


router.get('/companies/:_id/history', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { _id } = req.params
        const company = await Company.fetch(res.session, { _id }, { hideRawId })
        if (!company) throw new Error('Company not found')

        const data = {}
        const targets = ['names', 'ownerships', 'addresses', 'mail', 'phones', 'faxes', 'emails']
        const { since } = company

        for (const target of targets) {
            data[target] = await company.fetch(target)

            for (const row of data[target]) {
                row.initial = row.since === since

                if (target === 'ownerships') {
                    row.owner = await Owner.fetch(res.session, { id: row.ownerId }, { hideRawId })
                    if (!row.owner) throw new Error('Owner not found')

                    delete row.ownerId
                }
            }
        }

        res.json({ data })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


router.get('/company-owners/:_id', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { _id } = req.params

        res.json({ data: await Owner.fetch(res.session, { _id }, { hideRawId, hideSensitive: false }) })
    } catch(err) {
        sendError.server(req, res, err)
    }
})


router.get('/:src/:_id/:target?', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { src, _id, target } = req.params
        const [ PriSrc ] = { roles: [ Role ], teams: [ Team ], companies: [ Company ] }[src]
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
                    if (src === 'roles' && inst.location) filter.location = [ inst.location, null ]
                    break
            }

            data.all = await Src.fetch(res.session, filter, { hideRawId, hideSensitive: false, sorts })
            data.applied = await inst.fetch(`jx.${target}`, {}, { hideRawId, hideSensitive: false })
            data.available = data.all.filter(row => !data.applied.some(appliedRow => appliedRow._id === row._id))

            return res.json({ data, resource: inst })
        }

        let settings
        if (typeof inst.settings === 'function') settings = await inst.settings()

        res.json({ data: inst, settings })
    } catch(err) {
        sendError.server(req, res, err)
    }
})



//* POST/PUT/PATCH *//

const dynamicValidator = {

    user: (req, res, next) => {
        let validators = UserForm.validate()

        if (req.method === 'PATCH') {
            const { field } = req.params

            switch (field) {
                default:
                    validators = [ UserForm[field].validate() ]
                    break
            }
        }

        Promise.all(validators.map(validator => validator.run(req)))
            .then(() => next())
            .catch(next)
    },

    companies: (req, res, next) => {
        const { step } = req.params
        let validators = []

        switch (step) {
            case 'address':
                validators = CompanyForm.validate('address')
                break
            case 'contacts':
                validators = CompanyForm.validate('contacts')
                break
        }

        Promise.all(validators.map(validator => validator.run(req)))
            .then(() => next())
            .catch(next)
    },

    companyTargets: (req, res, next) => {
        const { target } = req.params
        let validators = [ CompanyForm.since.validate() ]

        switch (target) {
            case 'names':
                validators.push(CompanyForm.busName.validate(), CompanyForm.coType.validate())
                validators.push(CompanyForm.alias.validate())
                break
            case 'phones':
                validators.push(CompanyForm.phone.validate())
                break
            case 'faxes':
                validators.push(CompanyForm.fax.validate())
                break
            case 'emails':
                validators.push(CompanyForm.email.validate())
                break
            case 'addresses':
                //? need to figure out
                break
            case 'mail':
                //? need to figure out
                break
        }

        Promise.all(validators.map(validator => validator.run(req)))
            .then(() => next())
            .catch(next)
    },

}


router.post('/companies/:_id/:target', User.mw.verify, User.mw.superAdminOnly, dynamicValidator.companyTargets, validationCheck, async (req, res) => {
    try {
        const { _id, target } = req.params
        const company = await Company.fetch(res.session, { _id })
        if (!company) throw new Error('Company not found')

        if (target === 'addresses') req.body.mail = req.body.mail === 'on'

        const { route: oldRoute } = company
        const { added } = await company.add(target, req.body)
        const data = await company.fetch(target)
        const resource = await Company.fetch(res.session, { _id }, { hideRawId })
        const { route: newRoute } = resource

        await DriverApplication.calibrate(res.session, target)

        res.json({ added, data, props: { oldRoute, newRoute } })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.put('/companies/:_id/:target/:since', User.mw.verify, User.mw.superAdminOnly, dynamicValidator.companyTargets, validationCheck, async (req, res) => {
    try {
        const { _id, target, since } = req.params
        const company = await Company.fetch(res.session, { _id })
        if (!company) throw new Error('Company not found')

        if (target === 'addresses') req.body.mail = req.body.mail === 'on'

        const { route: oldRoute } = company
        const { updated } = await company.update(target, req.body, { since })
        const data = await company.fetch(target)
        const resource = await Company.fetch(res.session, { _id }, { hideRawId })
        const { route: newRoute } = resource

        await DriverApplication.calibrate(res.session, target)

        res.json({ updated, data, props: { oldRoute, newRoute } })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.patch('/users/:_id/:field?', User.mw.verify, dynamicValidator.user, validationCheck, async (req, res) => {
    try {
        const { _id, field } = req.params
        const user = await User.fetch(res.session, { _id })
        if (!user) throw new Error('User not found')

        switch (field) {

            case 'unscoped':
                {
                    const { unscoped } = req.body
                    // unscoped = unscoped === 'true'

                    await user.update({ unscoped })
                    if (unscoped) {
                        const teamIds = await user.fetch('jx.teams', {}, { idsOnly: true })
                        await user.delete('jx.teams', teamIds)
                    }
                }
                break

            default: await user.update(req.body)

        }

        res.json({ resource: await User.fetch(res.session, { _id }, { hideRawId }) })
    } catch (err) {
        sendError.server(req, res, err)
    }
})



//* DELETE *//


router.delete('/companies/:_id/:target/:since', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { _id, target, since } = req.params
        const company = await Company.fetch(res.session, { _id })
        if (!company) throw new Error('Company not found')

        const { route: oldRoute } = company
        const { deleted } = await company.delete(target, { since })
        const data = await company.fetch(target, {}, { hideRawId })
        const resource = await Company.fetch(res.session, { _id }, { hideRawId })
        const { route: newRoute } = resource

        res.json({ deleted, data, props: { oldRoute, newRoute } })
    } catch (err) {
        sendError.server(req, res, err)
    }
})



/* Export */
export default router