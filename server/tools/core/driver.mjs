require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_SSN } = process.env
const ssnSecret = DB__MYSQL_AES_SSN


/* Settings */
import { addrBook } from '../../../config.mjs'
import db from '../../settings/mysql.mjs'

/* Tools */
import moment from 'moment'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import Individual from './individual.mjs'
import Team from './team.mjs'
import User, { sessionError } from './user.mjs'
import Company from './company.mjs'
import Carrier from './carrier.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import transporter, { senderParams } from '../utils/nodemailer.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { generateRandomString } from '../utils/string.mjs'
import { dateAfter } from '../utils/date.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import bool from '../../../client/global/modules/tools/utils/boolean.mjs'
import { sortArrayByObjectKey } from '../../../client/global/modules/tools/utils/sorter.mjs'
import { tel as formatTel } from '../../../client/global/modules/tools/utils/formatter.mjs'

const mysql = require('../utils/mysql')
const knex = require('../utils/knex')
const throwErr = require('../utils/error')

const query = {
    drivers: new Query(db.carrier, 'drivers'),
    applications: new Query(db.carrier, 'applications'),
    aplAddresses: new Query(db.carrier, 'application_addresses'),
    aplDLs: new Query(db.carrier, 'application_DLs'),
    aplMECs: new Query(db.carrier, 'application_MECs'),
    aplCitations: new Query(db.carrier, 'application_citations'),
    aplAccidents: new Query(db.carrier, 'application_accidents'),
}



class Driver extends Individual {
    constructor(data = {}, light = false) {}


    static positionList = {
        'CD': 'Company Driver',
        'OO': 'Owner Operator',
        'OD': 'Driver for Owner',
        'LP': 'Lease Purchaser',
    }

    // static dlClassList = [
    //     {
    //         commercial: true,
    //         id: 'A',
    //         name: 'A',
    //         desc: 'Combination vehicles (26,001+ lbs, towing 10,000+ lbs): Large Tractor-Trailers, Semis',
    //     },
    //     {
    //         commercial: true,
    //         id: 'B',
    //         name: 'B',
    //         desc: 'Single vehicles (26,001+ lbs, towing under 10,000 lbs): Large Buses, Box Trucks, Dump Trucks',
    //     },
    //     {
    //         commercial: true,
    //         id: 'C',
    //         name: 'C CDL',
    //         desc: 'Passenger (16+ people) or Hazardous Materials: Small Buses, HazMat Vehicles',
    //     },
    //     {
    //         commercial: false,
    //         id: 'C*',
    //         name: 'C Non-CDL',
    //         desc: 'Standard Vehicles (some states): Regular Cars, SUVs, Vans, Small Trucks',
    //     },
    //     {
    //         commercial: false,
    //         id: 'D',
    //         name: 'D',
    //         desc: 'Standard Vehicles: Regular Cars, SUVs, Vans, Small Trucks',
    //     },
    // ]


}



