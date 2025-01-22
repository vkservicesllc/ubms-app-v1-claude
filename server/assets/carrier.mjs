/* Settings */
import db from '../settings/mysql.mjs'

/* Assets */
import Company from './company.mjs'

/* Tools */
import Query, { hash, matchHash }  from '../tools/query.mjs'
import { reSuper } from '../../client/global/modules/tools/object.mjs'
import { utcTimeStamp } from '../tools/date.mjs'
import { processData } from '../tools/database.mjs'
import { validateNumberId, validateStateUS } from '../validators/default.mjs'

/* Registry */
import inputLength from '../../client/global/modules/registry/length.mjs'

const mysql = require('../tools/mysql')


const query = {
    carriers: new Query(db.carrier, 'carriers'),
    ifta: new Query(db.carrier, 'carrier_ifta'),
}
const targets = Object.keys(query)



class Carrier extends Company {
    constructor(data = {}, light = false) {}
}


delete Carrier.create
delete Carrier.batch
delete Carrier.find

delete Carrier.record
delete Carrier.ownership
delete Carrier.address
delete Carrier.contacts


export default Carrier