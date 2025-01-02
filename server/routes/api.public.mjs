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


router.post('/find/:env', async (req, res) => {
    try{
        const response = { found: false }
        const { env } = req.params
        const match = req.body
        let searchDb, table

        switch (env) {
            case 'user':
                const { auth: _id } = req.query
                const user = await User.data(res.session, { _id })
                if (!user) return res.status(401).send({ error: 'Request Error: Invalid requester'})
                searchDb = db.online
                table = 'users'
                break
        }

        const [ rows ] = await mysql.execute(
            new Query(searchDb, table).select('*', { match })
        )
        if (rows.length) response.found = true

        res.send(response)
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})



export default router