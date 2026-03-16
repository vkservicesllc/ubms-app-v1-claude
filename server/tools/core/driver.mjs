/* Settings */
import { addrBook } from '../../../config.mjs'
import db, { query } from '../../settings/mysql.mjs'

/* Tools */
import moment from 'moment'
import { utc2tz, tz2utc, utcTimeStamp } from '../utils/date.mjs'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import Individual from './individual.mjs'
import Team from './team.mjs'
import User from './user.mjs'
import Carrier from './carrier.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import { classInstance, classStatic } from '../utils/class.mjs'
import transporter, { senderParams } from '../utils/nodemailer.mjs'
import { generateRandomString } from '../utils/string.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import bool from '../../../client/global/modules/tools/utils/boolean.mjs'
import { tel as formatTel } from '../../../client/global/modules/tools/utils/formatter.mjs'
// import { application } from '../../includes/driver'
import { selectAES, processAES, unprocessAES } from '../utils/data.mjs'

const mysql = require('../utils/mysql')



class Driver extends Individual {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Driver Data')

        super(data, { single, hideRawId, hideSensitive })

        const {
            id, _id, personId, _personId, blackListed,
            complete, prevCountry, expDate, cache,
        } = data
        const properties = {
            first: { _id, _personId },
            last: {
                appDef: { complete: !!complete, prevCountry, expDate, cache },
                comparator: {
                    mec: data.mecUntil,
                },
            },
        }
        if (!hideRawId) {
            properties.first.id = id
            properties.last.personId = personId
        }
        properties.first.blackListed = blackListed

        reSuper(this, properties.first, properties.last)

