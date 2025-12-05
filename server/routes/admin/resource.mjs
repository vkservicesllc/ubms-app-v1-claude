// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import User, { Role } from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Company, { Owner } from '../../tools/core/company.mjs'
import Carrier from '../../tools/core/carrier.mjs'

/* Validators */
import validationCheck from '../../tools/form/validator.mjs'
import UserForm, { RoleForm } from '../../tools/form/user.mjs'
import TeamForm from '../../tools/form/team.mjs'
import CompanyForm, { OwnerForm } from '../../tools/form/company.mjs'
import CarrierForm from '../../tools/form/carrier.mjs'


// ==== SETUP ==== //


const validateUser = []
const userFields = ['status', 'location', 'email', 'phone', 'firstName', 'lastName', 'alias', 'gender']
userFields.map(prop => validateUser.push(UserForm[prop].validate()))

const validateRole = []
const roleFields = ['roleName', 'roleLocation']
roleFields.map(prop => validateRole.push(RoleForm[prop].validate()))


const validateTeam = []
const teamFields = ['teamName',
    //'category',
'desc']
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

const validateCarrier = []
const carrierFields = ['mc', 'usdot', 'ifta', 'scac', 'irp', 'efs', 'fleetOne', 'transflo']
Object.keys(Carrier.list.permit).forEach(prop => carrierFields.push(`${prop}Permit`))
carrierFields.map(prop => validateCarrier.push(CarrierForm[prop].validate()))

const dynamicValidator = {
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
                validators = []
                break
        }

        Promise.all(validators.map(validator => validator.run(req)))
            .then(() => next())
            .catch(next)
    },
}


const source = {
    'user': [ User, '/online/users' ],
    'role': [ Role, '/online/users' ],
    'team': [ Team, '/online/teams' ],
    'company': [ Company, '/business/companies', '/business/company/' ],
    'company-owner': [ Owner, '/business/company-owners' ],

    ext(src, inst) {
        let ext = ''

        switch (src) {
            case 'role':
                ext = `?role=${inst.category || 'def'}`
                break
        }

        return ext
    },

}



// ==== INSERT/UPDATE ROUTES ==== //


