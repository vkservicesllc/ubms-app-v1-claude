/* Settings */
import db from '../../settings/mysql.mjs'

/* Registry */
import inputLength from '../../../client/global/modules/registry/length.mjs'

/* Tools */
import Company from './company.mjs'
import { sessionError } from './user.mjs'
import Query, { hash, matchHash }  from '../utils/query.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { processData } from '../utils/database.mjs'

const mysql = require('../utils/mysql')


const query = {
    carriers: new Query(db.carrier, 'carriers'),
    ifta: new Query(db.carrier, 'carrier_ifta'),
    stateTax: new Query(db.carrier, 'carrier_state_permits'),
}
const targets = Object.keys(query)

const stateTaxIds = Object.keys(inputLength.carrier.permit.max)



class Carrier extends Company {
    constructor(data = {}, light = false) {
        super(data, light)
        delete this._id

        if (!Object.keys(this).length)
            throw new Error('Carrier instantiation failed: Invalid data')

        const _id = data._carrierId
        const _companyId = data._id

        const properties = {
            mc: data.mc,
            usdot: data.usdot,
            scac: data.scac,
            irp: data.irp,
            ifta: data.ifta,
            iftaJur: data.iftaJur,
            stateTax: {},  //! data.stateTax,
            efs: data.efs,
            fleetOne: data.fleetOne,
            transflo: data.transflo,
        }
        stateTaxIds.forEach(state => properties.stateTax[state] = data[`${state}Permit`])

        reSuper(this, { _id, _companyId }, properties)

        if (!light) {

            this.id = async () => (await mysql.execute(query.carriers.select('id', {
                match: { id: Carrier.matchIdHash(this._id) },
            })))[0][0].id

            this.companyId = async () => (await mysql.execute(new Query(db.business, 'companies').select('id', {
                match: { id: Company.matchIdHash(this._companyId) },
            })))[0][0].id


            this.ein = async (session, format = false) => this.ein(session, format, this._companyId)


            this.log = async (target, field) => {
                if (!targets.includes(target)) target = targets[0]

                const fields = [ 'createdBy', 'createdAt', 'updateLog' ]
                const idProp = target == targets[0] ? 'id' : 'carrierId'

                let log = (await mysql.execute(query[target].select(fields, {
                    match: { [idProp]: Carrier.matchIdHash(this._id) },
                })))[0][0]

                if (fields.includes(field)) log = log[field]

                return log
            }
            

            this.flush = async target => {
                if (!targets.includes(target)) target = targets[0]

                const idProp = target == targets[0] ? 'id' : 'carrierId'

                await mysql.execute(query[target].update({ updateLog: null }, {
                    [idProp]: Carrier.matchIdHash(this._id),
                }))
            }


            this.history = async (target = targets[1], log = false) => {
                if (!targets.includes(target)) target = targets[1]
                let fields, sort = { desc: 'since' }

                switch (target) {
                    case targets[1]:
                        fields = [ 'since', 'number', 'jurisdiction' ]
                        break
                }
                if (log === true) fields.push('createdBy', 'createdAt', 'updateLog')

                return (await mysql.execute(query[target].select(fields, {
                    match: { companyId: Carrier.matchIdHash(this._id) },
                    sort,
                })))[0]
            }


            this.initialize = async (session, data) => {
                let initialized = false,
                    error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { initialized, error }

                data = {
                    carrier: data,
                    ifta: data.ifta,
                    stateTax: data.stateTax,
                }
                delete data.carrier.ifta
                delete data.carrier.stateTax

                //! const { stateTax } = data.carrier
                //! if (!Object.keys(stateTax).length) delete data.carrier.stateTax
                //! else data.carrier.stateTax = JSON.stringify(stateTax)

                data.carrier = processData(data.carrier)
                data.ifta = processData(data.ifta)
                data.stateTax = processData(data.stateTax)

                for (const prop of [ 'mc', 'usdot', 'jurisdiction' ])
                    if (!data.carrier[prop] && !data.ifta[prop]) return { initialized, error: 'Invalid Data' }

                data.carrier.companyId = await this.companyId()
                data.carrier.createdBy = await session.user.id()

                const [ result ] = await mysql.execute(query.carriers.insert(data.carrier))
                const id = result.insertId

                if (id) {
                    data.ifta.carrierId = id
                    data.ifta.since = this.since
                    data.ifta.createdBy = data.carrier.createdBy

                    const [ result ] = await mysql.execute(query.ifta.insert(data.ifta))
                    if (result.affectedRows == 1) initialized = true
                    else error = 'DB Error: Stage 2'

                    if (!error && Object.keys(data.stateTax).length) {
                        data.stateTax.carrierId = id
                        data.stateTax.createdBy = data.carrier.createdBy

                        const [ result ] = await mysql.execute(query.stateTax.insert(data.stateTax))
                        if (result.affectedRows != 1) error = 'DB Error: State 3'
                    }
                } else error = 'DB Error: Stage 1'

                if (error) return { initialized, error }

                return { initialized, data: await Carrier.data(session, { id }) }
            }


            this.modify = async (session, data) => {
                let modified = false,
                    error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { modified, error }

                data = {
                    carrier: data,
                    ifta: data.ifta,
                    stateTax: data.stateTax,
                }
                delete data.carrier.ifta
                delete data.carrier.stateTax

                const id = await this.id()
                const { branch, siteId } = session
                const modifiedBy = await session.user.id()
                const modifiedIn = { branch, siteId }

                let { since } = data
                if (!since) since = this.since

                data.carrier = processData(data.carrier, {
                    currentData: this,
                    currentUpdateLog: await this.log(targets[0], 'updateLog'),
                    modifiedBy,
                    modifiedIn,
                })

                data.ifta = processData(data.ifta, {
                    currentData: {
                        number: this.ifta,
                        jurisdiction: this.iftaJur,
                    },
                    currentUpdateLog: await this.log(targets[1], 'updateLog'),
                    modifiedBy,
                    modifiedIn,
                })

                data.stateTax = processData(data.stateTax, {
                    currentData: this.stateTax,
                    currentUpdateLog: await this.log(targets[2], 'updateLog'),
                    modifiedBy,
                    modifiedIn,
                })

                if (Object.keys(data.carrier).length) {
                    try {
                        const [ result ] = await mysql.execute(query.carriers.update(data.carrier, { id }))
                        if (result.affectedRows == 1) modified = true
                    } catch (err) {
                        error = 'DB Error: Stage 1'
                    }
                }

                if (!error && Object.keys(data.ifta).length) {
                    try {
                        const [ result ] = await mysql.execute(query.ifta.update(data.ifta, {
                            carrierId: id,
                            since,
                        }))
                        if (result.affectedRows == 1) modified = true
                    } catch (err) {
                        error = 'DB Error: Stage 2'
                    }
                }

                if (!error && Object.keys(data.stateTax).length) {
                    try {
                        const [ result ] = await mysql.execute(query.stateTax.update(data.stateTax, { carrierId: id }))
                        if (result.affectedRows == 1) modified = true
                    } catch (err) {
                        error = 'DB Error: Stage 3'
                    }
                }

                return { modified, error, data: await Carrier.data(session, { id }) }
            }


            this.update = async (session, targets, data) => {}

        }
    }


