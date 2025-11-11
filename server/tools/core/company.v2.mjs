import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import Individual from './individual.mjs'



class Company {
    static #algorithm = 'SHA-256'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Company Data')
    }

    static hashId = (field = 'id') => hash(field, Company.#algorithm)
    static matchIdHash = value => matchHash(value, Company.#algorithm)


    static list = {

        category:{
            'crr': {  branch: 'carrier',       item: [ 'Carriers', 'Carrier' ],      group: 'Logistics',     path: [ 'carriers', 'carrier' ],  icon: '<i class="fas fa-truck-fast"></i>'  },
            'brk': {  branch: 'broker',        item: [ 'Brokers', 'Broker' ],        group: 'Brokerage',     path: [ 'brokers', 'broker' ]        },
            'whs': {  branch: 'warehouse',     item: [ 'Warehouses', 'Warehouse' ],  group: 'Storage',       path: [ 'warehouses', 'warehouse' ]  },
            'shp': {  branch: 'shop',          item: [ 'Shops', 'Shop' ],            group: 'Shops',         path: [ 'shops', 'shop' ]            },
            'scl': {  branch: 'school',        item: [ 'Schools', 'School' ],        group: 'CDL Training',  path: [ 'schools', 'school' ]        },
            'cst': {  branch: 'construction',  item: [ 'Builders', 'Builder' ],      group: 'Construction',  path: [ 'builders', 'builder' ]      },
        },

        type: {
            'Corporation': {
                'Inc': 'Incorporated',
                'PC': 'Professional Corporation',
                'B Corp': 'Benefit Corporation',
                'C Corp': 'C Corporation',
                'S Corp': 'S Corporation',
            },
            'Partnership': {
                'GP': 'General Partnership',
                'LP': 'Limited Partnership',
                'LLP': 'Limited Liability Partnership',
            },
            'Other': {
                'LLC': 'Limited Liability Company',
            },
            full() {
                return {
                    ...this['Corporation'],
                    ...this['Partnership'],
                    ...this['Other'],
                }
            },
        },

    }


}



class Owner extends Individual {}



export default Company
export { Owner }