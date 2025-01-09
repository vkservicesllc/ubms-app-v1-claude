const router = require('express').Router()
const mysql = require('../tools/mysql')
const throwErr = require('../tools/error').api

/* Settings */
import db from '../settings/mysql.mjs'

/* Assests */
import User from '../assets/user.mjs'

/* Tools */
import Query from '../tools/query.mjs'
import { capitalizeEach } from '../../client/global/modules/tools/string.mjs'



router.get('/us-zips/:zip', async (req, res) => {
    try {
        const { zip } = req.params
        const [ rows ] = await mysql.execute(new Query(db.public, 'us_zips').select('*', { match: { zip } }))

        if (rows.length)
            rows[0].data.city = capitalizeEach(rows[0].data.city, true)

        res.send(rows[0] || {})
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})



export default router