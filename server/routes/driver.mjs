const router = require('express').Router()
const throwErr = require('../tools/error').data

/* Assets */
import Team from '../assets/team.mjs'

/* Tools */
import { respond404 } from '../tools/response.mjs'
import { capitalizeEach } from '../../client/global/modules/tools/string.mjs'



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



router.get('/application/:companyRoute?', async (req, res) => {
    try {
        const { env } = req.query
        const team = await Team.data({ ...res.session, user: true }, { _id: env })
        if (!team) return respond404(res)

        const { companyRoute } = req.params
        console.log({ companyRoute })

        const key = 'application'
        let { hbs } = res
        hbs = hbs.set(key, { title: 'Driver Application' })

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
})



export default router