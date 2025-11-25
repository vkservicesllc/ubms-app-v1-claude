// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import User from '../../tools/core/user.mjs'
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


const url = {
    users: '/online/users',
}



// ==== ROUTES ==== //


router.post('/add/user', User.mw.verify, validateUser, validationCheck, async (req, res) => {
    try {
        const { created, user } = await User.create(res.session, req.body)

        res.redirect(url.users)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router