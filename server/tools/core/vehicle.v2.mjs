import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import defProp from '../utils/data.mjs'



class Vehicle {
    static #algorithm = 'SHA-256'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Vehicle Data')

        let { single, hideRawId } = options
        single = defProp(single, true, 'boolean')
        hideRawId = defProp(hideRawId, false, 'boolean')
    }

    static hashId = (field = 'id') => hash(field, Vehicle.#algorithm)
    static matchIdHash = value => matchHash(value, Vehicle.#algorithm)
}



class Truck extends Vehicle {
    static #algorithm = 'SHA-384'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Truck Data')

        options.single = defProp(options.single, true, 'boolean')
        options.hideRawId = defProp(options.hideRawId, false, 'boolean')
        super(data, options)

        const { single, hideRawId } = options
    }

    static hashId = (field = 'id') => hash(field, Truck.#algorithm)
    static matchIdHash = value => matchHash(value, Truck.#algorithm)


    static list = {

        straightBoxMakeModel: {
            'Ford': ['F-650 Box', 'F-750 Box'],
            'Chevrolet': ['LCF 6500XD'],
            'Freightliner': ['M2 106 Box'],
            'Kenworth': ['T270 Box'],
            'International': ['MV607', 'Durastar 4300'],
            'Isuzu': ['NPR-HD', 'NQR', 'FTR'],
            'Hino': ['268A', 'L6 Box'],
        },

    }


}



class Trailer extends Vehicle {
    static #algorithm = 'SHA-384'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Trailer Data')

        options.single = defProp(options.single, true, 'boolean')
        options.hideRawId = defProp(options.hideRawId, false, 'boolean')
        super(data, options)

        const { single, hideRawId } = options
    }

    static hashId = (field = 'id') => hash(field, Trailer.#algorithm)
    static matchIdHash = value => matchHash(value, Trailer.#algorithm)
}



class Van extends Vehicle {
    static #algorithm = 'SHA-384'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Van Data')

        options.single = defProp(options.single, true, 'boolean')
        options.hideRawId = defProp(options.hideRawId, false, 'boolean')
        super(data, options)

        const { single, hideRawId } = options
    }

    static hashId = (field = 'id') => hash(field, Van.#algorithm)
    static matchIdHash = value => matchHash(value, Van.#algorithm)


    static list = {

        cargoMakeModel: {
            'Ford': ['Transit', 'Transit Connect', 'E-Series'],
            'Mercedes-Benz': ['Sprinter', 'Metris'],
            'Freightliner': ['Sprinter'],
            'Ram': ['ProMaster', 'ProMaster City'],
            'Chevrolet': ['Express 2500', 'Express 3500'],
            'GMC': ['Savana 2500', 'Savana 3500'],
            'Nissan': ['NV1500', 'NV2500', 'NV3500', 'NV200'],
        },

    }


}



class Bus extends Vehicle {
    static #algorithm = 'SHA-384'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Bus Data')

        options.single = defProp(options.single, true, 'boolean')
        options.hideRawId = defProp(options.hideRawId, false, 'boolean')
        super(data, options)

        const { single, hideRawId } = options
    }

    static hashId = (field = 'id') => hash(field, Bus.#algorithm)
    static matchIdHash = value => matchHash(value, Bus.#algorithm)
}



class Car extends Vehicle {
    static #algorithm = 'SHA-384'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Car Data')

        options.single = defProp(options.single, true, 'boolean')
        options.hideRawId = defProp(options.hideRawId, false, 'boolean')
        super(data, options)

        const { single, hideRawId } = options
    }

    static hashId = (field = 'id') => hash(field, Car.#algorithm)
    static matchIdHash = value => matchHash(value, Car.#algorithm)
}



export default Vehicle
export { Truck, Trailer, Van, Bus, Car }