const router = require('express').Router()

/* Assests */
import User, { superAdminUserOnly } from '../../assets/user.mjs'

/* Validators */
import validationCheck from '../../validators/default.mjs'
import { validateUser, validateCondition } from '../../validators/user.mjs'
import { validateCompany, validateCompanyOwner, validateCompanyOwnerUpdate, validateCompanyAddress, validateCompanyContacts } from '../../validators/company.mjs'

/* Middleware */
import UserMV from './mw/user.mjs'
import CompanyMV from './mw/company.mjs'



/* User Resource */

router.post('/user', User.verify, UserMV.devLock, validateUser, validationCheck, UserMV.upsert)
router.post('/user/modify/condition', User.verify, [ validateCondition() ], validationCheck, UserMV.modifyCondition)
router.post('/user/delete', User.verify, UserMV.delete)



/* Company Resource */

router.post('/company/add', User.verify, superAdminUserOnly, validateCompany, CompanyMV.add)
router.post('/company/:_id/modify', User.verify, superAdminUserOnly, validateCompany, CompanyMV.modify)
router.post('/company/:_id/update', User.verify, superAdminUserOnly, CompanyMV.update) //! unfinished
router.post('/company/:_id/delete', User.verify, superAdminUserOnly, CompanyMV.delete)

router.post('/company/:_id/ownership', User.verify, superAdminUserOnly, CompanyMV.upsertOwnership)
router.post('/company/:_id/ownership/update', User.verify, superAdminUserOnly, CompanyMV.updateOwnership) //! unfinished

router.post('/company/:_id/address', User.verify, superAdminUserOnly, CompanyMV.upsertAddress)
router.post('/company/:_id/address/:type/update', User.verify, superAdminUserOnly, CompanyMV.updateAddress) //! unfinished

router.post('/company/:_id/contacts', User.verify, superAdminUserOnly, CompanyMV.upsertContacts)
router.post('/company/:_id/:contactType/update', User.verify, superAdminUserOnly, CompanyMV.updateContact) //! unfinished

router.post('/company-owner', User.verify, superAdminUserOnly, validateCompanyOwner, CompanyMV.upsertOwner)
router.post('/company-owner/update', User.verify, superAdminUserOnly, validateCompanyOwnerUpdate, CompanyMV.updateOwner)
router.post('/company-owner/delete', User.verify, superAdminUserOnly, CompanyMV.deleteOwner)



export default router