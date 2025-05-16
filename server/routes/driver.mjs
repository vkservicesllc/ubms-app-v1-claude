const router = require('express').Router()
const throwErr = require('../tools/utils/error').data

/* Tools */
import { capitalizeEach } from '../../client/global/modules/tools/utils/string.mjs'

/* Middleware */
import { applicationStart, applicationLogin, applicationProgress } from './driver/mw/application.mjs'



router.use((req, res, next) => {
    res.hbs.set = function(key, params = {}) {
        let { inclKey, title } = params

        const includer = require('../includes/src')
        const includes = require('../includes/driver')

        const hbs = { ...this }
        
        if (!inclKey) inclKey = key
        if (!title) title = `${capitalizeEach(key.replace(/\./g, ' '))} - ${hbs.title}`

        hbs.title = title
        hbs.includes = includer.render(includes[inclKey])

        return hbs
    }

    next()
})


router.get('/application/:param?', applicationStart, applicationLogin, applicationProgress)



export default router