router.post('/insert/company', User.mw.verify, User.mw.superAdminOnly, validateCompany, validationCheck, async (req, res) => {
    try {
        delete req.body._match

        const { data: company } = await Company.create(res.session, req.body)
        if (!company) throw new Error('Failed to register company')

        res.redirect(source.company[2] + company._id)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



router.post('/upsert/user', User.mw.verify, async (req, res, next) => {
    const { user: sessionUser } = res.session
    const { status, location, firstName, alias } = req.body

    switch (true) {
        case status === 'D' && sessionStatus !== 'D':
        case status === 'S' && !sessionUser.DS:
            throw new Error('Illegal User Status')
            break
        case sessionUser.location !== 'US' && location !== sessionUser.location:
            throw new Error('Illegal User Location')
            break
        case firstName === alias:
            throw new Error('Illegal User Alias')
            break
    }

    if ((status === 'D' || status === 'S') && location !== 'US') req.body.location = 'US'
    if (location !== 'US') delete req.body.phone

    next()
}, validateUser, validationCheck, async (req, res) => {
    try {
        const { _id } = req.body
        delete req.body._id

        if (_id) {
            const user = await User.fetch(res.session, { _id }, { hideEvents: false })
            if (!user) throw new Error('User not found')

            if (user.DS) {
                if (user.status === 'D') req.body.status = 'D'
                req.body.location = 'US'
            } else if (!req.body.location) req.body.location = user.location

            await user.update(req.body)
            return res.redirect(source.user[1])
        }
        
        const { data: user } = await User.create(res.session, req.body)

        res.redirect(`/online/user/${user._id}`)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/upsert/role', User.mw.verify, User.mw.superAdminOnly, validateRole, validationCheck, async (req, res) => {
    try {
        let role
        const { _id } = req.body
        delete req.body._id

        if (_id) {
            role = await Role.fetch(res.session, { _id })
            if (!role) throw new Error('Role not found')

            await role.update(req.body)
        } else {
            let { category = null } = req.query

            if (category) category = Company.list.category.key(category)
            req.body.category = category

            role = (await Role.create(res.session, req.body)).data
        }

        res.redirect(source.user[1] + source.ext('role', role))
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/upsert/team', User.mw.verify, User.mw.superAdminOnly, validateTeam, validationCheck, async (req, res) => {
    try {
        let team
        const { _id } = req.body
        delete req.body._id

        if (_id) {
            team = await Team.fetch(res.session, { _id })
            if (!team) throw new Error('Team not found')

            await team.update(req.body)
        } else team = (await Team.create(res.session, req.body)).data

        res.redirect(source.team[1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/upsert/company-owner', User.mw.verify, User.mw.superAdminOnly, validateOwner, validationCheck, async (req, res) => {
    try {
        const { company: _companyId } = req.query
        const { _id } = req.body
        delete req.body._id

        if (!_id) {
            const { data: owner } = await Owner.create(res.session, req.body)
            if (!owner) throw new Error('Failed to create owner')

            if (_companyId) {
                const company = await Company.fetch(res.session, { _id: _companyId })
                if (!company) throw new Error('Company not found')

                const { since = company.since } = req.query

                await company.delete('ownership', { since })
                await company.add('ownership', { ownerId: owner.id, since })
            }
        } else {
            const owner = await Owner.fetch(res.session, { _id })
            await owner.update(req.body)
        }

        res.redirect(_companyId ? source.company[2] + _companyId : source['company-owner'][2])
    } catch (err) {
        sendError.server(req, res, err)
    }
})



router.post('/update/user/condition', User.mw.verify, [ UserForm.condition.validate() ], validationCheck, async (req, res) => {
    try {
        const { _id } = req.body
        const user = await User.fetch(res.session, { _id })
        if (!user) throw new Error('User not found')

        let { condition } = req.body
        if (condition === 'L') condition = 'I'

        await user.update({ condition })

        res.redirect(source.user[1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/update/team/profile', User.mw.verify, User.mw.superAdminOnly, validateTeamProfile, validationCheck, async (req, res) => {
    try {
        const { _id } = req.body
        delete req.body._id

        const team = await Team.fetch(res.session, { _id })
        if (!team) throw new Error('Team not found')

        await team[team.profile ? 'update' : 'add']('profile', req.body)

        res.redirect(source.team[1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/update/team/settings', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { _id, settings } = req.body
        delete req.body._id

        const team = await Team.fetch(res.session, { _id })
        if (!team) throw new Error('Team not found')

        await team.settings(req.body)

        res.redirect(source.team[1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/update/company/:_id', User.mw.verify, User.mw.superAdminOnly, validateCompany, validationCheck, async (req, res) => {
    try {
        const { _id } = req.params
        const company = await Company.fetch(res.session, { _id }, { hideSensitive: false })
        if (!company) throw new Error('Company not found')

        const { since, ein, duns, busName, coType, alias, website, _match: match } = req.body

        await company.update({ since, ein, duns, website })
        await company.update('name', { since, busName, coType, alias }, match)

        res.redirect(source .company[2] + company._id)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/update/company/:_id/:action/:step', User.mw.verify, User.mw.superAdminOnly, dynamicValidator.companies, validationCheck, async (req, res) => {
    try {
        const { _id, action, step } = req.params
        const company = await Company.fetch(res.session, { _id })
        if (!company) throw new Error('Company not found')

        const { _match: match } = req.body
        delete req.body._match

        switch (step) {

            case 'ownership':
                const { _ownerId: _id, since = company.since } = req.body
                const owner = await Owner.fetch(res.session, { _id })
                if (!owner) throw new Error('Company owner not found')

                const ownerId = owner.id

                if (action === 'update') await company.delete(step, match)
                await company.add(step, { ownerId, since })
                break

            case 'address':
                if (action === 'add') {
                    // add physical addr
                    // add mail addr if supplied
                } else {
                    // update physical addr
                    // add/delete or update mail addr
                }
                break

            case 'contacts':
                if (action === 'add') {
                    // add phone
                    // add fax if supplied
                    // add email if supplied
                } else {
                    // update phone
                    // add/update/delete fax
                    // add/update/delete email
                }
                break

        }

        res.redirect(source .company[2] + company._id)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/update/company-owner/add/name', User.mw.verify, User.mw.superAdminOnly, validateOwnerName, validationCheck, async (req, res) => {
    try {
        const { company: _companyId } = req.query
        const { _id } = req.body
        delete req.body._id

        const owner = await Owner.fetch(res.session, { _id })
        if (!owner) throw new Error('Owner not found')

        await owner.add('name', req.body)

        res.redirect(_companyId ? source.company[2] + _companyId : source['company-owner'][2])
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== DELETE ROUTES ==== //


router.post('/delete/:src/:_id?', User.mw.verify, async (req, res) => {
    try {
        const { src } = req.params
        if (src !== 'user' && res.session.user.status === 'A')
            throw new Error('Access to this path is granted to Super Admin only<br><a href="/">Home</a>')

        let { _id } = req.params
        if (!_id) ({ _id } = req.body)
        if (!_id) throw new Error('Identifier not supplied')

        const [ Src, redirUrl ] = source[src]

        const inst = await Src.fetch(res.session, { _id })
        if (!inst) throw new Error(`${Src.name} not found`)

        await inst.delete()

        res.redirect(redirUrl + source.ext(src, inst))
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== JX ROUTES ==== //


router.post('/jx/:src/:_id/:action/:target', User.mw.verify, async (req, res) => {
    try {
        const { src, _id, action, target } = req.params
        if (src !== 'user' && res.session.user.status === 'A')
            throw new Error('Access to this path is granted to Super Admin only<br><a href="/">Home</a>')

        let { _ids } = req.body
        if (!Array.isArray(_ids)) _ids = [ _ids ]
        const [ Src, redirUrl ] = source[src]

        const inst = await Src.fetch(res.session, { _id })
        if (!inst) throw new Error(`${Src.name} not found`)

        await inst[action](`jx.${target}`, _ids)

        res.redirect(req.get('referer') || redirUrl)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== MISC ROUTES ==== //


router.post('/reset/user', User.mw.verify, async (req, res) => {
    try {
        const { _id } = req.body
    
        const user = await User.fetch(res.session, { _id })
        if (!user) throw new Error('User not found')

        await user.reset()

        res.redirect(source.user[1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router