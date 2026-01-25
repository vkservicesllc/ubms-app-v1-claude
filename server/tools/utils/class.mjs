const { DB__MYSQL_AES_EIN, DB__MYSQL_AES_SSN } = Bun.env
const secret = {
    ein: DB__MYSQL_AES_EIN,
    ssn: DB__MYSQL_AES_SSN,
}

import Query, { hash, matchHash } from './query.mjs'
import { processData, logDeletion } from './database.mjs'

const mysql = require('./mysql')
const { sqlMode } = Query


export const classInstance = {


    redFields: ['createdBy', 'createdAt', 'createdIn', 'updateLog', 'deletedBy', 'deletedAt', 'deletedIn'],
    logFields: ['createdBy', 'createdAt', 'updateLog'],


    add: async (inst, Cls, target, bodyOrIds, bodyCB = null) => {
        const { enforceUser = true, enforceLocation = false } = Cls.config()
        const { user: sessionUser, branch, siteId } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [ADD]: Session user not supplied`)
        if (!target || target === 'main') throw new Error(`${Cls.name} Constructor Method Error [ADD]: Target not supplied`)

        const config = Cls.config()
        const createdBy = sessionUser?.id || null
        const jx = target.slice(0, 3) === 'jx.'
        if (jx) target = target.slice(3)

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

        let body = bodyOrIds || {}
        const { query, idProp, logLocation = false } = config

        body = processData(body)

        if (body?.ssn && typeof body.ssn !== 'object') body.ssn = { aes: [ body.ssn, secret.ssn ] }
        if (body?.ein && typeof body.ein !== 'object') body.ein = { aes: [ body.ein, secret.ein ] }

        body[idProp] = inst.id

        if (typeof bodyCB === 'function') body = await bodyCB(body)
        body.createdBy = createdBy

        let createdIn = { branch }
        if (siteId) createdIn.siteId = siteId
        createdIn = JSON.stringify(createdIn)
        if ((typeof enforceLocation === 'string' && enforceLocation.includes('add')) || enforceLocation === true) body.createdIn = createdIn

        if (logLocation) {
            const { branch, siteId } = inst.session
            const createdIn = { branch }
            if (siteId) createdIn.siteId = siteId

            body.createdIn = JSON.stringify(createdIn)
        }

        const [ result ] = await mysql.execute(query[target].insert(body))

        return { added: result.affectedRows > 0 }
    },


    fetch: async (inst, Cls, target, filter = {}, { hideRawId = false, hideSensitive = true, idsOnly = false, sorts = null } = {}) => {
        const config = Cls.config()
        const { enforceUser = true, idProp } = config
        const { user: sessionUser } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Session user not supplied`)
        if (!target || target === 'main') throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Target not supplied`)

        const jx = target.slice(0, 3) === 'jx.'
        if (jx) target = target.slice(3)

        if (jx) {
            const { jxTargets } = config
            if (!jxTargets) throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Junction targets not found`)

            const offline = inst.session?.offline || false
            const ids = []
            const [ jxQuery, jxIdProp, Src ] = jxTargets[target]
            if (!sorts) sorts = Src.config().defSorts || null

            const [ rows ] = await mysql.execute(jxQuery.select(jxIdProp, {
                match: { [idProp]: inst.id || Cls.matchIdHash(inst._id) },
            }))
            rows.map(row => ids.push(row[jxIdProp]))

            return idsOnly ? ids : await Src.fetch(inst.session, { ids, ...filter }, { hideRawId, hideSensitive, offline, sorts })
        }

        const { query, redFields = {}, childSort = {}, childIdHash = {} } = config
        if (!redFields[target]) redFields[target] = classInstance.redFields

        const options = {
            match: { [idProp]: inst.id || Cls.matchIdHash(inst._id) },
            sort: { desc: childSort[target] || 'since' },
        }
        if (filter.match)
            for (const prop in filter.match) {
                let value = filter.match[prop]
                if (prop === '_id') {
                    if (!value) continue
                    value = matchHash(value, childIdHash[target])
                }

                options.match[prop] = filter.match[prop]
            }

        let fields = ['*', Cls.hashId(idProp)]
        if (childIdHash[target]) fields.push(hash('id', childIdHash[target]))

        const [ rows ] = await mysql.execute(query[target].select(fields, options))
        rows.map(row => {
            if (!inst.id || hideRawId === true) {
                delete row.id
                delete row[idProp]
            }
            redFields[target].map(redField => delete row[redField] )
        })

        return rows
    },


    update: async (inst, Cls, targetOrBody, body, match = {}, { currentData, final } = {}) => {
        const { enforceUser = true, enforceLocation = false } = Cls.config()
        const { user: sessionUser, branch, siteId } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [UPDATE]: Session user not supplied`)

        let target = 'main'
        if (typeof targetOrBody === 'string') target = targetOrBody
        else body = targetOrBody

        const config = Cls.config()
        const idProp = target === 'main' ? 'id' : config.idProp

        const options = { modifiedBy: sessionUser.id }
        if ((typeof enforceLocation === 'string' && enforceLocation.includes('update')) || enforceLocation === true) {
            options.branch = branch
            options.siteId = siteId
        }

        options.currentData = inst
        options.currentUpdateLog = await inst.log({ target, field: 'updateLog' })

        if (typeof currentData === 'function') options.currentData = await currentData(target, options.currentData)

        body = processData(body, options)

        if (body?.ssn !== undefined) body.ssn = { aes: [ body.ssn, secret.ssn ] }
        if (body?.ein !== undefined) body.ein = { aes: [ body.ein, secret.ein ] }

        const [ result ] = await mysql.execute(config.query[target].update(body, {
            [idProp]: inst.id || Cls.matchIdHash(inst._id), ...match,
        }))

        if (typeof final === 'function') await final(inst, body, target)

        return { updated: result.affectedRows > 0 }
    },


    delete: async (inst, Cls, target = null, matchOrIds, handle) => {
        const { enforceUser = true } = Cls.config()
        const { user: sessionUser } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [DELETE]: Session user not supplied`)

        if (target === 'main') target = null

        const { idProp } = Cls.config()
        const jx = target && target.slice(0, 3) === 'jx.'
        if (jx) target = target.slice(3)

        if (jx) {
            const { jxTargets } = Cls.config()
            if (!jxTargets) throw new Error(`${Cls.name} Constructor Method Error [DELETE]: Junction targets not found`)

            if (!Array.isArray(matchOrIds)) throw new Error(`${Cls.name} Constructor Method Error [DELETE]: Invalid ids supplied`)
            if (!matchOrIds.length) return { deleted: false }

            const [ jxQuery, jxIdProp, Src ] = jxTargets[target]
            let ids, _ids
            if (typeof matchOrIds[0] === 'number') ids = matchOrIds
            if (typeof matchOrIds[0] === 'string') _ids = matchOrIds
            if (!ids && !_ids) throw new Error(`${Cls.name} Constructor Method Error [DELETE]: Invalid id types supplied`)

            if (!ids) {
                ids = []
                const list = await Src.fetch(inst.session, { _ids })
                list.map(item => ids.push(item.id))
            }

            const [ result ] = await mysql.execute(jxQuery.delete({ [idProp]: inst.id, [jxIdProp]: ids }))

            return { deleted: result.affectedRows > 0 }
        } else if (target) {
            const match = matchOrIds || {}

            const { query } = Cls.config()
            const [ result ] = await mysql.execute(query[target].delete({ [idProp]: inst.id, ...match }))

            return { deleted: result.affectedRows > 0 }
        }

        if (typeof handle === 'function') {
            const handled = await handle()
            if (handled === true) return { deleted: true }
        } else if (!handle) handle = {}

        const { extendLog } = handle

        const { query, logDeleted = true, logFile } = Cls.config()
        const { id } = inst
        let log = logDeleted && logFile ? await inst.log() : null

        const [ result ] = await mysql.execute(query.main.delete({ id }))
        if (!result.affectedRows) return { deleted: false }

        if (log) {
            for (const prop in log) inst[prop] = log[prop]
            if (typeof extendLog === 'function') inst = await extendLog(inst, log)

            await logDeletion(inst.session, logFile, inst, { id })
        }

        return { deleted: true }
    },


    log: async (inst, Cls, { field = null, target = 'main', since } = {}, fields) => {
        const { enforceUser = true, logFields = {} } = Cls.config()
        const { user: sessionUser } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [LOG]: Session user not supplied`)

        fields = logFields[target] ?? fields ?? classInstance.logFields

        const config = Cls.config()
        const idProp = target === 'main' ? 'id' : config.idProp
        const match = { [idProp]: inst.id || Cls.matchIdHash(inst._id), since }
        const log = (await mysql.execute(config.query[target].select(fields, { match })))[0][0]

        return fields.includes(field) ? log[field] : log
    },


}


export const classStatic = {


    create: async (Cls, { user: sessionUser = {}, branch, siteId = null }, body = {}, { hideRawId = false } = {}, {
        find, split, final,
    } = {}) => {
        const { enforceUser = true, enforceLocation = false, query, idProp } = Cls.config()
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Static Method Error [CREATE]: Session user not supplied`)

        let found = false, data
        if (typeof find === 'function') ({ found, data } = await find(body, hideRawId))

        if (found) {
            if (Array.isArray(data)) data = data[0]
            return { created: false, data }
        }

        body = processData(body)

        if (body?.ssn && typeof body.ssn !== 'object') body.ssn = { aes: [ body.ssn, secret.ssn ] }
        if (body?.ein && typeof body.ein !== 'object') body.ein = { aes: [ body.ein, secret.ein ] }

        if (typeof split === 'function') body = await split(body)
        else body = { main: body }

        let createdIn = { branch }
        if (siteId) createdIn.siteId = siteId
        createdIn = JSON.stringify(createdIn)

        if (sessionUser?.id) body.main.createdBy = sessionUser.id
        if ((typeof enforceLocation === 'string' && enforceLocation.includes('create')) || enforceLocation === true) body.main.createdIn = createdIn

        const [ result ] = await mysql.execute(query.main.insert(body.main))
        const id = result.insertId
        if (!id) throw new Error(`Failed to create ${Cls.name.toLowerCase()}`)

        if (Object.keys(body).length)
            for (const target in body) {
                if (target === 'main') continue

                body[target][idProp] = id
                if (sessionUser?.id) body[target].createdBy = sessionUser.id
                if (enforceLocation === 'create' || enforceLocation === true) body[target].createdIn = createdIn

                const [ result ] = await mysql.execute(query[target].insert(body[target]))
                if (!result.affectedRows) throw new Error(`Failed to create ${Cls.name.toLowerCase()}'s ${target}`)
            }

        data = await Cls.fetch({ user: sessionUser, branch, siteId }, { id }, { hideRawId })

        if (typeof final === 'function') await final(data, id, body)

        return { created: true, data }
    },


    fetch: async (Cls, { user: sessionUser = {}, branch, siteId = null } = {}, filter = {},
        { hideRawId = false, hideSensitive = true, sorts, mode = 'data' } = {},
        { batch = [], prepare, removeFullGroupBy = false } = {}
    ) => {
        const { enforceUser = true, db } = Cls.config()
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Static Method Error [FETCH]: Session user not supplied`)

        let single = false, custom = {}
        if (typeof prepare === 'function') ({ batch, single = false, custom = {} } = await prepare(batch, filter))

        if (!single && Array.isArray(sorts))
            sorts.forEach((sort, i) => { if (sort) batch[i].sort = sort })

        if (mode === 'batch') return batch

        const queryStr = Query.select(db, batch)
        if (mode === 'query') return queryStr

        if (removeFullGroupBy) await mysql.query(sqlMode.onlyFullGroupBy.remove)
        const list = (await mysql.execute(queryStr))[0]

        const session = setSession(sessionUser, branch, siteId)
        list.forEach((data, i, arr) => arr[i] = new Cls(data, { single, session, hideRawId, hideSensitive, custom }))

        return single ? list[0] : list
    },


}



function setSession(user = {}, branch, siteId = null) {
    const { id, DS, DSA, status, location, unscoped } = user

    return {
        user: { id, DS, DSA, status, location, unscoped },
        branch, siteId,
    }
}