const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Import: Tools */
import User, { Role } from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Individual from '../../tools/core/individual.mjs'
import Company, { Owner } from '../../tools/core/company.mjs'
import Carrier from '../../tools/core/carrier.mjs'



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
                data[target].applied = await user.fetch(`jx.${target}`, { hideRawId })

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
        const options = { hideRawId }

        if (!sessionUser.DS) {
            options.filter = { closed: false, confirmed: true }
            return res.json({ data: await sessionUser.fetch('jx.companies', options) })
        }

        res.json({ data: await Company.fetch(res.session, {}, options) })
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
        const Src = { teams: Team, 'company-owners': Owner }[src]

        res.json({ data: await Src.fetch(res.session, {}, { hideRawId }) })
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
                    if (src === 'role' && inst.location) filter.location = [ inst.location, null ]
                    break
            }

            data.all = await Src.fetch(res.session, filter, { hideRawId, hideSensitive: false, sorts })
            data.applied = await inst.fetch(`jx.${target}`, { hideRawId, hideSensitive: false })
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


/* Import: Validators */
import validationCheck from '../../tools/form/validator.mjs'
import UserForm, { RoleForm } from '../../tools/form/user.mjs'
import TeamForm from '../../tools/form/team.mjs'
import CompanyForm, { OwnerForm } from '../../tools/form/company.mjs'
import CarrierForm from '../../tools/form/carrier.mjs'


const validateUser = []
const userFields = ['status', 'location', 'email', 'phone', 'firstName', 'lastName', 'alias', 'gender']
userFields.map(prop => validateUser.push(UserForm[prop].validate()))

const validateRole = []
const roleFields = ['roleName', 'roleLocation']
roleFields.map(prop => validateRole.push(RoleForm[prop].validate()))


const validateTeam = []
const teamFields = ['teamName', 'desc']
teamFields.map(prop => validateTeam.push(TeamForm[prop].validate()))

const validateTeamProfile = []
const teamProfileFields = [
    'busName', 'coType', 'phone', 'email', 'website',
    'address1', 'address2', 'addrZip', 'addrCity', 'addrState',
]
teamProfileFields.map(prop => validateTeamProfile.push(TeamForm[prop].validate()))

const validateCompany = []
const companyFields = ['category', 'ein', 'duns', 'busName', 'coType', 'alias', 'website', 'since']
companyFields.map(prop => validateCompany.push(CompanyForm[prop].validate()))

const validateOwner = [], validateOwnerName = []
const ownerFields = ['firstName', 'middleName', 'lastName', 'suffix']
const ownerNameFields = [ ...ownerFields, 'nameSince' ]
ownerFields.push('gender', 'dob', 'ssn')
ownerFields.map(prop => validateOwner.push(OwnerForm[prop].validate()))
ownerNameFields.map(prop => validateOwnerName.push(OwnerForm[prop].validate()))

const validateCompanyContacts = []
const companyContactsFields = ['phone', 'fax', 'email']
companyContactsFields.map(prop => validateCompanyContacts.push(CompanyForm[prop].validate()))

const validateCarrier = []
const carrierFields = ['mc', 'usdot', 'ifta', 'scac', 'irp', 'efs', 'fleetOne', 'transflo']
Object.keys(Carrier.list.permit).forEach(prop => carrierFields.push(`${prop}Permit`))
carrierFields.map(prop => validateCarrier.push(CarrierForm[prop].validate()))

const dynamicValidator = {

    user: (req, res, next) => {
        let validators = validateUser

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
        let validators

        switch (step) {
            case 'ownership':
                validators = []
                break
            case 'address':
                validators = []
                break
            case 'contacts':
                validators = validateCompanyContacts
                break
        }

        Promise.all(validators.map(validator => validator.run(req)))
            .then(() => next())
            .catch(next)
    },

}


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
                        const teamIds = await user.fetch('jx.teams', { idsOnly: true })
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



/* Export */
export default router