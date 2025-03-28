require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_SSN } = process.env
const ssnSecret = DB__MYSQL_AES_SSN

/* Settings */
import { addrBook } from '../../config.mjs'
import db from '../settings/mysql.mjs'

/* Assests */
import Person from '../../client/global/modules/assets/person.mjs'
import Individual from './individual.mjs'
import Team from './team.mjs'
import User, { sessionError } from './user.mjs'
import Company from './company.mjs'
import Carrier from './carrier.mjs'

/* Tools */
import Query, { hash, matchHash } from '../tools/query.mjs'
import transporter, { senderParams } from '../tools/nodemailer.mjs'
import { processData, logDeletion } from '../tools/database.mjs'
import { generateRandomString } from '../tools/string.mjs'
import { stringifyBuffer } from '../../client/global/modules/tools/buffer.mjs'
import { reSuper } from '../../client/global/modules/tools/object.mjs'
import { sortArrayByObjectKey } from '../../client/global/modules/tools/sorter.mjs'

const moment = require('moment')
const mysql = require('../tools/mysql')
const knex = require('../tools/knex')
const throwErr = require('../tools/error')

const query = {
    drivers: new Query(db.carrier, 'drivers'),
    applications: new Query(db.carrier, 'applications'),
}



class Driver extends Individual {
    constructor(data = {}, light = false) {}


    static positionList = {
        'CD': 'Company Driver',
        'OO': 'Owner Operator',
        'OD': 'Driver for Owner',
        'LP': 'Lease Purchaser',
    }


}



class Application {
    constructor(data = {}) {
        const { firstName, middleName, lastName, suffix } = data

        this._id = data._id
        this._teamId = data._teamId
        this._userId = data._userId
        this._carrierId = data._carrierId
        this.formId = data.formId
        this.appliedOn = data.appliedOn
        this.position = data.position
            ? [ data.position, Driver.positionList[data.position] ]
            : null
        this.condition = data.condition
        this.step = data.step
        this.firstName = firstName
        this.middleName = middleName
        this.lastName = lastName
        this.suffix = suffix
        this.fullName = new Person({ firstName, middleName, lastName, suffix }).fullName()
        this.dob = data.dob
        this.ssn = stringifyBuffer(data.ssn)
        this.email = data.email
        this.phone = data.phone
        this.emPhone = data.emPhone
        this.emName = data.emName
        this.legalStatus = [ data.legalStatus, data.LS_expiresOn ]
        this.team = {
            name: data.teamName,
        }

        if (data.userLastName) {
            const {
                userFirstName: firstName,
                userLastName: lastName,
                userAlias: alias,
            } = data
            const person = new Person({ firstName, lastName, alias })

            this.user = {
                firstName,
                lastName,
                alias,
                name: person.fullName('AL'),
                shortName: person.fullName('Al'),
                fullName: person.fullName('FAL'),
                location: data.userLocation,
                condition: data.userCondition,
                deleted: !!data.userDeletedAt,
            }
        }

        if (data.busName) {
            this.carrier = {
                busName: data.busName,
                coType: data.coType,
                alias: data.companyAlias,
                name: `${data.busName}, ${data.coType}`,
            }
        }
    }


    id = async () => (await mysql.execute(query.applications.select('id', {
        match: { id: Application.matchIdHash(this._id) },
    })))[0][0].id


    log = async field => {
        const fields = [ 'createdBy', 'createdAt', 'createdIn', 'updateLog' ]

        let log = (await mysql.execute(query.applications.select(fields, {
            match: { id: Application.matchIdHash(this._id) },
        })))[0][0]

        if (fields.includes(field)) log = log[field]

        return log
    }


    delete = async session => {
        let deleted = false,
            error = sessionError(session, { branches: [ 'carrier' ] })

        if (!error && !['p', 'c'].includes(this.condition)) error = 'Permission Error: Application Locked'
        if (error) return { deleted, error }

        const id = await this.id()
        const teamId = await (await Team.data(session, { _id: this._teamId })).id()
        const carrierId = this._carrierId
            ? await (await Carrier.data(session, { _id: this._carrierId } )).id()
            : null
        const userId = this._userId
            ? await (await User.data(session, { _id: this._userId } )).id()
            : null
        const log = await this.log()

        try {
            const [ result ] = await mysql.execute(query.applications.delete({ id }))
            if (result.affectedRows > 0) deleted = true
        } catch(err) {
            console.error(err)
            error = 'DB Error'
        }

        if (error) return { deleted, error }

        for (const prop in log) this[prop] = log[prop]

        if (this.user) this.user = this.user.name
        if (this.carrier) this.carrier = `${this.carrier.name} (${this.carrier.alias})`

        await logDeletion(session, 'applications', this, { id, teamId, carrierId, userId })

        return { deleted }
    }


