const router = require('express').Router()

/* Tools */
import User from '../../tools/core/user.mjs'
import { permits } from '../../tools/core/carrier.mjs'

/* Validators */
import validationCheck from '../../tools/form/validator.mjs'
import UserForm, { RoleForm } from '../../tools/form/user.mjs'
import TeamForm from '../../tools/form/team.mjs'
import CompanyForm, { OwnerForm } from '../../tools/form/company.mjs'
import CarrierForm from '../../tools/form/carrier.mjs'

/* Middleware */
import UserMW from './mw/user.mjs'
import CompanyMW from './mw/company.mjs'
import CarrierMW from './mw/carrier.mjs'
import TeamMW from './mw/team.mjs'



/* User Resource */

const validateUser = []
const userFields = ['status', 'location', 'email', 'phone', 'firstName', 'lastName', 'alias', 'gender']
userFields.map(prop => validateUser.push(UserForm[prop].validate()))

router.post('/user', User.mw.verify, UserMW.resetValidation, validateUser, validationCheck, UserMW.upsert)
router.post('/user/modify/condition', User.mw.verify, [ UserForm.condition.validate() ], validationCheck, UserMW.modifyCondition)
router.post('/user/delete', User.mw.verify, UserMW.delete)
router.post('/user/reset', User.mw.verify, UserMW.reset)

router.post('/user/:_id/roles', User.mw.verify, UserMW.updateRoles)
router.post('/user/:_id/teams', User.mw.verify, UserMW.updateTeams)
router.post('/user/:_id/companies', User.mw.verify, UserMW.updateCompanies)


/* User Role Resource */

const validateRole = []
const roleFields = ['roleName', 'roleLocation']
roleFields.map(prop => validateRole.push(RoleForm[prop].validate()))

router.post('/role/delete', User.mw.verify, User.mw.superAdminOnly, UserMW.deleteRole)
router.post('/role/:category?', User.mw.verify, User.mw.superAdminOnly, validateRole, validationCheck, UserMW.upsertRole)



/* Company Resource */

const validateCompany = []
const companyFields = ['category', 'ein', 'duns', 'busName', 'coType', 'alias', 'website', 'since']
companyFields.map(prop => validateCompany.push(CompanyForm[prop].validate()))

const validateCompanyAddress = []
const companyAddressFields = [
    'address1', 'address2', 'addrZip', 'addrCity', 'addrState',
    'mailAddress1', 'mailAddress2', 'mailAddrZip', 'mailAddrCity', 'mailAddrState',
]
companyAddressFields.map(prop => validateCompanyAddress.push(CompanyForm[prop].validate()))

const validateCompanyContacts = []
const companyContactsFields = ['phone', 'fax', 'email']
companyContactsFields.map(prop => validateCompanyContacts.push(CompanyForm[prop].validate()))

router.post('/company/add', User.mw.verify, User.mw.superAdminOnly, validateCompany, validationCheck, CompanyMW.add)
router.post('/company/:_id/modify', User.mw.verify, User.mw.superAdminOnly, validateCompany, validationCheck, CompanyMW.modify)
router.post('/company/:_id/update', User.mw.verify, User.mw.superAdminOnly, CompanyMW.update) //! unfinished
router.post('/company/:_id/delete', User.mw.verify, User.mw.superAdminOnly, CompanyMW.delete)
router.post('/company/:_id/confirm', User.mw.verify, User.mw.superAdminOnly, CompanyMW.confirm)

router.post('/company/:_id/ownership', User.mw.verify, User.mw.superAdminOnly, CompanyMW.upsertOwnership)
router.post('/company/:_id/ownership/update', User.mw.verify, User.mw.superAdminOnly, CompanyMW.updateOwnership) //! unfinished

router.post('/company/:_id/address', User.mw.verify, User.mw.superAdminOnly, validateCompanyAddress, validationCheck, CompanyMW.upsertAddress)
router.post('/company/:_id/address/:type/update', User.mw.verify, User.mw.superAdminOnly, CompanyMW.updateAddress) //! unfinished

router.post('/company/:_id/contacts', User.mw.verify, User.mw.superAdminOnly, validateCompanyContacts, validationCheck, CompanyMW.upsertContacts)
router.post('/company/:_id/contacts/:type/update', User.mw.verify, User.mw.superAdminOnly, CompanyMW.updateContact) //! unfinished

// router.post('/company/:_id/teams', User.mw.verify, User.mw.superAdminOnly, CompanyMW.updateTeams)
router.post('/company/:_id/users', User.mw.verify, User.mw.superAdminOnly, CompanyMW.updateUsers)



/* Company Owner Resource */

const validateOwner = [], validateOwnerName = []
const ownerFields = ['firstName', 'middleName', 'lastName', 'suffix']
const ownerNameFields = [ ...ownerFields, 'nameSince' ]
ownerFields.push('gender', 'dob', 'ssn')
ownerFields.map(prop => validateOwner.push(OwnerForm[prop].validate()))
ownerNameFields.map(prop => validateOwnerName.push(OwnerForm[prop].validate()))

router.post('/company-owner', User.mw.verify, User.mw.superAdminOnly, validateOwner, validationCheck, CompanyMW.upsertOwner)
router.post('/company-owner/update', User.mw.verify, User.mw.superAdminOnly, validateOwnerName, validationCheck, CompanyMW.updateOwner)
router.post('/company-owner/delete', User.mw.verify, User.mw.superAdminOnly, CompanyMW.deleteOwner)
router.post('/company-owner/phone', User.mw.verify, User.mw.superAdminOnly, CompanyMW.upsertOwnerPhone) //! unfinished
router.post('/company-owner/phone/update', User.mw.verify, User.mw.superAdminOnly, CompanyMW.updateOwnerPhone) //! unfinished



/* Carrier Resource */

const validateCarrier = []
const carrierFields = ['mc', 'usdot', 'ifta', 'scac', 'irp', 'efs', 'fleetOne', 'transflo']
Object.keys(permits).forEach(prop => carrierFields.push(`${prop}Permit`))
carrierFields.map(prop => validateCarrier.push(CarrierForm[prop].validate()))

router.post('/carrier/:_companyId', User.mw.verify, User.mw.superAdminOnly, validateCarrier, validationCheck, CarrierMW.upsert)
router.post('/carrier/:_id/:target/update', User.mw.verify, User.mw.superAdminOnly) //! unfinished



/* Team Resource */

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

router.post('/team', User.mw.verify, User.mw.superAdminOnly, validateTeam, validationCheck, TeamMW.upsert)
router.post('/team/profile', User.mw.verify, User.mw.superAdminOnly, validateTeamProfile, validationCheck, TeamMW.upsertProfile)
router.post('/team/settings', User.mw.verify, User.mw.superAdminOnly, TeamMW.upsertSettings)
router.post('/team/delete', User.mw.verify, User.mw.superAdminOnly, TeamMW.delete) //! unused, deleted through api DELETE method



export default router