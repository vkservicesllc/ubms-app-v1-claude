import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'



class Vehicle {
    static #algorithm = 'SHA-256'

    static #batch = ({ user: sessionUser = {} }, filter = {}) => {}


    constructor(data = {}, { single = true, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Vehicle Data')
    }

    static hashId = (field = 'id') => hash(field, Vehicle.#algorithm)
    static matchIdHash = value => matchHash(value, Vehicle.#algorithm)


    static create = ({ user: sessionUser = {} }, data = {}) => {
        let created = false, error

        //* ...

        return { created, error }
    }


    static fetch = ({ user: sessionUser = {} } = {}, filter = {}) => {
        const batch = Role.#batch({ user: sessionUser }, filter)

        //* ...
    }


}



class Truck extends Vehicle {
    static #algorithm = 'SHA-384'

    static #batch = ({ user: sessionUser = {} }, filter = {}) => {}


    constructor(data = {}, { single = true, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Truck Data')

        super(data, { single, hideRawId })
    }

    static hashId = (field = 'id') => hash(field, Truck.#algorithm)
    static matchIdHash = value => matchHash(value, Truck.#algorithm)


    static create = ({ user: sessionUser = {} }, data = {}) => {
        let created = false, error

        //* ...

        return { created, error }
    }


    static fetch = ({ user: sessionUser = {} } = {}, filter = {}) => {
        const batch = Role.#batch({ user: sessionUser }, filter)

        //* ...
    }


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

    static #batch = ({ user: sessionUser = {} }, filter = {}) => {}


    constructor(data = {}, { single = true, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Trailer Data')

        super(data, { single, hideRawId })
    }

    static hashId = (field = 'id') => hash(field, Trailer.#algorithm)
    static matchIdHash = value => matchHash(value, Trailer.#algorithm)


    static create = ({ user: sessionUser = {} }, data = {}) => {
        let created = false, error

        //* ...

        return { created, error }
    }


    static fetch = ({ user: sessionUser = {} } = {}, filter = {}) => {
        const batch = Role.#batch({ user: sessionUser }, filter)

        //* ...
    }


}



class Van extends Vehicle {
    static #algorithm = 'SHA-384'

    static #batch = ({ user: sessionUser = {} }, filter = {}) => {}


    constructor(data = {}, { single = true, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Van Data')

        super(data, { single, hideRawId })
    }

    static hashId = (field = 'id') => hash(field, Van.#algorithm)
    static matchIdHash = value => matchHash(value, Van.#algorithm)


    static create = ({ user: sessionUser = {} }, data = {}) => {
        let created = false, error

        //* ...

        return { created, error }
    }


    static fetch = ({ user: sessionUser = {} } = {}, filter = {}) => {
        const batch = Role.#batch({ user: sessionUser }, filter)

        //* ...
    }


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

    static #batch = ({ user: sessionUser = {} }, filter = {}) => {}


    constructor(data = {}, { single = true, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Bus Data')

        super(data, { single, hideRawId })
    }

    static hashId = (field = 'id') => hash(field, Bus.#algorithm)
    static matchIdHash = value => matchHash(value, Bus.#algorithm)


    static create = ({ user: sessionUser = {} }, data = {}) => {
        let created = false, error

        //* ...

        return { created, error }
    }


    static fetch = ({ user: sessionUser = {} } = {}, filter = {}) => {
        const batch = Role.#batch({ user: sessionUser }, filter)

        //* ...
    }


}



class Car extends Vehicle {
    static #algorithm = 'SHA-384'

    static #batch = ({ user: sessionUser = {} }, filter = {}) => {}


    constructor(data = {}, { single = true, hideRawId = false }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Car Data')

        super(data, { single, hideRawId })
    }

    static hashId = (field = 'id') => hash(field, Car.#algorithm)
    static matchIdHash = value => matchHash(value, Car.#algorithm)


    static create = ({ user: sessionUser = {} }, data = {}) => {
        let created = false, error

        //* ...

        return { created, error }
    }


    static fetch = ({ user: sessionUser = {} } = {}, filter = {}) => {
        const batch = Role.#batch({ user: sessionUser }, filter)

        //* ...
    }


}



export default Vehicle
export { Truck, Trailer, Van, Bus, Car }