    static #algorithm = 'SHA-224'

    static hashId = (field = 'id') => hash(field, Application.#algorithm)

    static matchIdHash = value => matchHash(value, Application.#algorithm)


    static invite = async (session, email, options = {}) => {
        //
    }

    
    static create = async (session, data) => {
        if (!session.team) return

        let created = false

        const { branch, siteId, user, team } = session
        const createdIn = { branch }
        if (siteId) data.siteId = siteId

        const { selfAssign } = data
        delete data.selfAssign

        data = processData(data)
        data.ssn = { aes: [ data.ssn, ssnSecret ] }
        data.appliedOn = moment().format('YYYY-MM-DD')
        data.step = 'driver-license'
        data.teamId = await team.id()
        if (user) {
            data.createdBy = await user.id()
            if (selfAssign) data.userId = data.createdBy
        }
        data.createdIn = JSON.stringify(createdIn)

        let found = true
        do {
            const formId = generateRandomString(12, 'ud')
            const apl = await Application.data(session, { formId })
            if (!apl) {
                found = false
                data.formId = formId
            }
        } while (found)

        const [ result ] = await mysql.execute(query.applications.insert(data))
        const id = result.insertId

        if (id) created = true
        else return { error: 'DB Error' }

        let application, url
        if (created) {
            application = await Application.data(session, { id })

            const { carrierId } = data
            const { fullName, email, formId } = application
            let { from } = senderParams
            let companyName

            url = `/application/${formId}`

            if (carrierId) {
                if (!user) session = { ...session, user: true }
                const carrier = await Carrier.data(session, { id })

                companyName = carrier.name
            } else if (team.profile)
                companyName = team.profile.company

            if (companyName) from = `"${companyName}" <${senderParams.email}>`

            const options = {
                from,
                to: email,
                subject: 'Professional Driver Application',
                html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                    Dear ${fullName},<br/>
                    ${
                        companyName
                            ? `Thank you for your interest in joining ${companyName} as a professional driver.`
                            : 'Welcome aboard! Thank you for your interest in joining our professional driver team!'
                    }<br/><br/>
                    Your application has been successfully registered. If you interrupted the process, you can continue from where you left off.<br/>
                    To log in and proceed, use the requested credentials — your PIN is the last four digits of your Social Security number.<br/>
                    <a href="${addrBook.driver + url}" target="_blank">Continue Your Application</a><br/><br/>
                    We look forward to your completed application!
                </div>`,
            }

            transporter.sendMail(options, error => {
                if (error) console.error(error)
            })
        }

        return { created, data: application, url }
    }


    static data = async (session, params = {}) => {
        if (!params._id && !params.id && !params.formId) return

        const { _id, id, formId } = params
        const match = { id, formId }
        if (!id) match.id = Application.matchIdHash(_id)

        const batch = [
            {
                table: 'applications',
                fields: [
                    Application.hashId(),
                    Team.hashId('teamId'),
                    Carrier.hashId('carrierId'),
                    User.hashId('userId'),
                    'formId',
                    'appliedOn',
                    'position',
                    'condition',
                    'step',
                    'firstName',
                    'middleName',
                    'lastName',
                    'suffix',
                    'dob',
                    { aes: [ 'ssn', ssnSecret ] },
                    'email',
                    'phone',
                    'legalStatus',
                    'LS_expiresOn',
                ],
                match,
            },
            {
                table: 'carriers',
                join: [ 'id', 'carrierId' ],
            },
            {
                db: db.business,
                table: 'companies',
                join: [ 'id', 'companyId', 1 ],
            },
            {
                db: db.business,
                table: 'company_names',
                fields: [ 'busName', 'coType', [ 'alias', 'companyAlias' ] ],
                join: [ 'companyId', 'id', { max: 'since', table: 'companies' } ],
            },
            {
                db: db.online,
                table: 'users',
                fields: [
                    [ 'firstName', 'userFirstName' ],
                    [ 'lastName', 'userLastName' ],
                    [ 'alias', 'userAlias' ],
                    [ 'condition', 'userCondition' ],
                    [ 'location', 'userLocation' ],
                    [ 'deletedAt', 'userDeletedAt' ],
                ],
                join: [ 'id', 'userId' ],
            },
            {
                db: db.business,
                table: 'teams',
                fields: [ [ 'name', 'teamName' ] ],
                join: [ 'id', 'teamId' ],
            },
        ]

        const data = (await mysql.execute(Query.select(db.carrier, batch)))[0][0]

        return !data ? data : new Application(data)
    }


    static companies = async (session, filter = {}) => {
        if (!session?.user || !session?.team) return

        const { excluded } = filter
        const companyId = await session.team.ids(session, 'companies')

        const batch = [
            {
                table: 'applications',
                fields: Carrier.hashId('carrierId'),
            },
            {
                table: 'carriers',
                fields: Company.hashId('companyId'),
                join: [ 'id', 'carrierId' ],
            },
            {
                db: db.business,
                table: 'companies',
                fields: [ 'active', 'until' ],
                join: [ 'id', 'companyId', 1 ],
                match: { confirmed: true },
            },
            {
                db: db.business,
                table: 'company_names',
                fields: [ 'busName', 'coType', { concat: [ [ 'busName', '^, ', 'coType' ], 'name' ] }, 'alias' ],
                join: [ 'companyId', 'id', 2 ],
            },
        ]
        if (excluded !== true && companyId.length) batch[1].match = { companyId }

        let companies = (await mysql.execute(Query.select(db.carrier, batch)))[0]
        companies = sortArrayByObjectKey(companies, 'name')

        return companies
    }


    static users = async (session, filter = {}) => {
        if (!session?.user || !session?.team) return

        const batch = [
            {
                table: 'applications',
                match: { userId: { null: false } },
            },
            {
                db: db.online,
                table: 'users',
                fields: [ User.hashId(), 'firstName', 'lastName', 'alias', 'condition', 'location', 'deletedAt' ],
                join: [ 'id', 'userId' ],
            },
        ]

        let users = (await mysql.execute(Query.select(db.carrier, batch)))[0]
        users.forEach(user => user.self = user._id == session.user._id)

        return users
    }


    static dtList = async (req, res) => { /* API use only */
        try {
            const sessionsUser = res.session.user
            const { DS } = sessionsUser
            const permissions = await sessionsUser.permissions(res.session) || {}

            if (!DS && !('d:drv/apl' in permissions))
                return throwErr.api.auth(res, null, err, false)

            const settings = await sessionsUser.settings(res.session)
            const team = await Team.data(res.session, { _id: req.session.team })
            const teamId = await team.id()
            const { draw, start, length, columns, search, filter } = req.body  //!REDUNDANT: , order
            const { teamCompanies } = settings?.carrier || {}
            const companyIds = await team.ids(res.session, 'companies')

            let subquery = knex
                .select('*')
                .from(`${db.business}.company_names`)
                .whereIn('since', function() {
                    this.select(knex.raw('MAX(since)'))
                        .from(`${db.business}.company_names`)
                        .groupBy('companyId')
                })

            let query = knex(`${db.carrier}.applications AS apl`)
                .select(
                    knex.raw(Query.hashField(Application.hashId(), 'apl')),
                    knex.raw(Query.hashField(Team.hashId('teamId'))),
                    knex.raw(Query.hashField(Carrier.hashId('carrierId'))),
                    knex.raw(Query.hashField(User.hashId('userId'))),
                    'apl.formId',
                    'apl.appliedOn',
                    'apl.condition',
                    'apl.position',
                    'apl.firstName',
                    'apl.middleName',
                    'apl.lastName',
                    'apl.suffix',
                    'apl.dob',
                    'apl.email',
                    'apl.phone',
                    'cnm.busName',
                    'cnm.coType',
                    'cnm.alias AS companyAlias',
                    'usr.firstName AS userFirstName',
                    'usr.lastName AS userLastName',
                    'usr.alias AS userAlias',
                    'usr.condition AS userCondition',
                    'usr.location AS userLocation',
                    'usr.deletedAt AS userDeletedAt',
                )
                .leftJoin(knex.raw(`${db.carrier}.carriers AS crr ON apl.carrierId = crr.id`))
                .leftJoin(knex.raw(`${db.business}.companies AS cmp ON crr.companyId = cmp.id`))
                .leftJoin(
                    knex.raw('? as cnm', [ subquery ]),
                    'cnm.companyId',
                    'cmp.id'
                )
                .leftJoin(knex.raw(`${db.online}.users AS usr ON apl.userId = usr.id`))
                .where({ teamId })

            const filterParams = {
                company: {
                    nullable: true,
                    whereCond: 'orWhere',
                    carrierIds: [],
                },
            }
            if (filter?.companies) {
                filter.companies = filter.companies.split(',')

                if (filter.companies.length && !filter.companies.includes('null')) {
                    filterParams.company.nullable = false
                    filterParams.company.whereCond = 'where'
                }

                await Promise.all(filter.companies.map(async (_id) => {
                    if (_id != 'null') {
                        const carrier = await Carrier.data(res.session, { _id })
                        const id = await carrier.id()

                        filterParams.company.carrierIds.push(id)
                    }
                }))
            }

            if (filter?.user) {
                if (filter.user == 'null')
                    query.whereNull('userId')
                else {
                    const userId = await (await User.data(res.session, { _id: filter.user })).id()

                    query.where('userId', userId)
                }
            }

            query.where(async function() {
                const { nullable, whereCond, carrierIds } = filterParams.company

                if (nullable) this.whereNull('carrierId')
                if (!filter?.companies || carrierIds.length)
                    this[whereCond](function() {
                        this.where('cmp.confirmed', true)

                        if (!teamCompanies || !teamCompanies.includes('i')) this.where('cmp.active', true)
                        if (!teamCompanies || !teamCompanies.includes('c')) this.where('cmp.until', null)
                        if (!teamCompanies || !teamCompanies.includes('e')) this.whereIn('cmp.id', companyIds)

                        if (carrierIds.length) this.whereIn('apl.carrierId', carrierIds)
                    })
            })

            if (filter?.conditions) {
                filter.conditions = filter.conditions.split(',')

                query.whereIn('apl.condition', filter.conditions)
            }

            if (filter?.positions) {
                filter.positions = filter.positions.split(',')
                let nullable = false

                if (filter.positions.includes('null')) {
                    nullable = true
                    filter.positions = filter.positions.filter(value => value != 'null')
                }

                if (filter.positions.length)
                    query.where(function() {
                        this.whereIn('position', filter.positions)
                        if (nullable) this.orWhereNull('position')
                    })
                else query.whereNull('position')
            }

            const searchableColumns = columns
                .filter(column => column.data && column.data !== 'function' && column.searchable === 'true')
                .map(column => column.data)

            if (search && search.value && searchableColumns.length) {
                query = query.where(qb => {
                    searchableColumns.forEach((field, i) => {
                        if (i === 0) qb.where(`apl.${field}`, 'like', `%${search.value}%`)
                        else qb.orWhere(`apl.${field}`, 'like', `%${search.value}%`)
                    })
                })
            }

//! REDUNDANT / REUSE SOMEWHERE ELSE AND DELETE
//? CHECK ON THE MULTIPLE ORDER REQUEST, THE ONE BELOW IS FOR ONE REQUEST
// console.log(order)
//             const orderColumn = order?.[0]?.column != '0' ? order?.[0]?.column : null
//             const orderField = columns?.[orderColumn]?.data
//             const orderDir = order?.[0]?.dir === 'asc' ? 'asc' : 'desc'
//             if (orderField) query = query.orderBy(orderField, orderDir)
//             else
            query = query.orderBy([
                { column: 'appliedOn', order: 'desc' },
                { column: 'lastName', order: 'asc' },
                { column: 'firstName', order: 'asc' },
            ])

            query = query.limit(length).offset(start)

            const data = await query
            const [{ count }] = await knex('app_carrier.applications').count('* as count')

            res.json({
                draw,
                recordsTotal: count,
                recordsFiltered: data.length,
                data,
                actions: {
                    data: {
                        comment: DS || permissions?.['d:drv/apl'].includes('1'),
                        create: DS || permissions?.['d:drv/apl'].includes('2'),
                        modify: DS || permissions?.['d:drv/apl'].includes('3'),
                        delete: DS || permissions?.['d:drv/apl'].includes('5'),
                    },
                    file: {
                        access: Object.keys(permissions).some(key => key.startsWith('f:drv')),
                    },
                },
                aplAddress: `${res.hbs.addrBook.driver}/application/`,
            })
        } catch (err) {
            throwErr.api.server(res, null, err, false)
        }
    }



    /* Middleware */


    static verify = async (req, res, next) => {
        try {
            const { formId } = req.params
            const application = await Application.data({ ...res.session, user: true }, { formId })
            if (!application) return throwErr.data.server(res, 'Internal Server Error: Application not found')

            const { application: _id } = req.session
            if (!_id || _id != application._id) {
                delete req.session.application

                return res.redirect(`/application/${formId}`)
            }

            res.session.application = application

            next()
        } catch (err) {
            const msg = 'Application validation check failed: Server could not process the request'
            throwErr.data.server(res, msg, err)
        }
    }


}



class DriverUser {
    constructor() {}

    static login = () => {}

    static session = () => {}

    static logout = () => {}

}



export default Driver
export { Application, DriverUser }