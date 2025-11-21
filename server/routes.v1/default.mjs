const router = require('express').Router()
const sendError = require('../tools/utils/error')

/* Tools */
import User from '../tools/core/user.mjs'
import { capitalizeEach } from '../../client/global/modules/tools/utils/string.mjs'

import { apps } from '../../config.mjs'



router.use((req, res, next) => {
    res.hbs.set = function(key, params = {}) {
        let { inclKey, navKey, titlePfx, title } = params

        const includer = require('../includes/src')
        const includes = require('../includes/default')

        const hbs = { ...this }

        if (!inclKey) inclKey = key
        if (!titlePfx) titlePfx = capitalizeEach(key.replace(/\-/g, ' '))

        hbs.title = title || `${titlePfx} - ${hbs.title}`
        hbs.includes = includer.render(includes[inclKey])

        return hbs
    }

    next()
})


router.get('/', (req, res) => {
    //! Not a login page yet

    try {
        const key = 'login'
        let { hbs } = res
        const { title } = hbs
        hbs = hbs.set(key, { title })

        hbs.bodyAttrs = ' class="grey lighten-4"'

        hbs.apps = {
            carrier: {
                name: apps.carrier.name,
                address: apps.carrier.address,
            },
            driver: {
                name: apps.driver.name,
                address: apps.driver.address,
            },
        }

        hbs.refreshToUrl = apps.carrier.address

        res.render(key, hbs)
    } catch (err) {
        sendError.server(res, err)
    }
})



export default router