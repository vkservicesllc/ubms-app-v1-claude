const router = require('express').Router()

/* Assests */
import User, { superAdminUserOnly } from '../../assets/user.mjs'

/* Validators */
import validationCheck from '../../validators/default.mjs'
import { validateUser, validateCondition } from '../../validators/user.mjs'

/* Middleware */
import UserMV from './mw/user.mjs'



/* User Resource */

router.post('/user/upsert', User.verify, UserMV.devLock, validateUser, validationCheck, UserMV.upsert)

router.post('/user/update/condition', User.verify, [ validateCondition() ], validationCheck, UserMV.updateCondition)

router.post('/user/delete', User.verify, UserMV.delete)



export default router