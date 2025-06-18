require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_SSN, DB__MYSQL_AES_EIN } = process.env
const ssnSecret = DB__MYSQL_AES_SSN
const einSecret = DB__MYSQL_AES_EIN


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
    aplExperiences: new Query(db.carrier, 'application_experiences'),
    aplEmployers: new Query(db.carrier, 'application_preemployments'),
    aplPreferences: new Query(db.carrier, 'application_preferences'),
    aplBusinesses: new Query(db.carrier, 'application_businesses'),
    aplVehicles: new Query(db.carrier, 'application_vehicles'),
    aplBeneficiaries: new Query(db.carrier, 'application_beneficiaries'),
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
        this.deptId = data.deptId
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
        this.address.livedAbroad = bool(data.livedAbroad)
        this.address.country
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
                cdlSchool: bool(data.cdlSchool),
                schName: data.schName,
                schPhone: data.schPhone,
                schState: data.schState,
                schEndDate: data.schEndDate,
                schDuration: data.schDuration,
                currentVhl: bool(data.currentVhl),
                
            }

        this.prevEmployed = bool(data.prevEmployed)

        if (data.startPref !== null) {
            this.preference = {
                startPref: data.startPref.toString(),
                operType: data.operType,
            }

            if (this.deptId === 0) {
                this.preference.haulRegion = data.haulRegion
                this.preference.equipmentType = data.equipmentType
            }
        }

        this.activeBusiness = bool(data.activeBusiness)
        this.businessAssist = bool(data.businessAssist)

        if (this.activeBusiness)
            this.business = {
                busName: data.ownBusName,
                state: data.busState,
                ein: data.busEin ? stringifyBuffer(data.busEin) : null,
            }
        else if (this.businessAssist)
            this.business = {
                proposedName: data.proposedBusName,
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
            this.beneficiary = {
                firstName: data.benefFirstName,
                middleName: data.benefMiddleName,
                lastName: data.benefLastName,
                suffix: data.benefSuffix,
                relation: data.benefRelation,
                otherRel: data.benefOtherRel,
                dob: data.benefDob,
                sex: data.benefSex,
                ssn: data.benefSsn ? stringifyBuffer(data.benefSsn) : null,
                phone: data.benefPhone,
                address1: data.benefAddress1,
                address2: data.benefAddress2,
                city: data.benefAddrCity,
                state: data.benefAddrState,
                zip: data.benefAddrZip,
            }

            switch (this.beneficiary.sex) {
                case 0:
                case '0':
                    this.beneficiary.gender = [ 'F', 'Female' ]
                    break
                case 1:
                case '1':
                    this.beneficiary.gender = [ 'M', 'Male' ]
                    break
            }
        }

        if (data.emergPhone)
            data.emergency = {
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
            target2 = null,
            idProp = 'id',
            mainData = {},
            data2 = {}
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
                target = 'aplCitations'
                action = 'insert' //! for now it is easier to delete and insert newly submitted citations, `updateLog` is redundant at this point

                if (data.dui && typeof data.duiInDecade !== 'boolean')
                    error = 'Data Submission Error: Explanation not provided for DUI'
                if (!data.dui) data.duiInDecade = null

                if (data.criminal && !data.criminalExpl)
                    error = 'Data Submission Error: Explanation not provided for Criminal Record'
                if (!data.criminal) data.criminalExpl = null

                const { citations } = data

                mainData.dui = data.dui
                mainData.duiInDecade = data.duiInDecade
                mainData.criminal = data.criminal
                mainData.criminalExpl = data.criminalExpl
                mainData.dotDat = data.dotDat
                mainData.citations = citations

                await mysql.execute(query.aplCitations.delete({ aplId: id }))

                const { violation, other: otherViolation, citedOn, state: citState  } = data
                data = []

                //! DOESN'T MAKE SENSE
                if (!violation && data.citations) data.citations = false

                if (this.step < 4) {
                    mainData = processData(mainData)
                    mainData.step = 4
                } else
                    mainData = processData(mainData, {
                        modifiedBy,
                        branch,
                        siteId,
                        currentData: this,
                        currentUpdateLog: await this.log('updateLog'),
                    })

                if (citations) {
                    const count = violation.length

                    for (let i = 0; i < count; i++) {
                        data.push({
                            aplId: id,
                            violation: violation[i],
                            other: violation[i] === 'other' ? otherViolation?.[i] : null,
                            citedOn: citedOn[i],
                            state: citState[i],
                        })
                    }
                }
                break


            case 'safety':
                target = 'aplAccidents'
                action = 'insert' //! for now it is easier to delete and insert newly submitted accidents, `updateLog` is redundant at this point

                const { accidents } = data
                mainData.accidents = accidents

                await mysql.execute(query.aplAccidents.delete({ aplId: id }))

                const { collision, other: otherCollision, date: accDate, state: accState, injuries, fatalities } = data
                data = []

                //! DOESN'T MAKE SENSE
                if (!collision && data.accidents) data.accidents = false

                if (this.step < 5) {
                    mainData = processData(mainData)
                    mainData.step = 5
                } else
                    mainData = processData(mainData, {
                        modifiedBy,
                        branch,
                        siteId,
                        currentData: this,
                        currentUpdateLog: await this.log('updateLog'),
                    })

                if (accidents) {
                    const count = collision.length

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
                }
                break


            case 'experience':
                target = 'aplExperiences'
                action = 'insert' //! for now it is easier to delete and insert newly submitted experiences, `updateLog` is redundant at this point

                await mysql.execute(query.aplExperiences.delete({ aplId: id }))

                const experience = data.noExp !== true
                mainData.experience = experience
                delete data.noExp

                if (this.step < 6) {
                    mainData = processData(mainData)
                    mainData.step = 6
                } else
                    mainData = processData(mainData, {
                        modifiedBy,
                        branch,
                        siteId,
                        currentData: { experience: !!this.experience },
                        currentUpdateLog: await this.log('updateLog'),
                    })

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
                } else data = {}
                break


            case 'pre-employment':
                target = 'aplEmployers'
                action = 'insert' //! for now it is easier to delete and insert newly submitted employments, `updateLog` is redundant at this point

                const { prevEmployed } = data
                mainData.prevEmployed = prevEmployed

                await (mysql.execute(query.aplEmployers.delete({ aplId: id })))

                const {
                    employer, phone, address1, address2, zip, city, state,
                    startedOn, position, earnings, fmcsr, dotDat, rfl, leftOn,
                } = data
                data = []

                if (this.step < 7) {
                    mainData = processData(mainData)
                    mainData.step = 7
                } else
                    mainData = processData(mainData, {
                        modifiedBy,
                        branch,
                        siteId,
                        currentData: this,
                        currentUpdateLog: await this.log('updateLog'),
                    })

                if (prevEmployed) {
                    const count = employer.length

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
                }
                break


            case 'preference':
                target = 'aplPreferences'
                idProp = 'aplId'

                let { haulRegion, equipment } = data
                delete data.haulRegion
                delete data.equipment

                if (haulRegion) haulRegion = JSON.stringify(haulRegion)
                if (equipment) equipment = JSON.stringify(equipment)

                if (!this.preference) {
                    data = processData(data)
                    data.aplId = id
                    mainData.step = 8
                    action = 'insert'
                } else {
                    currentData = { ...this.preference }
                    currentUpdateLog = await this.log('updateLog', target)

                    currentData.startPref = +currentData.startPref
                    delete currentData.haulRegion
                    delete currentData.equipmentType

                    data = processData(data, {
                        modifiedBy,
                        branch,
                        siteId,
                        currentData,
                        currentUpdateLog,
                    })
                }

                if (this.deptId === 0) {
                    data.haulRegion = haulRegion
                    data.equipment = equipment
                }
                break


            case 'business':
                target = 'aplBusinesses'
                idProp = 'aplId'

                const { activeLLC, llcAssistance } = data
                delete data.activeLLC
                delete data.llcAssistance

                mainData.activeBusiness = activeLLC
                mainData.businessAssist = typeof llcAssistance === 'boolean' ? llcAssistance : null

                if (this.position[0] === 'OO') {
                    const { mmt, type, make, model, year, length } = data
                    delete data.mmt
                    delete data.type
                    delete data.make
                    delete data.model
                    delete data.year
                    delete data.length

                    data2 = { mmt, type, make, model, year, length }
                    target2 = 'aplVehicles'
                }

                if (this.step < 9) {
                    mainData = processData(mainData)
                    mainData.step = 9

                    action = 'insert'
                    data = processData(data)
                    data.aplId = id
                    if (data.ein) data.ein = { aes: [ data.ein, einSecret ] }

                    if (target2) {
                        data2 = processData(data2)
                        data2.aplId = id
                    }
                } else {
                    mainData = processData(mainData, {
                        modifiedBy,
                        branch,
                        siteId,
                        currentData: this,
                        currentUpdateLog: await this.log('updateLog'),
                    })

                    if (activeLLC === true) data.proposedName = null
                    else {
                        data.busName = null
                        data.state = null
                        data.ein = null
                    }

                    data = processData(data, {
                        modifiedBy,
                        branch,
                        siteId,
                        currentData: this.business,
                        currentUpdateLog: await this.log('updateLog', target),
                    })
                    if ('ein' in data) data.ein = { aes: [ data.ein, einSecret ] }

                    if (target2) {
                        if (data2.mmt) {
                            if (data2.mmt !== 'other') {
                                data2.type = null
                                data2.make = null
                                data2.model = null

                                if (data2.type !== 'straightBox')
                                    data2.length = null
                            } else {
                                if (data2.mmt.split(':')[0] !== 'straightBox')
                                    data2.length = null
                            }
                        }

                        data2 = processData(data2, {
                            modifiedBy,
                            branch,
                            siteId,
                            currentData: this.vehicle,
                            currentUpdateLog: await this.log('updateLog', target2),
                        })
                    }
                }

                break


            case 'beneficiary':
                target = 'aplBeneficiaries'
                idProp = 'aplId'

                if (!this.beneficiary) {
                    data = processData(data)
                    data.aplId = id
                    if (data.ssn) data.ssn = { aes: [ data.ssn, ssnSecret ] }
                    mainData.step = 10
                    action = 'insert'
                } else {
                    if (data.relation !== 'Other')
                        data.otherRel = null
                    data = processData(data, {
                        modifiedBy,
                        branch,
                        siteId,
                        currentData: this.beneficiary,
                        currentUpdateLog: await this.log('updateLog', target)
                    })
                    if ('ssn' in data) data.ssn = { aes: [ data.ssn, ssnSecret ] }
                }

                break


        }

        if (!error) {
// console.log({ mainData, data, data2 })
// console.log('----')
// console.log(query[target][action](data, { [idProp]: id }))
// console.log('----')
// console.log(query.applications.update(mainData, { id }))
// console.log('----')
// console.log(query[target2][action](data2, { [idProp]: id }))
            if ((Array.isArray(data) && data.length) || Object.keys(data).length) {
                const [ result ] = await mysql.execute(query[target][action](data, { [idProp]: id }))
                if (result.affectedRows > 0) modified = true
            }

            if (Object.keys(mainData).length) {
                const [ result ] = await mysql.execute(query.applications.update(mainData, { id }))
                if (!modified && result.affectedRows === 1) modified = true
            }

            if ((Array.isArray(data2) && data2.length) || Object.keys(data2).length) {
                const [ result ] = await mysql.execute(query[target2][action](data2, { [idProp]: id }))
                if (result.affectedRows > 0) modified = true
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

        }

        if (!src || !fields.length) return { error: 'Internal Server Error: Invalid Params' }

        return { data: (await mysql.execute(query[src].select(fields, filter)))[0] }
    }


    static stepList = [
        [ 'Profile', 'Address' ],  //, 'Previous Addresses' ],
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
        semiTL: {
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

    static vhlTypeList = {
        truckLoad: {
            semiTR: 'Semi Tractor',
            hotshot: 'Hotshot',
            straightBox: 'Box Truck',
            van: 'Cargo Van',
        },
        expedite: {
            van: 'Cargo Van',
            straightBox: 'Box Truck',
        },
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
                    'deptId',
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
                    'prevEmployed',
                    'activeBusiness',
                    'businessAssist',
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
                table: 'application_experiences',
                fields: [
                    [ 'cmv', 'cmvExp' ],
                    [ 'vehicles', 'expVehicles' ],
                    [ 'firstDate', 'expFirstDate' ],
                    [ 'lastDate', 'expLastDate' ],
                    [ 'mileage', 'expMileage' ],
                    [ 'hours', 'expHours' ],
                    'cdlSchool',
                    'schName',
                    'schPhone',
                    'schState',
                    'schEndDate',
                    'schDuration',
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: 'application_preferences',
                fields: [
                    'operType',
                    'haulRegion',
                    [ 'equipment', 'equipmentType' ],
                    'startPref',
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: 'application_businesses',
                fields: [
                    [ 'busName', 'ownBusName' ],
                    [ 'state', 'busState' ],
                    [ { aes: [ 'ein', einSecret ] }, 'busEin' ],
                    [ 'proposedName', 'proposedBusName' ],
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: 'application_vehicles',
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
                table: 'application_beneficiaries',
                fields: [
                    [ 'firstName', 'benefFirstName' ],
                    [ 'middleName', 'benefMiddleName' ],
                    [ 'lastName', 'benefLastName' ],
                    [ 'suffix', 'benefSuffix' ],
                    [ 'relation', 'benefRelation' ],
                    [ 'otherRel', 'benefOtherRel' ],
                    [ 'dob', 'benefDob' ],
                    [ 'sex', 'benefSex' ],
                    [ { aes: [ 'ssn', ssnSecret ] }, 'benefSsn' ],
                    [ 'phone', 'benefPhone' ],
                    [ 'address1', 'benefAddress1' ],
                    [ 'address2', 'benefAddress2' ],
                    [ 'city', 'benefAddrCity' ],
                    [ 'state', 'benefAddrState' ],
                    [ 'zip', 'benefAddrZip' ],
                ],
                join: [ 'aplId', 'id' ],
            },
            {
                table: 'application_emergencies',
                fields: [
                    [ 'phone', 'emergPhone' ],
                    [ 'name', 'emergName' ],
                    [ 'relation', 'emergRelation' ],
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
                    'apl.deptId',
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