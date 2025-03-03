const router = require('express').Router()
const throwErr = require('../../tools/error').api

/* Assets */
import User from '../../assets/user.mjs'
import Driver, { Application } from '../../assets/driver.mjs'



router.post('/drivers/applications', User.verify, Application.dtList)



export default router