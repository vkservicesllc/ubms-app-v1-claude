const router = require('express').Router()
const mysql = require('../tools/utils/mysql')
const sendError = require('../tools/utils/error')

/* Settings */
import db from '../settings/mysql.mjs'

/* Tools */
import Query from '../tools/utils/query.mjs'
import Company from '../tools/core/company.mjs'
import Driver, { Application as DriverApplication, Citation, Accident } from '../tools/core/driver.mjs'
import { capitalizeEach } from '../../client/global/modules/tools/utils/string.mjs'



router.get('/us-zips/:zip', async (req, res) => {
    try {
        const { zip } = req.params
        const [ rows ] = await mysql.execute(new Query(db.public, 'us_zips').select('*', { match: { zip } }))

        if (rows.length)
            rows[0].data.city = capitalizeEach(rows[0].data.city, true)

        res.send(rows[0] || {})
    } catch (err) {
        sendError.server(res, err, true)
    }
})


router.post('/source/:source', (req, res) => {
    try {
        const { filter } = req.query
        const { source } = req.params
        let result

        switch(source) {

            case 'company':
                result = {
                    categories: Company.list.category,
                    types: Company.list.type,
                }
                break

            case 'driver':
                result = {
                    positions: Driver.list.position,
                }
                break

            case 'driver-application':
                result = {
                    violations: Citation.list.violation,
                    accidents: Accident.list.collision,
                }
                break

        }

        if (filter) result = result[filter]

        res.send(result)
    } catch (err) {
        sendError.server(res, err, true)
    }
})



export default router