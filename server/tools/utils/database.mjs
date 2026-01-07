const { DIR__PATH: directory } = Bun.env

import { mkdirSync, existsSync } from 'fs'
import path from 'path'
import { utcTimeStamp } from './date.mjs'
import { encrypt } from './crypto.mjs'
import { resetProto } from '../../../client/global/modules/tools/utils/object.mjs'



export function processData(data = {}, options = {}) {
    const { modifiedBy, branch, siteId } = options
    let { currentData, currentUpdateLog } = options
    if (!currentData) currentData = {}
    const update = Object.keys(currentData).length > 0
    if (!currentUpdateLog) currentUpdateLog == currentData.updateLog
    let updateLog = update && modifiedBy !== undefined
        ? [
            {
                data: {},
                oldData: {},
                modifiedBy,
                modifiedAt: utcTimeStamp(),
            }
        ]
        : null

    if (updateLog) {
        if (branch) updateLog[0].modifiedIn = { branch }
        if (siteId) updateLog[0].modifiedIn.siteId = siteId
    }

    for (const field in data) {
        const value = data[field]

        if (value !== null && typeof value === 'object') {
            data[field] = JSON.stringify(data[field])
            continue
        }

        if (data[field] === undefined) {
            delete data[field]
            continue
        }

        const encData = ['ssn', 'ein'].includes(field)
        const currentValue = currentData[field]

        if (updateLog && field in currentData) {
            if (currentValue != value) { //* Loose comparison: skip when "0" == 0 and "1" == 1
                updateLog[0].data[field] = value && encData ? encrypt(value) : processValue(value)
                updateLog[0].oldData[field] = currentValue && encData ? encrypt(currentValue) : processValue(currentValue)
            }
        }
//! HUGE PROBLEM WITH THIS COMPARISON
        if ( //* Loose comparison
            (update && value == currentValue) ||
            (!update && !value && value !== false && value !== 0 && value !== null)
        )
            delete data[field]
//! FIX IT
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