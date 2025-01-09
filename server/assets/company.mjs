require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_EIN, DB__MYSQL_AES_SSN } = process.env
const secret = {
    ein: DB__MYSQL_AES_EIN,
    ssn: DB__MYSQL_AES_SSN,
}

/* Settings */
import db from '../settings/mysql.mjs'

/* Assets */
import Person from '../../client/global/modules/assets/person.mjs'

/* Tools */
import { reSuper } from '../../client/global/modules/tools/object.mjs'
import Query, { hash, matchHash } from '../tools/query.mjs'

const mysql = require('../tools/mysql')
const { body } = require('express-validator')
const throwErr = require('../tools/error').data


const { sqlMode } = Query
const query = {
    companies: new Query(db.business, 'companies'),
    names: new Query(db.business, 'company_names'),
    owners: new Query(db.business, 'company_owners'),  // * 2
    ownerships: new Query(db.business, 'company_ownerships'),
    addresses: new Query(db.business, 'company_addresses'),  // * 4
    mail: new Query(db.business, 'company_mail'),  // * 5
    phones: new Query(db.business, 'company_phones'),
    faxes: new Query(db.business, 'company_faxes'),
    emails: new Query(db.business, 'company_emails'),
    teams: new Query(db.business, 'teams_companies'),  // * 9
}
const targets = Object.keys(query)



class Company {
    constructor(data = {}, light = false) {}
}



class Owner extends Person {
    constructor(data = {}, light = false) {}
}



export default Company
export { Owner }