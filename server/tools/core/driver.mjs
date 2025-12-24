const { DB__MYSQL_AES_SSN, DB__MYSQL_AES_EIN } = Bun.env
const ssnSecret = DB__MYSQL_AES_SSN
const einSecret = DB__MYSQL_AES_EIN


/* Settings */
import { addrBook } from '../../../config.mjs'
import db, { query } from '../../settings/mysql.mjs'

/* Tools */
import moment from 'moment'
import { utcTimeStamp } from '../utils/date.mjs'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import Individual from './individual.mjs'
import Team from './team.mjs'
import User from './user.mjs'
import Company from './company.mjs'
import Carrier from './carrier.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import { classInstance, classStatic } from '../utils/class.mjs'
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
const sendError = require('../utils/error')


const subQuery = (db, table, maxField, groupId) => knex
    .select('*')
    .from(`${db}.${table}`)
    .whereIn(maxField, function() {
        this.select(knex.raw(`MAX(${maxField})`))
            .from(`${db}.${table}`)
            .groupBy(groupId)
    })



class Driver extends Individual {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Driver Data')

        super(data, { single, hideRawId, hideSensitive })

        const { _id, _personId, blackListed } = data
        const properties = {} //! add driver properties

        reSuper(this, { _id, _personId, blackListed }, properties)
    }


    static #algorithm = 'SHA-224'
    static hashId = (field = 'id') => hash(field, Driver.#algorithm)
    static matchIdHash = value => matchHash(value, Driver.#algorithm)

    static config = () => ({
        enforceUser: false,
        enforceLocation: true,
        db: db.carrier,
        query: query.driver,
        idProp: 'driverId',
        defSorts: null,
        logFile: 'drivers',
    })


    static create = (session, body, params) => classStatic.create(this, session, body, params, {})


    static fetch = (session, filter,
        { hideRawId = false, sorts = Driver.config().defSorts, mode } = {}
    ) => classStatic.fetch(this, session, filter, { hideRawId, sorts, mode }, {
        batch: [
            {
                table: query.driver.main.table,
                fields: [
                    'id',
                    'personId',
                    Driver.hashId(),
                    Individual.hashId('personId'),
                    'blackListed',
                ],
            },
            {
                db: db.person,
                table: query.person.main.table,
                fields: [ 'dob', 'gender', { aes: [ 'ssn', ssnSecret ] } ],
                join: [ 'id', 'personId' ],
            },
            {
                db: db.person,
                table: query.person.name.table,
                fields: [
                    'firstName',
                    'middleName',
                    'lastName',
                    'suffix',
                ],
                join: [ 'personId', 'id', {
                    table: query.person.main.table,
                    max: 'since',
                } ],
            },
            {
                db: db.person,
                table: query.person.phone.table,
                fields: 'phone',
                join: [ 'personId', 'id', {
                    table: query.person.main.table,
                    max: 'since',
                } ],
            },
            //! continue with driver licenses and other props
        ],
        prepare(batch, filter) {
            const {
                id, _id, personId, _personId,
                blackListed,
            } = filter
            const single = !!id || !!_id || !!personId || !!_personId

            const match = { id, personId, blackListed }
            if (!id && _id) match.id = Driver.matchIdHash(_id)
            if (!personId && _personId) match.personId = Individual.matchIdHash(_personId)

            batch[0].match = match

            return { single, batch }
        },
    })


    static list = {

        position: {
            'CD': 'Company Driver',
            'OO': 'Owner Operator',
            'OD': 'Driver for Owner',
            'LP': 'Lease Purchaser',
        },

    }


}



class Application {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Driver Application Data')

        this._id = data._id
        this._driverId = data._driverId
        this._personId = data._personId
        this._teamId = data._teamId
        this._userId = data._userId
        this._carrierId = data._carrierId
        if (!hideRawId) {
            this.id = data.id
            this.driverId = data.driverId
            this.personId = data.personId
            this.teamId = data.teamId
            this.userId = data.userId
            this.carrierId = data.carrierId
        }

        this.cdlRole = data.cdlRole
        this.formId = data.formId
        this.position = data.position
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

        const person = new Person(data)
        this.firstName = person.firstName
        this.middleName = person.middleName
        this.lastName = person.lastName
        this.suffix = person.suffix
        this.name = person.fullName()
        this.fullName = person.fullName('FMLs')
        this.dob = person.dob
        this.gender = person.gender
        if (!hideSensitive) this.ssn = data.ssn ? stringifyBuffer(data.ssn) : null

        this.marital = data.marital
        this.email = data.email
        this.phone = data.phone
        this.address = new Address(data)
        if (this?.address?.zip) {
            this.address.since = data.addrSince
            this.address.enough = !!data.addrEnough
            this.address.livedAbroad = bool(data.livedAbroad)
            this.address.country = data.prevCountry
        }

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
        if (this.activeBusiness) {
            this.business = {
                busName: data.ownBusName,
                state: data.busState,
            }
            if (!hideSensitive) this.business.ein = data.busEin ? stringifyBuffer(data.busEin) : null
        }

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
                phone: data.benefPhone,
            }
            if (!hideSensitive) this.beneficiary.ssn = data.benefSsn ? stringifyBuffer(data.benefSsn) : null
        }

        if (data.emergPhone)
            this.emergency = {
                phone: data.emergPhone,
                name: data.emergName,
                relation: data.emergRelation,
            }

        this.expansion = {
            position: Driver.list.position[data.position],
            gender: person.expansion.gender,
        }

        if (single && !hideRawId) {
            this.session = session


            this.add = (target, body) => classInstance.add(this, new.target, target, body)


            this.fetch = (target, params) => classInstance.fetch(this, new.target, target, params)


            this.update = (targetOrBody, body) => classInstance.update(this, new.target, targetOrBody, body, {}, {
                currentData(target, data) {
                    switch (target) {
                        //! to be added
                    }

                    return data
                },
                async final(inst, body, target) {
                    if (target !== 'main' || !body.ssn) return

                    let { ssn } = body
                    if (typeof ssn === 'object') {
                        ssn = ssn.aes[0]
                        body.ssn = ssn
                    }

                    let person = await Individual.fetch(session, { ssn })

                    if (!person) {
                        if (!body.firstName || !body.lastName) {
                            body.firstName = inst.firstName
                            body.middleName = inst.middleName
                            body.lastName = inst.lastName
                        }
                        if (!body.dob) body.dob = inst.dob
                        if (!body.gender) body.gender = inst.gender

                        person = (await Individual.create(session, body)).data
                        if (!person) throw new Error('Failed to create person')
                    }

                    let driver = await Driver.fetch(session, { personId: person.id })
                    if (!driver) driver = (await Driver.create(session, { personId: person.id })).data
                    if (!driver) throw new Error('Failed to fetch or create driver')

                    const driverId = driver.id
                    await inst.update({ driverId })
                },
            })


            this.delete = (target, match = {}) => classInstance.delete(this, new.target, target, match)


            this.log = params => classInstance.log(this, new.target, params, [
                ...classInstance.logFields,
                'createdIn', 'finishedAt', 'reviewedBy', 'reviewedAt', 'archivedBy', 'archivedAt',
            ])
        }
    }

    static #algorithm = 'SHA-256'
    static hashId = (field = 'id') => hash(field, Application.#algorithm)
    static matchIdHash = value => matchHash(value, Application.#algorithm)

    static config = () => ({
        enforceUser: false,
        enforceLocation: true,
        db: db.carrier,
        query: query.driver_application,
        idProp: 'appId',
        defSorts: null,
        logFile: 'driver-applications',
    })


    static invite = async (session, body, formId) => {
        if (!session?.user?.id) return

        const { _carrierId, carrierId, _teamId, teamId, _userSimpleId, cdlRole, selfAssign } = body
        let { email } = body

        let { team, user } = session
        let { from } = senderParams
        let companyName, phone, url = '/application'

        if (!team && (_teamId || teamId)) team = await Team.fetch(session, { _id: _teamId, id: teamId })

        if (_carrierId || carrierId) {
            const carrier = await Carrier.fetch(session, { _id: _carrierId, id: carrierId })
            if (!carrier) throw new Error('Carrier not found')

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
        if (_userSimpleId) url += `&rec=${_userSimpleId}`
        else if (selfAssign) url += `&rec=${user._simpleId}`
        if (formId) url += `&form=${formId}`

        if (email.split('@')[1] === 'bogus.xyz') email = senderParams.email

        const mailOpts = {
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
                ${user.fullName('AL')}<br/>
                Professional Driver Recruiter<br/>
                ${companyName && phone ? `${companyName}<br/>${formatTel(phone)}` : `<a href="mailto:${user.email}">${user.email}</a>`}
            </div>`,
        }

        transporter.sendMail(mailOpts, error => {
            if (error) console.error(error)
        })
    }


    static create = (session, body, params) => classStatic.create(this, session, body, params, {
        async split(body) {
            let found = true
            do {
                const formId = generateRandomString(12, 'ud')
                const application = await Application.fetch(session, { formId })
                if (!application) {
                    found = false
                    body.formId = formId
                }
            } while (found)

            const { _carrierId, _teamId, selfAssign } = body
            let { ssn } = body
            delete body._carrierId
            delete body._teamId
            delete body.selfAssign

            if (_carrierId) {
                const carrier = await Carrier.fetch(session, { _id: _carrierId })
                if (!carrier) throw new Error('Carrier not found')

                body.carrierId = carrier.id
            }

            let { team, user } = session

            if (!team && _teamId) team = await Team.fetch(res.session, { _id: _teamId })
            if (team) body.teamId = team.id

            if (ssn) {
                if (typeof ssn === 'object') {
                    ssn = ssn.aes[0]
                    body.ssn = ssn
                }

                let person = await Individual.fetch(session, { ssn })

                if (!person) {
                    person = (await Individual.create(session, body)).data
                    if (!person) throw new Error('Failed to create person')
                }

                let driver = await Driver.fetch(session, { personId: person.id })
                if (!driver) driver = (await Driver.create(session, { personId: person.id })).data
                if (!driver) throw new Error('Failed to fetch or create driver')

                body.driverId = driver.id
                body.ssn = { aes: [ ssn, ssnSecret ] }
            } else body.step = 0

            if (user && selfAssign) body.userId = user.id

            body = { main: body }

            return body
        },
        async final(application, id, body) {
            await Application.invite(session, body.main, application.formId)
        },
    })


    static fetch = (session, filter,
        { hideRawId = false, sorts = Application.config().defSorts, mode } = {}
    ) => classStatic.fetch(this, session, filter, { hideRawId, sorts, mode }, {
        batch: [
            {
                table: query.driver_application.main.table,
                fields: [
                    'id',
                    'driverId',
                    'teamId',
                    'userId',
                    'carrierId',
                    Application.hashId(),
                    Driver.hashId('driverId'),
                    Team.hashId('teamId'),
                    User.hashId('userId'),
                    Carrier.hashId('carrierId'),
                    'formId',
                    'cdlRole',
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
                    'gender',
                    'marital',
                    'email',
                    'phone',
                    'prevCountry',
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
                ],
            },
            {
                table: query.driver_application.checklist.table,
                fields: [
                    'dlScn', 'dlScnId', 'dlVrfId',
                    'mecScn', 'mecScnId', 'mecVrfId',
                    'docScn', 'docScnId', 'docVrfId',
                    'mvrUplId', 'pspUplId',
                ],
                join: [ 'appId', 'id' ],
            },
            {
                table: query.driver.main.table,
                fields: [ 'personId', Individual.hashId('personId') ],
                join: [ 'id', 'driverId' ],
            },
            {
                table: query.driver_application.address.table,
                fields: [
                    [ 'enough', 'addrEnough' ],
                    [ 'since', 'addrSince' ],
                    'address1',
                    'address2',
                    'city',
                    'state',
                    'zip',
                    'livedAbroad',
                ],
                join: [ 'appId', 'id', { max: 'since' } ],
            },
            {
                table: query.driver_application.license.table,
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
                join: [ 'appId', 'id' ],
            },
            {
                table: query.driver_application.medical.table,
                fields: [
                    'nrcme',
                    [ 'issuedOn', 'mecIssuedOn' ],
                    [ 'expiresOn', 'mecExpiresOn' ],
                ],
                join: [ 'appId', 'id' ],
            },
            {
                table: query.driver_application.experience.table,
                fields: [
                    [ 'cmv', 'cmvExp' ],
                    [ 'vehicles', 'expVehicles' ],
                    [ 'firstDate', 'expFirstDate' ],
                    [ 'lastDate', 'expLastDate' ],
                    [ 'mileage', 'expMileage' ],
                    [ 'hours', 'expHours' ],
                ],
                join: [ 'appId', 'id' ],
            },
            {
                table: query.driver_application.school.table,
                fields: [
                    [ 'name', 'schName' ],
                    [ 'phone', 'schPhone' ],
                    [ 'state', 'schState' ],
                    [ 'endDate', 'schEndDate' ],
                    [ 'duration', 'schDuration' ],
                ],
                join: [ 'appId', 'id' ],
            },
            {
                table: query.driver_application.preference.table,
                fields: [
                    'operType',
                    [ 'teamName', 'partnerName' ],
                    [ 'teamPhone', 'partnerPhone' ],
                    'haulRegion',
                    [ 'equipment', 'equipmentType' ],
                    'startPref',
                ],
                join: [ 'appId', 'id' ],
            },
            {
                table: query.driver_application.business.table,
                fields: [
                    [ 'busName', 'ownBusName' ],
                    [ 'state', 'busState' ],
                    [ { aes: [ 'ein', einSecret ] }, 'busEin' ],
                ],
                join: [ 'appId', 'id' ],
            },
            {
                table: query.driver_application.vehicle.table,
                fields: [
                    [ 'mmt', 'vhlMmt' ],
                    [ 'make', 'vhlMake' ],
                    [ 'model', 'vhlModel' ],
                    [ 'year', 'vhlYear' ],
                    [ 'type', 'vhlType' ],
                    [ 'length', 'vhlLength' ],
                ],
                join: [ 'appId', 'id' ],
            },
            {
                table: query.driver_application.beneficiary.table,
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
                join: [ 'appId', 'id' ],
            },
            {
                table: query.driver_application.emergency.table,
                fields: [
                    [ 'phone', 'emergPhone' ],
                    [ 'name', 'emergName' ],
                    [ 'relation', 'emergRelation' ],
                ],
                join: [ 'appId', 'id' ],
            },
            {
                table: query.driver_application.decision.table,
                fields: [
                    [ 'experience', 'decExperience' ],
                    [ 'position', 'decPosition' ],
                ],
                join: [ 'appId', 'id' ],
            },
            {
                table: query.carrier.main.table,
                join: [ 'id', 'carrierId' ],
            },
            {
                db: db.business,
                table: query.company.main.table,
                join: [ 'id', 'companyId', query.carrier.main.table ],
            },
            {
                db: db.business,
                table: query.company.name.table,
                fields: [ 'busName', 'coType', [ 'alias', 'companyAlias' ] ],
                join: [ 'companyId', 'id', { max: 'since', table: query.company.main.table } ],
            },
            {
                db: db.online,
                table: query.user.main.table,
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
                table: query.team.main.table,
                fields: [ [ 'name', 'teamName' ] ],
                join: [ 'id', 'teamId' ],
            },
        ],
        prepare(batch, filter) {
            const {
                id, _id, formId,
            } = filter
            const single = !!id || !!_id || !!formId

            const match = { id, formId }
            if (!id) match.id = Application.matchIdHash(_id)

            batch[0].match = match

            return { single, batch }
        },
    })


    static assigned = async session => {
        if (!session.user.id) throw new Error('Application Static Method Error [ASSIGNED]: Session user not supplied')
        const { team } = session
        const teamId = team?.id || null

        //! need to understand, do i need to see all users or by team

        return { users: [], teams: [], carriers: [] }
    }


    static list = {

        step: [
            [ 'Profile', 'Residence', 'Legal Status', 'Position' ],
            "Driver's License",
            'Medical Certificate',
            'Legal Compliance',
            'Safety',
            'Driving Experience',
            'Previous Employment',
            'Driving Preference',
            'Business Entity',
            'Beneficiary',
            'Miscellaneous',
        ],

        legalStatus: { '0': 'US Citizen', '1': 'Permanent Resident', '2': 'Work Authorization/Visa' },

        vehicle: {
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
        },

        schoolDuration: {
            '0-1w': '1 week',
            '1-2w': '1 – 2 weeks',
            '2-4w': '2 – 4 weeks',
            '1-2m': '1 – 2 months',
            '2+ m': '2+ months',
        },

        haulRegion: {
            loc: 'Local',
            reg: 'Regional',
            otr: 'Long Haul (Domestic)',
            otrInt: 'Long Haul (International)',
        },

        vhlType: [
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
        ],

        vhlLength: {
            straightBox: {
                '10': '10 ft (Small)',
                '12': '12 ft (Medium-Small)',
                '14': '14 ft (Medium)',
                '16': '16 ft (Mid-Large)',
                '20': '20 ft (Large)',
                '24': '24 ft (Extra Large)',
                '26': '26 ft (Heavy Duty)',
            },
        },

        startPref: {
            '0': 'Right away',
            '1': 'In 1 week',
            '2': 'In 2 weeks',
            '3': 'In 3 weeks',
            '4': 'In 4 weeks',
        },
    }


    static mw = {


        dtList: async (req, res) => {
            try {
                const sessionUser = res.session.user
                const { DS, unscoped } = sessionUser
                const permissions = await sessionUser.permissions() || {}

                if (!DS && !('d:drv/apl' in permissions)) return sendError.auth(req, res)

                const { draw, start, length, columns, search, filter } = req.body
                const { archived } = req.params

                let team, teamId

                if (req.session.team) {
                    team = await Team.fetch(res.session, { _id: req.session.team })
                    teamId = team.id
                }


                /* STEP 1: Set up Select, Join and Count Default States */

                const applyJoins = query => {

                    const nameSubQuery = subQuery(db.person, 'names', 'since', 'personId')
                    const addressSubQuery = subQuery(db.carrier, 'application_addresses', 'since', 'appId')
                    const companySubQuery = subQuery(db.business, 'company_names', 'since', 'companyId')

                    query
                        .leftJoin(`${db.carrier}.drivers AS drv`, 'drv.id', 'apl.driverId')
                        .leftJoin(`${db.person}.individuals AS psn`, 'psn.id', 'drv.personId')
                        .leftJoin(
                            knex.raw('? AS nms', [ nameSubQuery ]),
                            'nms.personId',
                            'psn.id'
                        )
                        .leftJoin(
                            knex.raw('? AS addr', [ addressSubQuery ]),
                            'addr.appId',
                            'apl.id'
                        )
                        .leftJoin(`${db.carrier}.application_DLs AS dl`, 'dl.appId', 'apl.id')
                        .leftJoin(`${db.carrier}.application_beneficiaries AS benef`, 'benef.appId', 'apl.id')
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
                        'apl.gender',
                        'apl.email',
                        'apl.phone',
                        'apl.marital',
                        'apl.medCard',
                        'apl.dui',
                        'apl.criminal',
                        'apl.dotDat',
                        'apl.citations',
                        'apl.accidents',
                        'apl.activeBusiness',
                        'psn.dob AS originalDob',
                        'psn.gender AS originalGender',
                        'nms.firstName AS originalFirstName',
                        'nms.middleName AS originalMiddleName',
                        'nms.lastName AS originalLastName',
                        'nms.suffix AS originalSuffix',
                        'addr.state',
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

                if (filter?.carriers) {
                    filter.carriers = filter.carriers.split(',')

                    if (filter.carriers.length && !filter.carriers.includes('null')) {
                        filterParams.company.nullable = false
                        filterParams.company.whereCond = 'where'
                    }

                    await Promise.all(filter.carriers.map(async (_id) => {
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
                    if (!filter?.carriers || carrierIds.length)
                        this[whereCond](function() {
                            this.where('cmp.confirmed', true)
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
                    stepLen: Application.list.step.length,
                    sessionUser: {
                        _id: sessionUser._id,
                        DS: sessionUser.DS,
                    },
                    // _sessionUserId: res.session.user._id,
                })
            } catch (err) {
                sendError.server(req, res, err)
            }
        }


    }


}



class Citation {
    constructor(data = {}, { single = true, session, hideRawId = false }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Citation Data')
    }

    static #algorithm = 'MD5'
    static hashId = (field = 'id') => hash(field, Citation.#algorithm)
    static matchIdHash = value => matchHash(value, Citation.#algorithm)


    static list = {

        violation: {
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
        },

    }


}



class Accident {
    constructor(data = {}, { single = true, session, hideRawId = false }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Accident Data')
    }

    static #algorithm = 'MD5'
    static hashId = (field = 'id') => hash(field, Accident.#algorithm)
    static matchIdHash = value => matchHash(value, Accident.#algorithm)


    static list = {

        collision: {
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
        },

    }


}



class Employment {
    constructor(data = {}, { single = true, session, hideRawId = false }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Employer Data')

    }

    static #algorithm = 'MD5'
    static hashId = (field = 'id') => hash(field, Employment.#algorithm)
    static matchIdHash = value => matchHash(value, Employment.#algorithm)


}



class DriverUser {


    static mw = {


        login: async (req, res) => {},


        session: async (req, res) => {},


        verify: async (req, res, next) => {},


        logout: (req, res) => {
            if (req.session.user) delete req.session.user
            if (res.session.user) delete res.session.user

            return req.session.destroy((err) => {
                if (err) return res.status(500).send('Failed to log out')

                res.redirect('/')
            })
        },


    }


}



export default Driver
export { Application, Citation, Accident, Employment, DriverUser }