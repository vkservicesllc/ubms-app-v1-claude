require('dotenv').config({ path: '../../.env' })
const { DB__MYSQL_AES_EIN, DB__MYSQL_AES_SSN } = process.env
const secret = {
    ein: DB__MYSQL_AES_EIN,
    ssn: DB__MYSQL_AES_SSN,
}

import Query from './query.mjs'
import { processData, logDeletion } from './database.mjs'

const mysql = require('./mysql')
const { sqlMode } = Query


export const classInstance = {


    redFields: ['createdBy', 'createdAt', 'updateLog', 'deletedBy', 'deletedAt', 'deletedIn'],
    logFields: ['createdBy', 'createdAt', 'updateLog'],


    add: async (inst, Cls, target, bodyOrIds, bodyCB = null) => {
        const { enforceUser = true } = Cls.config()
        const { user: sessionUser } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [ADD]: Session user not supplied`)
        if (!target || target === 'main') throw new Error(`${Cls.name} Constructor Method Error [ADD]: Target not supplied`)

        const createdBy = sessionUser?.id || null
        const jx = target.slice(0, 3) === 'jx.'
        if (jx) target = target.slice(3)

        if (jx) {
            const { jxTargets, idProp: refIdProp } = Cls.config()
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
        const { query, logLocation = false } = Cls.config()

        body = processData(body)
        if (typeof bodyCB === 'function') body = await bodyCB(body)
        body.createdBy = createdBy

        if (logLocation) {
            const { branch, siteId } = inst.session
            const createdIn = { branch }
            if (siteId) createdIn.siteId = siteId

            body.createdIn = JSON.stringify(createdIn)
        }

        const [ result ] = await mysql.execute(query[target].insert(body))

        return { added: result.affectedRows > 0 }
    },


    fetch: async (inst, Cls, target, { hideRawId = false, hideSensitive = true, idsOnly = false, filter = {}, sorts = null, since } = {}) => {
        const { enforceUser = true } = Cls.config()
        const { user: sessionUser } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Session user not supplied`)
        if (!target || target === 'main') throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Target not supplied`)

        const { idProp } = Cls.config()
        const jx = target.slice(0, 3) === 'jx.'
        const history = target.endsWith('.history')

        if (jx) target = target.slice(3)
        if (history) target = target.replace(/\.history$/, '')

        if (jx) {
            const { jxTargets } = Cls.config()
            if (!jxTargets) throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Junction targets not found`)

            const ids = []
            const [ jxQuery, jxIdProp, Src ] = jxTargets[target]
            if (!sorts) sorts = Src.config().defSorts || null

            const [ rows ] = await mysql.execute(jxQuery.select(jxIdProp, {
                match: { [idProp]: inst.id || Cls.matchIdHash(inst._id) },
            }))
            rows.map(row => ids.push(row[jxIdProp]))

            return idsOnly ? ids : await Src.fetch(inst.session, { ids, ...filter }, { hideRawId, hideSensitive, sorts })
        }

        const { query, redFields = {} } = Cls.config()