class Application {
    constructor(data = {}) {
        const { firstName, middleName, lastName, suffix } = data

        this._id = data._id
        this._teamId = data._teamId
        this._userId = data._userId
        this._carrierId = data._carrierId
        this.formId = data.formId
        this.position = [ data.position, Driver.positionList[data.position] ]
        this.condition = data.condition
        this.appliedAt = data.createdAt
        this.appliedOn = moment(data.createdAt).format('YYYY-MM-DD')
        this.finishedAt = data.finishedAt

        this.legalStatus = [ data.status, data.statusExpiresOn ]
        this.step = data.step
        this.firstName = firstName
        this.middleName = middleName
        this.lastName = lastName
        this.suffix = suffix
        this.fullName = new Person({ firstName, middleName, lastName, suffix }).fullName()
        this.dob = data.dob
        this.ssn = stringifyBuffer(data.ssn)
        this.sex = data.sex
        this.gender = null
        switch (this.sex) {
            case 0:
            case '0':
                this.gender = [ 'F', 'Female' ]
                break
            case 1:
            case '1':
                this.gender = [ 'M', 'Male' ]
                break
        }
        this.marital = data.marital
        this.email = data.email
        this.phone = data.phone
        this.address = new Address(data)
        this.address.since = data.addrSince
        this.address.enough = !!data.addrEnough
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

        if (data.dlNumber)
            this.dl = {
                number: data.dlNumber,
                commercial: !!data.dlCommercial,
                class: data.dlClass,
                state: data.dlState,
                issuedOn: data.dlIssuedOn,
                expiresOn: data.dlExpiresOn,
                endorsement: data.dlEndors,
                restriction: data.dlRestr,
                denied: !!data.dlDenied,
                deniedExpl: data.dlDeniedExpl,
                revoked: !!data.dlRevoked,
                revokedExpl: data.dlRevokedExpl,
            }

        this.medCard = !!data.medCard
        if (this.medCard && data.mecExpiresOn)
            this.mec = {
                nrcme: data.nrcme,
                issuedOn: data.mecIssuedOn,
                expiresOn: data.mecExpiresOn,
            }
        this.underMeds = bool(data.underMeds)
        this.medList = data.medList

        this.dui = bool(data.dui)
        this.duiInDecade = bool(data.dui)
        this.criminal = bool(data.criminal)
        this.criminalExpl = data.criminalExpl
        this.citations = bool(data.citations)

        this.accidents = bool(data.accidents)

    }


    id = async () => (await mysql.execute(query.applications.select('id', {
        match: { id: Application.matchIdHash(this._id) },
    })))[0][0].id


    log = async (field, target = 'applications') => {
        const fields = [ 'updateLog' ]
        let idProp = 'aplId'

        if (target === 'applications') {
            idProp = 'id'
            fields.unshift('createdBy', 'createdAt', 'createdIn', 'finishedAt', 'reviewedBy', 'reviewedAt', 'archivedBy', 'archivedAt')
        }

        let log = (await mysql.execute(query[target].select(fields, {
            match: { [idProp]: Application.matchIdHash(this._id) },
        })))[0][0]

        if (fields.includes(field)) log = log[field]

        return log
    }


