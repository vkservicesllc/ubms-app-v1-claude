const router = require('express').Router()

/* Assests */
import User, { superAdminUserOnly } from '../../assets/user.mjs'

/* Validators */
import validationCheck from '../../validators/default.mjs'
import { validateUser, validateCondition } from '../../validators/user.mjs'
import { validateCompany, validateCompanyOwner, validateCompanyOwnerUpdate, validateCompanyAddress, validateCompanyContacts } from '../../validators/company.mjs'
import { validateCarrier } from '../../validators/carrier.mjs'
import { validateTeam } from '../../validators/team.mjs'

/* Middleware */
import UserMW from './mw/user.mjs'
import CompanyMW from './mw/company.mjs'
import CarrierMW from './mw/carrier.mjs'
import TeamMW from './mw/team.mjs'



/* User Resource */

router.post('/user', User.verify, UserMW.devLock, validateUser, validationCheck, UserMW.upsert)
router.post('/user/modify/condition', User.verify, [ validateCondition() ], validationCheck, UserMW.modifyCondition)
router.post('/user/delete', User.verify, UserMW.delete)



/* Company Resource */

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

router.post('/company-owner', User.verify, superAdminUserOnly, validateCompanyOwner, CompanyMW.upsertOwner)
router.post('/company-owner/update', User.verify, superAdminUserOnly, validateCompanyOwnerUpdate, CompanyMW.updateOwner)
router.post('/company-owner/delete', User.verify, superAdminUserOnly, CompanyMW.deleteOwner)
router.post('/company-owner/phone', User.verify, superAdminUserOnly, CompanyMW.upsertOwnerPhone) //! unfinished
router.post('/company-owner/phone/update', User.verify, superAdminUserOnly, CompanyMW.updateOwnerPhone) //! unfinished

router.post('/carrier/:_companyId', User.verify, superAdminUserOnly, validateCarrier, CarrierMW.upsert)
router.post('/carrier/:_id/:target/update', User.verify, superAdminUserOnly) //! unfinished



/* Company Resource */
router.post('/team', User.verify, superAdminUserOnly, validateTeam, TeamMW.upsert)
router.post('/team/delete', User.verify, superAdminUserOnly)



export default router