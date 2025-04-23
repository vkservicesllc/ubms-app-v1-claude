const router = require('express').Router()

/* Settings */
import { permits } from '../../settings/carrier.mjs'

/* Tools */
import User, { superAdminUserOnly } from '../../tools/core/user.mjs'

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

router.post('/user', User.verify, UserMW.resetValidation, validateUser, validationCheck, UserMW.upsert)
router.post('/user/modify/condition', User.verify, [ UserForm.condition.validate() ], validationCheck, UserMW.modifyCondition)
router.post('/user/delete', User.verify, UserMW.delete)

router.post('/user/:_id/teams', User.verify, UserMW.updateTeams)
router.post('/user/:_id/roles', User.verify, UserMW.updateRoles)


/* User Role Resource */

const validateRole = []
const roleFields = ['roleName', 'roleLocation']
roleFields.map(prop => validateRole.push(RoleForm[prop].validate()))

router.post('/role/delete', User.verify, superAdminUserOnly, UserMW.deleteRole)
router.post('/role/:category?', User.verify, superAdminUserOnly, validateRole, UserMW.upsertRole)



/* Company Resource */

const validateCompany = []
const companyFields = ['catId', 'ein', 'duns', 'busName', 'coType', 'alias', 'website', 'since']
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

router.post('/company/add', User.verify, superAdminUserOnly, validateCompany, CompanyMW.add)
router.post('/company/:_id/modify', User.verify, superAdminUserOnly, validateCompany, CompanyMW.modify)
router.post('/company/:_id/update', User.verify, superAdminUserOnly, CompanyMW.update) //! unfinished
router.post('/company/:_id/delete', User.verify, superAdminUserOnly, CompanyMW.delete)
router.post('/company/:_id/confirm', User.verify, superAdminUserOnly, CompanyMW.confirm)

router.post('/company/:_id/ownership', User.verify, superAdminUserOnly, CompanyMW.upsertOwnership)
router.post('/company/:_id/ownership/update', User.verify, superAdminUserOnly, CompanyMW.updateOwnership) //! unfinished

router.post('/company/:_id/address', User.verify, superAdminUserOnly, validateCompanyAddress, CompanyMW.upsertAddress)
router.post('/company/:_id/address/:type/update', User.verify, superAdminUserOnly, CompanyMW.updateAddress) //! unfinished

router.post('/company/:_id/contacts', User.verify, superAdminUserOnly, validateCompanyContacts, CompanyMW.upsertContacts)
router.post('/company/:_id/contacts/:type/update', User.verify, superAdminUserOnly, CompanyMW.updateContact) //! unfinished

router.post('/company/:_id/teams', User.verify, superAdminUserOnly, CompanyMW.updateTeams)



/* Company Owner Resource */

const validateOwner = [], validateOwnerName = []
const ownerFields = ['firstName', 'middleName', 'lastName', 'suffix']
const ownerNameFields = [ ...ownerFields, 'nameSince' ]
ownerFields.push('gender', 'dob', 'ssn')
ownerFields.map(prop => validateOwner.push(OwnerForm[prop].validate()))
ownerNameFields.map(prop => validateOwner.push(OwnerForm[prop].validate()))

router.post('/company-owner', User.verify, superAdminUserOnly, validateOwner, CompanyMW.upsertOwner)
router.post('/company-owner/update', User.verify, superAdminUserOnly, validateOwnerName, CompanyMW.updateOwner)
router.post('/company-owner/delete', User.verify, superAdminUserOnly, CompanyMW.deleteOwner)
router.post('/company-owner/phone', User.verify, superAdminUserOnly, CompanyMW.upsertOwnerPhone) //! unfinished
router.post('/company-owner/phone/update', User.verify, superAdminUserOnly, CompanyMW.updateOwnerPhone) //! unfinished



/* Carrier Resource */

const validateCarrier = []
const carrierFields = ['mc', 'usdot', 'ifta', 'scac', 'irp', 'efs', 'fleetOne', 'transflo']
Object.keys(permits).forEach(prop => carrierFields.push(`${prop}Permit`))
carrierFields.map(prop => validateCarrier.push(CarrierForm[prop].validate()))

router.post('/carrier/:_companyId', User.verify, superAdminUserOnly, validateCarrier, CarrierMW.upsert)
router.post('/carrier/:_id/:target/update', User.verify, superAdminUserOnly) //! unfinished



/* Team Resource */

const validateTeam = []
const teamFields = ['teamName', 'category', 'desc']
teamFields.map(prop => validateTeam.push(TeamForm[prop].validate()))

const validateTeamProfile = []
const teamProfileFields = [
    'busName', 'coType', 'phone', 'email', 'website',
    'address1', 'address2', 'addrZip', 'addrCity', 'addrState',
]
teamProfileFields.map(prop => validateTeam.push(TeamForm[prop].validate()))

router.post('/team', User.verify, superAdminUserOnly, validateTeam, TeamMW.upsert)
router.post('/team/profile', User.verify, superAdminUserOnly, validateTeamProfile, TeamMW.upsertProfile)
router.post('/team/settings', User.verify, superAdminUserOnly, TeamMW.upsertSettings)
router.post('/team/delete', User.verify, superAdminUserOnly, TeamMW.delete) //! unused, deleted through api DELETE method



export default router