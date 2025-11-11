import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import Individual from './individual.mjs'



class Driver extends Individual {
    static #algorithm = 'SHA-224'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Driver Data')
    }

    static hashId = (field = 'id') => hash(field, Driver.#algorithm)
    static matchIdHash = value => matchHash(value, Driver.#algorithm)


    static list = {

        position: {
            'CD': 'Company Driver',
            'OO': 'Owner Operator',
            'OD': 'Driver for Owner',
            'LP': 'Lease Purchaser',
        },

        experience: { e: 'Experienced', i: 'Inexperienced', s: 'Student' },

    }


}



class Application {
    static #algorithm = 'SHA-256'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Application Data')
    }

    static hashId = (field = 'id') => hash(field, Application.#algorithm)
    static matchIdHash = value => matchHash(value, Application.#algorithm)


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
    static #algorithm = 'MD5'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Citation Data')
    }

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
    static #algorithm = 'MD5'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Accident Data')
    }

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
    static #algorithm = 'MD5'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Employment Data')
    }

    static hashId = (field = 'id') => hash(field, Employment.#algorithm)
    static matchIdHash = value => matchHash(value, Employment.#algorithm)
}



class DriverUser {}



export default Driver
export { Application, Citation, Accident, Employment, DriverUser }