const router = require('express').Router()

/* Assests */
import User, { superAdminUserOnly } from '../../assets/user.mjs'

/* Validators */
import validationCheck from '../../validators/default.mjs'
import { validateUser, validateCondition } from '../../validators/user.mjs'

/* Middleware */
import UserMV from './mw/user.mjs'
import CompanyMV from './mw/company.mjs'



/* User Resource */

router.post('/user', User.verify, UserMV.devLock, validateUser, validationCheck, UserMV.upsert)
router.post('/user/modify/condition', User.verify, [ validateCondition() ], validationCheck, UserMV.modifyCondition)
router.post('/user/delete', User.verify, UserMV.delete)



/* Company Resource */

router.post('/company/add', User.verify, superAdminUserOnly, CompanyMV.add)
router.post('/company/:_companyId/modify', User.verify, superAdminUserOnly, CompanyMV.modify)
router.post('/company/:_companyId/update', User.verify, superAdminUserOnly, CompanyMV.update)
router.post('/company/:_companyId/delete', User.verify, superAdminUserOnly, CompanyMV.delete)

router.post('/company/owner', User.verify, superAdminUserOnly, CompanyMV.upsertOwner)
router.post('/company/owner/update', User.verify, superAdminUserOnly, CompanyMV.updateOwner)
router.post('/company/owner/delete', User.verify, superAdminUserOnly, CompanyMV.deleteOwner)

router.post('/company/:_companyId/ownership', User.verify, superAdminUserOnly, CompanyMV.upsertOwnership)
router.post('/company/:_companyId/ownership/update', User.verify, superAdminUserOnly, CompanyMV.updateOwnership)

router.post('/company/:_companyId/address', User.verify, superAdminUserOnly, CompanyMV.upsertAddress)
router.post('/company/:_companyId/address/:type/update', User.verify, superAdminUserOnly, CompanyMV.updateAddress)

router.post('/company/:_companyId/contacts', User.verify, superAdminUserOnly, CompanyMV.upsertContacts)
router.post('/company/:_companyId/:contactType/update', User.verify, superAdminUserOnly, CompanyMV.updateContact)



export default router