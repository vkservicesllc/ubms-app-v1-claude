import Query, { hash, matchHash } from './query.mjs'
import { processData, logDeletion } from './data.mjs'
import { utc2tz } from './date.mjs'

const mysql = require('./mysql')
const { sqlMode } = Query


const logActions = ['created', 'deleted', 'archived', 'invited', 'finished', 'reviewed', 'declined']
const logFields = []
logActions.map(action => {
    logFields.push(action + 'By')
    logFields.push(action + 'At')
    logFields.push(action + 'In')
})
logFields.push('updateLog')



export const classInstance = {


    //* Support only one record at a time
    add: async (inst, Cls, target, bodyOrIds, bodyCB = null) => {
        if (!target || target === 'main') throw new Error(`${Cls.name} Constructor Method Error [ADD]: Target not supplied`)

        const config = Cls.config()

        const { enforceUser = true, enforceLocation = false } = config
        const { user: sessionUser, branch, siteId } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [ADD]: Session user not supplied`)
        if (enforceLocation && !branch) throw new Error(`${Cls.name} Constructor Method Error [ADD]: Session branch not supplied`)

        const createdBy = sessionUser?.id || null
        const jx = target.slice(0, 3) === 'jx.'
        if (jx) target = target.slice(3)

        //* Many-to-Many
        if (jx) {
            const { jxTargets, idProp: refIdProp } = config
            if (!jxTargets) throw new Error(`${Cls.name} Constructor Method Error [ADD]: Junction targets not found`)

            if (!Array.isArray(bodyOrIds) || !bodyOrIds.length) throw new Error(`${Cls.name} Constructor Method Error [ADD]: Invalid ids supplied`)

            const [ jxQuery, idProp, Src ] = jxTargets[target]
            const data = []
            let ids, _ids
            if (typeof bodyOrIds[0] === 'number') ids = bodyOrIds
            if (typeof bodyOrIds[0] === 'string') _ids = bodyOrIds
            if (!ids && !_ids) throw new Error(`${Cls.name} Constructor Method Error [ADD]: Invalid id types supplied`)

            const list = await Src.fetch(inst.session, { ids, _ids })
            list.map(item => data.push({ [refIdProp]: inst.id, [idProp]: item.id, createdBy }))

            const [ result ] = await mysql.execute(jxQuery.insert(data))

            return { added: result.affectedRows > 0 }
        }

        //* One-to-One & One-to-Many

        const { query, idProp } = config
        let body = bodyOrIds || {}

        body = await processData(body)

        if (typeof bodyCB === 'function') body = await bodyCB(body)
        body.createdBy = createdBy

        if ((typeof enforceLocation === 'string' && enforceLocation.includes('add')) || enforceLocation === true) {
            const createdIn = { branch }
            if (siteId) createdIn.siteId = siteId

            body.createdIn = JSON.stringify(createdIn)
        }

        body[idProp] = inst.id

        const [ result ] = await mysql.execute(query[target].insert(body))

        return { added: result.affectedRows > 0 }
    },


    fetch: async (inst, Cls, target, filter = {}, { hideRawId: hideRawIdEnf, hideSensitive: hideSensitiveEnf, idsOnly = false, sorts = null, mode = 'data' } = {}) => {
        if (!target || target === 'main') throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Target not supplied`)

        const config = Cls.config()

        const { enforceUser = true, idProp } = config
        const { user: sessionUser, offline = false } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Session user not supplied`)
        if (!idProp) throw new Error(`${Cls.name} Constructor Method Error [FETCH]: ID Property not supplied`)

        let { hideRawId, hideSensitive } = inst.config

        if (typeof hideRawIdEnf === 'boolean') hideRawId = hideRawIdEnf
        if (typeof hideSensitiveEnf === 'boolean') hideSensitive = hideSensitiveEnf

        const jx = target.slice(0, 3) === 'jx.'
        if (jx) target = target.slice(3)

        //* Many-to-Many
        if (jx) {
            const { jxTargets, defSorts = null } = config
            if (!jxTargets) throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Junction targets not found`)

            const ids = []
            const [ jxQuery, jxIdProp, Src ] = jxTargets[target]
            if (!sorts) sorts = Src.config().defSorts || null

            const [ rows ] = await mysql.execute(jxQuery.select(jxIdProp, {
                match: { [idProp]: inst.id || Cls.matchIdHash(inst._id) },
            }))
            rows.map(row => ids.push(row[jxIdProp]))

            return idsOnly ? ids : await Src.fetch(inst.session, { ids, ...filter }, { hideRawId, hideSensitive, offline, sorts, mode })
        }

        //* One-to-Many

        //! NEED TO THINK THROUGH STATIC SELECT WITH JOINS

        const { query, childBatch = {}, childSort = {}, childIdHash = {}, childExclude = {} } = config

        if (childBatch[target]) {
            //! figure out
        }

        const options = {
            match: { [idProp]: inst.id || Cls.matchIdHash(inst._id) },
            sort: { desc: childSort[target] || 'since' },
        }

        let single = false

        for (let prop in filter) {
            let value = filter[prop]
            if (prop === '_id') {
                if (!value) continue
                prop = 'id'
                value = matchHash(value, childIdHash[target])
                single = true
            } else if (prop === 'id' && value) single = true

            options.match[prop] = value
        }

        if (childExclude[target]) {
            const [ prop, parent ] = childExclude[target]
            const value = parent ? inst[parent][prop] : inst[prop]

            options.match[prop] = { not: value }
        }

        let fields = ['*', Cls.hashId(idProp)]
        if (childIdHash[target]) fields.push(hash('id', childIdHash[target]))
        
        const queryStr = query[target].select(fields, options)
        if (mode === 'query') return queryStr

        const [ rows ] = await mysql.execute(queryStr)
        rows.map(row => {
            if (!inst.id || hideRawId === true) {
                delete row.id
                delete row[idProp]
            }
            logFields.map(logField => delete row[logField] )
        })

        return single ? rows[0] : rows
    },


    update: async (inst, Cls, targetOrBody, body, match = {}, { final, skipLog = false, hideRawId = false } = {}) => {
        const config = Cls.config()

        const { enforceUser = true, enforceLocation = false } = config
        const { user: sessionUser, branch, siteId } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [UPDATE]: Session user not supplied`)
        if (enforceLocation && !branch) throw new Error(`${Cls.name} Constructor Method Error [UPDATE]: Session branch not supplied`)

        const { query, childIdHash = {} } = config
        let target = 'main'
        if (typeof targetOrBody === 'string') target = targetOrBody
        else body = targetOrBody

        const idProp = target === 'main' ? 'id' : config.idProp

        if ('_id' in match) {
            match.id = matchHash(match._id, childIdHash[target])
            delete match._id
        }
        match = { [idProp]: inst.id || Cls.matchIdHash(inst._id), ...match }

        const options = { query, target, skipLog, match, modifiedBy: sessionUser.id }
        if ((typeof enforceLocation === 'string' && enforceLocation.includes('update')) || enforceLocation === true) {
            options.branch = branch
            options.siteId = siteId
        }

        body = await processData(body, options)

        const [ result ] = await mysql.execute(config.query[target].update(body, {
            [idProp]: inst.id || Cls.matchIdHash(inst._id), ...match,
        }))

        if (typeof final === 'function') await final(inst, body, target)

        const data = await Cls.fetch({ user: sessionUser, branch, siteId }, { id: inst.id || Cls.matchIdHash(inst._id) }, { hideRawId })

        return { updated: result.affectedRows > 0, data }
    },


    delete: async (inst, Cls, target = null, matchOrIds, handle) => {
        const config = Cls.config()

        const { enforceUser = true } = config
        const { user: sessionUser } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [DELETE]: Session user not supplied`)

        if (target === 'main') target = null

        const { idProp } = config
        const jx = target && target.slice(0, 3) === 'jx.'
        if (jx) target = target.slice(3)

        //* Many-to-Many
        if (jx) {
            const { jxTargets } = config
            if (!jxTargets) throw new Error(`${Cls.name} Constructor Method Error [DELETE]: Junction targets not found`)

            const match = { [idProp]: inst.id }
            const [ jxQuery, jxIdProp, Src ] = jxTargets[target]

            if (Array.isArray(matchOrIds) && matchOrIds.length) {
                let ids, _ids
                if (typeof matchOrIds[0] === 'number') ids = matchOrIds
                if (typeof matchOrIds[0] === 'string') _ids = matchOrIds

                if (!ids && _ids) {
                    ids = []

                    const list = await Src.fetch(inst.session, { _ids })
                    list.map(item => ids.push(item.id))
                }

                match[jxIdProp] = ids
            }

            const [ result ] = await mysql.execute(jxQuery.delete(match))

            return { deleted: result.affectedRows > 0 }
        }

        //* One-to-One & One-to-Many
        //? No option to log target deletion
        else if (target) {
            const match = matchOrIds || {}

            const { query, childIdHash = {} } = config
            if ('_id' in match) {
                match.id = matchHash(match._id, childIdHash[target])
                delete match._id
            }

            const [ result ] = await mysql.execute(query[target].delete({ [idProp]: inst.id, ...match }))

            return { deleted: result.affectedRows > 0 }
        }

        //* Self

        if (typeof handle === 'function') {
            const handled = await handle()
            if (handled === true) return { deleted: true }
        } else if (!handle) handle = {}

        const { query, logDeleted = true, logFile } = Cls.config()
        let log = logDeleted && logFile && inst.id ? await inst.log() : null

        const [ result ] = await mysql.execute(query.main.delete({ id: inst.id || Cls.matchIdHash(inst._id) }))
        if (!result.affectedRows) return { deleted: false }

        if (log) {
            const { id } = inst
            const { extendLog } = handle

            for (const prop in log) inst[prop] = log[prop]
            if (typeof extendLog === 'function') inst = await extendLog(inst, log)

            await logDeletion(inst.session, logFile, inst, { id })
        }

        return { deleted: true }
    },


    log: async (inst, Cls, { target = 'main', field, match = {} } = {}) => {
        const config = Cls.config()

        const { enforceUser = true } = config
        const { user: sessionUser } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [LOG]: Session user not supplied`)

        const { query } = config
        const idProp = target === 'main' ? 'id' : config.idProp

        const data = (await mysql.execute(query[target].select('*', {
            match: { [idProp]: inst.id || Cls.matchIdHash(inst._id), ...match },
        })))[0][0]
        if (!data) return

        const log = {}
        for (const field in data)
            if (logFields.includes(field)) {
                log[field] = data[field]

                if (field === 'updateLog' && field.updateLog)
                    for (const row of data.updateLog) row.modifiedBy = utc2tz(row.modifiedBy)
                else log[field] = utc2tz(log[field])
            }

        return field ? log[field] : log
    },


}



export const classStatic = {


    create: async (Cls, { user: sessionUser = {}, branch, siteId = null }, body = {},
        { hideRawId = false } = {},
        { find, split, final } = {}
    ) => {
        const config = Cls.config()

        const { enforceUser = true } = config
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Static Method Error [CREATE]: Session user not supplied`)

        let found = false, data
        if (typeof find === 'function') ({ found, data } = await find(body, hideRawId))

        if (found) {
            if (Array.isArray(data)) data = data[0]
            return { created: false, data }
        }

        body = await processData(body)

        if (typeof split === 'function') body = await split(body)
        else body = { main: body }

        let createdIn = { branch }
        if (siteId) createdIn.siteId = siteId
        createdIn = JSON.stringify(createdIn)

        const { enforceLocation = false, query, idProp } = config
        const locationEnforced = (typeof enforceLocation === 'string' && enforceLocation.includes('create')) || enforceLocation === true

        if (sessionUser?.id) body.main.createdBy = sessionUser.id
        if (locationEnforced) body.main.createdIn = createdIn

        const [ result ] = await mysql.execute(query.main.insert(body.main))
        const id = result.insertId
        if (!id) throw new Error(`Failed to create ${Cls.name.toLowerCase()}`)

        for (const target in body) {
            if (target === 'main') continue

            body[target][idProp] = id
            if (sessionUser?.id) body[target].createdBy = sessionUser.id
            if (locationEnforced) body[target].createdIn = createdIn

            const [ result ] = await mysql.execute(query[target].insert(body[target]))
            if (!result.affectedRows) throw new Error(`Failed to create ${Cls.name.toLowerCase()}'s ${target}`)
        }

        data = await Cls.fetch({ user: sessionUser, branch, siteId }, { id }, { hideRawId })

        if (typeof final === 'function') await final(data, id, body)

        return { created: true, data }
    },


    fetch: async (Cls, { user: sessionUser = {}, branch, siteId = null } = {}, filter = {},
        { hideRawId = false, hideSensitive = true, sorts, limit, mode = 'data' } = {},
        { batch = [], prepare, removeFullGroupBy = false } = {}
    ) => {
        const { enforceUser = true, db } = Cls.config()
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Static Method Error [FETCH]: Session user not supplied`)

        let single = false, custom = {}
        if (typeof prepare === 'function') ({ batch, single = false, custom = {} } = await prepare(batch, filter))

        if (!single && Array.isArray(sorts))
            sorts.forEach((sort, i) => { if (sort) batch[i].sort = sort })

        if (mode === 'batch') return batch

        const queryStr = Query.select(db, batch, limit)
        if (mode === 'query') return queryStr

        if (removeFullGroupBy) await mysql.query(sqlMode.onlyFullGroupBy.remove)
        const list = (await mysql.execute(queryStr))[0]

        const session = setSession(sessionUser, branch, siteId)
        list.forEach((data, i, arr) => arr[i] = new Cls(data, { single, session, hideRawId, hideSensitive, custom }))

        return single ? list[0] : list
    }


}



function setSession(user = {}, branch, siteId = null) {
    const { id, DS, DSA, status, location, unscoped } = user

    return {
        user: { id, DS, DSA, status, location, unscoped },
        branch, siteId,
    }
}