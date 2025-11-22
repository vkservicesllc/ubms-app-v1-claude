require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_SSN, DB__MYSQL_AES_EIN } = process.env
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

    static config = {
        db: db.carrier,
        query: query.driver,
        idProp: 'driverId',
        defSorts: null,
    }


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
        this.sex = person.sex
        this.gender = person.gender
        if (!hideSensitive) this.ssn = data.ssn ? stringifyBuffer(data.ssn) : null

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
        }
    }

    static #algorithm = 'SHA-256'
    static hashId = (field = 'id') => hash(field, Application.#algorithm)
    static matchIdHash = value => matchHash(value, Application.#algorithm)

    static config = () => ({
        enforceUser: false,
        db: db.carrier,
        query: query.driver_application,
        idProp: 'aplId',
        defSorts: null,
        logFile: 'driver-applications',
    })


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


}



class Citation {
    constructor(data = {}, { single = true, session, hideRawId = false }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Citation Data')
    }

    static #algorithm = 'MD5'
    static hashId = (field = 'id') => hash(field, Citation.#algorithm)
    static matchIdHash = value => matchHash(value, Citation.#algorithm)


}



class Accident {
    constructor(data = {}, { single = true, session, hideRawId = false }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Accident Data')
    }

    static #algorithm = 'MD5'
    static hashId = (field = 'id') => hash(field, Accident.#algorithm)
    static matchIdHash = value => matchHash(value, Accident.#algorithm)


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