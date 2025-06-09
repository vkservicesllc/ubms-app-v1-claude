const router = require('express').Router()
const mysql = require('../tools/utils/mysql')
const throwErr = require('../tools/utils/error').api

/* Settings */
import db from '../settings/mysql.mjs'

/* Tools */
import Query from '../tools/utils/query.mjs'
import Company from '../tools/core/company.mjs'
import Driver, { Application as DriverApplication } from '../tools/core/driver.mjs'
import { capitalizeEach } from '../../client/global/modules/tools/utils/string.mjs'



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


router.post('/source/:source', (req, res) => {
    try {
        const { filter } = req.query
        const { source } = req.params
        let result

        switch(source) {

            case 'company':
                result = {
                    categories: Company.categoryList,
                    types: Company.typeList,
                }
                break

            case 'driver':
                result = {
                    positions: Driver.positionList,
                }
                break

            case 'driver-application':
                result = {
                    violations: DriverApplication.citationList,
                    accidents: DriverApplication.accidentList,
                }
                break

        }

        if (filter) result = result[filter]

        res.send(result)
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})



export default router