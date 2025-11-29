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


const source = {
    'user': [ User, '/online/users' ],
    'role': [ Role, '/online/users' ],
    'team': [ Team, '/online/teams' ],
    'company': [ Company, '/business/companies' ],
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
            const user = await User.fetch(res.session, { _id })
            if (!user) throw new Error('User not found')

            if (user.DS) {
                if (user.status === 'D') req.body.status = 'D'
                req.body.location = 'US'
            } else if (!req.body.location) req.body.location = user.location

            await user.update(req.body)
        } else await User.create(res.session, req.body)

        res.redirect(source.user[1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})



router.post('/upsert/role', User.mw.verify, User.mw.superAdminOnly, validateRole, validationCheck, async (req, res) => {
    try {
        const { _id } = req.body
        delete req.body._id

        let role

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



// ==== DELETE ROUTES ==== //


router.post('/delete/:src', User.mw.verify, async (req, res) => {
    try {
        const { src } = req.params
        if (src !== 'user' && res.session.user.status === 'A')
            throw new Error('Access to this path is granted to Super Admin only<br><a href="/">Home</a>')

        const { _id } = req.body
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