//! POSSIBLE Problem with redFields

        if (!redFields[target]) redFields[target] = this.redFields

        const options = {
            match: { [idProp]: inst.id || Cls.matchIdHash(inst._id), since },
        }

        if (history) {
            delete options.match.since
            options.sort = { desc: 'since' }
        }

        const [ rows ] = await mysql.execute(query[target].select('*', options))
        rows.map(row => { redFields.map(redField => delete row[redField]) })

        return since ? rows[0] : rows
    },


    update: async (inst, Cls, targetOrBody, body, { currentData, final } = {}) => {
        const { enforceUser = true, enforceLocation = false } = Cls.config()
        const { user: sessionUser, branch, siteId } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [UPDATE]: Session user not supplied`)

        let target = 'main'
        if (typeof target === 'string') target = targetOrBody
        else body = targetOrBody

        let { match = {} } = body
        if (target === 'main') match = {}
        delete body.match

        const config = Cls.config()
        const idProp = target === 'main' ? 'id' : config.idProp

        const options = { modifiedBy: sessionUser.id }
        if (enforceLocation) {
            options.branch = branch
            options.siteId = siteId
        }

        options.currentData = inst
        options.currentUpdateLog = await inst.log({ target, field: 'updateLog' })

        if (target !== 'main' && typeof currentData === 'function')
            options.currentData = await currentData(target)

        body = processData(body, options)

        const [ result ] = await mysql.execute(config.query[target].update(body, {
            [idProp]: inst.id || Cls.matchIdHash(inst._id), ...match,
        }))

        if (typeof final === 'function') await final(inst, body)

        return { updated: result.affectedRows > 0 }
    },


    delete: async (inst, Cls, target = null, sinceOrIds, handle) => {
        const { user: sessionUser } = inst.session || {}
        if (!sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [DELETE]: Session user not supplied`)

        if (target === 'main') target = null

        const { idProp } = Cls.config()
        const jx = target && target.slice(0, 3) === 'jx.'
        if (jx) target = target.slice(3)

        if (jx) {
            const { jxTargets } = Cls.config()
            if (!jxTargets) throw new Error(`${Cls.name} Constructor Method Error [DELETE]: Junction targets not found`)

            if (!Array.isArray(sinceOrIds) || !sinceOrIds.length) throw new Error(`${Cls.name} Constructor Method Error [DELETE]: Invalid ids supplied`)

            const [ jxQuery, jxIdProp, Src ] = jxTargets[target]
            let ids, _ids
            if (typeof sinceOrIds[0] === 'number') ids = sinceOrIds
            if (typeof sinceOrIds[0] === 'string') _ids = sinceOrIds
            if (!ids && !_ids) throw new Error(`${Cls.name} Constructor Method Error [DELETE]: Invalid id types supplied`)

            if (!ids) {
                ids = []
                const list = await Src.fetch(inst.session, { _ids })
                list.map(item => ids.push(item.id))
            }

            const [ result ] = await mysql.execute(jxQuery.delete({ [idProp]: inst.id, [jxIdProp]: ids }))

            return { deleted: result.affectedRows > 0 }
        } else if (target) {
            const since = sinceOrIds

            const { query } = Cls.config()
            const [ result ] = await mysql.execute(query[target].delete({ [idProp]: inst.id, since }))

            return { deleted: result.affectedRows > 0 }
        }

        if (typeof handle === 'function') {
            const handled = await handle()
            if (handled === true) return true
        }

        const { query, logDeleted = true, logFile } = Cls.config()
        const { id } = inst
        const log = logDeleted && logFile ? await inst.log() : null

        const [ result ] = await mysql.execute(query.main.delete({ id }))
        if (!result.affectedRows) return { deleted: false }

        if (log) {
            for (const prop in log) inst[prop] = log[prop]
            await logDeletion(inst.session, logFile, inst, { id })
        }

        return { deleted: true }
    },


    // history: async (inst, Cls, target) => {
    //     const { user: sessionUser } = inst.session || {}
    //     if (!sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [HISTORY]: Session user not supplied`)

    //     //! not finished...
    // },


    log: async (inst, Cls, { field = null, target = 'main', since } = {}, fields) => {
        const { enforceUser = true } = Cls.config()
        const { user: sessionUser } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [LOG]: Session user not supplied`)

        fields = fields ?? classInstance.logFields

        const config = Cls.config()
        const idProp = target === 'main' ? 'id' : config.idProp
        const match = { [idProp]: inst.id || Cls.matchIdHash(inst._id), since }

        const log = (await mysql.execute(config.query[target].select(fields, { match })))[0][0]

        return fields.includes(field) ? log[field] : log
    }


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

        if (body?.ssn) body.ssn = { aes: [ ssn, secret.ssn ] }
        if (body?.ein) body.ein = { aes: [ ein, secret.ein ] }

        if (typeof split === 'function') body = await split(body)
        else body = { main: body }

        let createdIn = { branch }
        if (siteId) createdIn.siteId = siteId
        createdIn = JSON.stringify(createdIn)

        if (sessionUser?.id) body.main.createdBy = sessionUser.id
        if (enforceLocation) body.main.createdIn = createdIn

        const [ result ] = await mysql.execute(query.main.insert(body.main))
        const id = result.insertId
        if (!id) throw new Error(`Failed to create ${Cls.name.toLowerCase()}`)

        delete body.main
        if (Object.keys(body).length) {
            for (const target in body) {
                body[target][idProp] = id
                if (sessionUser?.id) body[target].createdBy = sessionUser.id
                if (enforceLocation) body[main].createdIn = createdIn

                const [ result ] = await mysql.execute(query[target].insert(body[target]))
                if (!result.affectedRows) throw new Error(`Failed to create ${Cls.name.toLowerCase()}'s ${target}`)
            }
        }

        data = await Cls.fetch({ user: sessionUser, branch, siteId }, { id }, { hideRawId })

        if (typeof final === 'function') await final(data, id)

        return { created: true, data }
    },


    fetch: async (Cls, { user: sessionUser = {}, branch, siteId = null } = {}, filter = {},
        { hideRawId = false, hideSensitive = true, sorts, mode = 'data', },
        { batch = [], prepare, removeFullGroupBy = false }
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
    }


}



function setSession(user = {}, branch, siteId = null) {
    const { id, DS, DSA, status, location, unscoped } = user

    return {
        user: { id, DS, DSA, status, location, unscoped },
        branch, siteId,
    }
}