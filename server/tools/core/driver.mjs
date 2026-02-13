const { DB__MYSQL_AES_SSN, DB__MYSQL_AES_EIN } = Bun.env
const ssnSecret = DB__MYSQL_AES_SSN
const einSecret = DB__MYSQL_AES_EIN


/* Settings */
import { addrBook } from '../../../config.mjs'
import db, { query } from '../../settings/mysql.mjs'

/* Tools */
import moment from 'moment'
import { utc2tz, utcTimeStamp } from '../utils/date.mjs'
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
import { application } from '../../includes/driver'

const mysql = require('../utils/mysql')



class Driver extends Individual {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Driver Data')

        super(data, { single, hideRawId, hideSensitive })

        const {
            id, _id, personId, _personId, blackListed,
            expDate,
        } = data
        const properties = {
            first: { _id, _personId },
            last: { expDate },
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

            this.add = () => {}

            this.fetch = undefined //? (target, filter, params) => classInstance.fetch(this, new.target, target, filter, params)

            this.update = () => {}

            this.delete = () => {}

            this.log = () => {}
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
                    fields: 'expDate',
                    join: [ 'driverId', 'id' ],
                },
                {
                    db: db.person,
                    table: query.person.main.table,
                    fields: [ 'dob', 'gender', { aes: [ 'ssn', ssnSecret ] } ],
                    join: [ 'id', 'personId' ],
                    search: [ null, { aes: [ 'ssn', ssnSecret ] } ],
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
                //? need other props ???
                {
                    table: query.driver_application.main.table,
                    join: [ 'driverId', 'id', { type: 'inner' } ],
                },
                {
                    db: db.online,
                    table: query.team.main.table,
                    join: [ 'id', 'teamId', query.driver_application.main.table ],
                },
            ],
            prepare(batch, filter) {
                const {
                    id, _id, personId, _personId, ssn,
                    blackListed, teamId, _teamId,
                } = filter
                const single = !!id || !!_id || !!personId || !!_personId || !!ssn

                batch[0].match = { id, personId, blackListed }
                if (!id && _id) batch[0].match.id = Driver.matchIdHash(_id)
                if (!personId && _personId) batch[0].match.personId = Individual.matchIdHash(_personId)

                if (ssn) batch[2].match.ssn = { aes: [ ssn, secret ] }

                const teamIdx = batch.length - 1
                const appIdx = teamIdx - 1

                if (teamId || _teamId)
                    batch[appIdx].match = { teamId: teamId || Team.matchIdHash(_teamId) }
                else batch[teamIdx].match = { scoped: [ false, null ] }

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

        this.cdlRole = data.cdlRole
        this.position = data.position
        this.condition = data.condition
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
            }
            if (this.lead.firstName && this.lead.lastName)
                this.lead = new Person(this.lead)
            this.lead.email = data.leadEmail
            this.lead.phone = data.leadPhone
            // this.lead.position = data.leadPosition
            if (!hideSensitive) this.lead.ssn = stringifyBuffer(data.leadSsn)
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
            // this.address.complete = !!data.addrComplete
            // this.address.enough = !!data.addrEnough
            // this.address.livedAbroad = bool(data.livedAbroad)
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

        if (data.coAlias)
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

        if (data.userAlias) {
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


            this.add = (target, body) => classInstance.add(this, new.target, target, body)


            this.fetch = (target, filter, params) => classInstance.fetch(this, new.target, target, filter, params)


            this.update = (targetOrBody, body, filter) => {
                const application = this

                return classInstance.update(this, new.target, targetOrBody, body, filter, {
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

                        const updateBody = { driverId: driver.id }
                        if (inst.step === 0) updateBody.step = 1
                        await inst.update(updateBody)
                    },
                })
            }


            this.delete = (target, match = {}) => classInstance.delete(this, new.target, target, match)


