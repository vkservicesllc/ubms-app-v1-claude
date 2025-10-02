require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_SSN, DB__MYSQL_AES_EIN } = process.env
const ssnSecret = DB__MYSQL_AES_SSN
const einSecret = DB__MYSQL_AES_EIN


/* Settings */
import { addrBook } from '../../../config.mjs'
import db from '../../settings/mysql.mjs'

/* Tools */
import moment from 'moment'
import { utcTimeStamp } from '../utils/date.mjs'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import Individual, { query as personQuery } from './individual.mjs'
import Team, { query as teamQuery } from './team.mjs'
import User, { sessionError, query as userQuery } from './user.mjs'
import Company, { query as companyQuery } from './company.mjs'
import Carrier, { query as carrierQuery } from './carrier.mjs'
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
    main: new Query(db.carrier, 'drivers'),
    applications: new Query(db.carrier, 'applications'),
    aplAddresses: new Query(db.carrier, 'application_addresses'),
    aplDLs: new Query(db.carrier, 'application_DLs'),
    aplMECs: new Query(db.carrier, 'application_MECs'),
    aplCitations: new Query(db.carrier, 'application_citations'),
    aplAccidents: new Query(db.carrier, 'application_accidents'),
    aplExperiences: new Query(db.carrier, 'application_experiences'),
    aplCdlSchools: new Query(db.carrier, 'application_cdlschools'),
    aplEmployers: new Query(db.carrier, 'application_preemployments'),
    aplPreferences: new Query(db.carrier, 'application_preferences'),
    aplBusinesses: new Query(db.carrier, 'application_businesses'),
    aplVehicles: new Query(db.carrier, 'application_vehicles'),
    aplBeneficiaries: new Query(db.carrier, 'application_beneficiaries'),
    aplEmergencies: new Query(db.carrier, 'application_emergencies'),
    aplChecklists: new Query(db.carrier, 'application_checklists'),
    aplDecisions: new Query(db.carrier, 'application_decisions'),
}

const subQuery = (db, table, maxField, groupId) => knex
    .select('*')
    .from(`${db}.${table}`)
    .whereIn(maxField, function() {
        this.select(knex.raw(`MAX(${maxField})`))
            .from(`${db}.${table}`)
            .groupBy(groupId)
    })



class Driver extends Individual {
    constructor(data = {}) {
        super(data, true)
        if (!data?._id || !data?._personId || !Object.keys(this).length)
            throw new Error('Driver instantiation failed: Invalid data')

        const { _id, _personId, blackListed } = data
        const properties = {} //! add driver properties

        reSuper(this, { _id, _personId, blackListed }, properties)

        this.id = async () => (await mysql.execute(query.main.select('id', {
            match: { id: Driver.matchIdHash(this._id) },
        })))[0][0].id

        this.applications = async (session, ) => {
            let error = sessionError(session, { branches: [ 'carrier', 'driver' ] })
            if (error) return { error }

            const count = { total: 0, submitted: 0, matched: 0 }
            const applications = (await mysql.execute(query.applications.select([
                Application.hashId(),
                Driver.hashId('driverId'),
                Team.hashId('teamId'),
                User.hashId('userId'),
                Carrier.hashId('carrierId'),
                'formId',
                'position',
                'condition',
                'matched',
                'createdAt',
            ], { match: { driverId: Driver.matchIdHash(this._id) }, sort: [ 'id' ] })))[0]

            let idx = 1
            applications.forEach((application, i) => {
                if (!application.matched) applications[i].unmatchedIdx = idx++
                count.total += 1

                if (application.condition !== 'p') {
                    count.submitted += 1
                    if (application.matched) count.matched += 1
                }
            })

            return { applications, count }
        }
    }


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


    static #algorithm = 'SHA-224'

