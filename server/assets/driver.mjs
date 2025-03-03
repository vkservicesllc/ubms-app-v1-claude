/* Settings */
import db from '../settings/mysql.mjs'

/* Assests */
import Individual from './individual.mjs'
import Carrier from './carrier.mjs'
import Team from './team.mjs'

/* Tools */
import { reSuper } from '../../client/global/modules/tools/object.mjs'
import Query, { hash, matchHash } from '../tools/query.mjs'

const dtQuery = require('datatables-query')
const mysql = require('../tools/mysql')
const throwErr = require('../tools/error').api



class Driver extends Individual {
    constructor(data = {}, light = false) {}
}



class Application {
    constructor(data = {}, light = false) {
        this._id = data._id
        this._carrierId = data._carrierId
        this._teamId = data._teamId
        this.formId = data.formId
        this.appliedOn = data.appliedOn
        this.firstName = data.firstName
        this.middleName = data.middleName
        this.lastName = data.lastName
        this.suffix = data.suffix
        this.dob = data.dob
        this.email = data.email
        this.phone = data.phone
        this.emPhone = data.emPhone
        this.emName = data.emName
        this.legal = data.legal
        this.legStatus = data.legStatus
    }


    static #algorithm = 'SHA-224'

    static hashId = (field = 'id') => hash(field, Application.#algorithm)

    static matchIdHash = value => matchHash(value, Application.#algorithm)


    static dtList = async (req, res) => { //* Datatables Server Side API
        try {
            let table = 'app_carrier.applications apl'
            //* attach ' JOIN app_carrier.application_addresses adr on apl.id = adr.aplId'
            //! make it select only the latest address

            const query = dtQuery(mysql, table, [
                Application.hashId(),
                Carrier.hashId('carrierId'),
                Team.hashId('teamId'),
                'formId',
                'appliedOn',
                'firstName',
                'middleName',
                'lastName',
                'suffix',
                'dob',
                'email',
                'phone',
            ])

            const { sql, params } = dtQuery.createQuery(req.body)
            const [ rows ] = await mysql.execute(sql, params)
            const result = {
                draw: req.body.draw,
                recordsTotal: rows.length,
                recordsFiltered: rows.length,
                data: rows
            }
console.log(result)
            res.json(result)
        } catch(err) {
            throwErr.server(res, null, err, false)
        }
    }


}



class User {
    constructor() {}
}



export default Driver
export { Application, User }