import { processData, logDeletion } from './database.mjs'

const mysql = require('./mysql')


export const classInstance = {


    redFields: ['createdBy', 'createdAt', 'updateLog', 'deletedBy', 'deletedAt', 'deletedIn'],
    logFields: ['createdBy', 'createdAt', 'updateLog'],


    add: async (inst, Cls, target, bodyOrIds, bodyCB = null) => {
        const { enforceUser = true } = inst.config
        const { user: sessionUser } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [ADD]: Session user not supplied`)
        if (!target || target === 'main') throw new Error(`${Cls.name} Constructor Method Error [ADD]: Target not supplied`)

        const createdBy = sessionUser?.id || null
        const jx = target.slice(0, 3) === 'jx.'
        if (jx) target = target.slice(3)

        if (jx) {
            const { jxTargets, idProp: refIdProp } = inst.config
            if (!jxTargets) throw new Error(`${Cls.name} Constructor Method Error [ADD]: Junction targets not found`)

            const ids = bodyOrIds || []
            if (!Array.isArray(ids)) throw new Error(`${Cls.name} Constructor Method Error [ADD]: Invalid ids supplied`)

            const [ jxQuery, idProp, Src ] = jxTargets[target]
            const data = []

            const list = await Src.fetch(inst.session, { ids })
            list.map(item => data.push({ [refIdProp]: inst.id, [idProp]: item.id, createdBy }))

            const [ result ] = await mysql.execute(jxQuery.insert(data))

            return result.affectedRows > 0 // Boolean
        }

        let body = bodyOrIds || {}
        const { query, logLocation = false } = inst.config

        body = processData(body)
        if (typeof bodyCB === 'function') body = bodyCB(body)
        body.createdBy = createdBy

        if (logLocation) {
            const { branch, siteId } = inst.session
            const createdIn = { branch }
            if (siteId) createdIn.siteId = siteId

            body.createdIn = JSON.stringify(createdIn)
        }

        const [ result ] = await mysql.execute(query[target].insert(body))

        return result.affectedRows > 0 // Boolean
    },


    fetch: async (inst, Cls, target, { hideRawId = false, hideSensitive = true, idsOnly = false, sorts = null, since } = {}) => {
        const { enforceUser = true } = inst.config
        const { user: sessionUser } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Session user not supplied`)
        if (!target || target === 'main') throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Target not supplied`)

        const { idProp } = inst.config
        const jx = target.slice(0, 3) === 'jx.'
        if (jx) target = target.slice(3)

        if (jx) {
            const { jxTargets } = inst.config
            if (!jxTargets) throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Junction targets not found`)

            const ids = []
            const [ jxQuery, jxIdProp, Src ] = jxTargets[target]
            if (!sorts) sorts = Src.defSorts

            const [ rows ] = await mysql.execute(jxQuery.select(jxIdProp, { match: { [idProp]: inst.id } }))
            rows.map(row => ids.push(row[jxIdProp]))

            return idsOnly ? ids : await Src.fetch(inst.session, { ids }, { hideRawId, hideSensitive, sorts })
        }

        const { query, redFields } = inst.config
        if (!redFields[target]) redFields[target] = this.redFields

        const [ rows ] = await mysql.execute(query[target].select('*', { [idProp]: inst.id, since }))
        rows.map(row => { redFields.map(redField => delete row[redField]) })

        return since ? rows[0] : rows
    },


    update: async (inst, Cls, targetOrBody, body) => {
        const { enforceUser = true } = inst.config
        const { user: sessionUser } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [UPDATE]: Session user not supplied`)

        //! not finished...
    },


    delete: async (inst, Cls, targetOrCB = null, sinceOrIds) => {
        const { user: sessionUser } = inst.session || {}
        if (!sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [DELETE]: Session user not supplied`)

        let target = typeof targetOrCB === 'string' ? targetOrCB : null
        if (target === 'main') target = null

        const { idProp } = inst.config
        const jx = target && target.slice(0, 3) === 'jx.'
        if (jx) target = target.slice(3)

        if (jx) {
            const { jxTargets } = inst.config
            if (!jxTargets) throw new Error(`${Cls.name} Constructor Method Error [DELETE]: Junction targets not found`)

            const ids = sinceOrIds || []
            if (!Array.isArray(ids)) throw new Error(`${Cls.name} Constructor Method Error [DELETE]: Invalid ids supplied`)

            const [ jxQuery, jxIdProp ] = jxTargets[target]
            const [ result ] = await mysql.execute(jxQuery.delete({ [idProp]: inst.id, [jxIdProp]: ids }))

            return result.affectedRows > 0 // Boolean
        } else if (target) {
            const since = sinceOrIds

            const { query } = inst.config
            const [ result ] = await mysql.execute(query[target].delete({ [idProp]: inst.id, since }))

            return result.affectedRows > 0 // Boolean
        }

        const handle = typeof targetOrCB === 'function' ? targetOrCB : null
        if (handle) return handle(inst, Cls)

        const { query, logDeleted = true, logFile } = inst.config
        const { id } = inst
        const log = logDeleted && logFile ? await inst.log() : null

        const [ result ] = await mysql.execute(query.main.delete({ id }))
        if (!result.affectedRows) return false

        if (log) {
            for (const prop in log) inst[prop] = log[prop]

            await logDeletion(inst.session, logFile, inst, { id })
        }

        return true
    },


    // history: async (inst, Cls, target) => {
    //     const { user: sessionUser } = inst.session || {}
    //     if (!sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [HISTORY]: Session user not supplied`)

    //     //! not finished...
    // },


    log: async (inst, Cls, field = null, { target = 'main', fields } = {}) => {
        const { user: sessionUser } = inst.session || {}
        if (!sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [LOG]: Session user not supplied`)

        fields = fields ?? this.logFields

        const { query } = inst.config
        const log = (await mysql.execute(query[target].select(fields, { match: { id: inst.id } })))[0][0]

        return fields.includes(field) ? log[field] : log
    }


}