    static hashId = (field = 'id') => hash(field, Driver.#algorithm)

    static matchIdHash = value => matchHash(value, Driver.#algorithm)


    static create = async (session, data) => {
        let created = false, id
        const { branch, user } = session

        const { ssn } = data
        let person = await Individual.data(session, { ssn })

        if (!person) {
            const result = await Individual.create(session, data)
            person = result.data
        }

        const driverData = { personId: await person.id() }
        if (user && user !== true) driverData.createdBy = await user.id()
        const createdIn = { branch }
        driverData.createdIn = JSON.stringify(createdIn)

        const [ result ] = await mysql.execute(query.main.insert(driverData))
        if (result.affectedRows === 1) created = true
        id = result.insertId

        return { created, data: await Driver.data(session, { id })}
    }


    static data = async (session, params = {}) => {
        if (!params._id && !params.id && !params._personId && !params.personId) return

        const { _id, id, _personId, personId } = params
        const match = { id, personId }
        if (!id) match.id = Driver.matchIdHash(_id)
        if (!personId) match.personId = Individual.matchIdHash(_personId)

        const batch = !session.user
            ? []
            : [
                {
                    table: query.main.table,
                    fields: [
                        Driver.hashId(),
                        Individual.hashId('personId'),
                        'blackListed',
                    ],
                    match,
                },
                {
                    db: db.person,
                    table: personQuery.main.table,
                    fields: [ 'dob', 'sex', { aes: [ 'ssn', ssnSecret ] } ],
                    join: [ 'id', 'personId' ],
                },
                {
                    db: db.person,
                    table: personQuery.names.table,
                    fields: [
                        'firstName',
                        'middleName',
                        'lastName',
                        'suffix',
                    ],
                    join: [ 'personId', 'id', {
                        table: personQuery.main.table,
                        max: 'since',
                    } ],
                },
                {
                    db: db.person,
                    table: personQuery.phones.table,
                    fields: [ [ 'number', 'phone' ] ],
                    join: [ 'personId', 'id', {
                        table: personQuery.main.table,
                        max: 'since',
                    } ],
                },
                //! continue with driver licenses and other props
            ]

        const data = (await mysql.execute(Query.select(db.carrier, batch)))[0][0]

        return !data ? data : new Driver(data)
    }


    static dtList = async (req, res) => {
        try {
            const sessionsUser = res.session.user
            const { DS } = sessionsUser
            const permissions = await sessionsUser.permissions(res.session) || {}

            if (!DS && !('d:drv/apl' in permissions))
                return throwErr.api.auth(res, null, err, false)

            const { blacklisted } = req.params
            let team, teamId = null
            if (req.session.team) team = await Team.data(res.session, { _id: req.session.team })
            if (team) teamId = await team.id()
            const { draw, start, length } = req.body

            const excludedConditions = ['p']
            if (false) excludedConditions.push('c') //! FILTER

            const baseQuery = knex(`${db.carrier}.drivers AS drv`)
                .select(
                    knex.raw(Query.hashField(Driver.hashId(), 'drv')),
                    knex.raw(Query.hashField(Individual.hashId('personId'), 'drv')),
                    'psn.dob',
                    'psn.sex',
                    knex.raw('MAX(??) AS ??', ['nms.firstName', 'firstName']),
                    knex.raw('MAX(??) AS ??', ['nms.middleName', 'middleName']),
                    knex.raw('MAX(??) AS ??', ['nms.lastName', 'lastName']),
                    knex.raw('MAX(??) AS ??', ['nms.suffix', 'suffix']),
                    knex.raw('MAX(??) AS ??', ['phn.number', 'phone'])
                )
                .leftJoin(`${db.person}.individuals AS psn`, 'psn.id', 'drv.personId')
                .leftJoin(
                    knex.raw('? AS nms', [ subQuery(db.person, 'names', 'since', 'personId') ]),
                    'nms.personId',
                    'drv.personId'
                )
                .leftJoin(
                    knex.raw('? AS phn', [ subQuery(db.person, 'phones', 'since', 'personId') ]),
                    'phn.personId',
                    'drv.personId'
                )
                .leftJoin(`${db.carrier}.applications AS apl`, 'apl.driverId', 'drv.id')
                // .where('apl.teamId', teamId)
                .whereNotIn('apl.condition', excludedConditions)
                .groupBy('drv.id')

            const totalCountQuery = knex.queryBuilder().count('* AS count').from(baseQuery.as('base'))

            baseQuery.limit(length).offset(start)
            const countQuery = knex.queryBuilder().count('* AS count').from(baseQuery.as('base'))

            if (teamId) baseQuery.where('apl.teamId', teamId)

            const [
                data,
                [{ count: recordsFiltered }],
                [{ count: recordsTotal }],
            ] = await Promise.all([
                baseQuery,
                countQuery,
                totalCountQuery,
            ])

            res.json({
                draw,
                recordsTotal,
                recordsFiltered,
                data,
            })
        } catch (err) {
            throwErr.api.server(res, null, err, false)
        }
    }


}



class Application {
    constructor(data = {}) {
        const { firstName, middleName, lastName, suffix } = data

        this._id = data._id
        this._driverId = data._driverId
        this._personId = data._personId
        this._teamId = data._teamId
        this._userId = data._userId
        this._carrierId = data._carrierId
        this.cdlRole = data.cdlRole
        this.formId = data.formId
        this.position = [ data.position, Driver.positionList[data.position] ]
        this.condition = data.condition
        this.appliedAt = data.createdAt
        this.appliedOn = moment(data.createdAt).format('YYYY-MM-DD')
        this.finishedAt = data.finishedAt
        this.matched = data.matched

        this.checklist = {
            dlScn: data.dlScn,
            dlScnId: data.dlScnId,
            dlVrfId: data.dlVrfId,
            mecScn: data.mecScn,
            mecScnId: data.mecScnId,
            mecVrfId: data.mecVrfId,
            docScn: data.docScn,
            docScnId: data.docScnId,
            docVrfId: data.docVrfId,
            mvrUplId: data.mvrUplId,
            pspUplId: data.pspUplId,
        }

        this.legalStatus = [ data.legalStatus, data.legalExpiration ]
        this.step = data.step

        if (data.decExperience || data.decPosition)
            this.decision = {
                experience: data.decExperience,
                position: data.decPosition,
            }

        const person = new Person({ firstName, middleName, lastName, suffix })
        this.firstName = firstName
        this.middleName = middleName
        this.lastName = lastName
        this.suffix = suffix
        this.name = person.fullName()
        this.fullName = person.fullName('FMLs')

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
        this.address.livedAbroad = bool(data.livedAbroad)
        this.address.country = data.country
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
        this.duiInDecade = bool(data.duiInDecade)
        this.criminal = bool(data.criminal)
        this.criminalExpl = data.criminalExpl
        this.dotDat = bool(data.dotDat)
        this.citations = bool(data.citations)

        this.accidents = bool(data.accidents)

        this.experience = bool(data.experience)
        if (this.experience)
            this.experience = {
                cmv: bool(data.cmvExp),
                vehicles: data.expVehicles,
                firstDate: data.expFirstDate,
                lastDate: data.expLastDate,
                mileage: data.expMileage,
                hours: data.expHours,
                // cdlSchool: bool(data.cdlSchool),
                // currentVhl: bool(data.currentVhl),
            }
        this.cdlSchool = bool(data.cdlSchool)
        if (this.cdlSchool)
            this.cdlSchool = {
                name: data.schName,
                phone: data.schPhone,
                state: data.schState,
                endDate: data.schEndDate,
                duration: data.schDuration,
            }

        this.prevEmployed = bool(data.prevEmployed)

        if (data.startPref !== null) {
            this.preference = {
                startPref: data.startPref.toString(),
                operType: data.operType,
            }

            if (this.cdlRole) {
                this.preference.teamName = data.partnerName
                this.preference.teamPhone = data.partnerPhone
                this.preference.haulRegion = data.haulRegion
                this.preference.equipmentType = data.equipmentType
            }
        }

        this.activeBusiness = bool(data.activeBusiness)
        // this.businessAssist = bool(data.businessAssist)

        if (this.activeBusiness)
            this.business = {
                busName: data.ownBusName,
                state: data.busState,
                ein: data.busEin ? stringifyBuffer(data.busEin) : null,
            }
        // else if (this.businessAssist)
        //     this.business = {
        //         proposedName: data.proposedBusName,
        //     }

        if (data.vhlType || data.vhlMmt)
            this.vehicle = {
                mmt: data.vhlMmt,
                make: data.vhlMake,
                model: data.vhlModel,
                year: data.vhlYear,
                type: data.vhlType,
                length: data.vhlLength,
            }

        if (data.benefRelation) {
            let { benefRelation: relation, benefOtherRel: otherRel } = data

            this.beneficiary = {
                firstName: data.benefFirstName,
                middleName: data.benefMiddleName,
                lastName: data.benefLastName,
                suffix: data.benefSuffix,
                relation: relation,
                otherRel: otherRel,
                // dob: data.benefDob,
                // sex: data.benefSex,
                ssn: data.benefSsn ? stringifyBuffer(data.benefSsn) : null,
                phone: data.benefPhone,
                // address1: data.benefAddress1,
                // address2: data.benefAddress2,
                // city: data.benefAddrCity,
                // state: data.benefAddrState,
                // zip: data.benefAddrZip,
            }

            // switch (this.beneficiary.sex) {
            //     case 0:
            //     case '0':
            //         this.beneficiary.gender = [ 'F', 'Female' ]
            //         break
            //     case 1:
            //     case '1':
            //         this.beneficiary.gender = [ 'M', 'Male' ]
            //         break
            // }
        }

        if (data.emergPhone)
            this.emergency = {
                phone: data.emergPhone,
                name: data.emergName,
                relation: data.emergRelation,
            }
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

        if (log && fields.includes(field)) log = log[field]

        return log
    }


    modify = async (session, step, data) => {
        let modified = false,
            error = sessionError(session, { branches: [ 'carrier', 'driver' ] })

        // if (!error && !['p', 'c'].includes(this.condition)) error = 'Permission Error: Application Locked'
        if (!error && this.condition === 'h') error = 'Permission Error: Application Locked'
        if (error) return { modified, error }

        const id = await this.id()
        const { branch, siteId } = session
        const modifiedBy = session.user && session.user !== true
            ? await session.user.id()
            : null
        const dataLen = data => Object.keys(data).length > 0

        switch (step) {

            case 'workflow':
                {
                    let mainData = {}
                    const { _userId, _carrierId, condition } = data
                    delete data._userId
                    delete data._carrierId
                    delete data.condition

                    if (_userId) {
                        const user = await User.data(session, { _id: _userId })
                        mainData.userId = await user.id()
                    }

                    if (_carrierId) {
                        const carrier = await Carrier.data(session, { _id: _carrierId })
                        mainData.carrierId = await carrier.id()
                    }

                    if (condition) mainData.condition = condition

                    mainData = processData(mainData, {
                        modifiedBy, branch, siteId,
                        currentData: this, currentUpdateLog: await this.log('updateLog'),
                    })

                    if (dataLen(mainData)) {
                        const [ result ] = await mysql.execute(query.applications.update(mainData, { id }))
                        if (result.affectedRows === 1) modified = true
                    }

                    if (dataLen(data)) {
                        if (this.decision) {
                            data = processData(data, {
                                modifiedBy, branch, siteId,
                                currentData: this, currentUpdateLog: await this.log('updateLog', 'aplDecisions'),
                            })

                            if (dataLen(data)) {
                                const [ result ] = await mysql.execute(query.aplDecisions.update(data, { aplId: id }))
                                if (result.affectedRows === 1) modified = true
                            }
                        } else {
                            data = processData(data)
                            data.aplId = id

                            const [ result ] = await mysql.execute(query.aplDecisions.insert(data))
                            if (result.affectedRows === 1) modified = true
                        }
                    }
                }
                break

            case 'profile':
                {
                    if (data.nameMismatch === 'on') {
                        //! another action
                    }

                    data = processData(data, {
                        modifiedBy, branch, siteId,
                        currentData: this, currentUpdateLog: await this.log('updateLog'),
                    })

                    const { ssn } = data
                    if (ssn) data.ssn = { aes: [ ssn, ssnSecret ] }
                    if (dataLen(data)) {
                        const [ result ] = await mysql.execute(query.applications.update(data, { id }))
                        if (result.affectedRows === 1) modified = true

                        if (ssn) {
                            //! check if person exists
                            //? if yes, check if driver exists
                                //? if yes, get driver, update driverId in the application
                                //! else add driver, get driverId and update it in the application
                            //! else add person, add driver, update driverId
                        } else if (data.sex !== undefined || data.dob || data.marital) {
                            const driver = await Driver.data(session, { _id: this._driverId })
                            const { applications, count } = await driver.applications(session)

                            if (!count.matched) {
                                const { unmatchedIdx } = applications.filter(application => application.formId === this.formId)[0]
                                if (unmatchedIdx === 1) {
                                    const { sex, dob, marital } = data
                                    const individual = await Individual.data(session, { _id: driver._personId })

                                    if (sex !== undefined || dob) {
                                        const result = await individual.modify(session, { sex, dob })
                                        if (result.error) error = result.error
                                    }

                                    if (marital) {
                                        const result = await individual.modify(session, { marital }, 'maritals')
                                        if (result.error) error = result.error
                                    }
                                }
                            }
                        }
                    }
                }
                break

            case 'legal-status': //* Carrier UI only
                {
                    if (data.status < 2) data.statusExpiresOn = null
                    data = processData(data, {
                        modifiedBy, branch, siteId,
                        currentData: {
                            status: this.legalStatus[0],
                            statusExpiresOn: this.legalStatus[1],
                        },
                        currentUpdateLog: await this.log('updateLog'),
                    })

                    if (dataLen(data)) {
                        const [ result ] = await mysql.execute(query.applications.update(data, { id }))
                        if (result.affectedRows === 1) modified = true
                    }
                }
                break

            case 'position': //* Carrier UI only
                {
                    const { position, mmt, type, make, model, year, length } = data
                    data = { position }

                    data = processData(data, {
                        modifiedBy, branch, siteId,
                        currentData: { condition: this.condition[0] },
                        currentUpdateLog: await this.log('updateLog'),
                    })

                    if (position !== 'OO') await mysql.execute(query.aplVehicles.delete({ aplId: id }))
                    else
                        modified = await modifyVehicle(this, { mmt, type, make, model, year, length })

                    if (dataLen(data)) {
                        const [ result ] = await mysql.execute(query.applications.update(data, { id }))
                        if (result.affectedRows === 1) modified = true
                    }
                }
                break

            case 'residence':
                {
                    const currentData = { ...this.address }
                    currentData.state = currentData.state[0]
                    currentData.addrSince = currentData.since
                    currentData.addrEnough = currentData.enough

                    const addrEnough = !dateAfter(data.addrSince, 3, 'years', this.finishedAt)
                    const { addresses, livedAbroad } = data
                    delete data.addresses
                    data.addrEnough = addrEnough
                    if (this.step === 0) data.step = 1

                    data = processData(data, {
                        modifiedBy, branch, siteId,
                        currentData, currentUpdateLog: await this.log('updateLog'),
                    })

                    await mysql.execute(query.aplAddresses.delete({ aplId: id }))

                    if (!addrEnough && !livedAbroad) {
                        const addrData = []
                        const { address1, address2, zip, city, state, since, livedAbroad } = addresses
                        const count = zip.length

                        for (let i = 0; i < count; i++) {
                            addrData.push({
                                aplId: id,
                                address1: address1[i],
                                address2: address2[i],
                                zip: zip[i],
                                city: city[i],
                                state: state[i],
                                since: since[i],
                                livedAbroad: typeof livedAbroad?.[i] === 'boolean' ? livedAbroad[i] : null,
                            })
                        }

                        const [ result ] = await mysql.execute(query.aplAddresses.insert(addrData))
                        if (result.affectedRows === 1) modified = true
                    }

                    if (dataLen(data)) {
                        const [ result ] = await mysql.execute(query.applications.update(data, { id }))
                        if (result.affectedRows === 1) modified = true
                    }
                }
                break

            case 'driver-license':
                {
                    if (!data['denied']) data['deniedExpl'] = null
                    if (!data['revoked']) data['revokedExpl'] = null

                    if (!this.dl) {
                        data = processData(data)
                        data.aplId = id

                        const [ result ] = await mysql.execute(query.aplDLs.insert(data))
                        if (result.affectedRows === 1) modified = true
                        if (modified) await mysql.execute(query.applications.update({ step: 2 }, { id }))
                    } else {
                        const currentData = { driverLicense: this.dl.number }
                        const props = [
                            'class', 'state',
                            'issuedOn', 'expiresOn',
                            'endorsement', 'restriction',
                            'denied', 'deniedExpl',
                            'revoked', 'revokedExpl',
                        ]
                        props.forEach(prop => currentData[`DL_${prop}`] = this.dl[prop])

                        data = processData(data, {
                            modifiedBy, branch, siteId,
                            currentData, currentUpdateLog: await this.log('updateLog', 'aplDLs'),
                        })

                        if (dataLen(data)) {
                            const [ result ] = await mysql.execute(query.aplDLs.update(data, { aplId: id }))
                            if (result.affectedRows === 1) modified = true
                        }
                    }
                }
                break

            case 'medical-card':
                {
                    let mainData = {}

                    if (!data.underMeds) data.medList = null
                    if (!this.dl.commercial && data.mecAbsent && !data.expiresOn) mainData.medCard = false
                    delete data.mecAbsent

                    mainData.underMeds = data.underMeds
                    mainData.medList = data.medList
                    delete data.underMeds
                    delete data.medList
                    if (this.step < 3) {
                        mainData = processData(mainData)
                        mainData.step = 3

                        if (mainData.medCard !== false) {
                            data = processData(data)
                            data.aplId = id

                            const [ result ] = await mysql.execute(query.aplMECs.insert(data))
                            if (result.affectedRows === 1) modified = true
                        }
                    } else {
                        if (mainData.medCard === false) {
                            if (this.mec) await mysql.execute(query.aplMECs.delete({ aplId: id }))
                        } else {
                            mainData.medCard = true

                            if (this.mec) {
                                data = processData(data, {
                                    modifiedBy, branch, siteId,
                                    currentData: this.mec,
                                    currentUpdateLog: await this.log('updateLog', 'aplMECs'),
                                })

                                if (dataLen(data)) {
                                    const [ result ] = await mysql.execute(query.aplMECs.update(data, { aplId: id }))
                                    if (result.affectedRows === 1) modified = true
                                }
                            } else {
                                data = processData(data)
                                data.aplId = id

                                const [ result ] = await mysql.execute(query.aplMECs.insert(data))
                                if (result.affectedRows === 1) modified = true
                            }
                        }
                    }

                    if (dataLen(mainData)) {
                        const [ result ] = await mysql.execute(query.applications.update(mainData, { id }))
                        if (result.affectedRows === 1) modified = true
                    }
                }
                break

            case 'legal-compliance':
                {
                    if (!data.dui) data.duiInDecade = null
                    if (!data.criminal) data.criminalExpl = null

                    const { citations, violation, other: otherViolation, citedOn, state: citState } = data
                    delete data.violation
                    delete data.other
                    delete data.citedOn
                    delete data.state
                    if (!violation && data.citations) data.citations = false

                    if (this.step < 4) {
                        data = processData(data)
                        data.step = 4
                    } else {
                        data = processData(data, {
                            modifiedBy, branch, siteId,
                            currentData: this, currentUpdateLog: await this.log('updateLog'),
                        })
                    }

                    if (dataLen(data)) {
                        const [ result ] = await mysql.execute(query.applications.update(data, { id }))
                        if (result.affectedRows === 1) modified = true
                    }

                    await mysql.execute(query.aplCitations.delete({ aplId: id }))

                    if (citations) {
                        const count = violation.length
                        data = []

                        for (let i = 0; i < count; i++) {
                            data.push({
                                aplId: id,
                                violation: violation[i],
                                other: violation[i] === 'other' ? otherViolation?.[i] : null,
                                citedOn: citedOn[i],
                                state: citState[i],
                            })
                        }

                        const [ result ] = await mysql.execute(query.aplCitations.insert(data))
                        if (result.affectedRows > 0) modified = true
                    }
                }
                break

            case 'safety':
                {
                    const { accidents, collision, other: otherCollision, date: accDate, state: accState, injuries, fatalities } = data
                    data = { accidents }
                    if (!collision && data.accidents) data.accidents = false

                    if (this.step < 5) {
                        data = processData(data)
                        data.step = 5
                    } else {
                        data = processData(data, {
                            modifiedBy, branch, siteId,
                            currentData: this,
                            currentUpdateLog: await this.log('updateLog'),
                        })
                    }

                    if (dataLen(data)) {
                        const [ result ] = await mysql.execute(query.applications.update(data, { id }))
                        if (result.affectedRows === 1) modified = true
                    }

                    await mysql.execute(query.aplAccidents.delete({ aplId: id }))

                    if (accidents) {
                        const count = collision.length
                        data = []

                        for (let i = 0; i < count; i++) {
                            data.push({
                                aplId: id,
                                collision: collision[i],
                                other: collision[i] === 'other' ? otherCollision?.[i] : null,
                                date: accDate[i],
                                state: accState[i],
                                injuries: injuries[i],
                                fatalities: fatalities[i],
                            })
                        }

                        const [ result ] = await mysql.execute(query.aplAccidents.insert(data))
                        if (result.affectedRows > 0) modified = true
                    }
                }
                break

            case 'experience':
                {
                    const experience = data.noExp !== true
                    let { cdlSchool } = data
                    const { name, phone, state, endDate, duration } = data
                    if (cdlSchool === undefined) cdlSchool = false
                    delete data.noExp
                    delete data.cdlSchool
                    delete data.name
                    delete data.phone
                    delete data.state
                    delete data.endDate
                    delete data.duration

                    let mainData = { experience, cdlSchool }

                    if (this.step < 6) {
                        mainData = processData(mainData)
                        mainData.step = 6
                    } else
                        mainData = processData(mainData, {
                            modifiedBy, branch, siteId,
                            currentData: { experience: !!this.experience },
                            currentUpdateLog: await this.log('updateLog'),
                        })

                    if (dataLen(mainData)) {
                        const [ result ] = await mysql.execute(query.applications.update(mainData, { id }))
                        if (result.affectedRows === 1) modified = true
                    }

                    await mysql.execute(query.aplExperiences.delete({ aplId: id }))
                    await mysql.execute(query.aplCdlSchools.delete({ aplId: id }))

                    if (experience) {
                        if (data?.vehicles?.misc) {
                            const { misc } = data.vehicles
                            data.vehicles.misc = []

                            for (const prop in misc)
                                data.vehicles.misc.push(prop)
                        }

                        if (data.cmv === false) {
                            if (data?.vehicles?.semi) delete data.vehicles.semi
                            if (data?.vehicles?.misc) data.vehicles.misc = data.vehicles.misc.filter(value => value !== 'tandem')
                        }

                        if (data.vehicles) data.vehicles = JSON.stringify(data.vehicles)
                        if (data.hours) data.hours = JSON.stringify(data.hours.map(value => +value))

                        data.aplId = id

                        const [ result ] = await mysql.execute(query.aplExperiences.insert(data))
                        if (result.affectedRows === 1) modified = true
                    }

                    if (cdlSchool) {
                        const data = { aplId: id, name, phone, state, endDate, duration }

                        const [ result ] = await mysql.execute(query.aplCdlSchools.insert(data))
                        if (result.affectedRows === 1) modified = true
                    }
                }
                break

            case 'prev-employment':
                {
                    const {
                        prevEmployed,
                        employer, phone, address1, address2, zip, city, state,
                        startedOn, position, earnings, fmcsr, dotDat, rfl, leftOn,
                    } = data
                    data = { prevEmployed }

                    if (this.step < 7) {
                        data = processData(data)
                        data.step = 7
                    } else
                        data = processData(data, {
                            modifiedBy, branch, siteId,
                            currentData: this, currentUpdateLog: await this.log('updateLog'),
                        })

                    if (dataLen(data)) {
                        const [ result ] = await mysql.execute(query.applications.update(data, { id }))
                        if (result.affectedRows === 1) modified = true
                    }

                    await (mysql.execute(query.aplEmployers.delete({ aplId: id })))

                    if (prevEmployed) {
                        const count = employer.length
                        data = []

                        for (let i = 0; i < count; i++)
                            data.push({
                                aplId: id,
                                employer: employer[i],
                                phone: phone[i],
                                address1: address1[i],
                                address2: address2[i],
                                city: city[i],
                                state: state[i],
                                zip: zip[i],
                                startedOn: startedOn[i],
                                position: position[i],
                                earnings: earnings[i],
                                fmcsr: fmcsr && typeof fmcsr[i] ? fmcsr[i] : null,
                                dotDat: dotDat[i],
                                rfl: rfl[i],
                                leftOn: leftOn[i],
                            })

                        const [ result ] = await mysql.execute(query.aplEmployers.insert(data))
                        if (result.affectedRows > 0) modified = true
                    }
                }
                break

            case 'preference':
                {
                    let { haulRegion, equipment } = data
                    delete data.haulRegion
                    delete data.equipment

                    if (haulRegion) haulRegion = JSON.stringify(haulRegion)
                    if (equipment) equipment = JSON.stringify(equipment)

                    if (data.operType === 's') {
                        data.teamName = null
                        data.teamPhone = null
                    }

                    if (this.cdlRole) {
                        data.haulRegion = haulRegion
                        data.equipment = equipment
                    }

                    if (!this.preference) {
                        data = processData(data)
                        data.aplId = id

                        const [ result ] = await mysql.execute(query.applications.update({ step: 8 }, { id }))
                        if (result.affectedRows === 1) modified = true

                        await mysql.execute(query.aplPreferences.insert(data))
                    } else {
                        const currentData = { ...this.preference }

                        currentData.startPref = +currentData.startPref
                        delete currentData.haulRegion
                        delete currentData.equipmentType

                        data = processData(data, {
                            modifiedBy, branch, siteId,
                            currentData, currentUpdateLog: await this.log('updateLog', 'aplPreferences'),
                        })

                        if (dataLen(data)) {
                            const [ result ] = await mysql.execute(query.aplPreferences.update(data, { aplId: id }))
                            if (result.affectedRows === 1) modified = true
                        }
                    }
                }
                break

            case 'business':
                {
                    let { activeLLC } = data
                    const {
                        inactiveLLC, busName, state, ein,
                        // llcAssistance, proposedName,
                        mmt, type, make, model, year, length,
                    } = data
                    if (inactiveLLC) activeLLC = false
                    else if (activeLLC === undefined) activeLLC = true

                    let mainData = { activeBusiness: activeLLC } //, businessAssist: llcAssistance }
                    data = { busName, state } // , proposedName }

                    if (this.step < 9) {
                        mainData = processData(mainData)
                        mainData.step = 9

                        data.aplId = id
                        if (ein) data.ein = { aes: [ ein, einSecret ] }

                        const [ result ] = await mysql.execute(query.aplBusinesses.insert(data))
                        if (result.affectedRows === 1) modified = true
                    } else {
                        mainData = processData(mainData, {
                            modifiedBy, branch, siteId,
                            currentData: this, currentUpdateLog: await this.log('updateLog'),
                        })
                        data.ein = ein

                        if (activeLLC === true) {} // data.proposedName = null
                        else {
                            data.busName = null
                            data.state = null
                            data.ein = null
                        }
                        data = processData(data, {
                            modifiedBy, branch, siteId,
                            currentData: this.business, currentUpdateLog: await this.log('updateLog', 'aplBusinesses'),
                        })
                        if ('ein' in data) data.ein = { aes: [ data.ein, einSecret ] }

                        if (dataLen(data)) {
                            if (!mainData.activeBusiness) {
                                const [ result ] = await mysql.execute(query.aplBusinesses.update(data, { aplId: id }))
                                if (result.affectedRows === 1) modified = true
                            } else {
                                data.aplId = id
                                const [ result ] = await mysql.execute(query.aplBusinesses.insert(data))
                                if (result.affectedRows === 1) modified = true
                            }
                        }
                    }

                    if (dataLen(mainData)) {
                        const [ result ] = await mysql.execute(query.applications.update(mainData, { id }))
                        if (result.affectedRows === 1) modified = true
                    }

                    //* Driver Application only
                    if (this.position[0] === 'OO')
                        modified = await modifyVehicle(this, { mmt, type, make, model, year, length })
                }
                break

            case 'beneficiary':
                {
                   if (!this.beneficiary) {
                        data = processData(data)
                        data.aplId = id
                        if (data.ssn) data.ssn = { aes: [ data.ssn, ssnSecret ] }

                        const [ result ] = await mysql.execute(query.aplBeneficiaries.insert(data))
                        if (result.affectedRows === 1) modified = true

                        if (modified) await mysql.execute(query.applications.update({ step: 10 }, { id }))
                    } else {
                        if (data.relation !== 'Other') data.otherRel = null
                        data = processData(data, {
                            modifiedBy, branch, siteId,
                            currentData: this.beneficiary, currentUpdateLog: await this.log('updateLog', 'aplBeneficiaries'),
                        })
                        if ('ssn' in data) data.ssn = { aes: [ data.ssn, ssnSecret ] }

                        if (dataLen(data)) {
                            const [ result ] = await mysql.execute(query.aplBeneficiaries.update(data, { aplId: id }))
                            if (result.affectedRows === 1) modified = true
                        }
                    }
                }
                break

            case 'misc':
                {
                    if (this.step < 11) {
                        data = processData(data)
                        data.aplId = id

                        const [ result ] = await mysql.execute(query.aplEmergencies.insert(data))
                        if (result.affectedRows === 1) modified = true

                        if (modified) await mysql.execute(query.applications.update({ step: 11 }, { id }))
                    } else {
                        data = processData(data, {
                            modifiedBy, branch, siteId,
                            currentData: this.emergency, currentUpdateLog: await this.log('updateLog', 'aplEmergencies'),
                        })

                        if (dataLen(data)) {
                            const [ result ] = await mysql.execute(query.aplEmergencies.update(data, { aplId: id }))
                            if (result.affectedRows === 1) modified = true
                        }
                    }
                }
                break

            case 'assignment': //* Carrier UI only
                {
                    data = processData(data, {
                        modifiedBy, branch, siteId,
                        currentData: this, currentUpdateLog: await this.log('updateLog'),
                    })

                    if (dataLen(data)) {
                        const [ result ] = await mysql.execute(query.applications.update(data, { id }))
                        if (result.affectedRows === 1) modified = true
                    }
                }
                break

        }

        async function modifyVehicle(applicant, data) {
            if (data.mmt) {
                if (data.mmt !== 'other') {
                    data.type = null
                    data.make = null
                    data.model = null

                    if (data.mmt.split(':')[0] !== 'straightBox')
                        data.length = null
                } else {
                    if (data.type !== 'straightBox')
                        data.length = null
                }
            }

            if (!applicant.vehicle) {
                data = processData(data)
                data.aplId = id

                const [ result ] = await mysql.execute(query.aplVehicles.insert(data))
                if (result.affectedRows > 0) modified = true
            } else {
                data = processData(data, {
                    modifiedBy, branch, siteId,
                    currentData: applicant.vehicle,
                    currentUpdateLog: await applicant.log('updateLog', 'aplVehicles'),
                })

                const [ result ] = await mysql.execute(query.aplVehicles.update(data, { aplId: id }))
                if (result.affectedRows > 0) modified = true
            }

            return modified
        }

        return { modified, error }
    }


    certify = async session => {
        let modified = false,
            error = sessionError(session, { branches: [ 'driver' ] })

        if (!error && this.condition !== 'p') error = 'Permission Error: Application Locked'
        if (error) return { modified, error }

        if (this.step < 12) {
            const id = await this.id()

            const [ result ] = await mysql.execute(query.applications.update({ step: 12 }, { id }))
            if (result.affectedRows > 0) modified = true
        }

        return { modified, error }
    }


    submit = async session => {
        let modified = false,
            error = sessionError(session, { branches: [ 'driver' ] })

        if (!error && this.condition !== 'p') error = 'Permission Error: Application Locked'
        if (error) return { modified, error }

        if (this.condition === 'p') {
            const id = await this.id()

            const [ result ] = await mysql.execute(query.applications.update({
                condition: 'c',
                finishedAt: utcTimeStamp(),
            }, { id }))
            if (result.affectedRows > 0) modified = true
        }

        return { modified, error }
    }


    delete = async session => {
        let deleted = false,
            error = sessionError(session, { branches: [ 'carrier' ] })

        if (!error && !['p', 'c'].includes(this.condition)) error = 'Permission Error: Application Locked'
        if (error) return { deleted, error }

        const id = await this.id()
        const teamId = this._teamId ? await (await Team.data(session, { _id: this._teamId })).id() : null
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

            case 'addresses':
                src = 'aplAddresses'
                fields = [
                    'since',
                    'address1',
                    'address2',
                    'city',
                    'state',
                    'zip',
                    'livedAbroad',
                ]
                break

            case 'citations':
                src = 'aplCitations'
                fields = [
                    'violation',
                    'other',
                    'citedOn',
                    'state',
                ]
                break

            case 'accidents':
                src = 'aplAccidents'
                fields = [
                    'collision',
                    'other',
                    'date',
                    'state',
                    'injuries',
                    'fatalities',
                ]
                break

            case 'employers':
                src = 'aplEmployers'
                fields = [
                    'employer',
                    'phone',
                    'address1',
                    'address2',
                    'city',
                    'state',
                    'zip',
                    'startedOn',
                    'position',
                    'earnings',
                    'fmcsr',
                    'dotDat',
                    'leftOn',
                    'rfl',
                ]
                break

        }

        if (!src || !fields.length) return { error: 'Internal Server Error: Invalid Params' }

        return { data: (await mysql.execute(query[src].select(fields, filter)))[0] }
    }


    // carrierCreds = async session => {
    //     if (!this._carrierId) return

    //     const carrier = await Carrier.data(session, { _id: this._carrierId })
    //     const company = await Company.data(session, { _id: carrier._companyId })

    //     return await company.credentials(this.appliedOn)
    // }


    identity = async session => {
        let error = sessionError(session, { branches: [ 'carrier' ] })
        if (error) return { error }

        const individual = await Individual.data(session, { _id: this._personId })
        if (!individual) return { error: 'App Error: Individual not found' }

        const mismatch = {}

        let props = ['dob', 'sex', 'firstName', 'middleName', 'lastName', 'suffix']
        props.forEach(prop => mismatch[prop] = this[prop] !== individual[prop])

        props = ['phone', 'email', 'marital']
        props.forEach(prop => mismatch[prop] = !!individual[prop] && this[prop] !== individual[prop])

        return { individual, mismatch }
    }


    static stepList = [
        [ 'Profile', 'Residence', 'Legal Status', 'Position' ],
        "Driver's License",
        'Medical Card',
        'Legal Compliance',
        'Safety',
        'Driving Experience',
        'Previous Employment',
        'Driving Preference',
        'Business Entity',
        'Beneficiary',
        'Miscellaneous',
    ]

    static experienceList = { e: 'Experienced', i: 'Inexperienced', s: 'Student' }

    static legalStatusList = { '0': 'US Citizen', '1': 'Permanent Resident', '2': 'Work Authorization/Visa' }

    static violationList = {
        "Moving Violations": {
            speeding_5_9: "Speeding (5–9 MPH)",
            speeding_10_14: "Speeding (10–14 MPH)",
            speeding_15_19: "Speeding (15–19 MPH)",
            speeding_20_plus: "Speeding (20+ MPH)",
            failure_yield: "Failure to Yield",
            red_light: "Running Red Light",
            stop_sign: "Running Stop Sign",
            improper_lane: "Improper Lane Change",
            tailgating: "Following Too Closely",
            reckless: "Reckless Driving",
            distracted: "Distracted Driving",
        },
        "Non-Moving Violations": {
            seatbelt: "Seat Belt Violation",
            parking: "Parking Violation",
        },
        "License & Documents": {
            no_license: "No Driver's License",
            suspended_license: "Suspended/Revoked License",
            no_registration: "No Registration",
            expired_registration: "Expired Registration",
            no_insurance: "No Insurance",
            expired_insurance: "Expired Insurance",
            false_docs: "Falsified Documents",
        },
        "Alcohol/Drug Related": {
            dui: "DUI/DWI",
            open_container: "Open Container",
            refusal_test: "Refused Testing",
        },
        "Commercial Vehicle": {
            logbook: "Logbook Violation",
            hos: "Hours of Service",
            unsecured_load: "Unsecured Load",
            overweight: "Overweight Vehicle",
        },
        "Misc": {
            other: "Other",
        },
    }

    static accidentList = {
        "Vehicle-to-Vehicle": {
            head_on: "Head-on",
            rear_end: "Rear-End",
            sideswipe: "Sideswipe",
            broadside: "Broadside (T-bone)",
            backing: "Backing Collision",
            multi_vehicle: "Chain Reaction / Multi-Vehicle",
        },
        "Vehicle-to-Other": {
            pedestrian: "Vehicle vs. Pedestrian",
            bicyclist: "Vehicle vs. Bicyclist",
            animal: "Vehicle vs. Animal",
            parked: "Parked Vehicle",
            object: "Struck Object",
            work_zone: "Work Zone Collision",
        },
        "Misc": {
            rollover: "Rollover",
            run_off_road: "Run-Off-Road",
            non_collision: "Non-Collision Incident",
        },
        "Other": {
            other: "Other",
        }
    }

    static vehicleList = {
        straight: {
            box: 'Box',
            cube: 'Cube',
            dump: 'Dump',
            rollback: 'Rollback',
            pickup: 'Heavy-Duty Pickup',
        },
        semi: {
            van: 'Dry Van',
            reefer: 'Reefer',
            flat: 'Flatbed',
            step: 'Step Deck',
            tanker: 'Tanker',
            lowboy: 'Lowboy',
            carhaul: 'Car Hauler',
        },
    }

    static schoolDurationList = {
        '0-1w': '1 week',
        '1-2w': '1 – 2 weeks',
        '2-4w': '2 – 4 weeks',
        '1-2m': '1 – 2 months',
        '2+ m': '2+ months',
    }

    static haulRegionList = {
        loc: 'Local',
        reg: 'Regional',
        otr: 'Long Haul (Domestic)',
        otrInt: 'Long Haul (International)',
    }

    static vhlTypeList = [
        {
            van: 'Cargo Van',
            straightBox: 'Box Truck',
        },
        {
            semiTR: 'Semi Tractor',
            hotshot: 'Hotshot',
            straightBox: 'Box Truck',
            van: 'Cargo Van',
        },
    ]


    static vhlLengthList = {
        straightBox: {
            '10': '10 ft (Small)',
            '12': '12 ft (Medium-Small)',
            '14': '14 ft (Medium)',
            '16': '16 ft (Mid-Large)',
            '20': '20 ft (Large)',
            '24': '24 ft (Extra Large)',
            '26': '26 ft (Heavy Duty)',
        },
    }

    static startPrefList = {
        '0': 'Right away',
        '1': 'In 1 week',
        '2': 'In 2 weeks',
        '3': 'In 3 weeks',
        '4': 'In 4 weeks',
    }


    static #algorithm = 'SHA-256'

    static hashId = (field = 'id') => hash(field, Application.#algorithm)

    static matchIdHash = value => matchHash(value, Application.#algorithm)


    static invite = async (session, email, cdlRole, carrierId, selfAssign = false) => {
        if (!session.user) return

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
        } else if (team?.profile) {
            companyName = team.profile.company
            phone = team.profile.phone
        }

        if (companyName) from = `"${companyName}" <${senderParams.email}>`
        url += `?env=${team ? team._id : 'global'}`
        url += `&cdl=${cdlRole}`
        if (selfAssign) url += `&rec=${user._simpleId}`
        //! No department yet

        if (email.split('@')[1] === 'bogus.xyz') email = senderParams.email

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
        // if (!session.team) return

        let created = false

        const { branch, siteId, user } = session
        let { team } = session
        if (!user) session = { ...session, user: true }
        const createdIn = { branch }
        if (siteId) data.siteId = siteId

        const { selfAssign, ssn } = data
        delete data.selfAssign

        data = processData(data)

        const person = await Individual.data(session, { ssn })
        let driver

        if (person) {
            if (person.dob === data.dob) { // Individual confirmed via SSN and DOB
                if (person.sex === null)
                    await person.modify(session, { sex: data.sex })
            }

            driver = await Driver.data(session, { personId: await person.id() })
            if (!driver) driver = (await Driver.create(session, data)).data
        } else
            driver = (await Driver.create(session, data)).data

        if (!driver) return { created, error: 'DB Error: Failed to create Driver Entity' }

        data.driverId = await driver.id()
        data.ssn = { aes: [ ssn, ssnSecret ] }

        if (!team && data._teamId) team = await Team.data(session, { _id: data._teamId })
        delete data._teamId

        if (team) data.teamId = await team.id()
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
        else return { error: 'DB Error: Stage 1' }

        let application, url
        if (created) {
            const [ result ] = await mysql.execute(query.aplChecklists.insert({ aplId: id }))
            if (result.affectedRows !== 1) return { error: 'DB Error: Stage 2' }

            application = await Application.data(session, { id })

            const { carrierId } = data
            const { fullName, formId } = application
            let { email } = application
            let { from } = senderParams
            let companyName

            url = `/application/${formId}`

            if (carrierId) {
                const carrier = await Carrier.data(session, { id: carrierId })

                if (carrier) companyName = carrier.name
            } else if (team?.profile)
                companyName = team.profile.company

            if (companyName) from = `"${companyName}" <${senderParams.email}>`

            if (email.split('@')[1] === 'bogus.xyz') email = senderParams.email

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
                table: query.applications.table,
                fields: [
                    Application.hashId(),
                    Driver.hashId('driverId'),
                    Team.hashId('teamId'),
                    User.hashId('userId'),
                    Carrier.hashId('carrierId'),
                    'cdlRole',
                    'formId',
                    'condition',
                    'step',
                    'matched',
                    'createdBy',
                    'createdAt',
                    'finishedAt',
                    'legalStatus',
                    'legalExpiration',
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
                    'livedAbroad',
                    'country',
                    'medCard',
                    'underMeds',
                    'medList',
                    'dui',
                    'duiInDecade',
                    'criminal',
                    'criminalExpl',
                    'dotDat',
                    'citations',
                    'accidents',
                    'experience',
                    'cdlSchool',
                    'prevEmployed',
                    'activeBusiness',
                    // 'businessAssist',
                ],
                match,
            },
            {
                table: query.aplChecklists.table,
                fields: [
                    'dlScn', 'dlScnId', 'dlVrfId',
                    'mecScn', 'mecScnId', 'mecVrfId',
                    'docScn', 'docScnId', 'docVrfId',
                    'mvrUplId', 'pspUplId',
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: query.main.table,
                fields: Individual.hashId('personId'),
                join: [ 'id', 'driverId' ],
            },
            {
                table: query.aplDLs.table,
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
                table: query.aplMECs.table,
                fields: [
                    'nrcme',
                    [ 'issuedOn', 'mecIssuedOn' ],
                    [ 'expiresOn', 'mecExpiresOn' ],
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: query.aplExperiences.table,
                fields: [
                    [ 'cmv', 'cmvExp' ],
                    [ 'vehicles', 'expVehicles' ],
                    [ 'firstDate', 'expFirstDate' ],
                    [ 'lastDate', 'expLastDate' ],
                    [ 'mileage', 'expMileage' ],
                    [ 'hours', 'expHours' ],
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: query.aplCdlSchools.table,
                fields: [
                    [ 'name', 'schName' ],
                    [ 'phone', 'schPhone' ],
                    [ 'state', 'schState' ],
                    [ 'endDate', 'schEndDate' ],
                    [ 'duration', 'schDuration' ],
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: query.aplPreferences.table,
                fields: [
                    'operType',
                    [ 'teamName', 'partnerName' ],
                    [ 'teamPhone', 'partnerPhone' ],
                    'haulRegion',
                    [ 'equipment', 'equipmentType' ],
                    'startPref',
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: query.aplBusinesses.table,
                fields: [
                    [ 'busName', 'ownBusName' ],
                    [ 'state', 'busState' ],
                    [ { aes: [ 'ein', einSecret ] }, 'busEin' ],
                    // [ 'proposedName', 'proposedBusName' ],
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: query.aplVehicles.table,
                fields: [
                    [ 'mmt', 'vhlMmt' ],
                    [ 'make', 'vhlMake' ],
                    [ 'model', 'vhlModel' ],
                    [ 'year', 'vhlYear' ],
                    [ 'type', 'vhlType' ],
                    [ 'length', 'vhlLength' ],
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: query.aplBeneficiaries.table,
                fields: [
                    [ 'firstName', 'benefFirstName' ],
                    [ 'middleName', 'benefMiddleName' ],
                    [ 'lastName', 'benefLastName' ],
                    [ 'suffix', 'benefSuffix' ],
                    [ 'relation', 'benefRelation' ],
                    [ 'otherRel', 'benefOtherRel' ],
                    [ { aes: [ 'ssn', ssnSecret ] }, 'benefSsn' ],
                    [ 'phone', 'benefPhone' ],
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: query.aplEmergencies.table,
                fields: [
                    [ 'phone', 'emergPhone' ],
                    [ 'name', 'emergName' ],
                    [ 'relation', 'emergRelation' ],
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: query.aplDecisions.table,
                fields: [
                    [ 'experience', 'decExperience' ],
                    [ 'position', 'decPosition' ],
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: carrierQuery.main.table,
                join: [ 'id', 'carrierId' ],
            },
            {
                db: db.business,
                table: companyQuery.main.table,
                join: [ 'id', 'companyId', 'carriers' ],
            },
            {
                db: db.business,
                table: companyQuery.names.table,
                fields: [ 'busName', 'coType', [ 'alias', 'companyAlias' ] ],
                join: [ 'companyId', 'id', { max: 'since', table: companyQuery.main.table } ],
            },
            {
                db: db.online,
                table: userQuery.main.table,
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
                db: db.online,
                table: teamQuery.main.table,
                fields: [ [ 'name', 'teamName' ] ],
                join: [ 'id', 'teamId' ],
            },
        ]

        const data = (await mysql.execute(Query.select(db.carrier, batch)))[0][0]

        return !data ? data : new Application(data)
    }


    // static companies = async (session, filter = {}) => {
    //     if (!session?.user || !session?.team) return

    //     const { excluded } = filter
    //     const companyId = await session.team.ids(session, 'companies')

    //     const batch = [
    //         {
    //             table: query.applications.table,
    //             fields: Carrier.hashId('carrierId'),
    //         },
    //         {
    //             table: carrierQuery.main.table,
    //             fields: Company.hashId('companyId'),
    //             join: [ 'id', 'carrierId' ],
    //         },
    //         {
    //             db: db.business,
    //             table: companyQuery.main.table,
    //             fields: [ 'active', 'until' ],
    //             join: [ 'id', 'companyId', 1 ],
    //             match: { confirmed: true },
    //         },
    //         {
    //             db: db.business,
    //             table: companyQuery.names.table,
    //             fields: [ 'busName', 'coType', { concat: [ [ 'busName', '^, ', 'coType' ], 'name' ] }, 'alias' ],
    //             join: [ 'companyId', 'id', 2 ],
    //         },
    //     ]
    //     if (excluded !== true && companyId.length) batch[1].match = { companyId }

    //     let companies = (await mysql.execute(Query.select(db.carrier, batch)))[0]
    //     companies = sortArrayByObjectKey(companies, 'name')

    //     return companies
    // }


    static users = async (session, filter = {}) => {
        if (!session?.user || !session?.team) return

        const batch = [
            {
                table: query.applications.table,
                match: { userId: { null: false } },
            },
            {
                db: db.online,
                table: userQuery.main.table,
                fields: [ User.hashId(), 'firstName', 'lastName', 'alias', 'condition', 'location', 'deletedAt' ],
                join: [ 'id', 'userId' ],
            },
        ]

        let users = (await mysql.execute(Query.select(db.carrier, batch)))[0]
        users.forEach(user => user.self = user._id === session.user._id)

        return users
    }


    static charts = async (session, filter = {}) => {
        if (!session.user) return

        const { teamId } = filter
        const data = { applications: {} }
        let match
        if (teamId) match = { teamId }

        const [ result ] = await mysql.execute(query.applications.select(['condition', { count: ['condition', 'count'] }], {
            match, group: 'condition',
        }))
        data.applications.statuses = {}

        result.forEach(row => {
            const { condition, count } = row
            data.applications.statuses[condition] = count
        })

        return data
    }


    static dtList = async (req, res) => {
        try {
            const sessionUser = res.session.user
            const { DS, unscoped } = sessionUser
            const permissions = await sessionUser.permissions(res.session) || {}

            if (!DS && !('d:drv/apl' in permissions))
                return throwErr.api.auth(res, null, err, false)

            const { draw, start, length, columns, search, filter } = req.body  //!REDUNDANT: , order
            const { archived } = req.params
            const settings = await sessionUser.settings(res.session)

            const { companyIds } = res.session
            let team, teamId

            if (req.session.team) {
                team = await Team.data(res.session, { _id: req.session.team })
                teamId = await team.id()
            }
            const { teamCompanies } = settings?.carrier || {} //? May want to consider another name for the variable


            /* STEP 1: Set up Select, Join and Count Default States */

            const applyJoins = query => {

                const nameSubQuery = subQuery(db.person, 'names', 'since', 'personId')
                const companySubQuery = subQuery(db.business, 'company_names', 'since', 'companyId')

                query
                    .leftJoin(`${db.carrier}.drivers AS drv`, 'drv.id', 'apl.driverId')
                    .leftJoin(`${db.person}.individuals AS psn`, 'psn.id', 'drv.personId')
                    .leftJoin(
                        knex.raw('? AS nms', [ nameSubQuery ]),
                        'nms.personId',
                        'psn.id'
                    )
                    .leftJoin(`${db.carrier}.application_DLs AS dl`, 'dl.aplId', 'apl.id')
                    .leftJoin(`${db.carrier}.application_beneficiaries AS benef`, 'benef.aplId', 'apl.id')
                    .leftJoin(`${db.carrier}.carriers AS crr`, 'apl.carrierId',' crr.id')
                    .leftJoin(`${db.business}.companies AS cmp`, 'crr.companyId', 'cmp.id')
                    .leftJoin(
                        knex.raw('? AS cnm', [ companySubQuery ]),
                        'cnm.companyId',
                        'cmp.id'
                    )
                    .leftJoin(knex.raw(`${db.online}.users AS usr ON apl.userId = usr.id`))
                    .leftJoin(knex.raw(`${db.online}.teams AS env ON apl.teamId = env.id`))
            }

            const baseQuery = knex(`${db.carrier}.applications AS apl`)
                .select(
                    knex.raw(Query.hashField(Application.hashId(), 'apl')),
                    knex.raw(Query.hashField(Driver.hashId('driverId'))),
                    knex.raw(Query.hashField(Team.hashId('teamId'))),
                    knex.raw(Query.hashField(User.hashId('userId'))),
                    knex.raw(Query.hashField(Carrier.hashId('carrierId'))),
                    'apl.formId',
                    'apl.condition',
                    'apl.createdAt', //! will return ISO 8601 UTC timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
                    'apl.finishedAt',
                    'apl.position',
                    'apl.step',
                    'apl.firstName',
                    'apl.middleName',
                    'apl.lastName',
                    'apl.suffix',
                    'apl.dob',
                    'apl.sex',
                    'apl.email',
                    'apl.phone',
                    'apl.state',
                    'apl.marital',
                    'apl.medCard',
                    'apl.dui',
                    'apl.criminal',
                    'apl.dotDat',
                    'apl.activeBusiness',
                    'psn.dob AS originalDob',
                    'psn.sex AS originalSex',
                    'nms.firstName AS originalFirstName',
                    'nms.middleName AS originalMiddleName',
                    'nms.lastName AS originalLastName',
                    'nms.suffix AS originalSuffix',
                    'dl.commercial AS dlCommercial',
                    'dl.state AS dlState',
                    'benef.relation AS benefRelation',
                    'benef.otherRel AS benefOtherRel',
                    'cnm.busName',
                    'cnm.coType',
                    'cnm.alias AS companyAlias',
                    'usr.firstName AS userFirstName',
                    'usr.lastName AS userLastName',
                    'usr.alias AS userAlias',
                    'usr.condition AS userCondition',
                    'usr.location AS userLocation',
                    'usr.deletedAt AS userDeletedAt',
                    'env.name AS teamName',
                )

            const countQuery = knex(`${db.carrier}.applications AS apl`).count('* AS count')
            const totalCountQuery = countQuery.clone()

            applyJoins(baseQuery)
            applyJoins(countQuery)

            if (teamId) {
                baseQuery.where({ teamId })
                countQuery.where({ teamId })
                totalCountQuery.where({ teamId })
            }

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
            const [
                data,
                [{ count: recordsFiltered }],
                [{ count: recordsTotal }],
            ] = await Promise.all([
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
                unscoped,
                stepLen: Application.stepList.length,
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