        if (single) {
            this.session = session
            this.config = { hideRawId, hideSensitive }

            this.add = (target, body) => classInstance.add(this, new.target, target, body)

            this.fetch = (target, filter, params) => classInstance.fetch(this, new.target, target, filter, params)

            this.update = (targetOrBody, body, match) => classInstance.update(this, new.target, targetOrBody, body, match)

            this.delete = (target, match) => classInstance.delete(this, new.target, target, match)

            this.log = params => classInstance.log(this, new.target, params)
        }
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
        { hideRawId = false, sorts = Driver.config().defSorts, limit, mode } = {}
    ) => {
        const join = [ 'personId', 'id', {
            table: query.person.main.table,
            max: 'since',
        } ]

        return classStatic.fetch(this, session, filter, { hideRawId, sorts, limit, mode }, {
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
                    table: query.driver.appDef.table,
                    fields: [ 'complete', 'prevCountry', 'expDate', 'cache' ],
                    join: [ 'driverId', 'id' ],
                },
                {
                    db: db.person,
                    table: query.person.main.table,
                    fields: [ 'dob', 'gender', selectAES('ssn') ],
                    join: [ 'id', 'personId' ],
                    search: [ null, selectAES('ssn') ],
                },
                {
                    db: db.person,
                    table: query.person.names.table,
                    fields: [
                        'prefix',
                        'firstName',
                        'middleName',
                        'lastName',
                        'suffix',
                    ],
                    join,
                    search: [ null, [ 'lastName', 'firstName' ] ],
                },
                {
                    db: db.person,
                    table: query.person.legal.table,
                    fields: [ 'status', [ 'expiresOn', 'statusExpiredOn' ] ],
                    join,
                },
                {
                    db: db.person,
                    table: query.person.maritals.table,
                    fields: [ [ 'status', 'marital' ] ],
                    join,
                },
                {
                    db: db.person,
                    table: query.person.addresses.table,
                    fields: [ 'address1', 'address2', 'city', 'state', 'zip' ],
                    join,
                },
                {
                    db: db.person,
                    table: query.person.phones.table,
                    fields: 'phone',
                    join,
                    search: [ null, 'phone' ],
                },
                {
                    db: db.person,
                    table: query.person.emails.table,
                    fields: 'email',
                    join,
                    search: [ null, 'email' ],
                },
                {
                    db: db.person,
                    table: query.person.identifications.table,
                    fields: [
                        'driver',
                        'commercial',
                        [ 'number', 'idNumber' ],
                        [ 'class', 'idClass' ],
                        [ 'state', 'idState' ],
                        [ 'issuedOn', 'idIssuedOn' ],
                        [ 'expiresOn', 'idExpiresOn' ],
                        [ 'endorsement', 'idEndorsement' ],
                        [ 'restriction', 'idRestriction' ],
                    ],
                    join: [ 'personId', 'id', {
                        table: query.person.main.table,
                        max: 'issuedOn',
                    } ],
                },
                {
                    table: query.driver.mecs.table,
                    fields: [ [ 'expiresOn', 'mecUntil' ] ],
                    join: [ 'driverId', 'id', { max: 'expiresOn' } ],
                },
                //? need other props ???
            ],
            prepare(batch, filter, session) {
                const { DS = false } = session?.user || {}
                const {
                    id, _id, personId, _personId, ssn,
                    blackListed, teamId, _teamId,
                } = filter
                const single = !!id || !!_id || !!personId || !!_personId || !!ssn

                batch[0].match = { id, personId, blackListed }
                if (!id && _id) batch[0].match.id = Driver.matchIdHash(_id)
                if (!personId && _personId) batch[0].match.personId = Individual.matchIdHash(_personId)

                if (ssn) batch[2].match = { ssn: processAES('ssn', ssn) }

                if (!single) {
                    batch.push({
                        table: query.driver_application.main.table,
                        join: [ 'driverId', 'id', { type: 'inner' } ],
                    },
                    {
                        db: db.online,
                        table: query.team.main.table,
                        join: [ 'id', 'teamId', query.driver_application.main.table ],
                    })

                    const teamIdx = batch.length - 1
                    const appIdx = teamIdx - 1

                    if (teamId || _teamId)
                        batch[appIdx].match = { teamId: teamId || Team.matchIdHash(_teamId) }
                    else if (!DS) batch[teamIdx].match = { scoped: [ false, null ] }
                }

                return { single, batch }
            },
        })
    }


    static count = async (session, filter = {}) => {
        if (!session?.user?.id) return 0

        delete filter.id
        delete filter._id
        delete filter.personId
        delete filter._personId
        delete filter.search

        const batch = await Driver.fetch(session, filter, { mode: 'batch' })

        const [ rows ] = await mysql.execute(Query.count(db.carrier, batch))
        return rows[0].count
    }


    static list = {

        position: {
            'CD': 'Company Driver',
            'OO': 'Owner-Operator',
            'LP': 'Lease-Purchase Driver',
            'OD': "Owner's Driver",
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
        this.formId = data.formId

        if (data.matchNameSince)
            this.matcher = {
                nameSince: data.matchNameSince,
                legalSince: data.matchLegalSince,
                maritalSince: data.matchMaritalSince,
                phoneSince: data.matchPhoneSince,
                emailSince: data.matchEmailSince,
                addrSince: data.matchAddrSince,
                dlId: data.matchDlId,
                mecUntil: data.matchMecUntil,
                busId: data.matchBusId,
            }

        this.cdlRole = data.cdlRole
        this.position = data.position
        this.condition = data.condition
        this.locked = data.locked
        this.step = data.step
        this.rehire = data.rehire

        if (data.leadLastName || data.leadSsn) {
            this.lead = {
                prefix: data.leadPrefix,
                firstName: data.leadFirstName,
                middleName: data.leadMiddleName,
                lastName: data.leadLastName,
                suffix: data.leadSuffix,
                gender: data.leadGender,
                dob: data.leadDob,
            }
            if (this.lead.firstName && this.lead.lastName)
                this.lead = new Person(this.lead)
            this.lead.email = data.leadEmail
            this.lead.phone = data.leadPhone
            // this.lead.position = data.leadPosition
            if (!hideSensitive) this.lead.ssn = stringifyBuffer(data.leadSsn)
            this.lead._personId = data._leadPersonId
            if (!hideRawId) this.lead.personId = data.personId
        }

        this.appliedAt = utc2tz(data.createdAt)
        this.appliedOn = utc2tz(data.createdAt, true)
        this.finishedAt = utc2tz(data.finishedAt)
        this.finishedOn = utc2tz(data.finishedAt, true)
        this.reviewedAt = utc2tz(data.reviewedAt)
        this.reviewedOn = utc2tz(data.reviewedAt, true)

        this.prefix = data.prefix
        this.firstName = data.firstName
        this.middleName = data.middleName
        this.lastName = data.lastName
        this.suffix = data.suffix
        this.dob = data.dob
        this.gender = data.gender
        if (!hideSensitive) this.ssn = stringifyBuffer(data.ssn)

        const person = data.firstName && data.lastName ? new Person(data) : null
        this.name = person ? person.fullName() : null
        this.fullName = person ? person.fullName('FMLs') : null

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

        if (data.decExperience || data.decPosition)
            this.decision = {
                experience: data.decExperience,
                position: data.decPosition,
            }

        this.legalStatus = [ data.legalStatus, data.legalExpiration ]
        this.marital = data.marital

        this.email = data.email
        this.phone = data.phone
        this.address = new Address(data)

        if (this?.address?.zip) {
            this.address.complete = !!data.addrComplete
            this.address.enough = !!data.addrEnough
            this.address.livedAbroad = bool(data.livedAbroad)
            this.address.since = data.addrSince
            this.address.country = data.prevCountry
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

        this.medCard = bool(data.medCard)
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
                firstDate: data.expDate,
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

            this.preference.expansion = {
                operType: { s: 'Solo', t: 'Team' }[data.operType],
            }
        }

        this.activeBusiness = bool(data.activeBusiness)
        if (this.activeBusiness) {
            this.business = {
                busName: data.ownBusName,
                coType: data.ownCoType,
                state: data.busState,
            }
            if (!hideSensitive) this.business.ein = stringifyBuffer(data.busEin)
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
                prefix: data.benefPrefix,
                firstName: data.benefFirstName,
                middleName: data.benefMiddleName,
                lastName: data.benefLastName,
                suffix: data.benefSuffix,
                relation: relation,
                otherRel: otherRel,
                phone: data.benefPhone,
            }
            if (!hideSensitive) this.beneficiary.ssn = stringifyBuffer(data.benefSsn)
        }

        if (data.emergPhone)
            this.emergency = {
                phone: data.emergPhone,
                name: data.emergName,
                relation: data.emergRelation,
            }

        if (data.coAlias) {
            this.carrier = {
                name: `${data.coBusName}, ${data.coCoType}`,
                alias: data.coAlias,
                address: new Address({
                    address1: data.coAddress1,
                    address2: data.coAddress2,
                    city: data.coCity,
                    state: data.coState,
                    zip: data.coZip,
                }),
                phone: data.coPhone,
                fax: data.coFax,
            }
            this.owner = new Person({
                prefix: data.ownerPrefix,
                firstName: data.ownerFirstName,
                middleName: data.ownerMiddleName,
                lastName: data.ownerLastName,
                suffix: data.ownerSuffix,
            })
        }

        if (data.userLastName) {
            const user = new Person({
                firstName: data.userFirstName,
                lastName: data.userLastName,
                alias: data.userAlias,
            })
            this.user = {
                name: user.fullName('AL'),
                shortName: user.fullName('Al'),
                condition: data.userCondition,
                location: data.userLocation,
                deleted: !!data.userDeletedAt,
            }
        }

        if (data.teamName)
            this.team = {
                name: data.teamName,
            }

        this.expansion = {
            position: this.position ? Driver.list.position[this.position] : null,
            gender: person?.expansion?.gender || null,
        }

        this.signature = {
            applicant: data.applicant_,
            recruiter: data.recruiter_,
        }

        if (single) {
            this.session = session
            this.config = { hideRawId, hideSensitive }


            this.register = async body => {
                if (this.driverId || this.rehire || !this?.lead?.ssn || !this?.lead?.dob) return

                const {
                    prefix, firstName, middleName, lastName, suffix, gender,
                    phone, email, address, marital, legalStatus: status, legalExpiration: expiresOn,
                } = body
                const { ssn, dob } = this.lead
                const since = dob
                let step = 1, addrComplete = false
                const { enough } = address
                delete address.enough
                if (!enough) step = 0
                else addrComplete = true

                let person = await Individual.fetch(this.session, { ssn }) //? Technically it is checked before in create
                if (!person) {
                    person = (await Individual.create(this.session, {
                        ssn, dob, gender,
                        prefix, firstName, middleName, lastName, suffix,
                    })).data

                    await person.add('phones', { since, phone })
                    await person.add('emails', { since, email })
                    await person.add('addresses', address)
                    await person.add('maritals', { since, status: marital })
                    await person.add('legal', { since, status, expiresOn })

                    person = await Individual.fetch(this.session, { id: person.id })
                }

                const personId = person.id
                const driver = (await Driver.create(this.session, { personId })).data
                if (!driver) throw new Error('Failed to create driver')

                const cache = { appliedAt: tz2utc(this.appliedAt), step, addrEnough: enough }

                const driverId = driver.id
                await this.update({ driverId, step, public: true, addrComplete })
                await this.update('matcher', {
                    personId, driverId,
                    nameSince: person.comparator.name, legalSince: person.comparator.legal, maritalSince: person.comparator.marital,
                    phoneSince: person.comparator.phone, emailSince: person.comparator.email, addrSince: person.comparator.address,
                }, {}, { skipLog: true })
                await this.add('addresses', { personId: person.id, since: person.comparator.address, enough })
                await driver.add('appDef', { cache })

                const application = await Application.fetch(this.session, { id: this.id })
                await application.welcome()
            }


            this.add = (target, body) => classInstance.add(this, new.target, target, body)


            this.fetch = async (target, filter = {}, { hideRawId = false } = {}) => {
                const person = await Individual.fetch(this.session, { id: this.personId || Individual.matchIdHash(this._personId) })
                if (!person) throw new Error('Person not found')

                const driver = await Driver.fetch(this.session, { id: this.driverId || Driver.matchIdHash(this._driverId )})
                if (!driver) throw new Error('Driver not found')

                let single = false, batch = []

                switch (target) {

                    case 'addresses':
                        {
                            let { since } = filter
                            if (since) single = true
                            else since = { not: this.address.since }

                            batch = [
                                {
                                    table: query.driver_application.addresses.table,
                                    fields: [ 'since', 'enough', 'livedAbroad' ],
                                    match: { appId: this.id || Application.matchIdHash(this._id), since },
                                    sort: { desc: 'since' },
                                },
                                {
                                    db: db.person,
                                    table: query.person.addresses.table,
                                    fields: [ 'address1', 'address2', 'city', 'state', 'zip' ],
                                    join: [ 'personId', 'personId', 0, [ 'since', 'since' ] ],
                                },
                            ]
                        }
                        break

                    case 'citations':
                        {
                            batch = [
                                {
                                    table: query.driver_application.citations.table,
                                    match: { appId: this.id || Application.matchIdHash(this._id) },
                                },
                                {
                                    table: query.driver.citations.table,
                                    fields: [ hash('id'), 'violation', 'other', 'citedOn', 'state' ],
                                    join: [ 'id', 'citId' ],
                                    sort: { desc: 'citedOn' },
                                },
                            ]
                            if (!hideRawId) batch[1].fields.unshift('id')

                            const { id, _id } = filter
                            if (id || _id) {
                                single = true
                                batch[1].match = { id: id || matchHash(_id) }
                            }
                        }
                        break

                    case 'accidents':
                        {
                            batch = [
                                {
                                    table: query.driver_application.accidents.table,
                                    match: { appId: this.id || Application.matchIdHash(this._id) },
                                },
                                {
                                    table: query.driver.accidents.table,
                                    fields: [ hash('id'), 'collision', 'other', 'date', 'state', 'injuries', 'fatalities' ],
                                    join: [ 'id', 'accId' ],
                                    sort: { desc: 'date' },
                                },
                            ]
                            if (!hideRawId) batch[1].fields.unshift('id')

                            const { id, _id } = filter
                            if (id || _id) {
                                single = true
                                batch[1].match = { id: id || matchHash(_id) }
                            }
                        }
                        break

                    case 'employments':
                        {
                            batch = [
                                {
                                    table: query.driver_employment.verifications.table,
                                    fields: [
                                        'verify', 'status',
                                        //! decide if more fields needed
                                        //? this may be enough for this fetch
                                    ],
                                    match: { appId: this.id || Application.matchIdHash(this._id) },
                                },
                                {
                                    table: query.driver_employment.main.table,
                                    fields: [
                                        Employment.hashId(), 'locked',
                                        'employer', 'phone',
                                        'address1', 'address2', 'city', 'state', 'zip',
                                        'startedOn', 'position', 'earnings', 'fmcsr', 'dotDat',
                                        'rfl', 'leftOn', 'gapExpl',
                                    ],
                                    join: [ 'id', 'emplId' ],
                                },
                            ]
                            if (!hideRawId) batch[1].fields.unshift('id')

                            const { id, _id } = filter
                            if (id || _id) {
                                single = true
                                batch[1].match = { id: id || matchHash(_id) }
                            }
                        }
                        break

                }

                const [ rows ] = await mysql.execute(Query.select(db.carrier, batch))

                return single ? rows[0] : rows
            }


            this.update = (targetOrBody, body, match, options) => {
                const application = this

                return classInstance.update(this, new.target, targetOrBody, body, match, {
                    ...options,
                    // async final(inst, body, target) {
                    //     if (target !== 'main' || !body.ssn) return

                    //     let { ssn } = body
                    //     if (typeof ssn === 'object') {
                    //         ssn = ssn.aes[0]
                    //         body.ssn = ssn
                    //     }

                    //     let person = await Individual.fetch(session, { ssn })

                    //     if (!person) {
                    //         if (!body.firstName || !body.lastName) {
                    //             body.firstName = inst.firstName
                    //             body.middleName = inst.middleName
                    //             body.lastName = inst.lastName
                    //         }
                    //         if (!body.dob) body.dob = inst.dob
                    //         if (!body.gender) body.gender = inst.gender

                    //         person = (await Individual.create(session, body)).data
                    //         if (!person) throw new Error('Failed to create person')
                    //     }

                    //     let driver = await Driver.fetch(session, { personId: person.id })
                    //     if (!driver) driver = (await Driver.create(session, { personId: person.id })).data
                    //     if (!driver) throw new Error('Failed to fetch or create driver')

                    //     const updateBody = { driverId: driver.id }
                    //     if (inst.step === 0) updateBody.step = 1
                    //     await inst.update(updateBody)
                    // },
                })
            }


            this.delete = (target, match = {}) => classInstance.delete(this, new.target, target, match)


            this.progress = async (step, body, rehire = false) => {
                // const { branch, siteId } = this.session
                // const modifiedBy = this.session?.user?.id || null
                // let createdIn = { branch }
                // if (siteId) createdIn.siteId = siteId
                // createdIn = JSON.stringify(createdIn)

                const vehicleRecord = async (application, body, cache = {}) => {
                    if (application.position !== 'OO') {
                        await application.delete('vehicle')
                        delete cache.vehicle
                    } else {
                        if (body.mmt) {
                            if (body.mmt !== 'other') {
                                body.type = null
                                body.make = null
                                body.model = null

                                if (body.mmt.split(':')[0] !== 'straightBox') body.length = null
                            } else {
                                if (body.type !== 'straightBox') body.length = null
                            }
                        }
                        cache.vehicle = { ...body }

                        await application[application.vehicle ? 'update' : 'add']('vehicle', body)
                    }

                    return cache
                }

                if (rehire !== true) {
                    const person = await Individual.fetch(this.session, { id: this.personId || Individual.matchHash(this._personId) })
                    if (!person) throw new Error('Person not found')

                    const driver = await Driver.fetch(this.session, { id: this.driverId || Driver.matchIdHash(this._driverId )})
                    if (!driver) throw new Error('Driver not found')

                    let { cache } = driver.appDef
                    if (!cache) cache = {}

                    switch (step) {


                        case 'profile':
                            {
                                const { prefix, firstName, middleName, lastName, suffix, dob, gender, marital, phone, email } = body
                                let { nameSince, maritalSince, phoneSince, emailSince } = this.matcher

                                const matcherData = {}

                                if (dob !== this.dob) {
                                    if (nameSince === this.dob) matcherData.nameSince = dob
                                    if (maritalSince === this.dob) matcherData.maritalSince = dob
                                    if (phoneSince === this.dob) matcherData.phoneSince = dob
                                    if (emailSince === this.dob) matcherData.emailSince = dob
                                }

                                await person.update({ dob, gender })
                                await person.update('names', { prefix, firstName, middleName, lastName, suffix }, { since: nameSince })
                                await person.update('maritals', { status: marital }, { since: maritalSince })
                                await person.update('phones', { phone }, { since: phoneSince })
                                await person.update('emails', { email }, { since: emailSince })
                                if (Object.keys(matcherData).length) await this.update('matcher', matcherData)
                            }
                            break


                        case 'residence':
                            {
                                const { address, addresses, prevCountry = null } = body
                                const { since, enough, livedAbroad, address1, address2, city, state, zip } = address
                                const { personId = person.id } = this

                                await person.update('addresses', { since, address1, address2, city, state, zip }, {
                                    since: this.matcher.addrSince,
                                })
                                await this.update('addresses', { enough, livedAbroad }, { since }) //? since cascaded on update in db

                                body = {
                                    main: { addrComplete: true },
                                    appDef: { prevCountry },
                                }
                                if (this.step === 0) {
                                    body.main.step = 1
                                    cache.step = 1
                                }
                                cache.addrComplete = true
                                cache.addrEnough = enough
                                cache.livedAbroad = !!prevCountry

                                await person.delete('addresses', { since: { not: since } })
                                if (addresses) {
                                    const { address1, address2, zip, city, state, since, enough, livedAbroad } = addresses
                                    const count = zip.length

                                    for (let i = 0; i < count; i++) {
                                        await person.add('addresses', {
                                            since: since[i],
                                            address1: address1[i],
                                            address2: address2[i],
                                            city: city[i],
                                            state: state[i],
                                            zip: zip[i],
                                        })
                                        this.add('addresses', {
                                            personId,
                                            since: since[i],
                                            enough: enough[i],
                                            livedAbroad: typeof livedAbroad?.[i] === 'boolean' ? livedAbroad[i] : null,
                                        })
                                        cache.addrEnough = enough[i]
                                    }
                                }

                                body.appDef.cache = cache //? JSON.stringify(cache)

                                await this.update(body.main)
                                await driver.update('appDef', body.appDef)
                            }
                            break


                        case 'driver-license': //! NOT FULLY TESTED
                            {
                                if (!body.dlDenied) body.dlDeniedExpl = null
                                if (!body.dlRevoked) body.dlRevokedExpl = null

                                const { dlDenied, dlRevoked, dlDeniedExpl, dlRevokedExpl } = body
                                delete body.dlDenied
                                delete body.dlRevoked
                                delete body.dlDeniedExpl
                                delete body.dlRevokedExpl

                                body = {
                                    dl: body,
                                    main: { dlDenied, dlRevoked, dlDeniedExpl, dlRevokedExpl },
                                }

                                let dlId

                                //* Attempt to Avoid Dublicates (NOT GUARANTEED)
                                const identifications = await person.fetch('identifications')
                                if (identifications.length)
                                    for (const card of identifications) {
                                        if (!card.driver) continue
                                        if (!!card.commercial !== !!body.dl.commercial) continue
                                        if (card.number !== body.dl.number) continue
                                        if (card.class !== body.dl.class) continue
                                        if (card.state !== body.dl.state) continue
                                        if (card.issuedOn !== body.dl.issuedOn) continue
                                        if (card.expiresOn !== body.dl.expiresOn) continue
                                        dlId = card.id
                                    }

                                if (!this.dl) {
                                    if (!dlId) {
                                        const { insertId } = await person.add('identifications', body.dl)
                                        if (!insertId) throw new Error("Failed to add driver's license")

                                        dlId = insertId
                                    }
                                    body.main.step = 2
                                    cache.step = 2
                                } else {
                                    if (!dlId) await person.update('identifications', body.dl, { id: this.matcher.dlId })
                                }

                                await this.update('matcher', { dlId })
                                await this.update(body.main)

                                cache.dlId = dlId
                                cache.dlExpiresOn = body.dl.expiresOn
                                cache.dlDenied = dlDenied
                                cache.dlRevoked = dlRevoked
                                cache.dlDeniedExpl = dlDeniedExpl || null
                                cache.dlRevokedExpl = dlRevokedExpl || null

                                //? cache = JSON.stringify(cache)
                                await driver.update('appDef', { cache })
                            }
                            break


                        case 'medical-card': //! NOT FULLY TESTED
                            {
                                const { expiresOn, issuedOn, nrcme, mecAbsent } = body
                                delete body.expiresOn
                                delete body.issuedOn
                                delete body.nrcme
                                delete body.mecAbsent

                                if (!body.underMeds) body.medList = null
                                body.medCard = !mecAbsent

                                body = {
                                    main: body,
                                    mec: { expiresOn, issuedOn, nrcme },
                                    matcher: { mecUntil: expiresOn || null },
                                }

                                if (this.step < 3) {
                                    body.main.step = 3
                                    cache.step = 3
                                }

                                const match = { expiresOn: this.matcher.mecUntil }

                                if (expiresOn) {
                                    if (this.medCard) await driver.update('mecs', body.mec, match)
                                    else await driver.add('mecs', body.mec)
                                } else await driver.delete('mecs', match)

                                await this.update('matcher', body.matcher)
                                await this.update(body.main)

                                cache.mecUntil = expiresOn || null
                                cache.medCard = body.main.medCard
                                cache.underMeds = body.main.underMeds
                                cache.medList = body.main.medList || null

                                //? cache = JSON.stringify(cache)
                                await driver.update('appDef', { cache })
                            }
                            break


                        case 'legal-compliance': //! NOT FULLY TESTED
                            {
                                if (!body.dui) body.duiInDecade = null
                                if (!body.criminal) body.criminalExpl = null

                                const { violation, other, citedOn, state } = body
                                delete body.violation
                                delete body.other
                                delete body.citedOn
                                delete body.state
                                if (!violation && body.citations) body.citations = false

                                if (this.step < 4) {
                                    body.step = 4
                                    cache.step = 4
                                }

                                cache.dui = body.dui
                                cache.duiInDecade = body.duiInDecade
                                cache.criminal = body.criminal
                                cache.criminalExpl = body.criminalExpl
                                cache.dotDat = body.dotDat
                                cache.citations = body.citations
                                cache.citIds = []

                                if (body.citations) {
                                    const count = violation.length

                                    await driver.delete('citations') //* Cascades on delete in application citations
                                    for (let i = 0; i < count; i++) {
                                        const { insertId: citId } = await driver.add('citations', {
                                            violation: violation[i],
                                            other: violation[i] === 'other' ? other?.[i] : null,
                                            citedOn: citedOn[i],
                                            state: state[i],
                                        })
                                        if (!citId) throw new Error('Failed adding citation')
                                        await this.add('citations', { citId })
                                        cache.citIds.push(citId)
                                    }
                                }

                                await this.update(body)

                                //? cache = JSON.stringify(cache)
                                await driver.update('appDef', { cache })
                            }
                            break


                        case 'safety': //! NOT FULLY TESTED
                            {
                                const { accidents, collision, other, date, state, injuries, fatalities } = body
                                body = { accidents }
                                if (!collision && body.accidents) body.accidents = false

                                if (this.step < 5) {
                                    body.step = 5
                                    cache.step = 5
                                }

                                cache.accidents = body.accidents
                                cache.accIds = []

                                if (body.accidents) {
                                    const count = collision.length

                                    await driver.delete('accidents') //* Cascades on delete in application accidents
                                    for (let i = 0; i < count; i++) {
                                        const { insertId: accId } = await driver.add('accidents', {
                                            collision: collision[i],
                                            other: collision[i] === 'other' ? other?.[i] : null,
                                            date: date[i],
                                            state: state[i],
                                            injuries: injuries[i],
                                            fatalities: fatalities[i],
                                        })
                                        if (!accId) throw new Error('Failed adding accident')
                                        await this.add('accidents', { accId })
                                        cache.accIds.push(accId)
                                    }
                                }

                                await this.update(body)

                                //? cache = JSON.stringify(cache)
                                await driver.update('appDef', { cache })
                            }
                            break


                        case 'experience': //! NOT FULLY TESTED
                            {
                                const experience = body.noExp !== true
                                const prevEmployed = experience === true ? true : this.prevEmployed
                                let { cdlSchool } = body
                                const { cmv, vehicles = {}, firstDate = null, lastDate, mileage, hours } = body
                                const { name, phone, state, endDate, duration } = body
                                if (cdlSchool === undefined) cdlSchool = null

                                let { misc } = vehicles
                                if (misc) {
                                    if (!cmv) { //* VERY IMPORTANT! If other non-cmv types are added, they must be deleted also
                                        delete misc.tandem
                                    }

                                    misc = Object.keys(misc)
                                    vehicles.misc = misc
                                }
                                if (!cmv) delete vehicles.semi

                                body = {
                                    main: { experience, cdlSchool, prevEmployed },
                                    appDef: { expDate: firstDate },
                                    experience: { cmv, vehicles, lastDate, mileage, hours },
                                    school: { name, phone, state, endDate, duration },
                                }

                                if (this.step < 6) {
                                    body.main.step = 6
                                    cache.step = 6
                                }

                                cache.experience = experience ? { ...body.experience } : false
                                cache.cdlSchool = cdlSchool
                                cache.prevEmployed

                                body.appDef.cache = cache

                                if (experience) await this[this.experience ? 'update' : 'add']('experience', body.experience)
                                else {
                                    await this.delete('experience')
                                    body.appDef.expDate = null
                                }

                                if (cdlSchool) await driver[this.cdlSchool ? 'update' : 'add']('school', body.school)
                                else await driver.delete('school')

                                await this.update(body.main)
                                await driver.update('appDef', body.appDef)
                            }
                            break


                        case 'prev-employment': //! NOT FULLY TESTED
                            {
                                delete body.explGap
                                if (this.step < 7) {
                                    body.step = 7
                                    cache.step = 7
                                }
                                cache.prevEmployed = body.prevEmployed

                                if (!body.prevEmployed) await mysql.execute(query.driver_employment.main.delete({ driverId: driver.id }))
                                await this.update(body)
                                await driver.update('appDef', { cache })
                            }
                            break


                        case 'preference':
                            {
                                if (body.operType === 's' || !this.cdlRole) {
                                    body.teamName = null
                                    body.teamPhone = null
                                }

                                if (!this.cdlRole) {
                                    body.haulRegion = null
                                    body.equipment = null
                                }
                                cache.preference = { ...body }

                                await this[this.preference ? 'update' : 'add']('preference', body)

                                if (this.step < 8) {
                                    await this.update({ step: 8 })
                                    cache.step = 8
                                }

                                await driver.update('appDef', { cache })
                            }
                            break


                        case 'business': //! NOT TESTED
                            {
                                let { activeLLC } = body
                                const {
                                    inactiveLLC, busName, state, ein,
                                    mmt, type, make, model, year, length,
                                } = body
                                if (inactiveLLC) activeLLC = false
                                else if (activeLLC === undefined) activeLLC = true

                                body = { activeBusiness: activeLLC }
                                if (this.step < 9) {
                                    body.step = 9
                                    cache.step = 9
                                }

                                // if (activeLLC) await this[this.activeBusiness ? 'update' : 'add']('business', { busName, state, ein })
                                // else await this.delete('business')
                                let busId = this.matcher.busId
                                if (activeLLC) {
                                    const busBody = { busName, state, ein }
                                    if (!this.activeBusiness) {
                                        const { insertId } = await driver.add('businesses', busBody)
                                        if (!insertId) throw new Error("Failed to add driver's business")

                                        busId = insertId
                                    } else await driver.update('businesses', busBody, { id: busId })
                                } else {
                                    await driver.delete('businesses', { id: busId }) //* No need to filter since it is not rehire
                                    busId = null
                                }

                                //* Driver Application only (when type is defined)
                                cache = await vehicleRecord(this, { mmt, type, make, model, year, length }, cache)

                                await this.update(body)
                                await this.update('matcher', { busId })
                                await driver.update('appDef', { cache })
                            }
                            break


                        case 'beneficiary':
                            {
                                if (body.relation !== 'Other') body.otherRel = null

                                cache.beneficiary = { ...body }
                                if (!this.beneficiary) {
                                    await this.add('beneficiary', body)
                                    await this.update({ step: 10 })
                                    cache.step = 10
                                } else await this.update('beneficiary', body)

                                await driver.update('appDef', { cache })
                            }
                            break


                        case 'misc':
                            {
                                cache.emergency = { ...body }
                                if (!this.emergency) {
                                    await this.add('emergency', body)
                                    await this.update({ step: 11 })
                                    cache.step = 10
                                } else await this.update('emergency', body)

                                await driver.update('appDef', { cache })
                            }
                            break


                        case 'certify':
                            {
                                if (this.step < 12) await this.update({ step: 12 })
                            }
                            break


                        case 'legal-status': //* Carrier UI only (no step)
                            {
                                const { legalSince } = this.matcher
                                if (body.legalStatus < 2) body.legalExpiration = null

                                const { legalStatus: status, legalExpiration: expiresOn } = body
                                await person.update('legal', { status, expiresOn }, { since: legalSince })
                            }
                            break


                        case 'position': //* Carrier UI only (no step)
                            {
                                const { position, mmt, type, make, model, year, length } = body

                                await this.update({ position })
                                this.position = position
                                await vehicleRecord(this, { mmt, type, make, model, year, length })
                            }
                            break


                        case 'workflow': //* Carrier UI only
                            {
                                const { _userId, _carrierId, _teamId, condition, experience, position } = body
                                body = { main: {}, matcher: {}, decision: {} }

                                if (_carrierId && _carrierId !== this._carrierId) {
                                    const carrier = await Carrier.fetch(this.session, { _id: _carrierId })
                                    if (!carrier) throw new Error('Carrier not found')

                                    body.main.carrierId = carrier.id
                                    body.matcher.companyId = carrier.companyId
                                    body.matcher.ownerId = carrier.owner.id
                                    body.matcher.owPersonId = carrier.owner.personId
                                    body.matcher.coNameSince = carrier.comparator.name
                                    body.matcher.coAddrSince = carrier.comparator.address
                                    body.matcher.coPhoneSince = carrier.comparator.phone
                                    body.matcher.coFaxSince = carrier.comparator.fax
                                    body.matcher.coOwnerSince = carrier.comparator.ownership
                                    body.matcher.owNameSince = carrier.owner.comparator.name
                                }

                                if (_teamId && _teamId !== this._teamId) {
                                    const team = await Team.fetch(this.session, { _id: _teamId })
                                    body.main.teamId = team.id
                                }

                                await this.update(body.main)
                                await this.update('matcher', body.matcher)
                            }
                            break


                    }
                }
            }


            this.submit = async () => {
                const employments = await Employment.fetch(this.session, { appId: this.id })
                const today = moment()
                const appId = this.id

                for (const employment of employments) {
                    const { id: emplId } = employment
                    let { leftOn } = employment

                    leftOn = moment(leftOn || undefined)
                    const diff = today.diff(leftOn, 'years')
                    const verify = diff <= 3

                    await mysql.execute(query.driver_employment.verifications.update({ verify }, { emplId, appId }))
                }

                if (this.condition === 'p' && this.step === 12)
                    await this.update({ condition: 'c', finishedAt: utcTimeStamp() })
            }


            this.sign = async (target = 'applicant') => {
                let signature = null

                switch (target) {
                    case 'applicant':
                        signature = new Person(this).fullName()
                        break
                }

                await this.update({ [`${target}_`]: signature })
            }


            this.welcome = async () => {
                if (!this._driverId) return

                const { fullName, formId, carrier, team, _teamId } = this
                let { email } = this
                let { from } = senderParams
                const url = `/application/${formId}`
                let companyName

                if (!email) email = this?.lead?.email
                if (!email) return

                if (carrier?.name) companyName = carrier.name
                else if (team?.name) {
                    const team = await Team.fetch(this.session, { _id: _teamId }, { offline: true })
                    if (team?.profile?.company) companyName = team.profile.company
                }

                if (companyName) from = `"${companyName}" <${senderParams.email}>`
                if (email.split('@')[1] === 'bogus.xyz') email = senderParams.email

                const mailOpts = {
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

                transporter.sendMail(mailOpts, error => {
                    if (error) console.error(error)
                })
            }


            this.pin = () => {
                if (!this.email) return

                let { email } = this
                if (email.split('@')[1] === 'bogus.xyz') email = senderParams.email

                let { from } = senderParams
                if (this?.carrier?.name) from = `"${this.carrier.name}" <${senderParams.email}>`
                else if (this?.team?.name) from = `"${this.team.name}" <${senderParams.email}>`

                const mailOpts = {
                    from,
                    to: email,
                    subject: 'PIN Request',
                    html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                        Your requested PIN is the last four digits of your Social Security number. Keep it confidential.
                    </div>`,
                }

                transporter.sendMail(mailOpts, error => {
                    if (error) console.error(error)
                })
            }


            this.identity = async () => {
                if (!this._personId) return

                const individual = await Individual.fetch(this.session, { _id: this._personId }, this.config)
                if (!individual) throw new Error('Identity could not be determined')

                const mismatch = {}

                let props = ['dob', 'sex', 'prefix', 'firstName', 'middleName', 'lastName', 'suffix']
                props.forEach(prop => mismatch[prop] = this[prop] !== individual[prop])

                props = ['phone', 'email', 'marital']
                props.forEach(prop => mismatch[prop] = !!individual[prop] && this[prop] !== individual[prop])

                return { individual, mismatch }
            }


            this.log = params => classInstance.log(this, new.target, params)
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
        defSorts: [ { desc: 'id' } ],
        // childSort: {
        //     citations: 'citedOn',
        //     accidents: 'date',
        // },
        // childIdHash: {
        //     citations: 'MD5',
        //     accidents: 'MD5',
        // },
        childExclude: {
            addresses: [ 'since', 'address' ],
        },
        logFile: 'driver-applications',
    })


    static invite = async (session, data, formId) => {
        if (!session?.user?.id) return

        let email = data.email || data?.lead?.email
        let { team, user } = session

        if (!email || !user) return
        let { from } = senderParams
        let companyName, phone, url = '/application'

        const { cdlRole, carrierId, _carrierId, teamId, _teamId, _userSimpleId, selfAssign } = data

        if (!team && (teamId || _teamId)) team = await Team.fetch(session, { id: teamId, _id: _teamId })

        if (carrierId || _carrierId) {
            const carrier = await Carrier.fetch(session, { id: carrierId, _id: _carrierId })
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
            let formId, found = true, carrierId, teamId, userId
            do {
                formId = generateRandomString(12, 'ud')

                const application = await Application.fetch(session, { formId })
                if (!application) found = false
            } while (found)

            const {
                _carrierId, _teamId, _userSimpleId, selfAssign, cdlRole, dob,
                prefix, firstName, middleName, lastName, suffix, phone, email, position,
            } = body
            const ssn = unprocessAES(body.ssn)
            const matcher = {}

            if (_carrierId) {
                const carrier = await Carrier.fetch(session, { _id: _carrierId })
                if (!carrier) throw new Error('Carrier not found')

                carrierId = carrier.id
                matcher.companyId = carrier.companyId
                matcher.ownerId = carrier.owner.id
                matcher.owPersonId = carrier.owner.personId
                matcher.coNameSince = carrier.comparator.name
                matcher.coAddrSince = carrier.comparator.address
                matcher.coPhoneSince = carrier.comparator.phone
                matcher.coFaxSince = carrier.comparator.fax
                matcher.coOwnerSince = carrier.comparator.ownership
                matcher.owNameSince = carrier.owner.comparator.name
            }

            let { team, user } = session

            if (!team && _teamId && _teamId !== 'global') team = await Team.fetch(session, { _id: _teamId }, { offline: true })
            if (team) teamId = team.id
            if (user && selfAssign) userId = user.id
            else if (_userSimpleId) {
                const user = await User.fetch(session, { _simpleId: _userSimpleId }, { offline: true })
                if (user) userId = user.id
            }

            body = {
                main: { formId, cdlRole, carrierId, teamId, userId, position },
                matcher,
            }

            if (!ssn) { //* Pre-Application
                body.main.step = 0
                body.lead = { prefix, firstName, middleName, lastName, suffix, email, phone }

                return body
            }

            let driver = await Driver.fetch(session, { ssn })

            if (!driver) { //* First Timer
                const person = await Individual.fetch(session, { ssn })

                body.main.public = false
                body.lead = !person ? { ssn: processAES('ssn', ssn), dob } : { personId: person.id }

                return body
            }

            //* Application was incomplete and deleted

            const { id: driverId, personId } = driver
            const person = await Individual.fetch(session, { id: personId }, { hideSensitive: false })

            body.main.driverId = driver.id
            body.matcher.driverId = driverId
            body.matcher.personId = personId
            body.matcher.nameSince = person.comparator.name
            if (driver.appDef.complete) {
                body.main.rehire = true //! Rehire will only copy the name at first
            } else { //* Original Application Restoration
                const { cache } = driver.appDef
                let { step } = cache

                body.main.addrComplete = cache.addrComplete
                body.lead = { ssn: processAES('ssn', person.ssn), dob: person.dob }

                body.matcher.legalSince = person.comparator.legal
                body.matcher.maritalSince = person.comparator.marital
                body.matcher.phoneSince = person.comparator.phone
                body.matcher.emailSince = person.comparator.email
                body.matcher.addrSince = person.comparator.address

                body.addresses = []

                const addresses = await person.fetch('addresses')
                const addrLen = addresses.length
                const today = moment()

                for (let i = 0; i < addrLen; i++) {
                    const since = addresses[i].since
                    let enough = false, livedAbroad = false
                    if (i + 1 === addrLen) {
                        enough = cache.addrEnough
                        livedAbroad = cache.livedAbroad
                    }

                    body.addresses.push({ personId, since, enough, livedAbroad })
                }

                if (cache.dlId) { //! NOT FULLY TESTED
                    body.matcher.dlId = cache.dlId
                    body.main.dlDenied = cache.dlDenied
                    body.main.dlDeniedExpl = cache.dlDeniedExpl
                    body.main.dlRevoked = cache.dlRevoked
                    body.main.dlRevokedExpl = cache.dlRevokedExpl

                    const expiresOn = moment(cache.dlExpiresOn)
                    if (expiresOn.isSameOrBefore(today)) step = 2
                }

                if (cache.medCard !== undefined) { //! NOT FULLY TESTED
                    body.main.medCard = cache.medCard
                    body.main.underMeds = cache.underMeds
                    body.main.medList = cache.medList

                    if (cache.mecUntil) {
                        body.matcher.mecUntil = cache.mecUntil

                        const mecUntil = moment(cache.mecUntil)
                        if (mecUntil.isSameOrBefore(today) && step > 3) step = 3
                    }
                }

                if (cache.citations !== undefined) {
                    body.main.dui = cache.dui
                    body.main.duiInDecade = cache.duiInDecade
                    body.main.criminal = cache.criminal
                    body.main.criminalExpl = cache.criminalExpl
                    body.main.dotDat = cache.dotDat
                    body.main.citations = cache.citations
                    if (cache.citIds.length) {
                        body.citations = []
                        cache.citIds.map(citId => body.citations.push({ citId }))
                    }
                }

                if (cache.accidents !== undefined) {
                    body.main.accidents = cache.accidents
                    if (cache.accIds.length) {
                        body.accidents = []
                        cache.accIds.map(accId => body.accidents.push({ accId }))
                    }
                }

                if (cache.experience !== undefined) { //! NOT FULLY TESTED
                    body.main.experience = cache.experience ? true : false
                    body.main.cdlSchool = cache.cdlSchool
                    if (!!cache.experience) {
                        body.experience = cache.experience

                        const appliedOn = moment(cache.appliedAt.split(' ')[0])
                        if (appliedOn.isBefore(today)) {
                            delete body.experience.lastDate
                            delete body.experience.mileage
                            delete body.experience.hours
                            if (step > 6) step = 6
                        }
                    }
                }

                body.main.step = step
            }

            return body
        },
        async final(application) {
            if (application.driverId) {
                const driver = await Driver.fetch(session, { id: application.driverId })
                let { cache } = driver.appDef
                if (!cache) cache = {}

                cache.appliedAt = tz2utc(application.appliedAt)
                await driver.update('appDef', { cache })
            }

            if (application.driverId) await application.welcome()
            else await Application.invite(session, application, application.formId)
        },
    })


    static fetch = (session, filter,
        { hideRawId = false, hideSensitive = true, sorts = Application.config().defSorts, limit, mode } = {}
    ) => classStatic.fetch(this, session, filter, { hideRawId, hideSensitive, sorts, limit, mode }, {
        batch: [
            {
                table: query.driver_application.main.table,
                fields: [
                    'id',
                    'formId',
                    'driverId',
                    'teamId',
                    'userId',
                    'carrierId',
                    Application.hashId(),
                    Driver.hashId('driverId'),
                    Team.hashId('teamId'),
                    User.hashId('userId'),
                    Carrier.hashId('carrierId'),
                    'cdlRole',
                    'position',
                    'condition',
                    'step',
                    'locked',
                    'rehire',
                    'addrComplete',
                    'dlDenied',
                    'dlDeniedExpl',
                    'dlRevoked',
                    'dlRevokedExpl',
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
                    'applicant_',
                    'recruiter_',
                        'createdAt',
                        'finishedAt',
                        'reviewedAt',
                ],
                search: [ null, 'formId' ]
            },
            {
                table: query.driver_application.lead.table,
                fields: [
                    [ 'personId', 'leadPersonId' ],
                    [ Individual.hashId('personId'), '_leadPersonId' ],
                    [ selectAES('ssn'), 'leadSsn' ],
                    [ 'dob', 'leadDob' ],
                    // [ 'position', 'leadPosition' ],
                    [ 'prefix', 'leadPrefix' ],
                    [ 'firstName', 'leadFirstName' ],
                    [ 'middleName', 'leadMiddleName' ],
                    [ 'lastName', 'leadLastName' ],
                    [ 'suffix', 'leadSuffix' ],
                    [ 'gender', 'leadGender' ],
                    [ 'email', 'leadEmail' ],
                    [ 'phone', 'leadPhone' ],
                ],
                join: [ 'appId', 'id' ],
                search: [ null, [ 'lastName', 'firstName' ] ],
            },
            {
                table: query.driver.main.table,
                fields: [ 'personId', Individual.hashId('personId') ],
                join: [ 'id', 'driverId' ],
            },
            {
                table: query.driver_application.matcher.table,
                fields: [
                    [ 'nameSince', 'matchNameSince' ],
                    [ 'legalSince', 'matchLegalSince' ],
                    [ 'maritalSince', 'matchMaritalSince' ],
                    [ 'phoneSince', 'matchPhoneSince' ],
                    [ 'emailSince', 'matchEmailSince' ],
                    [ 'addrSince', 'matchAddrSince' ],
                    [ 'dlId', 'matchDlId' ],
                    [ 'mecUntil', 'matchMecUntil' ],
                    [ 'busId', 'matchBusId' ],
                ],
                join: [ 'appId', 'id' ],
            },
            {
                table: query.driver.appDef.table,
                fields: [ 'prevCountry', 'expDate' ],
                join: [ 'driverId', 'driverId' ],
            },
            {
                db: db.person,
                table: query.person.main.table,
                fields: [ 'dob', 'gender', selectAES('ssn') ],
                join: [ 'id', 'personId', 2 ],
                search: [ null, selectAES('ssn') ],
            },
            {
                db: db.person,
                table: query.person.names.table,
                fields: [ 'prefix', 'firstName', 'middleName', 'lastName', 'suffix' ],
                join: [ 'personId', 'personId', 2, [ 'since', 'nameSince', 3 ] ],
                search: [ null, [ 'lastName', 'firstName' ] ],
            },
            {
                db: db.person,
                table: query.person.legal.table,
                fields: [ [ 'status', 'legalStatus' ], [ 'expiresOn', 'legalExpiration' ] ],
                join: [ 'personId', 'personId', 2, [ 'since', 'legalSince', 3 ] ],
            },
            {
                db: db.person,
                table: query.person.maritals.table,
                fields: [ [ 'status', 'marital' ] ],
                join: [ 'personId', 'personId', 2, [ 'since', 'maritalSince', 3 ] ],
            },
            {
                db: db.person,
                table: query.person.emails.table,
                fields: 'email',
                join: [ 'personId', 'personId', 2, [ 'since', 'emailSince', 3 ] ],
                search: [ null, 'email' ],
            },
            {
                db: db.person,
                table: query.person.phones.table,
                fields: 'phone',
                join: [ 'personId', 'personId', 2, [ 'since', 'phoneSince', 3 ] ],
                search: [ null, 'phone' ],
            },
            {
                db: db.person,
                table: query.person.addresses.table,
                fields: [ [ 'since', 'addrSince' ], 'placeId', 'address1', 'address2', 'city', 'state', 'zip' ],
                join: [ 'personId', 'personId', 2, [ 'since', 'addrSince', 3 ] ],
            },
            {
                table: query.driver_application.addresses.table,
                fields: [ [ 'enough', 'addrEnough' ], 'livedAbroad' ],
                join: [
                    'personId', 'personId', query.person.addresses.table,
                    [ 'since', 'since', query.person.addresses.table ],
                ],
            },
            {
                db: db.person,
                table: query.person.identifications.table,
                fields: [
                    [ 'commercial', 'dlCommercial' ],
                    [ 'number', 'dlNumber' ],
                    [ 'class', 'dlClass' ],
                    [ 'state', 'dlState' ],
                    [ 'issuedOn', 'dlIssuedOn' ],
                    [ 'expiresOn', 'dlExpiresOn' ],
                    [ 'endorsement', 'dlEndors' ],
                    [ 'restriction', 'dlRestr' ],
                ],
                join: [ 'id', 'dlId', 3 ],
                // join: [ 'personId', 'personId', 2, [ 'id', 'dlId', 3 ] ],
            },
            {
                table: query.driver.mecs.table,
                fields: [
                    [ 'expiresOn', 'mecExpiresOn' ],
                    [ 'issuedOn', 'mecIssuedOn' ],
                    'nrcme',
                ],
                join: [ 'driverId', 'driverId', 0, [ 'expiresOn', 'mecUntil', 3 ] ],
            },
            {
                table: query.driver_application.experience.table,
                fields: [
                    [ 'cmv', 'cmvExp' ],
                    [ 'vehicles', 'expVehicles' ],
                    [ 'lastDate', 'expLastDate' ],
                    [ 'mileage', 'expMileage' ],
                    [ 'hours', 'expHours' ],
                ],
                join: [ 'appId', 'id' ],
            },
            {
                table: query.driver.school.table,
                fields: [
                    [ 'name', 'schName' ],
                    [ 'phone', 'schPhone' ],
                    [ 'state', 'schState' ],
                    [ 'endDate', 'schEndDate' ],
                    [ 'duration', 'schDuration' ],
                ],
                join: [ 'driverId', 'driverId' ],
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
                table: query.driver.businesses.table,
                fields: [
                    [ 'busName', 'ownBusName' ],
                    [ 'coType', 'ownCoType' ],
                    [ 'state', 'busState' ],
                    [ selectAES('ein'), 'busEin' ],
                ],
                join: [ 'id', 'busId', 3 ],
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
                    [ 'prefix', 'benefPrefix' ],
                    [ 'firstName', 'benefFirstName' ],
                    [ 'middleName', 'benefMiddleName' ],
                    [ 'lastName', 'benefLastName' ],
                    [ 'suffix', 'benefSuffix' ],
                    [ 'relation', 'benefRelation' ],
                    [ 'otherRel', 'benefOtherRel' ],
                    [ selectAES('ssn'), 'benefSsn' ],
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
                table: query.company.names.table,
                fields: [
                    [ 'busName', 'coBusName' ],
                    [ 'coType', 'coCoType' ],
                    [ 'alias', 'coAlias' ],
                ],
                join: [ 'companyId', 'id', query.company.main.table, [ 'since', 'coNameSince', 3 ] ],
            },
            {
                db: db.business,
                table: query.company.addresses.table,
                fields: [
                    [ 'placeId', 'coPlaceId' ],
                    [ 'address1', 'coAddress1' ],
                    [ 'address2', 'coAddress2' ],
                    [ 'city', 'coCity' ],
                    [ 'state', 'coState' ],
                    [ 'zip', 'coZip' ],
                ],
                join: [ 'companyId', 'id', query.company.main.table, [ 'since', 'coAddrSince', 3 ] ],
            },
            {
                db: db.business,
                table: query.company.phones.table,
                fields: [ [ 'phone', 'coPhone' ] ],
                join: [ 'companyId', 'id', query.company.main.table, [ 'since', 'coPhoneSince', 3 ] ],
            },
            {
                db: db.business,
                table: query.company.faxes.table,
                fields: [ [ 'fax', 'coFax' ] ],
                join: [ 'companyId', 'id', query.company.main.table, [ 'since', 'coFaxSince', 3 ] ],
            },
            {
                db: db.business,
                table: query.company.ownerships.table,
                join: [ 'companyId', 'id', query.company.main.table, [ 'since', 'coOwnerSince', 3 ] ],
            },
            {
                db: db.business,
                table: query.company_owner.main.table,
                join: [ 'id', 'ownerId', query.company.ownerships.table ],
            },
            {
                db: db.person,
                table: [ query.person.names.table, 'owner_names' ],
                fields: [
                    [ 'prefix', 'ownerPrefix' ],
                    [ 'firstName', 'ownerFirstName' ],
                    [ 'middleName', 'ownerMiddleName' ],
                    [ 'lastName', 'ownerLastName' ],
                    [ 'suffix', 'ownerSuffix' ],
                ],
                join: [ 'personId', 'personId', query.company_owner.main.table, [ 'since', 'owNameSince', 3 ] ],
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
        prepare(batch, filter, session) {
            const { DS = false } = session?.user || {}
            const {
                id, _id, formId, ssn,
                driverId, _driverId, teamId, _teamId, userId, _userId, carrierId, _carrierId,
                cdlRole, position, condition, rehire, archived,
                search = {},
            } = filter
            const single = !!id || !!_id || !!formId || !!ssn

            const match = {
                id, formId, driverId, teamId, userId, carrierId,
                cdlRole, position, condition, rehire,
            }
            if (!single) match.public = true
            if (!id) match.id = Application.matchIdHash(_id)
            if (!driverId) match.driverId = Driver.matchIdHash(_driverId)
            if (!teamId && teamId !== null) match.teamId = Team.matchIdHash(_teamId)
            if (!userId && userId !== null) match.userId = User.matchIdHash(_userId)
            if (!carrierId && carrierId !== null) match.carrierId = Carrier.matchIdHash(_carrierId)
            if (typeof archived === 'boolean') {
                match.archivedAt = archived ? { not: null } : null
            }

            batch[0].match = match
            if (ssn) batch[1].match = { ssn: processAES('ssn', ssn) }

            if (!DS && !single && !teamId && !_teamId) {
                const idx = batch.length - 1
                batch[idx].match = { scoped: [ false, null ] }
            }

            if (!single && search.value)
                for (const piece of batch) {
                    if (!piece.search) continue
                    piece.search[0] = search.value
                }

            return { single, batch }
        },
    })


    static count = async (session, filter = {}) => {
        if (!session?.user?.id) return 0

        const { driverId, _driverId, teamId, _teamId, cdlRole, position, condition, rehire, archived } = filter
        const match = { driverId, teamId, cdlRole, position, condition, rehire }
        if (!driverId) match.driverId = Driver.matchIdHash(_driverId)
        if (!teamId) match.teamId = Team.matchIdHash(_teamId)
        if (typeof archived === 'boolean') {
            match.archivedAt = archived ? { not: null } : null
        }

        const [ rows ] = await mysql.execute(query.driver_application.main.count(match))
        return rows[0].count
    }


    static assigned = async session => {
        if (!session.user.id) throw new Error('Application Static Method Error [ASSIGNED]: Session user not supplied')
        const { team } = session
        const teamId = team?.id || null

        //! need to understand, do i need to see all users or by team

        return { users: [], teams: [], carriers: [] }
    }


    static chart = async (session, filter = {}) => {
        if (!session.user) return

        const { teamId, _teamId } = filter
        const data = { applications: {} }
        const match = { teamId }
        if (!teamId) match.teamId = Team.matchIdHash(_teamId)

        const batch = [
            {
                table: query.driver_application.main.table,
                fields: [ 'condition', { count: ['condition', 'count'] } ],
                group: 'condition',
                match,
            },
            {
                db: db.online,
                table: query.team.main.table,
                join: [ 'id', 'teamId' ],
            },
        ]

        if (!teamId && !teamId)
            batch[1].match = { scoped: [ false, null ] }

        const [ result ] = await mysql.execute(Query.select(db.carrier, batch))
        data.applications.conditions = {}

        result.forEach(row => {
            const { condition, count } = row
            data.applications.conditions[condition] = count
        })

        return data
    }


    static list = {

        step: [
            ['Profile', 'Residence', 'Legal Status', 'Position'],
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

        experience: { e: 'Experienced', i: 'Inexperienced', s: 'Student' },

        legalStatus: { '0': 'US Citizen', '1': 'Permanent Resident', '2': 'Work Authorization/Visa' },

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


}



class Employment {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Employer Data')

        this._id = data._id
        this._driverId = data._driverId
        this._appId = data._appId
        if (!hideRawId) {
            this.id = data.id
            this.driverId = data.driverId
            this.appId = data.appId
        }
        this.usdot = data.usdot
        this.locked = data.locked
        this.employer = data.employer
        this.phone = data.phone
        this.address = new Address(data)
        this.startedOn = data.startedOn
        this.leftOn = data.leftOn
        this.position = data.position
        this.earnings = data.earnings
        this.fmcsr = bool(data.fmcsr)
        this.dotDat = !!data.dotDat
        this.rfl = data.rfl
        this.gapExpl = data.gapExpl

        if (data.formId) {
            this.application = {
                formId: data.formId,
                cdlRole: data.cdlRole,
                prefix: data.driverPrefix,
                firstName: data.driverFirstName,
                middleName: data.driverMiddleName,
                lastName: data.driverLastName,
                suffix: data.driverSuffix,
                phone: data.driverPhone,
                dob: data.dob,
                gender: data.gender,
                address1: data.driverAddress1,
                address2: data.driverAddress2,
                city: data.driverCity,
                state: data.driverState,
                zip: data.driverZip,
                createdAt: utc2tz(data.createdAt),
                finishedAt: utc2tz(data.finishedAt),
                _carrierId: data._carrierId,
                _teamId: data._teamId,
            }
            if (!hideSensitive) this.application.ssn = stringifyBuffer(data.ssn)
            if (!hideRawId) {
                this.application.carrierId = data.carrierId
                this.application.teamId = data.teamId
            }
            if (data._carrierId) {
                this.application.carrier = `${data.coBusName}, ${data.coCoType}`
                this.application.carrierAlias = data.coAlias
                this.application.carrierPhone = data.coPhone
                this.application.carrierAddress = new Address({
                    address1: data.coAddress1,
                    address2: data.coAddress2,
                    city: data.coCity,
                    state: data.coState,
                    zip: data.coZip,
                })
            }
            if (data._teamId) this.application.team = data.teamName
        }

        this.verififcation = {
            verify: !!data.verify,
            status: data.status,
            comment: data.comments,
            //! continue,
            // signature: {
            //     inquirer1: data.inquirer1_,
            //     inquirer2: data.inquirer2_,
            //     inquirer3: data.inquirer3_,
            // },
        }

        if (single) {
            this.session = session
            this.config = { hideRawId, hideSensitive }

            this.fetch = async (target, filter = {}, { hideRawId = false } = {}) => {
                if (!this.session?.user?.id) throw new Error('Employment Constructor Method Error [FETCH]: Session user not supplied')
            
                switch (target) {
                    case 'attempts':
                        {
                            const batch = [
                                {
                                    table: query.driver_employment.attempts.table,
                                    fields: [
                                        Employment.hashId('emplId'),
                                        Application.hashId('appId'),
                                        User.hashId('inquiredBy'),
                                        'method',
                                        'inquiredOn',
                                        'response',
                                        'note',
                                        'inquirer_',
                                    ],
                                    match: {
                                        emplId: this.id || Employment.matchIdHash(this._id),
                                        appId: this.appId || Application.matchIdHash(this._appId),
                                    },
                                },
                            ]
                        }
                        break
                }
            }

            this.update = body => {
                if (!body.fmcsr) body.usdot = null

                return classInstance.update(this, new.target, body)
            }

            this.delete = () => classInstance.delete(this, new.target)

            this.log = params => classInstance.log(this, new.target, params)
        }
    }

    static #algorithm = 'MD5'
    static hashId = (field = 'id') => hash(field, Employment.#algorithm)
    static matchIdHash = value => matchHash(value, Employment.#algorithm)

    static config = () => ({
        enforceUser: false,
        enforceLocation: true,
        db: db.carrier,
        query: query.driver_employment,
        idProp: 'emplId',
        defSorts: [ null, { desc: 'startedOn' }, { desc: 'createdAt' } ],
    })


    static create = (session, body, params) => classStatic.create(this, session, body, params, {
        async split(body) {
            const { appId } = body
            delete body.appId

            body = {
                main: body,
                verifications: { appId },
            }

            return body
        },
    })


    static fetch = (session, filter = {}, { hideRawId = false, hideSensitive = true, sorts = Employment.config().defSorts, limit, mode } = {}) => {
        // const { teamId, condition } = filter
        // const match = { teamId, condition }

        return classStatic.fetch(this, session, filter, { hideRawId, hideSensitive, sorts, limit, mode }, {
            batch: [
                {
                    table: query.driver_employment.verifications.table,
                    fields: [
                        'appId',
                        Application.hashId('appId'),
                        'verify',
                        'status',
                        'comment',
                    ],
                },
                {
                    table: query.driver_employment.main.table,
                    fields: [
                        'id',
                        'driverId',
                        Employment.hashId(),
                        Driver.hashId('driverId'),
                        'usdot',
                        'locked',
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
                        'rfl',
                        'leftOn',
                        'gapExpl',
                    ],
                    join: [ 'id', 'emplId' ],
                },
                {
                    table: query.driver_application.main.table,
                    fields: [
                        'teamId', Team.hashId('teamId'), 'carrierId', Carrier.hashId('carrierId'), 'formId', 'cdlRole',
                        'createdAt', 'finishedAt',
                    ],
                    join: [ 'id', 'appId' ],
                },
                {
                    table: query.driver.main.table,
                    join: [ 'id', 'driverId', 1 ],
                },
                {
                    table: query.driver_application.matcher.table,
                    join: [ 'appId', 'appId' ],
                },
                {
                    db: db.person,
                    table: query.person.main.table,
                    fields: [ 'dob', 'gender', selectAES('ssn') ],
                    join: [ 'id', 'personId', 3 ],
                },
                {
                    db: db.person,
                    table: query.person.names.table,
                    fields: [
                        [ 'prefix', 'driverPrefix' ],
                        [ 'firstName', 'driverFirstName' ],
                        [ 'middleName', 'driverMiddleName' ],
                        [ 'lastName', 'driverLastName' ],
                        [ 'suffix', 'driverSuffix' ],
                    ],
                    join: [
                        'personId', 'id', query.person.main.table,
                        [ 'since', 'nameSince', query.driver_application.matcher.table ],
                    ],
                },
                {
                    db: db.person,
                    table: query.person.phones.table,
                    fields: [ [ 'phone', 'driverPhone' ] ],
                    join: [
                        'personId', 'id', query.person.main.table,
                        [ 'since', 'phoneSince', query.driver_application.matcher.table ],
                    ],
                },
                {
                    db: db.person,
                    table: query.person.addresses.table,
                    fields: [
                        [ 'address1', 'driverAddress1' ],
                        [ 'address2', 'driverAddress2' ],
                        [ 'city', 'driverCity' ],
                        [ 'state', 'driverState' ],
                        [ 'zip', 'driverZip' ],
                    ],
                    join: [
                        'personId', 'id', query.person.main.table,
                        [ 'since', 'addrSince', query.driver_application.matcher.table ],
                    ],
                },
                {
                    table: query.carrier.main.table,
                    join: [ 'id', 'carrierId', 2 ],
                },
                {
                    db: db.business,
                    table: query.company.main.table,
                    join: [ 'id', 'companyId', query.carrier.main.table ],
                },
                {
                    db: db.business,
                    table: query.company.names.table,
                    fields: [ [ 'busName', 'coBusName' ], [ 'coType', 'coCoType' ], [ 'alias', 'coAlias' ] ],
                    join: [
                        'companyId', 'id', query.company.main.table,
                        [ 'since', 'coNameSince', query.driver_application.matcher.table ],
                    ],
                },
                {
                    db: db.business,
                    table: query.company.phones.table,
                    fields: [ [ 'phone', 'coPhone' ] ],
                    join: [
                        'companyId', 'id', query.company.main.table,
                        [ 'since', 'coPhoneSince', query.driver_application.matcher.table ],
                    ],
                },
                {
                    db: db.business,
                    table: query.company.addresses.table,
                    fields: [
                        [ 'address1', 'coAddress1' ],
                        [ 'address2', 'coAddress2' ],
                        [ 'city', 'coCity' ],
                        [ 'state', 'coState' ],
                        [ 'zip', 'coZip' ],
                    ],
                    join: [
                        'companyId', 'id', query.company.main.table,
                        [ 'since', 'coAddrSince', query.driver_application.matcher.table ],
                    ],
                },
                {
                    db: db.online,
                    table: query.team.main.table,
                    fields: [ [ 'name', 'teamName' ] ],
                    join: [ 'id', 'teamId', 2 ],
                },
            ],
            prepare(batch, filter) {
                const {
                    id, _id,
                    appId, _appId, driverId, _driverId, teamId, _teamId, carrierId, _carrierId, condition, verify,
                } = filter
                const single = (!!id && !!appId) || (!!_id && !!_appId)

                batch[0].match = { appId, verify }
                batch[1].match = { id }
                batch[2].match = { driverId, teamId, carrierId, condition }
                if (_appId) batch[0].match.appId = Application.matchIdHash(_appId)
                if (_id) batch[1].match.id = Employment.matchIdHash(_id)
                if (_driverId) batch[2].match.driverId = Driver.matchIdHash(_driverId)
                if (_teamId) batch[2].match.teamId = Team.matchIdHash(_teamId)
                if (_carrierId) batch[2].match.carrierId = Carrier.matchIdHash(_carrierId)

                return { single, batch }
            },
        })
    }


    static list = {

        inquiryMethod: { p: 'Phone', f: 'Fax', e: 'Email', m: 'Mail' },

        verifStatus: { p: 'In progress', c: 'Complete', u: 'Unobtainable' },

    }


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
export { Application, Employment, DriverUser }
