/* Settings */
import db from '../settings/mysql.mjs'

/* Registry */
import inputLength from '../../client/global/modules/registry/length.mjs'

/* Assets */
import Company from './company.mjs'
import { sessionError } from './user.mjs'

/* Tools */
import Query, { hash, matchHash }  from '../tools/query.mjs'
import { reSuper } from '../../client/global/modules/tools/object.mjs'
import { utcTimeStamp } from '../tools/date.mjs'
import { processData } from '../tools/database.mjs'

const mysql = require('../tools/mysql')


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
        stateTaxIds.forEach(state => properties.stateTax[state] = data[`statePermit`])

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
                }
                delete data.carrier.ifta

                const { stateTax } = data.carrier
                if (!Object.keys(stateTax).length) delete data.carrier.stateTax
                else data.carrier.stateTax = JSON.stringify(stateTax)

                data.carrier = processData(data.carrier)
                data.ifta = processData(data.ifta)

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
                } else error = 'DB Error: Stage 1'

                if (error) return { initialized, error }

                return { initialized, data: await Carrier.data(session, { id }) }
            }


            this.modify = async (session, body) => {
                let modified = false,
                    error = sessionError(session, { status: 'DS', branches: [ 'admin' ] })
                if (error) return { modified, error }

                body = {
                    carrier: body,
                    stateTax: body.stateTax,
                    ifta: body.ifta,
                }
                delete body.carrier.stateTax
                delete body.carrier.ifta

                let carrierModified = false, stateTaxModified = false
                const id = await this.id()
                const { branch, siteId } = session
                const modifiedBy = await session.user.id()
                const modifiedIn = { branch, siteId }

                let { since, stateTax } = body
                if (!since) since = this.since

                let currentUpdateLog = await this.log(targets[0], 'updateLog')
                body.carrier = processData(body.carrier, {
                    currentData: this,
                    currentUpdateLog,
                    modifiedBy,
                    modifiedIn,
                })

                let { updateLog } = body.carrier
                let { stateTax: newStateTax } = this
                if (!newStateTax) newStateTax = {}

                if (currentUpdateLog)
                    currentUpdateLog = JSON.stringify(currentUpdateLog)

                if (updateLog && updateLog != currentUpdateLog) carrierModified = true

                body.stateTax = processData(body.stateTax, {
                    currentData: newStateTax,
                    modifiedBy,
                })

                /* State Tax Modification */
                if (Object.keys(body.stateTax).length) {
                    const data = {}, oldData = {}

                    for (const state in stateTax) {
                        let value = stateTax[state], oldValue = newStateTax[state]
                        if ((oldValue == value) || (!oldValue && !value)) continue

                        if (!data.stateTax) data.stateTax = {}
                        if (!oldData.stateTax) oldData.stateTax = {}

                        if (oldValue && !value) {
                            value = null

                            delete newStateTax[state]
                        }

                        if (!oldValue && value) oldValue = null

                        if (value) newStateTax[state] = value
                        data.stateTax[state] = value
                        oldData.stateTax[state] = oldValue

                        stateTaxModified = true
                    }

                    if (stateTaxModified) {
                        /* Update Log for stateTax */
                        if (updateLog) {
                            updateLog = JSON.parse(updateLog)

                            if (carrierModified) {
                                updateLog[0].data = { ...updateLog[0].data, ...data }
                                updateLog[0].oldData = { ...updateLog[0].oldData, ...oldData }
                            } else
                                updateLog.unshift({
                                    data,
                                    oldData,
                                    modifiedBy,
                                    modifiedIn,
                                    modifiedAt: utcTimeStamp(),
                                })
                        } else {
                            if (currentUpdateLog) updateLog = JSON.parse(currentUpdateLog)
                            else updateLog = []

                            updateLog.unshift({
                                data,
                                oldData,
                                modifiedBy,
                                modifiedIn,
                                modifiedAt: utcTimeStamp(),
                            })
                        }

                        updateLog = JSON.stringify(updateLog)

                        body.carrier.stateTax = Object.keys(newStateTax).length
                            ? JSON.stringify(newStateTax)
                            : null
                        body.carrier.updateLog = updateLog
                    }
                }

                body.ifta = processData(body.ifta, {
                    currentData: {
                        number: this.ifta,
                        jurisdiction: this.iftaJur,
                    },
                    currentUpdateLog: await this.log(targets[1], 'updateLog'),
                    modifiedBy,
                    modifiedIn,
                })

                if (Object.keys(body.carrier)) {
                    try {
                        const [ result ] = await mysql.execute(query.carriers.update(body.carrier, { id }))
                        if (result.affectedRows == 1) modified = true
                    } catch (err) {
                        error = 'DB Error: Stage 1'
                    }
                }

                if (!error && Object.keys(body.ifta)) {
                    try {
                        const [ result ] = await mysql.execute(query.ifta.update(body.ifta, {
                            carrierId: id,
                            since,
                        }))
                        if (result.affectedRows == 1) modified = true
                    } catch (err) {
                        error = 'DB Error: Stage 2'
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

        const { _id, _companyId, id, companyId } = params
        const idx = batch.length - 2
        batch[0].match.id = companyId
        batch[idx].match = { id }
        if (!companyId) batch[0].match.id = Company.matchIdHash(_companyId)
        if (!id) batch[idx].match.id = Carrier.matchIdHash(_id)

        return batch
    }


    static data = async (session, params = {}) => {
        if (!params._id && !params.id && !params._companyId && !params.companyId) return

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

        const { mc, usdot, scac, irp, efs, fleetOne, transflo, iftaId } = params
        if (!mc && !usdot && !scac && !irp && !efs && !fleetOne && !transflo && !iftaId)
            return { error: 'Invalid Parameters' }

        let target = targets[0], idProp = 'id'
        if (iftaId) target = targets[1], idProp = 'carrierId'

        const match = { mc, usdot, scac, irp, efs, fleetOne, transflo, number: iftaId }
        const data = (await mysql.execute(query[target].select(idProp, { match })))[0]

        return { found: data.length == 1 }
    }


}


delete Carrier.categoryList
delete Carrier.typeList
delete Carrier.create
delete Carrier.batch


export default Carrier