            this.progress = async (step, body) => {
                const { branch, siteId } = this.session
                const modifiedBy = this.session?.user?.id || null
                let createdIn = { branch }
                if (siteId) createdIn.siteId = siteId
                createdIn = JSON.stringify(createdIn)

                const vehicleRecord = async (application, body) => {
                    if (application.position !== 'OO') return await application.delete('vehicle')
                    // if (!body.type) return

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

                    await application[application.vehicle ? 'update' : 'add']('vehicle', body)
                }

                switch (step) {


                    case 'profile':
                        await this.update(body)
                        break


                    case 'residence':
                        {
                            const { address, addresses } = body
                            delete body.address
                            delete body.addresses

                            address.appId = this.id
                            address.createdIn = createdIn

                            const addrBody = [ address ]

                            if (addresses) {
                                const { address1, address2, zip, city, state, since, enough, livedAbroad } = addresses
                                const count = zip.length

                                for (let i = 0; i < count; i++) {
                                    addrBody.push({
                                        appId: this.id,
                                        address1: address1[i],
                                        address2: address2[i],
                                        zip: zip[i],
                                        city: city[i],
                                        state: state[i],
                                        since: since[i],
                                        enough: enough[i],
                                        livedAbroad: typeof livedAbroad?.[i] === 'boolean' ? livedAbroad[i] : null,
                                        createdIn,
                                    })
                                }
                            }

                            if (!body.prevCountry) body.prevCountry = null
                            body.addrComplete = true
                            if (this.step === 0) body.step = 1

                            await mysql.execute(query.driver_application.addresses.delete({ appId: this.id }))
                            await mysql.execute(query.driver_application.addresses.insert(addrBody))

                            await this.update(body)
                        }
                        break


                    case 'driver-license':
                        {
                            if (!body.denied) body.deniedExpl = null
                            if (!body.revoked) body.revokedExpl = null

                            const person = await Individual.fetch(this.session, { id: this.personId })
                            const identifications = await person.fetch('identifications')

                            const dlBody = { ...body }
                            delete dlBody.appId
                            delete dlBody.denied
                            delete dlBody.revoked
                            delete dlBody.deniedExpl
                            delete dlBody.revokedExpl

                            if (!this.dl) {
                                await this.add('license', body)
                                await this.update({ step: 2 })

                                let found = false

                                for (const id of identifications) {
                                    if (body.state === id.state && body.issuedOn === id.issuedOn && body.expiresOn === id.expiresOn) {
                                        found = true
                                        break
                                    }
                                }

                                if (!found) await person.add('identifications', dlBody)
                            } else {
                                const { state, issuedOn, expiresOn } = this.dl

                                await this.update('license', body)
                                await person.update('identifications', dlBody, { state, issuedOn, expiresOn })
                            }
                        }
                        break


                    case 'medical-card':
                        {
                            const { expiresOn, issuedOn, nrcme, mecAbsent } = body
                            delete body.expiresOn
                            delete body.issuedOn
                            delete body.nrcme
                            delete body.mecAbsent
                            
                            if (!body.underMeds) body.medList = null
                            body.medCard = !mecAbsent
                            if (this.step < 3) body.step = 3

                            if (expiresOn) await this[this.medCard ? 'update' : 'add']('medical', { expiresOn, issuedOn, nrcme })
                            else await this.delete('medical')

                            await this.update(body)
                        }
                        break


                    case 'legal-compliance':
                        {
                            if (!body.dui) body.duiInDecade = null
                            if (!body.criminal) body.criminalExpl = null

                            const { citations, violation, other: otherViolation, citedOn, state: citState } = body
                            delete body.violation
                            delete body.other
                            delete body.citedOn
                            delete body.state
                            if (!violation && body.citations) body.citations = false

                            if (this.step < 4) body.step = 4

                            await mysql.execute(query.driver_application.citations.delete({ appId: this.id }))
                            if (citations) {
                                const count = violation.length
                                const citBody = []

                                for (let i = 0; i < count; i++)
                                    citBody.push({
                                        appId: this.id,
                                        violation: violation[i],
                                        other: violation[i] === 'other' ? otherViolation?.[i] : null,
                                        citedOn: citedOn[i],
                                        state: citState[i],
                                        createdIn,
                                    })

                                await mysql.execute(query.driver_application.citations.insert(citBody))
                            }

                            await this.update(body)
                        }
                        break


                    case 'safety':
                        {
                            const { accidents, collision, other: otherCollision, date: accDate, state: accState, injuries, fatalities } = body
                            body = { accidents }
                            if (!collision && body.accidents) body.accidents = false

                            if (this.step < 5) body.step = 5

                            await mysql.execute(query.driver_application.accidents.delete({ appId: this.id }))
                            if (accidents) {
                                const count = collision.length
                                const accBody = []

                                for (let i = 0; i < count; i++)
                                    accBody.push({
                                        appId: this.id,
                                        collision: collision[i],
                                        other: collision[i] === 'other' ? otherCollision?.[i] : null,
                                        date: accDate[i],
                                        state: accState[i],
                                        injuries: injuries[i],
                                        fatalities: fatalities[i],
                                        createdIn,
                                    })

                                await mysql.execute(query.driver_application.accidents.insert(accBody))
                            }

                            await this.update(body)
                        }
                        break


                    case 'experience':
                        {
                            const experience = body.noExp !== true
                            let { cdlSchool } = body
                            const { vehicles = {}, cmv, firstDate, lastDate, mileage, hours } = body
                            const { name, phone, state, endDate, duration } = body
                            if (cdlSchool === undefined) cdlSchool = false

                            body = { experience, cdlSchool }
                            if (this.step < 6) body.step = 6

                            let { misc } = vehicles
                            if (misc) {
                                if (!cmv) { //* VERY IMPORTANT! If other non-cmv types are added, they must be deleted also
                                    delete misc.tandem
                                }

                                misc = Object.keys(misc)
                                vehicles.misc = misc
                            }
                            if (!cmv) delete vehicles.semi

                            if (experience) await this[this.experience ? 'update' : 'add']('experience', { vehicles, cmv, firstDate, lastDate, mileage, hours })
                            else await this.delete('experience')

                            if (cdlSchool) await this[this.cdlSchool ? 'update' : 'add']('school', { name, phone, state, endDate, duration })
                            else await this.delete('school')

                            await this.update(body)
                        }
                        break


                    case 'prev-employment':
                        // {
                        //     delete body.explGap
                        //     if (this.step < 7) body.step = 7

                        //     if (!body.prevEmployed) await mysql.execute(query.driver_appemployer.main.delete({ appId: this.id }))

                        //     await this.update(body)
                        // }
                        break

                    
                    // case 'prev-employer':
                    //     {
                    //         const { _id } = body
                    //         delete body._id

                    //         const appBody = { prevEmployed: true }

                    //         if (_id) {
                    //             const employment = await Employment.fetch(this.session, { _id }, { hideRawId: false })
                    //             if (!body.leftOn) body.leftOn = null
                    //             await employment.update(body)
                    //         } else {
                    //             body.appId = this.id
                    //             await Employment.create(this.session, body)
                    //         }

                    //         await this.update(appBody)
                    //     }
                    //     break


                    case 'preference':
                        {
                            body.appId = this.id
                            if (body.operType === 's' || !this.cdlRole) {
                                body.teamName = null
                                body.teamPhone = null
                            }

                            if (!this.cdlRole) {
                                body.haulRegion = null
                                body.equipment = null
                            }

                            await this[this.preference ? 'update' : 'add']('preference', body)
                            if (this.step < 8) await this.update({ step: 8 })
                        }
                        break


                    case 'business':
                        {
                            let { activeLLC } = body
                            const {
                                inactiveLLC, busName, state, ein,
                                mmt, type, make, model, year, length,
                            } = body
                            if (inactiveLLC) activeLLC = false
                            else if (activeLLC === undefined) activeLLC = true

                            body = { activeBusiness: activeLLC }
                            if (this.step < 9) body.step = 9

                            if (activeLLC) await this[this.activeBusiness ? 'update' : 'add']('business', { busName, state, ein })
                            else await this.delete('business')

                            //* Driver Application only (when type if defined)
                            await vehicleRecord(this, { mmt, type, make, model, year, length })

                            await this.update(body)
                        }
                        break


                    case 'beneficiary':
                        {
                            if (body.relation !== 'Other') body.otherRel = null

                            if (!this.beneficiary) {
                                await this.add('beneficiary', body)
                                await this.update({ step: 10 })
                            } else await this.update('beneficiary', body)
                        }
                        break


                    case 'misc':
                        {
                            if (!this.emergency) {
                                await this.add('emergency', body)
                                await this.update({ step: 11 })
                            } else await this.update('emergency', body)
                        }
                        break


                    case 'certify':
                        {
                            if (this.step < 12) await this.update({ step: 12 })
                        }
                        break


                    case 'legal-status': //* Carrier UI only (no step)
                        {
                            if (body.legalStatus < 2) body.legalExpiration = null
                            await this.update(body)
                        }
                        break


                    case 'position': //* Carrier UI only (no step)
                        {
                            const { position, mmt, type, make, model, year, length } = body

                            await vehicleRecord(this, { mmt, type, make, model, year, length })
                            await this.update({ position })
                        }
                        break


                    case 'workflow': //* Carrier UI only
                        break


                    case 'assignment': //* Carrier UI only
                        break


                }
            }


