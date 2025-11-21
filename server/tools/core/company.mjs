require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_EIN, DB__MYSQL_AES_SSN } = process.env
const secret = {
    ein: DB__MYSQL_AES_EIN,
    ssn: DB__MYSQL_AES_SSN,
}

/* Settings */
import db from '../../settings/mysql.mjs'

/* Tools */
import moment from 'moment'
import Individual, { query as personQuery } from './individual.mjs'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Team from './team.mjs'
import User, { query as userQuery } from './user.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
// import { sessionError } from './user.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import { classInstance, classStatic } from '../utils/class.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { encrypt } from '../utils/crypto.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { numeric } from '../../../client/global/modules/tools/utils/number.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import strip, { ein as formatEin, ssn as formatSsn } from '../../../client/global/modules/tools/utils/formatter.mjs'
import { sortArrayByObjectKey, sortObjectByValue } from '../../../client/global/modules/tools/utils/sorter.mjs'

const mysql = require('../utils/mysql')


const { sqlMode } = Query
const query = {
    company: {
        main: new Query(db.business, 'companies'),
        name: new Query(db.business, 'company_names'),
        ownership: new Query(db.business, 'company_ownerships'),
        address: new Query(db.business, 'company_addresses'),
        mail: new Query(db.business, 'company_mail'),
        phone: new Query(db.business, 'company_phones'),
        fax: new Query(db.business, 'company_faxes'),
        email: new Query(db.business, 'company_emails'),
        //! ...Add more if needed
    },
    owner: {
        main: new Query(db.business, 'company_owners'),
    },
}



class Company {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true } = {}) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Company Data')

        this._id = data._id
        if (!hideRawId) this.id = data.id

        this.category = data.category
        if (!hideSensitive) this.ein = stringifyBuffer(data.ein)
        this.duns = data.duns
        this.website = data.website
        this.route = data.route
        this.active = data.active
        this.confirmed = data.confirmed
        this.global = data.global
        this.name = data.name
        this.busName = data.busName
        this.coType = data.coType
        this.alias = data.alias
        this.since = data.since
        this.until = data.until
        this.lastLogo = data.lastLogo
        this.style = data.style || {}
        if (!this.style.background) this.style.background = null
        if (!this.style.text) this.style.text = null

        this.expansion = {
            category: Company.list.category[data.category].item[1],
            categoryGroup: Company.list.category[data.category].item[0],
            group: Company.list.category[data.category].group,
        }

        this.owner = data._ownerId
            ? new Owner({
                _id: data._ownerId,
                _personId: data._personId,
                id: data.ownerId,
                personId: data.personId,
                firstName: data.firstName,
                middleName: data.middleName,
                lastName: data.lastName,
                suffix: data.suffix,
                sex: data.sex,
                dob: data.dob,
                ssn: data.ssn,
            }, { hideRawId, hideSensitive })
            : { _id: null }
        if (this.owner._id)
            this.owner.name = this.owner.fullName('FmLs')

        this.address = {
            physical: new Address(data),
            mail: new Address({
                address1: data.mailAddress1,
                address2: data.mailAddress2,
                city: data.mailCity,
                state: data.mailState,
                zip: data.mailZip,
            }),
        }
        this.address.physical.mail = !!data.mail

        this.phone = data.phone
        this.fax = data.fax
        this.email = data.email

        if (single && !hideRawId) {
            this.session = session

        }
    }

    static #algorithm = 'SHA-256'
    static hashId = (field = 'id') => hash(field, Company.#algorithm)
    static matchIdHash = value => matchHash(value, Company.#algorithm)

    static config = () => ({
        db: db.business,
        query: query.company,
        idProp: 'companyId',
        jxTargets: jxTargets('company'),
        defSorts: [ null, [ 'busName', 'coType' ] ],
        logFile: 'companies',
    })


    static list = {

        category: {
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



class Owner extends Individual {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Owner Data')

        super(data, { single, hideRawId, hideSensitive })

        const props = { _id: data._id, _personId: data._personId }
        if (!hideRawId) {
            props.id = data.id
            props.personId = data.personId
        }
        if (!hideSensitive) this.ssn = stringifyBuffer(data.ssn)

        const props2 = { count: { companies: data.companyCount } }

        const categories = Company.list.category
        for (const category in categories) {
            const path = categories[category].path[0]
            props2.count[path] = data[`${path}Count`]
        }

        reSuper(this, props, props2)

        if (single && !hideRawId) {
            this.session = session

        }
    }

    static #algorithm = 'SHA-1'
    static hashId = (field = 'id') => hash(field, Owner.#algorithm)
    static matchIdHash = value => matchHash(value, Owner.#algorithm)

    static config = () => ({
        db: db.business,
        query: query.owner,
        idProp: 'ownerId',
        defSorts: [ null, null, [ 'lastName', 'suffix', 'firstName', 'middleName' ] ],
        logFile: 'company-owners',
    })


}



function jxTargets(src, target = null) {
    const targets =  {
        company: {
            users: [ userQuery.jx.companies, 'userId', User ],
        },
    }[src]

    return target ? targets[target] : targets
}



export default Company
export { Owner, query, jxTargets }