import config, { apps } from '../../../config.mjs'
import Company from './company.mjs'
import { query } from '../../settings/mysql.mjs'

const mysql = require('../utils/mysql')


export default class {

    constructor (branch, identifier) {
        if (!branch) return

        return (async () => {
            const app = apps[branch]
            const { type, category, name, address } = app

            let site = { ...config.site, name, address, category: category || null }

            if (!category || !identifier) return site

            let { id, _id, domain } = site

            if (typeof identifier === 'number') id = identifier
            else if (typeof identifier === 'object') ({id, _id, domain} = identifier)
            else domain = identifier

            const fields = [
                'id',
                'category',
                'active',
                'domain',
                'name',
                'alias',
            ]
            const match = { domain, id }
            if (_id) match.id = { md5: _id }

            const [ rows ] = await mysql.execute(query.site.main.select(fields, match))
            if (!rows.length) return site

            site = rows[0]
            site.address = 'https://'
            if (type === 'secondary') site.address += branch + '.'
            site.address += site.domain
            site.expansion = {
                category: Company.categoryList[site.category].item[1],
                categoryGroup: Company.categoryList[site.category].item[0],
            }

            return site
        })()
    }


    static fetch = async () => await mysql.execute(query.site.main.select([
        { md5: 'id' },
        'category',
        'active',
        'domain',
        'name',
        'alias',
    ]))[0]


}