    static #algorithm = 'SHA-512/224'

    static hashId = (field = 'id') => hash(field, Carrier.#algorithm)

    static matchIdHash = value => matchHash(value, Carrier.#algorithm)


    static #batch = async (session, options = {}) => {
        let { params, filter } = options
        if (!params) params = {}
        if (!filter) filter = {}

        const batch = await Company.batch(session, options)
        if (!batch.length) return batch

        const join = [ 'carrierId', 'id', 'carriers' ]
        const stateTaxFields = []
        stateTaxIds.map(state => stateTaxFields.push([ state, `${state}Permit` ]))
        batch.push({
            db: db.carrier,
            table: 'carriers',
            fields: [
                [ Carrier.hashId(), 'carrierId' ],
                'mc', 'usdot', 'scac', 'irp',  //! 'stateTax',
                'efs', 'fleetOne', 'transflo',
            ],
            join: [ 'companyId', 'id' ],
        }, {
            db: db.carrier,
            table: 'carrier_ifta',
            fields: [ [ 'number', 'ifta' ], [ 'jurisdiction', 'iftaJur' ] ],
            join,
        }, {
            db: db.carrier,
            table: 'carrier_state_permits',
            fields: stateTaxFields,
            join,
        })
        delete batch[0].match.id
        batch[0].match.catId = 'crr'

        const { _id, _companyId, id, companyId, route } = params
        const idx = batch.length - 3
        batch[0].match.id = companyId
        batch[idx].match = { id }
        if (!companyId) batch[0].match.id = Company.matchIdHash(_companyId)
        if (!id) batch[idx].match.id = Carrier.matchIdHash(_id)
        if (route) batch[1].match.route = { route: [ [ 'busName', 'coType' ], route ] }

        return batch
    }


    static data = async (session, params = {}) => {
        if (!params._id && !params.id && !params._companyId && !params.companyId && !params.route) return

        const batch = await Carrier.#batch(session, { params })
        if (!batch.length) return

        const data = (await mysql.execute(Query.select(db.business, batch)))[0][0]

        return !data ? data : new Carrier(data)
    }


    static list = async (session, filter = {}) => {
        const batch = await Carrier.#batch(session, { filter })
        if (!batch.length) return []

        const list = (await mysql.execute(Query.select(db.business, batch)))[0]
        list.forEach((data, i, arr) => arr[i] = new Carrier(data, true))

        return list
    }


    static find = async (session, params = {}) => {
        if (!session?.user) return { error: 'Invalid User' }

        const { mc, usdot, scac, irp, efs, fleetOne, transflo, ifta, stateTax, exclude } = params
        if (!mc && !usdot && !scac && !irp && !efs && !fleetOne && !transflo && !ifta && !stateTax)
            return { error: 'Invalid Parameters' }

        let match = { mc, usdot, scac, irp, efs, fleetOne, transflo }
        let target = targets[0], idProp = 'id'
        if (ifta) {
            target = targets[1], idProp = 'carrierId'
            const { number } = ifta
            match = { number }
        }
        if (stateTax) { //? not tested
            target = targets[2], idProp = 'carrierId'
            const keys = Object.keys(stateTax)
            match = { [keys[0]]: stateTax[keys[0]] }
        }

        if (exclude?._id) {
            const carrier = await Carrier.data(session, { _companyId: exclude._id })
            const id = carrier._id ? await carrier.id() : null

            if (id) match[idProp] = { not: id }
        }

        const data = (await mysql.execute(query[target].select(idProp, { match })))[0]

        return { found: data.length == 1 }
    }


}


delete Carrier.categoryList
delete Carrier.typeList
delete Carrier.create
delete Carrier.batch


export default Carrier