            this.submit = async () => {
                if (this.condition === 'p' && this.step === 12)
                    await this.update({ condition: 'c', finishedAt: utcTimeStamp() })
            }


            this.welcome = async () => {
                if (!this._driverId) return

                const { fullName, formId, carrier, team, _teamId } = this
                let { email } = this
                let { from } = senderParams
                const url = `/application/${formId}`
                let companyName

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


            this.identity = async () => {
                if (!this._personId) return

                const individual = await Individual.fetch(this.session, { _id: this._personId }, this.config)
                if (!individual) throw new Error('Identity could not be determined')

                const mismatch = {}

                let props = ['dob', 'sex', 'firstName', 'middleName', 'lastName', 'suffix']
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
        defSorts: null,
        childSort: {
            citations: 'citedOn',
            accidents: 'date',
        },
        childIdHash: {
            citations: 'MD5',
            accidents: 'MD5',
        },
        childExclude: {
            addresses: [ 'since', 'address' ],
        },
        logFile: 'driver-applications',
    })


    static invite = async (session, data, formId) => {
        if (!session?.user?.id) return

        let email = data.email || data?.lead?.email
        if (!email) throw new Error('Failed to send invitation; email undefined')

        let { team, user } = session
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

        if (formId) url += `?form=${formId}`
        else {
            url += `?env=${team ? team._id : 'global'}`
            url += `&cdl=${cdlRole}`
            if (_userSimpleId) url += `&rec=${_userSimpleId}`
            else if (selfAssign) url += `&rec=${user._simpleId}`
        }

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
            let formId, found = true, carrierId, teamId, userId, personId
            do {
                formId = generateRandomString(12, 'ud')

                const application = await Application.fetch(session, { formId })
                if (!application) found = false
            } while (found)

            const {
                _carrierId, _teamId, selfAssign, cdlRole, ssn,
                prefix, firstName, middleName, lastName, suffix, phone, email, position,
            } = body
            
            if (_carrierId) {
                const carrier = await Carrier.fetch(session, { _id: _carrierId })
                if (!carrier) throw new Error('Carrier not found')

                carrierId = carrier.id
            }

            let { team, user } = session

            if (!team && _teamId) team = await Team.fetch(session, { _id: _teamId }, { offline: true })
            if (team) teamId = team.id
            if (user && selfAssign) userId = user.id

            body = {
                main: { formId, cdlRole, carrierId, teamId, userId, position },
            }

            if (!ssn) { //* Pre-Application
                body.main.step = 0
                body.lead = { prefix, firstName, middleName, lastName, suffix, email, phone }

                return body
            }

            const person = await Individual.fetch(session, { ssn })

            if (person) {
                personId = person.id

                let driver = await Driver.fetch(session, { personId })

                if (!driver) driver = (await Driver.create(session, { personId })).data
                else body.main.rehire = true

                if (!driver) throw new Error('Failed to fetch or create driver')

                body.main.driverId = driver.id
            } else body.lead = { ssn }

            return body
        },
        async final(application) {
            await Application.invite(session, application, application.formId)
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
                    'rehire',
                    'createdAt',
                    'finishedAt',
                    'reviewedAt',
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
                ],
                search: [ null, 'formId' ]
            },
            {
                table: query.driver_application.lead.table,
                fields: [
                    [ { aes: [ 'ssn', ssnSecret ] }, 'leadSsn' ],
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
                fields: [ 'dob', 'gender', { aes: [ 'ssn', ssnSecret ] } ],
                join: [ 'id', 'personId', 2 ],
                search: [ null, { aes: [ 'ssn', ssnSecret ] } ],
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
                fields: [ 'placeId', 'address1', 'address2', 'city', 'state', 'zip' ],
                join: [ 'personId', 'personId', 2, [ 'since', 'addrSince', 3 ] ],
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
                join: [ 'personId', 'personId', 2, [ 'id', 'dlId', 3 ] ],
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
                driverId, _driverId, teamId, _teamId, userId, _userId, carrierId, _carrierId,
                cdlRole, position, condition, rehire, archived,
                search = {},
            } = filter
            const single = !!id || !!_id || !!formId

            const match = {
                id, formId, driverId, teamId, userId, carrierId,
                cdlRole, position, condition, rehire,
            }
            if (!id) match.id = Application.matchIdHash(_id)
            if (!driverId) match.driverId = Driver.matchIdHash(_driverId)
            if (!teamId) match.teamId = Team.matchIdHash(_teamId)
            if (!userId) match.userId = User.matchIdHash(_userId)
            if (!carrierId) match.carrierId = Carrier.matchIdHash(_carrierId)
            if (typeof archived === 'boolean') {
                match.archivedAt = archived ? { not: null } : null
            }

            batch[0].match = match
            if (!single && !teamId && !_teamId) {
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
        // this._appId = data._appId
        if (!hideRawId) {
            this.id = data.id
            this.driverId = data.driverId
            // this.appId = data.appId
        }
        this.status = data.status
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

        const driverParams = {
            firstName: data.driverFirstName,
            middleName: data.driverMiddleName,
            lastName: data.driverLastName,
            suffix: data.driverSuffix,
            dob: data.dob,
            gender: data.gender,
        }
        this.driver = new Person(driverParams)

        if (data.formId) {
            this._appId = data._appId
            this.application = {
                formId: data.formId,
                firstName: data.appFirstName,
                middleName: data.appMiddleName,
                lastName: data.appLastName,
                suffix: data.appSuffix,
                phone: data.appPhone,
                createdAt: utc2tz(data.createdAt),
                finishedAt: utc2tz(data.finishedAt),
                carrier: data.busName ?  `${data.busName}, ${data.coType}` : null,
                carrierAlias: data.companyAlias,
                _carrierId: data._carrierId,
                _teamId: data._teamId,
            }
            if (!hideRawId) {
                this.appId = data.appId
                this.application.carrierId = data.carrierId
                this.application.teamId = data.teamId
            }
        }

        if (single) {
            this.session = session
            this.config = { hideRawId, hideSensitive }

            this.update = body => classInstance.update(this, new.target, body)

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
        defSorts: [ { desc: 'startedOn' } ],
    })


    static create = (session, body, params) => classStatic.create(this, session, body, params)


    static fetch = (session, filter = {}, { hideRawId = false, sorts = Employment.config().defSorts, limit, mode } = {}) => {
        // const { teamId, condition } = filter
        // const match = { teamId, condition }

        return classStatic.fetch(this, session, filter, { hideRawId, sorts, limit, mode }, {
            batch: [
                {
                    table: query.driver_employment.main.table,
                    fields: [
                        'id',
                        // 'appId',
                        'driverId',
                        Employment.hashId(),
                        // Application.hashId('appId'),
                        'status',
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
                },
                {
                    table: query.driver.main.table,
                    join: [ 'driverId', 'id' ],
                },
                {
                    db: db.person,
                    table: query.person.main.table,
                    fields: [ 'dob', 'gender', { aes: [ 'ssn', ssnSecret ] } ],
                    join: [ 'id', 'personId', 1 ],
                },
                {
                    db: db.person,
                    table: query.person.names.table,
                    fields: [
                        [ 'firstName', 'driverFirstName' ],
                        [ 'middleName', 'driverMiddleName' ],
                        [ 'lastName', 'driverLastName' ],
                        [ 'suffix', 'driverSuffix' ],
                    ],
                    join: [ 'personId', 'id', {
                        table: query.person.main.table,
                        max: 'since',
                    } ],
                },
                // {
                //     table: query.driver_application.main.table,
                //     fields: [
                //         'teamId', Team.hashId('teamId'), 'carrierId', Carrier.hashId('carrierId'), 'formId',
                //         'firstName', 'middleName', 'lastName', 'suffix', ['phone', 'aplPhone'],
                //         'createdAt', 'finishedAt',
                //     ],
                //     match,
                //     join: [ 'id', 'appId' ],
                // },
                // {
                //     table: query.carrier.main.table,
                //     join: [ 'id', 'carrierId', 1 ],
                // },
                // {
                //     db: db.business,
                //     table: query.company.main.table,
                //     join: [ 'id', 'companyId', query.carrier.main.table ],
                // },
                // {
                //     db: db.business,
                //     table: query.company.names.table,
                //     fields: [ 'busName', 'coType', [ 'alias', 'companyAlias' ] ],
                //     join: [ 'companyId', 'id', { max: 'since', table: query.company.main.table } ],
                // },
                // {
                //     db: db.online,
                //     table: query.team.main.table,
                //     join: [ 'id', 'teamId', 1 ],
                // },
            ],
            prepare(batch, filter) {
                const {
                    id, _id,
                    // appId, _appId, teamId, _teamId,
                    driverId, _driverId, appId, _appId, condition,
                } = filter
                const single = !!id || !!_id

                batch[0].match = { id, driverId }
                if (!id) batch[0].match.main.id = Employment.matchIdHash(_id)
                if (!driverId) batch[0].match.main.driverId = Driver.matchIdHash(_driverId)

                if (appId || _appId) {
                    batch.push({
                        table: query.driver_employment.verifications.table,
                        fields: [
                            'appId', Application.hashId('appId'), 'status',
                            'method1', 'inquiredBy1', User.hashId('inquiredBy1'), 'inquiredOn1', 'inquirer1', 'response1',
                            'method2', 'inquiredBy2', User.hashId('inquiredBy2'), 'inquiredOn2', 'inquirer2', 'response2',
                            'method3', 'inquiredBy3', User.hashId('inquiredBy3'), 'inquiredOn3', 'inquirer3', 'response3',
                            'comment',
                            //! continue with more data from verification
                        ],
                        join: [ 'emplId', 'id' ],
                        match: { appId: appId || Application.matchIdHash(_appId) },
                    }, {
                        table: query.driver_application.main.table,
                        fields: [
                            'teamId', Team.hashId('teamId'), 'carrierId', Carrier.hashId('carrierId'), 'formId',
                            [ 'firstName', 'appFirstName' ], [ 'middleName', 'appMiddleName' ],
                            [ 'lastName', 'appLastName' ], [ 'suffix', 'appSuffix' ],
                            ['phone', 'appPhone'], 'createdAt', 'finishedAt',
                        ],
                        join: [ 'id', 'appId', query.driver_employment.verifications.table ],
                    }, {
                        table: query.carrier.main.table,
                        join: [ 'id', 'carrierId', query.driver_employment.verifications.table ],
                    }, {
                        db: db.business,
                        table: query.company.main.table,
                        join: [ 'id', 'companyId', query.carrier.main.table ],
                    }, {
                        db: db.business,
                        table: query.company.names.table,
                        fields: [ 'busName', 'coType', [ 'alias', 'companyAlias' ] ],
                        join: [ 'companyId', 'id', { max: 'since', table: query.company.main.table } ],
                    },
                    {
                        db: db.online,
                        table: query.team.main.table,
                        fields: [ [ 'name', 'teamName' ] ],
                        join: [ 'id', 'teamId', 1 ],
                    })
                }

                // const match = {
                //     main: { id, appId },
                //     applications: { teamId, condition },
                // }
                // if (!id) match.main.id = Employment.matchIdHash(_id)
                // if (!appId) match.main.appId = Application.matchIdHash(_appId)
                // if (!teamId) match.applications.teamId = Team.matchIdHash(_teamId)

                // batch[0].match = match.main
                // batch[1].match = match.applications
                // if (!single && !teamId && !_teamId) {
                //     const idx = batch.length - 1
                //     batch[idx].match = { scoped: [ false, null ] }
                // }

                return { single, batch }
            },
        })
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