    modify = async (session, step, data) => {
        let modified = false,
            error = sessionError(session, { branches: [ 'carrier', 'driver' ] })

        if (!error && !['p', 'c'].includes(this.condition)) error = 'Permission Error: Application Locked'
        if (error) return { modified, error }

        const id = await this.id()
        const { branch, siteId } = session
        let modifiedBy = null,
            currentData = {},
            currentUpdateLog,
            action = 'update',
            target = 'applications',
            idProp = 'id',
            mainData = {}
        if (session.user && session.user !== true)
            modifiedBy = await session.user.id()

        let checkExpl

        switch (step) {


            case 'profile':
                currentData = { ...this }
                if (currentData.position)
                    currentData.position = currentData.position[0]
                currentUpdateLog = await this.log('updateLog')

                data = processData(data, {
                    modifiedBy,
                    branch,
                    siteId,
                    currentData,
                    currentUpdateLog,
                })
                if (data.ssn)
                    data.ssn = { aes: [ data.ssn, ssnSecret ] }
                break

            
            case 'address':
                currentData = { ...this.address }
                currentData.state = currentData.state[0]
                currentData.addrSince = currentData.since
                currentUpdateLog = await this.log('updateLog')

                data = processData(data, {
                    modifiedBy,
                    branch,
                    siteId,
                    currentData,
                    currentUpdateLog,
                })
                if (data.addrSince) {
                    if (dateAfter(data.addrSince, 3, 'years', this.finishedAt)) {
                        if (this.step === 1) data.step = 0
                        data.addrEnough = false
                    } else {
                        if (this.step === 0) data.step = 1
                        data.addrEnough = true
                    }
                }
                break


            // case 'prev-address':
            //     break


            case 'driver-license':
                target = 'aplDLs'
                idProp = 'aplId'

                checkExpl = data => {
                    if (
                        (data['denied'] && !data['deniedExpl']) ||
                        (data['revoked'] && !data['revokedExpl'])
                    ) return 'Data Submission Error: Explanation not provided'
                }

                if (!data['denied']) data['deniedExpl'] = null
                if (!data['revoked']) data['revokedExpl'] = null

                if (!this.dl) {
                    data = processData(data)
                    data.aplId = id
                    mainData.step = 2
                    action = 'insert'

                    error = checkExpl(data)
                } else {
                    currentData.driverLicense = this.dl.number
                    const props = [
                        'class', 'state',
                        'issuedOn', 'expiresOn',
                        'endorsement', 'restriction',
                        'denied', 'deniedExpl',
                        'revoked', 'revokedExpl',
                    ]
                    props.forEach(prop => currentData[`DL_${prop}`] = this.dl[prop])
                    currentUpdateLog = await this.log('updateLog', target)

                    data = processData(data, {
                        modifiedBy,
                        branch,
                        siteId,
                        currentData,
                        currentUpdateLog,
                    })

                    error = checkExpl(data)
                }
                break


            case 'medical-card':
                target = 'aplMECs'
                idProp = 'aplId'

                if (data.underMeds && !data.medList)
                    error = 'Data Submission Error: Medical List not provided'
                if (!data.underMeds) data.medList = null

                if (!this.dl.commercial && data.mecAbsent && !data.expiresOn) mainData.medCard = false
                delete data.mecAbsent

                mainData.underMeds = data.underMeds
                mainData.medList = data.medList || null
                delete data.underMeds
                delete data.medList

                if (this.step < 3) {
                    mainData = processData(mainData)
                    mainData.step = 3

                    if (mainData.medCard !== false) {
                        if (!Object.keys(data).length) error = 'Request Error: No MEC data submitted'
                        else {
                            data = processData(data)
                            data.aplId = id
                            action = 'insert'
                        }
                    }
                } else {
                    if (mainData.medCard === false) {
                        if (this.mec) {
                            const [ result ] = await mysql.execute(query.aplMECs.delete({ aplId: id }))
                            if (result.affectedRows !== 1) error = 'DB Error: Could not delete MEC record'
                        }
                    } else {
                        mainData.medCard = true

                        if (!Object.keys(data).length) error = 'Request Error: No MEC data submitted'
                        else {
                            if (this.mec) {
                                currentData = this.mec
                                currentUpdateLog = await this.log('updateLog', target)

                                data = processData(data, {
                                    modifiedBy,
                                    branch,
                                    siteId,
                                    currentData,
                                    currentUpdateLog,
                                })
                            } else {
                                data = processData(data)
                                data.aplId = id
                                action = 'insert'
                            }
                        }
                    }

                    mainData = processData(mainData, {
                        modifiedBy,
                        branch,
                        siteId,
                        currentData: this,
                        currentUpdateLog: await this.log('updateLog'),
                    })
                }
                break

            case 'legal-compliance':
                if (data.dui && typeof data.duiInDecade !== 'boolean')
                    error = 'Data Submission Error: Explanation not provided for DUI'
                if (!data.dui) data.duiInDecade = null

                if (data.criminal && !data.criminalExpl)
                    error = 'Data Submission Error: Explanation not provided for Criminal Record'
                if (!data.criminal) data.criminalExpl = null

                if (data.citations) {
                    //
                } else {
                    //? delete all citations tied to the aplId
                }

                break


        }

        if (!error) {
            if (Object.keys(data).length) {
                const [ result ] = await mysql.execute(query[target][action](data, { [idProp]: id }))
                if (result.affectedRows === 1) modified = true
            }

            if (Object.keys(mainData).length) {
                const [ result ] = await mysql.execute(query.applications.update(mainData, { id }))
                if (!modified && result.affectedRows === 1) modified = true
            }
        }

        return { modified, error }
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


    data = async (target, session) => {
        let error = sessionError(session, { branches: [ 'carrier', 'driver' ] })
        if (error) return { error }

        let src, fields = []
        const filter = { match: { aplId: await this.id() } }

        switch (target) {

            case 'citations':
                src = 'aplCitations'
                fields = [
                    hash('id'),
                    'citedOn',
                    'state',
                    'reason',
                    'otherReason',
                ]
                break

        }

        if (!src || !fields.length) return { error: 'Internal Server Error: Invalid Params' }

        return { data: (await mysql.execute(query[src].select(fields, filter)))[0] }
    }


    static stepList = [
        [ 'Profile', 'Address' ],  //, 'Previous Addresses' ],
        'Driver License',
        'Medical Card',
        'Legal Compliance',
        'Safety',
        'Driving Experience',
        'Previous Employment',
        'Driving Preference',
        'Occupational Accidental Insurance',
        'Business Entity',
        'Emergency Contact',
    ]

    static citationList = {
        s5: 'Speeding 5+',
        s10: 'Speeding 10+',
        rl: 'Red Light',
        ss: 'Stop Sign',
        _dl: 'No Driver License',
        _mec: 'No Medical Card',
        _sb: 'No Seat Belt',
        _: 'Other',
    }


    static #algorithm = 'SHA-224'

    static hashId = (field = 'id') => hash(field, Application.#algorithm)

    static matchIdHash = value => matchHash(value, Application.#algorithm)


    static invite = async (session, email, carrierId) => {
        if (!session.team || !session.user) return

        const { team, user } = session
        let { from } = senderParams
        let companyName, phone, url = '/application'

        if (carrierId) {
            const carrier = await Carrier.data(session, { id: carrierId })

            if (carrier) {
                companyName = carrier.name
                phone = carrier.phone
                url += `/${carrier.route}`
            }
        } else if (team.profile) {
            companyName = team.profile.company
            phone = team.profile.phone
        }

        if (companyName) from = `"${companyName}" <${senderParams.email}>`
        url += `?env=${team._id}`

        const options = {
            from,
            to: email,
            replyTo: user.email,
            subject: 'Invitation to Apply – Professional Driver Position',
            html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                Dear Friend,<br/>
                ${
                    companyName
                        ? `${companyName} invites you`
                        : 'You are invited'
                } to apply for a Professional Driver position!
                We are looking for dedicated and skilled drivers to join our team and would love for you to be part of it.<br/><br/>
                To learn more and submit your application, please visit the link below:<br/>
                <a href="${addrBook.driver + url}" target="_blank">APPLY TODAY</a><br/><br/>
                If you have any questions, feel free to reach out. We look forward to your application!<br/><br/>
                Best regards,<br/>
                ${user.name}<br/>
                Driver Recruiter<br/>
                ${companyName && phone ? `${companyName}<br/>${formatTel(phone)}` : user.email}
            </div>`,
        }

        transporter.sendMail(options, error => {
            if (error) console.error(error)
        })
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
        data.teamId = await team.id()
        if (user) {
            data.createdBy = await user.id()
            if (selfAssign) data.userId = data.createdBy
        }
        data.createdIn = JSON.stringify(createdIn)
        
        if (dateAfter(data.addrSince, 3, 'years')) {
            /* Database has default values for the else condition */
            data.addrEnough = false
            data.step = 0
        }

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
                const carrier = await Carrier.data(session, { id: carrierId })

                if (carrier) companyName = carrier.name
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
                    'condition',
                    'step',
                    'createdBy',
                    'createdAt',
                    'finishedAt',
                    'status',
                    'statusExpiresOn',
                    'position',
                    'firstName',
                    'middleName',
                    'lastName',
                    'suffix',
                    'dob',
                    { aes: [ 'ssn', ssnSecret ] },
                    'sex',
                    'marital',
                    'email',
                    'phone',
                    'addrEnough', //? could be redundant
                    'addrSince',
                    'address1',
                    'address2',
                    'city',
                    'state',
                    'zip',
                    'medCard',
                    'underMeds',
                    'medList',
                    'dui',
                    'duiInDecade',
                    'criminal',
                    'criminalExpl',
                    'citations',
                    'accidents',
                ],
                match,
            },
            {
                table: 'application_DLs',
                fields: [
                    [ 'commercial', 'dlCommercial' ],
                    [ 'number', 'dlNumber' ],
                    [ 'class', 'dlClass' ],
                    [ 'state', 'dlState' ],
                    [ 'issuedOn', 'dlIssuedOn' ],
                    [ 'expiresOn', 'dlExpiresOn' ],
                    [ 'endorsement', 'dlEndors' ],
                    [ 'restriction', 'dlRestr' ],
                    [ 'denied', 'dlDenied' ],
                    [ 'deniedExpl', 'dlDeniedExpl' ],
                    [ 'revoked', 'dlRevoked' ],
                    [ 'revokedExpl', 'dlRevokedExpl' ],
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: 'application_MECs',
                fields: [
                    'nrcme',
                    [ 'issuedOn', 'mecIssuedOn' ],
                    [ 'expiresOn', 'mecExpiresOn' ],
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: 'carriers',
                join: [ 'id', 'carrierId' ],
            },
            {
                db: db.business,
                table: 'companies',
                join: [ 'id', 'companyId', 'carriers' ],
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
        users.forEach(user => user.self = user._id === session.user._id)

        return users
    }


    static dtList = async (req, res) => { /* DataTables Server Side use only */
        try {
            const sessionsUser = res.session.user
            const { DS } = sessionsUser
            const permissions = await sessionsUser.permissions(res.session) || {}

            if (!DS && !('d:drv/apl' in permissions))
                return throwErr.api.auth(res, null, err, false)

            const { archived } = req.params
            const settings = await sessionsUser.settings(res.session)
            const team = await Team.data(res.session, { _id: req.session.team })
            const teamId = await team.id()
            const { draw, start, length, columns, search, filter } = req.body  //!REDUNDANT: , order
            const { teamCompanies } = settings?.carrier || {}
            const companyIds = await team.ids(res.session, 'companies')


            /* STEP 1: Set up Select, Join and Count Default States */

            const applyJoins = query => {
                const subQuery = knex
                    .select('*')
                    .from(`${db.business}.company_names`)
                    .whereIn('since', function() {
                        this.select(knex.raw('MAX(since)'))
                            .from(`${db.business}.company_names`)
                            .groupBy('companyId')
                    })

                query
                    .leftJoin(`${db.carrier}.application_DLs AS adl`, 'adl.aplId', 'apl.id')
                    .leftJoin(`${db.carrier}.carriers AS crr`, 'apl.carrierId',' crr.id')
                    .leftJoin(`${db.business}.companies AS cmp`, 'crr.companyId', 'cmp.id')
                    .leftJoin(
                        knex.raw('? as cnm', [ subQuery ]),
                        'cnm.companyId',
                        'cmp.id'
                    )
                    .leftJoin(knex.raw(`${db.online}.users AS usr ON apl.userId = usr.id`))
            }

            const baseQuery = knex(`${db.carrier}.applications AS apl`)
                .select(
                    knex.raw(Query.hashField(Application.hashId(), 'apl')),
                    knex.raw(Query.hashField(Team.hashId('teamId'))),
                    knex.raw(Query.hashField(Carrier.hashId('carrierId'))),
                    knex.raw(Query.hashField(User.hashId('userId'))),
                    'apl.formId',
                    'apl.condition',
                    'apl.createdAt', //! will return ISO 8601 UTC timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
                    'apl.finishedAt',
                    'apl.position',
                    'apl.firstName',
                    'apl.middleName',
                    'apl.lastName',
                    'apl.suffix',
                    'apl.dob',
                    'apl.sex',
                    'apl.email',
                    'apl.phone',
                    'apl.state',
                    'adl.state as dlState',
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

            const countQuery = knex(`${db.carrier}.applications as apl`).count('* as count')
            const totalCountQuery = countQuery.clone()

            applyJoins(baseQuery)
            applyJoins(countQuery)

            baseQuery.where({ teamId })
            countQuery.where({ teamId })
            totalCountQuery.where({ teamId })

            const archiveWhere = archived === 'archived'
                ? 'whereNotNull'
                : 'whereNull'

            baseQuery[archiveWhere]('archivedAt')
            countQuery[archiveWhere]('archivedAt')
            totalCountQuery[archiveWhere]('archivedAt')
                


            /* STEP 2: Prepare Filters */

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
                    if (_id !== 'null') {
                        const carrier = await Carrier.data(res.session, { _id })
                        const id = await carrier.id()

                        filterParams.company.carrierIds.push(id)
                    }
                }))
            }

            if (filter?.user) {
                if (filter.user === 'null') {
                    baseQuery.whereNull('userId')
                    countQuery.whereNull('userId')
                } else {
                    const userId = await (await User.data(res.session, { _id: filter.user, allowDeleted: true })).id()

                    baseQuery.where('userId', userId)
                    countQuery.where('userId', userId)
                }
            }

            function companyStateFilter() {
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
            }

            baseQuery.where(companyStateFilter)
            countQuery.where(companyStateFilter)

            if (filter?.conditions) {
                filter.conditions = filter.conditions.split(',')

                baseQuery.whereIn('apl.condition', filter.conditions)
                countQuery.whereIn('apl.condition', filter.conditions)
            }

            if (filter?.positions) {
                filter.positions = filter.positions.split(',')
                let nullable = false

                if (filter.positions.includes('null')) {
                    nullable = true
                    filter.positions = filter.positions.filter(value => value !== 'null')
                }

                if (filter.positions.length) {
                    function positionFilter() {
                        this.whereIn('position', filter.positions)
                        if (nullable) this.orWhereNull('position')
                    }

                    baseQuery.where(positionFilter)
                    countQuery.where(positionFilter)
                } else {
                    baseQuery.whereNull('position')
                    countQuery.whereNull('position')
                }
            }


            /* STEP 3: Prepare Search */

            const searchableColumns = columns
                .filter(column => column.data && column.data !== 'function' && column.searchable === 'true')
                .map(column => column.data)

            if (search && search.value && searchableColumns.length) {
                function searchFilter() {
                    searchableColumns.forEach((field, i) => {
                        if (i === 0) this.where(`apl.${field}`, 'like', `%${search.value}%`)
                        else this.orWhere(`apl.${field}`, 'like', `%${search.value}%`)
                    })
                }

                baseQuery.where(searchFilter)
                countQuery.where(searchFilter)
            }


            /* STEP 4: Prepare Orders and Limits */

            baseQuery
                .orderBy([
                    { column: 'createdAt', order: 'desc' },
                    { column: 'lastName', order: 'asc' },
                    { column: 'firstName', order: 'asc' },
                ])
                .limit(length).offset(start)


            /* Obtain Data and Counts */
            const [ data, [ { count: recordsFiltered } ], [ { count: recordsTotal } ] ] = await Promise.all([
                baseQuery,
                countQuery,
                totalCountQuery,
            ])

            res.json({
                draw,
                recordsTotal,
                recordsFiltered,
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


}



class DriverUser {
    constructor() {}

    static login = () => {}

    static session = () => {}

    static logout = () => {}

}



export default Driver
export { Application, DriverUser }