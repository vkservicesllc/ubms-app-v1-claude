/* Settings */
import { addrBook } from '../../../config.mjs';
import db, { query } from '../../settings/mysql.mjs';

/* Tools */
import moment from 'moment';
import { utc2tz, tz2utc, utcTimeStamp } from '../utils/date.mjs';
import Team from './team.mjs';
import User from './user.mjs';
import Query, { hash, matchHash } from '../utils/query.mjs';
import { classInstance, classStatic } from '../utils/class.mjs';
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs';
import bool from '../../../client/global/modules/tools/utils/boolean.mjs';

class Vehicle {
    constructor(data = {}, { single = true, session, hideRawId = false }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Vehicle Data');

        this._id = data._id;
        if (!hideRawId) this.id = data.id;
        this.category = data.category;
        this.make = data.make;
        this.model = data.model;
        this.year = data.year;
        this.vin = data.vin;

        if (single) {
            this.session = session;
            this.config = { hideRawId };

            this.fetch = (filter, params) =>
                classInstance(this, new.target, 'main', filter, params);

            this.update = (body) => classInstance.update(this, new.target, body);

            this.delete = () => classInstance.delete(this, new.target);
        }
    }

    static #algorithm = 'SHA-256';
    static hashId = (field = 'id') => hash(field, Vehicle.#algorithm);
    static matchIdHash = (value) => matchHash(value, Vehicle.#algorithm);

    static config = () => ({
        enforceLocation: true,
        db: db.vehicle,
        query: query.vehicle,
        defSorts: null,
        logFile: 'vehicles',
    });

    static create = (session, body, params) => classStatic.create(this, session, body, params);

    static fetch = (
        session,
        filter,
        { hideRawId = false, sorts = Vehicle.config().defSorts, limit, mode } = {},
    ) =>
        classStatic.fetch(
            this,
            session,
            filter,
            { hideRawId, sorts, limit, mode },
            {
                batch: [
                    {
                        table: query.vehicle.main.table,
                        fields: [
                            'id',
                            Vehicle.hashId(),
                            'vin',
                            'category',
                            'make',
                            'model',
                            'year',
                        ],
                    },
                ],
                prepare(batch, filter) {
                    const { id, _id, vin, category, make, year } = filter;
                    let { model } = filter;
                    const single = !!id || !!_id || !!vin;
                    if (!make) model = undefined;

                    batch[0].match = { id, vin, category, make, model, year };
                    if (!id && _id) batch[0].match.id = Vehicle.matchIdHash(_id);

                    return { single, batch };
                },
            },
        );

    static list = {
        category: {
            htr: ['Heavy Truck', 'GVWR/GCWR over 26,000 lbs (CDL Class A/B)'],
            mtr: ['Medium Truck', 'Trucks 10,001–26,000 lbs GVWR'],
            ltr: ['Light Truck', 'Trucks and pickups ≤ 10,000 lbs GVWR'],
            trl: ['Trailer/Semi', 'Trailers, semi-trailers'],
            van: ['Van/Minivan', 'Passenger or cargo vans'],
            // spc: [
            //     'Special Purpose',
            //     'Non-truck utility/construction equipment (e.g., graders, forklifts)',
            // ],
            // bus: ['Bus/Coach', 'City buses, coaches, minibuses'],
            // car: ['Passenger Car', 'Standard cars, sedans, hatchbacks'],
            // suv: ['SUV/Crossover', 'Sport Utility Vehicles'],
            // mcy: ['Motorcycle/Moped', 'Two-wheeled vehicles'],
        },
    };
}

async function resolveVehicleBody(session, body = {}) {
    const { _vehicleId, vin, category, make, model, year } = body;
    let { vehicleId } = body;
    delete body.vehicleId;
    delete body._vehicleId;
    delete body.vin;
    delete body.category;
    delete body.make;
    delete body.model;
    delete body.year;

    if (!vehicleId && !_vehicleId) {
        if (!vin || !category || !make || !model || !year)
            throw new Error('Not enough parameters to create vehicle');

        const { data: vehicle } = await Vehicle.create(session, {
            vin,
            category,
            make,
            model,
            year,
        });
        if (!vehicle) throw new Error('Failed to create vehicle');

        vehicleId = vehicle.id;
    } else if (_vehicleId) {
        const vehicle = await Vehicle.fetch(session, { _id: _vehicleId });
        if (!vehicle) throw new Error('Vehicle not found');

        vehicleId = vehicle.id;
    }

    return { vehicleId, ...body };
}

function vehicleBatch(Src, prop, fields = []) {
    return [
        {
            table: query[prop].main.table,
            fields: ['id', Src.hashId(), 'vehicleId', Vehicle.hashId('vehicleId'), ...fields],
        },
        {
            table: query.vehicle.main.table,
            fields: ['vin', 'category', 'make', 'model', 'year'],
            join: ['id', 'vehicleId'],
        },
    ];
}

function prepareVehicleFilter(Src, batch, filter) {
    const { id, _id, vehicleId, _vehicleId, vin, category, make, year } = filter;
    let { model } = filter;
    const single = !!id || !!_id || !!vehicleId || !!_vehicleId || !!vin;
    if (!make) model = undefined;

    batch[0].match = { id, vehicleId };
    batch[1].match = { vin, category, make, model, year };
    if (!id && _id) batch[0].match.id = Src.matchIdHash(_id);
    if (!vehicleId && _vehicleId) batch[0].match.vehicleId = Vehicle.matchIdHash(_vehicleId);

    return { single, batch };
}

class Truck extends Vehicle {
    constructor(data = {}, { single = true, session, hideRawId = false }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Truck Data');

        super(data, { single, hideRawId });
        const { id, _id, vehicleId, _vehicleId } = data;
        const properties = {
            first: { _id, _vehicleId },
            last: {},
        };
        if (!hideRawId) {
            properties.first.id = id;
            properties.last.vehicleId = vehicleId;
        }

        reSuper(this, properties.first, properties.last);

        if (single) {
            this.session = session;
            this.config = { hideRawId };

            this.fetch = (filter, params) =>
                classInstance(this, new.target, 'main', filter, params);

            this.update = (body) => classInstance.update(this, new.target, body);

            this.delete = () => classInstance.delete(this, new.target);
        }
    }

    static #algorithm = 'SHA-224';
    static hashId = (field = 'id') => hash(field, Truck.#algorithm);
    static matchIdHash = (value) => matchHash(value, Truck.#algorithm);

    static config = () => ({
        enforceLocation: true,
        db: db.vehicle,
        query: query.truck,
        defSorts: null,
        logFile: 'trucks',
    });

    static create = async (session, body, params) => {
        body = await resolveVehicleBody(session, body);
        return classStatic.create(this, session, body, params);
    };

    static fetch = (
        session,
        filter,
        { hideRawId = false, sorts = Truck.config().defSorts, limit, mode } = {},
    ) =>
        classStatic.fetch(
            this,
            session,
            filter,
            { hideRawId, sorts, limit, mode },
            {
                batch: vehicleBatch(Truck, 'truck', [
                    //! unique truck fields
                ]),
                prepare(batch, filter) {
                    return prepareVehicleFilter(Truck, batch, filter);
                },
            },
        );

    static list = {
        pickupMakeModel: {
            Ford: ['F-250', 'F-350', 'F-450'],
            Ram: ['2500', '3500', '4500'],
            Chevrolet: ['Silverado 2500HD', 'Silverado 3500HD'],
            GMC: ['Sierra 2500HD', 'Sierra 3500HD'],
            Nissan: ['Titan XD'],
            Toyota: ['Tundra'],
        },

        straightBoxMakeModel: {
            Ford: ['F-650 Box', 'F-750 Box'],
            Chevrolet: ['LCF 6500XD'],
            Freightliner: ['M2 106 Box'],
            Kenworth: ['T270 Box'],
            International: ['MV607', 'Durastar 4300'],
            Isuzu: ['NPR-HD', 'NQR', 'FTR'],
            Hino: ['268A', 'L6 Box'],
        },
    };

    // static straightCubeMakeModelList = {
    //     'Ford': ['E-350 Cutaway', 'E-450 Cube'],
    //     'Chevrolet': ['Express Cutaway', '3500 Cube'],
    //     'GMC': ['Savana Cutaway', '3500 Cube'],
    //     'Ram': ['3500 Cutaway'],
    //     'Isuzu': ['N-Series Cutaway'],
    // }

    // static straightDumpMakeModelList = {
    //     'Ford': ['F-550 Dump', 'F-750 Dump'],
    //     'Chevrolet': ['Silverado 6500HD Dump'],
    //     'GMC': ['Sierra 6500HD Dump'],
    //     'Ram': ['5500 Dump'],
    //     'Freightliner': ['M2 106 Dump'],
    //     'International': ['HV607', 'Durastar Dump'],
    //     'Peterbilt': ['337 Dump'],
    //     'Kenworth': ['T370 Dump'],
    // }

    // static straightRollbackMakeModelList = {
    //     'Ford': ['F-550 Rollback', 'F-650 Rollback'],
    //     'Chevrolet': ['Silverado 5500HD Rollback'],
    //     'Ram': ['5500 Rollback'],
    //     'Freightliner': ['M2 106 Rollback'],
    //     'International': ['MV607 Rollback'],
    //     'Hino': ['258 Rollback', 'L7 Rollback'],
    //     'Kenworth': ['T270 Rollback'],
    // }

    // static straightPickupMakeModelList = {
    //     'Ford': ['F-250 Super Duty', 'F-350 Super Duty', 'F-450 Super Duty'],
    //     'Ram': ['2500', '3500', '4500', '5500'],
    //     'Chevrolet': ['Silverado 2500HD', 'Silverado 3500HD'],
    //     'GMC': ['Sierra 2500HD', 'Sierra 3500HD'],
    // }
}

class Trailer extends Vehicle {
    constructor(data = {}, { single = true, session, hideRawId = false }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Trailer Data');

        super(data, { single, hideRawId });
        const { id, _id, vehicleId, _vehicleId } = data;
        const properties = {
            first: { _id, _vehicleId },
            last: {},
        };
        if (!hideRawId) {
            properties.first.id = id;
            properties.last.vehicleId = vehicleId;
        }

        reSuper(this, properties.first, properties.last);

        if (single) {
            this.session = session;
            this.config = { hideRawId };

            this.fetch = (filter, params) =>
                classInstance(this, new.target, 'main', filter, params);

            this.update = (body) => classInstance.update(this, new.target, body);

            this.delete = () => classInstance.delete(this, new.target);
        }
    }

    static #algorithm = 'SHA-224';
    static hashId = (field = 'id') => hash(field, Trailer.#algorithm);
    static matchIdHash = (value) => matchHash(value, Trailer.#algorithm);

    static config = () => ({
        enforceLocation: true,
        db: db.vehicle,
        query: query.trailer,
        defSorts: null,
        logFile: 'tailers',
    });

    static create = async (session, body, params) => {
        body = await resolveVehicleBody(session, body);
        return classStatic.create(this, session, body, params);
    };

    static fetch = (
        session,
        filter,
        { hideRawId = false, sorts = Trailer.config().defSorts, limit, mode } = {},
    ) =>
        classStatic.fetch(
            this,
            session,
            filter,
            { hideRawId, sorts, limit, mode },
            {
                batch: vehicleBatch(Trailer, 'trailer', [
                    //! unique trailer fields
                ]),
                prepare(batch, filter) {
                    return prepareVehicleFilter(Trailer, batch, filter);
                },
            },
        );
}

class Van extends Vehicle {
    constructor(data = {}, { single = true, session, hideRawId = false }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Van Data');

        super(data, { single, hideRawId });
        const { id, _id, vehicleId, _vehicleId } = data;
        const properties = {
            first: { _id, _vehicleId },
            last: {},
        };
        if (!hideRawId) {
            properties.first.id = id;
            properties.last.vehicleId = vehicleId;
        }

        reSuper(this, properties.first, properties.last);

        if (single) {
            this.session = session;
            this.config = { hideRawId };

            this.fetch = (filter, params) =>
                classInstance(this, new.target, 'main', filter, params);

            this.update = (body) => classInstance.update(this, new.target, body);

            this.delete = () => classInstance.delete(this, new.target);
        }
    }

    static #algorithm = 'SHA-224';
    static hashId = (field = 'id') => hash(field, Van.#algorithm);
    static matchIdHash = (value) => matchHash(value, Van.#algorithm);

    static config = () => ({
        enforceLocation: true,
        db: db.vehicle,
        query: query.van,
        defSorts: null,
        logFile: 'vans',
    });

    static create = async (session, body, params) => {
        body = await resolveVehicleBody(session, body);
        return classStatic.create(this, session, body, params);
    };

    static fetch = (
        session,
        filter,
        { hideRawId = false, sorts = Van.config().defSorts, limit, mode } = {},
    ) =>
        classStatic.fetch(
            this,
            session,
            filter,
            { hideRawId, sorts, limit, mode },
            {
                batch: vehicleBatch(Van, 'van', [
                    //! unique van fields
                ]),
                prepare(batch, filter) {
                    return prepareVehicleFilter(Van, batch, filter);
                },
            },
        );

    static list = {
        cargoMakeModel: {
            Ford: ['Transit', 'Transit Connect', 'E-Series'],
            'Mercedes-Benz': ['Sprinter', 'Metris'],
            Freightliner: ['Sprinter'],
            Ram: ['ProMaster', 'ProMaster City'],
            Chevrolet: ['Express 2500', 'Express 3500'],
            GMC: ['Savana 2500', 'Savana 3500'],
            Nissan: ['NV1500', 'NV2500', 'NV3500', 'NV200'],
        },
    };
}

export default Vehicle;
export { Truck, Trailer, Van };
