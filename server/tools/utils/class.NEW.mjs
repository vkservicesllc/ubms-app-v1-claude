const { DB__MYSQL_AES_EIN, DB__MYSQL_AES_SSN } = Bun.env
const secret = {
    ein: DB__MYSQL_AES_EIN,
    ssn: DB__MYSQL_AES_SSN,
}

import Query, { hash, matchHash } from './query.mjs'

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

        body = processData(body)

        if (body?.ssn && typeof body.ssn !== 'object') body.ssn = { aes: [ body.ssn, secret.ssn ] }
        if (body?.ein && typeof body.ein !== 'object') body.ein = { aes: [ body.ein, secret.ein ] }

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


    fetch: async (inst, Cls, target, filter = {}, { idsOnly = false, sorts = null, mode = 'data' } = {}) => {
        if (!target || target === 'main') throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Target not supplied`)

        const config = Cls.config()

        const { enforceUser = true, idProp } = config
        const { user: sessionUser, offline = false } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Session user not supplied`)
        if (!idProp) throw new Error(`${Cls.name} Constructor Method Error [FETCH]: ID Property not supplied`)

        const jx = target.slice(0, 3) === 'jx.'
        if (jx) target = target.slice(3)

        //* Many-to-Many
        if (jx) {
            const { jxTargets, jxSorts = null } = config
            if (!jxTargets) throw new Error(`${Cls.name} Constructor Method Error [FETCH]: Junction targets not found`)

            const ids = []
            const [ jxQuery, jxIdProp, Src ] = jxTargets[target]
            if (!sorts) sorts = jxSorts

            const [ rows ] = await mysql.execute(jxQuery.select(jxIdProp, {
                match: { [idProp]: inst.id || Cls.matchIdHash(inst._id) },
            }))
            rows.map(row => ids.push(row[jxIdProp]))

            return idsOnly ? ids : await Src.fetch(inst.session, { ids, ...filter }, { hideRawId, hideSensitive, offline, sorts, mode })
        }

        //* One-to-Many

        const { query, childSort = {}, childIdHash = {}, childExclude = {} } = config

        const options = {
            match: { [idProp]: inst.id || Cls.matchIdHash(inst._id) },
            sort: { desc: childSort[target] || 'since' },
        }

        const { match = {} } = filter
        for (const prop in match) {
            let value = match[prop]
            if (prop === '_id') {
                if (!value) continue
                value = matchHash(value, childIdHash[target])
            }

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

        return rows
    },


    update: async (inst, Cls, targetOrBody, body, match = {}, { currentData, final, skipLog = false } = {}) => {
        const config = Cls.config()

        const { enforceUser = true, enforceLocation = false } = config
        const { user: sessionUser, branch, siteId } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [UPDATE]: Session user not supplied`)
        if (enforceLocation && !branch) throw new Error(`${Cls.name} Constructor Method Error [UPDATE]: Session branch not supplied`)

        const { query } = config
        let target = 'main'
        if (typeof targetOrBody === 'string') target = targetOrBody
        else body = targetOrBody

        const idProp = target === 'main' ? 'id' : config.idProp
        match = { [idProp]: inst.id || Cls.matchIdHash(inst._id), ...match }

        const options = { modifiedBy: sessionUser.id, skipLog }
        if ((typeof enforceLocation === 'string' && enforceLocation.includes('update')) || enforceLocation === true) {
            options.branch = branch
            options.siteId = siteId
        }

        options.currentData = await mysql(query[target].select('*', { match }))
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
            if ('_id' in match) match._id = matchHash(match._id, childIdHash[target])

            const [ result ] = await mysql.execute(query[target].delete({ [idProp]: inst.id, ...match }))

            return { deleted: result.affectedRows > 0 }
        }

        //* Self

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


    log: async (inst, Cls, { target = 'main', field, match = {} } = {}) => {
        const config = Cls.config()

        const { enforceUser = true } = config
        const { user: sessionUser } = inst.session || {}
        if (enforceUser && !sessionUser?.id) throw new Error(`${Cls.name} Constructor Method Error [LOG]: Session user not supplied`)

        const { query } = config

        const idProp = target === 'main' ? 'id' : config.idProp

        const data = (await mysql.execute(query[target].select('*', {
            [idProp]: inst.id || Cls.matchIdHash(inst._id), ...match,
        })))[0][0]
        if (!data) return
        
        const log = {}
        for (const field in data)
            if (logFields.includes(field)) log[field] = data[field]

        return log?.[field] || log
    },


}



export const classStatic = {}



async function processData(data = {}, { query, target, skipLog = false, modifiedBy, branch, siteId } = {}) {
    // let currentUpdateLog = {}
    // let updateLog = Object.keys(currentData).length > 0 && modifiedBy !== undefined
    //     ? [
    //         {
    //             data: {},
    //             oldData: {},
    //             modifiedBy,
    //             modifiedAt: utcTimeStamp(),
    //         }
    //     ]
    //     : null

    // if (updateLog) {
    //     if (branch) updateLog[0].modifiedIn = { branch }
    //     if (siteId) updateLog[0].modifiedIn.siteId = siteId

    //     currentUpdateLog = currentData.updateLog
    //     logFields.map(logField => delete currentData[logField])
    // }

    // for (const field in data) {
    //     const value = data[field]

    //     //* Ignore logging Objects
    //     if (value !== null && typeof value === 'object') {
    //         data[field] = JSON.stringify(value)
    //         continue
    //     }

    //     //* Ignore undefined fields
    //     if (value === undefined) {
    //         delete data[field]
    //         continue
    //     }

    //     //* Convert empty string to null
    //     if (value === '') data[field] = null

    //     if (updateLog) {
    //         const currentValue = currentData[field]

    //         //* Boolean to TinyInt when update for correct comparison
    //         if (typeof value === 'boolean') data[field] = value ? 1 : 0

    //         if (currentValue === undefined || value === currentValue) {
    //             delete data[field]
    //             continue
    //         }

    //         const encData = ['ssn', 'ein'].includes(field)

    //         updateLog[0].data[field] = value && encData ? encrypt(value) : processValue(value)
    //         updateLog[0].oldData[field] = currentValue && encData ? encrypt(currentValue) : processValue(currentValue)
    //     } else if (value === null) delete data[field]
    // }

    // if (updateLog && Object.keys(updateLog[0].data).length) {
    //     if (currentUpdateLog)
    //         updateLog = updateLog.concat(currentUpdateLog)

    //     data.updateLog = JSON.stringify(updateLog).replace(/(?<!\\)\\"/g, '\\\\"')
    // }

    // return data
}


async function logDeletion(session, target, instance, ids = {}) {
    if (!session?.user) return

    const { branch, siteId, user } = session
    const dirPath = `${directory}/log/deleted/`
    const filePath = path.join(dirPath, `${target}.json`).replace(/\\/g, '/')
    const { name: signature } = user
    const deletedBy = user.id
    const deletedAt = utcTimeStamp()
    let deletedIn = null

    if (branch) {
        deletedIn = { branch }
        if (siteId) deletedIn.siteId = siteId
    }

    for (const prop in ids) delete instance[prop]
    instance = resetProto(instance, ids, { deletedBy, deletedIn, deletedAt, signature })

    if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true })

    const file = Bun.file(filePath, { type: 'application/json' })
    let log = [ instance ]

    if (await file.exists()) {
        log = JSON.parse(await file.text())
        log.unshift(instance)
    }

    await Bun.write(filePath, JSON.stringify(log, null, 4))
}


function processValue(value) {
    if (typeof value === 'boolean') value = value ? 1 : 0
    else if (typeof value === 'string') {
        if (value === '') value = null
        else value = value.replace(/"/g, '\\"')
    }

    return value
}


function setSession(user = {}, branch, siteId = null) {
    const { id, DS, DSA, status, location, unscoped } = user

    return {
        user: { id, DS, DSA, status, location, unscoped },
        branch, siteId,
    }
}