const { DIR__PATH: directory } = Bun.env

import { mkdirSync, existsSync } from 'fs'
import path from 'path'
import { utcTimeStamp } from './date.mjs'
import { encrypt } from './crypto.mjs'
import { resetProto } from '../../../client/global/modules/tools/utils/object.mjs'



export function processData(data = {}, options = {}) {
    //
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