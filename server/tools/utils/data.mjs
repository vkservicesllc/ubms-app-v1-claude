const { DB__MYSQL_AES_EIN, DB__MYSQL_AES_SSN, DIR__PATH: directory } = Bun.env
const secret = {
    ein: DB__MYSQL_AES_EIN,
    ssn: DB__MYSQL_AES_SSN,
}

import { mkdirSync, existsSync } from 'fs'
import path from 'path'
import { utcTimeStamp } from './date.mjs'
import { encrypt } from './crypto.mjs'
import { resetProto } from '../../../client/global/modules/tools/utils/object.mjs'

const mysql = require('./mysql')



export async function processData(data = {}, { query, target = 'main', skipLog = false, match = {}, modifiedBy, branch, siteId } = {}) {
    const update = query && target
    let currentData, currentUpdateLog, updateLog

    // if (data.ssn && data.ssn?.aes) data.ssn = data.ssn.aes[0]
    // if (data.ein && data.ein?.aes) data.ein = data.ein.aes[0]
    data.ssn = unprocessAES(data.ssn)
    data.ein = unprocessAES(data.ein)

    if (update) {
        const fields = ['*']
        if (data.ssn) fields.push(selectAES('ssn'))
        if (data.ein) fields.push(selectAES('ein'))
;console.log(query[target].select(fields, { match }));
        currentData = (await mysql.execute(query[target].select(fields, { match })))[0][0]
;console.log(currentData);
        if (!currentData) currentData = {}

        if (!skipLog && currentData.updateLog !== undefined) {
            currentUpdateLog = currentData.updateLog
            updateLog = [
                {
                    data: {},
                    oldData: {},
                    modifiedBy,
                    modifiedAt: utcTimeStamp(),
                }
            ]
            if (branch) updateLog[0].modifiedIn = { branch }
            if (siteId) updateLog[0].modifiedIn.siteId = siteId
        }
    }

    for (const field in data) {
        const value = data[field]

        //* Ignore logging Objects
        if (value !== null && typeof value === 'object') {
            data[field] = JSON.stringify(value)
            continue
        }

        //* Ignore undefined fields
        if (value === undefined) {
            delete data[field]
            continue
        }

        //* Convert empty string to null
        if (value === '') data[field] = null

        if (update) {
            const currentValue = currentData[field]

            //* Boolean to TinyInt when update for correct comparison
            if (typeof value === 'boolean') data[field] = value ? 1 : 0

            if (currentValue === undefined || value === currentValue) {
                delete data[field]
                continue
            }

            if (updateLog) {
                const encData = ['ssn', 'ein'].includes(field)

                updateLog[0].data[field] = value && encData ? encrypt(value) : processValue(value)
                updateLog[0].oldData[field] = currentValue && encData ? encrypt(currentValue) : processValue(currentValue)
            }
        } else if (value === null) delete data[field]

        // if (field === 'ssn' || field === 'ein') data[field] = { aes: [ value, secret[field] ] }
        if (field === 'ssn' || field === 'ein') data[field] = processAES(field, value)
    }

    if (updateLog && Object.keys(updateLog[0].data).length) {
        if (currentUpdateLog)
            updateLog = updateLog.concat(currentUpdateLog)

        data.updateLog = JSON.stringify(updateLog).replace(/(?<!\\)\\"/g, '\\\\"')
    }

    return data
}


export async function logDeletion(session, target, instance, ids = {}) {
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


export function selectAES(target, field) {
    if (!field) field = target
    return { aes: [ field, secret[target] ] }
}


export function processAES(target, value) {
    if (!value?.aes) value = { aes: [ value, secret[target] ] }
    return value
}


export function unprocessAES(value) {
    if (value?.aes) value = value.aes[0]
    return value
}