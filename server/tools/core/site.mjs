import config, { apps } from '../../../config.mjs'
import Query from '../tools/utils/query.mjs'

const mysql = require('../tools/utils/mysql')
const query = new Query('app_online', 'sites')


export default class {

    constructor (branch, identifier) {
        if (!branch) return

        return (async () => {
            const app = apps[branch]
            const { type, catId, name, address } = app

            let site = { ...config.site, name, address, catId: catId || null }

            if (!catId || !identifier) return site

            let { id, _id, domain } = site

            if (typeof identifier == 'number') id = identifier
            else if (typeof identifier == 'object') ({id, _id, domain} = identifier)
            else domain = identifier

            const fields = [
                'id',
                'catId',
                'active',
                'domain',
                'name',
                'alias',
            ]
            const match = { domain, id }
            if (_id) match.id = { md5: _id }

            const [ rows ] = await mysql.execute(query.select(fields, match))
            if (!rows.length) return site

            site = rows[0]
            site.address = 'https://'
            if (type == 'secondary') site.address += branch + '.'
            site.address += site.domain

            return site
        })()
    }


    static list = async () => await mysql.execute(query.select([
        { md5: 'id' },
        'catId',
        'active',
        'domain',
        'name',
        'alias',
    ]))[0]


}