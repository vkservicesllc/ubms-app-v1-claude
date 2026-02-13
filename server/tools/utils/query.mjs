import { formatDateToString } from '../../../client/global/modules/tools/utils/date.mjs'
import { capitalizeFirst } from '../../../client/global/modules/tools/utils/string.mjs'
import { sortObjectByKey } from '../../../client/global/modules/tools/utils/sorter.mjs'



class Query {

    constructor(db, table) {
        this.db = db
        this.table = table
    }


    static sqlMode = {
        onlyFullGroupBy: {
            add: "SET SESSION sql_mode = (SELECT CONCAT(@@sql_mode, ',ONLY_FULL_GROUP_BY'))",
            remove: "SET SESSION sql_mode = (SELECT REPLACE(@@sql_mode, 'ONLY_FULL_GROUP_BY', ''))",
        },
    }


    static md5 = value => `SELECT MD5(${Query.#value(value)}) AS md5`

    static sha1 = value => `SELECT SHA1(${Query.#value(value)}) AS sha1`

    static sha2 = (value, length = 512, secondLength) => {
        let sha2 = `SHA2(${Query.#value(value)}, ${length})`

        if (length === 512 && secondLength) {
            let substrLength

            if (secondLength === 224) substrLength = 56
            if (secondLength === 256) substrLength = 64

            if (substrLength) sha2 = `SUBSTRING(${sha2}, 1, ${substrLength})`
        }

        return `SELECT ${sha2} AS sha2`
    }

    static unMd5 = (db, table, field, md5Str) => `SELECT ${field} FROM ${db}.${table} WHERE MD5(${field}) = '${md5Str}'`

    static timeStamp = 'NOW()'


    static select(primaryDb, batch, limit) {
        if (!Array.isArray(batch)) {
            const { table, fields, match, search, sort, group } = batch
            let { limit: setLimit } = batch
            if (setLimit) limit = setLimit

            return new Query(primaryDb, table).select(fields, { match, search, sort, group, limit })
        }

        const databases = []
        const tables = []
        const joins = []
        const matches = []
        let searches = []
        const sorts = []

        let grouper
        let columns = []
        let primaryTable

        for (const cluster of batch) {
            let { db, table, fields, match, search, sort, group } = cluster
            const { join } = cluster

            let joiner

            if (!db) db = primaryDb
            if (!fields) fields = []
            else if (!Array.isArray(fields)) fields = [ fields ]

            fields = fields.map(field => field = Query.#field(field, table))
            table = Query.#_table(table, db)

            if (primaryTable && join) {
                joiner = { table: '', links: [ '' ], type: 'left' }
                const [ id, foreignId, param3 ] = join
                let foreignTable, foreignMatch, min, max, type

                if (typeof param3 === 'string')
                    foreignTable = param3
                else if (typeof param3 === 'number')
                    foreignTable = tables[param3]
                else if (typeof param3 === 'object')
                    ({ min, max, match: foreignMatch, table: foreignTable, type } = param3)

                if (!foreignTable) foreignTable = primaryTable
                foreignTable = Query.#_table(foreignTable, false)

                if (['left', 'right', 'inner', 'outter', null].includes(type))
                    joiner.type = type

                joiner.table = table
                joiner.links[0] = `${Query.#_table(table, false)}.${id} = ${foreignTable}.${foreignId}`

                if (max || min) {
                    const purpose = max || min
                    const func = max ? 'MAX' : 'MIN'
                    const subTable = 'latest'
                    let field = purpose, match = ''

                    if (Array.isArray(purpose)) {
                        field = purpose[0]

                        if (typeof purpose[1] === 'object')
                            for (const field in purpose[1]) {
                                const value = purpose[1][field]
                                if (value) match += ` AND ${subTable}.${field} = ${Query.#_value(value)}`
                            }
                    }

                    joiner.links[0] += `\nAND ${Query.#_table(table, false)}.${field} = (`
                    joiner.links[0] += `\nSELECT ${func}(${subTable}.${field}) `
                    joiner.links[0] += `FROM ${db}.${Query.#_table(table, false)} AS ${subTable}`
                    joiner.links[0] += `\nWHERE ${subTable}.${id} = ${foreignTable}.${foreignId}${match}\n)`
                    // console.log('id', joiner.links[0])

                    // const purpose = max || min
                    // let field, groups = [ id ], groupMatch = '', comparison = ''

                    // if (Array.isArray(purpose)) {
                    //     field = purpose[0]

                    //     if (typeof purpose[1] === 'object') {
                    //         if ('lessEq' in purpose[1]) {
                    //             let [ outterField, outterTable, outterId ] = purpose[1].lessEq
                    //             outterField = Query.#field(outterField, outterTable)
                    //             if (outterTable) {
                    //                 if (!outterId) outterId = 'id'
                    //                 comparison += ` LEFT JOIN ${outterTable} ON ${outterTable}.${foreignId} = ${table}.${id}`
                    //             }

                    //             comparison += ` WHERE ${outterField} <= ${field}`
                    //         } else {
                    //             groups = groups.concat(Object.keys(purpose[1]))

                    //             groupMatch = ` WHERE ${Query.#match(purpose[1])}`
                    //         }
                    //     }
                    // } else field = purpose

                    // const func = max ? 'MAX' : 'MIN'

                    // joiner.table = `(SELECT * FROM ${table} WHERE ${field} IN\n`
                    // joiner.table += `(SELECT ${func}(${field}) FROM ${table}`
                    // joiner.table += groupMatch
                    // joiner.table += comparison
                    // joiner.table += ` GROUP BY ${groups.join(', ')}))\n`
                    // joiner.table += `AS ${Query.#_table(table, false)}`
                }

                else if (foreignMatch)
                    joiner.table =`(SELECT * FROM ${table}\nWHERE ${Query.#match(foreignMatch)}) AS ${Query.#_table(table, false)}`
                // else joiner.table = table

                if (Array.isArray(join[3])) {
                    let join2 = join[3]
                    if (!Array.isArray(join2[0])) join2 = [ join2 ]

                    join2.map((pieces, i) => {
                        const [ field, foreignField, param3 ] = pieces

                        if (typeof param3 === 'string')
                            foreignTable = param3
                        else if (typeof param3 === 'number')
                            foreignTable = tables[param3]
                        else foreignTable = primaryTable

                        joiner.links[i + 1] = `${Query.#_table(table, false)}.${field} = ${foreignTable}.${foreignField}`
                    })
                }
            }

            if (!primaryTable) primaryTable = table

            match = Query.#match(match, table)

            if (sort) sort = Query.#sort(sort, table) //! UNTESTED

            databases.push(db)
            tables.push(table)
            columns = [ ...columns, ...fields ]
            if (joiner) joins.push(joiner)
            if (match) matches.push(match)
            if (Array.isArray(search)) {
                const [ searchStr, searchFields ] = search

                if (searchStr)
                    searches = searches.concat(Query.#search(searchStr, searchFields, table)) //! UNTESTED
            }
            if (sort) sorts.push(sort) //! UNTESTED
            if (!grouper && group) grouper = Query.#field(group, table)
        }

        let query = `\nSELECT DISTINCT\n`
        query += columns.join(`,\n`)
        query += `\nFROM ${primaryTable}\n`
        joins.map(joiner => {
            const { table, type, links } = joiner
            const join = (type ? `${type.toUpperCase()} ` : '') + 'JOIN '

            query += `${join + table}\nON ${links.join(`\nAND `)}\n`
        })
        if (matches.length) query += `WHERE ${matches.join(`\nAND `)}\n`
        if (searches.length)
            query += (matches.length ? 'AND ' : 'WHERE ') + `(${searches.join(' OR ')})\n`
        if (grouper) query += `GROUP BY ${Query.#_field(grouper)}\n`
        if (sorts.length) query += `ORDER BY ${sorts.join(', ')}\n` //! UNTESTED
        if (limit) query += `LIMIT ${Array.isArray(limit) ? limit.join(', ') : limit}\n`

        return query
    }


    static count(primaryDb, batch, field = 'id') {
        if (!Array.isArray(batch)) {
            const { table, match } = batch

            return new Query(primaryDb, table).count(match, field)
        }

        const databases = []
        const tables = []
        const joins = []
        const matches = []
        let primaryTable

        for (const cluster of batch) {
            let { db, table, match } = cluster
            const { join } = cluster

            let joiner

            if (!db) db = primaryDb
            table = Query.#_table(table, db)
        }
    }


    select(fields, filter = {}) {
        const table = Query.#_table(this.table, this.db)
        let { match, search = [], group, sort, limit } = filter

        if (!Array.isArray(fields)) fields = [ fields ]
        fields = fields.map(field => field = Query.#field(field))

        let query = `\nSELECT\n`
        query += fields.join(`,\n`)
        query += `\nFROM ${table}\n`

        match = Query.#match(match)

        let searchChunks = []
        const [ searchStr, searchFields ] = search
        if (searchStr) searchChunks = Query.#search(searchStr, searchFields)

        if (match) query += `WHERE ${match}\n`
        if (searchChunks.length)
            query += (match ? 'AND ' : 'WHERE ') + `(${searchChunks.join(' OR ')})\n` //! UNTESTED
        if (group) query += `GROUP BY ${Query.#_field(group)}\n`
        if (sort) query += `ORDER BY ${Query.#sort(sort)}\n`
        if (limit) query += `LIMIT ${Array.isArray(limit) ? limit.join(', ') : limit}\n`

        return query
    }


    count(match = {}, field = 'id') {
        const table = Query.#_table(this.table, this.db)
        match = Query.#match(match)

        let query = `\nSELECT COUNT(${field}) AS count\n`
        query += `FROM ${table}\n`
        if (match) query += `WHERE ${match}\n`

        return query
    }


    insert(data) {
        if (!Array.isArray(data)) data = [ data ]
        const table = Query.#_table(this.table, this.db)
        const fields = [], values = []
        let i = 0

        for (let pairs of data) {
            pairs = sortObjectByKey(pairs)
            values[i] = []

            for (let field in pairs) {
                let value
                [ field, value ] = Query.#unpair(field, pairs)

                if (!i) fields.push(field)
                values[i].push(value)
            }

            if (!fields.length || !values[i].length || fields.length !== values[i].length)
                return 'SELECT NULL'

            i++
        }

        let query = `\nINSERT INTO ${table}\n(`
        query += fields.join(', ')
        query += `)\nVALUES\n`

        values.forEach((list, i, array) => {
            array[i] = `(${list.join(' , ')})`
        })

        query += values.join(`,\n`)

        return query
    }


    update(pairs, match) {
        const table = Query.#_table(this.table, this.db)
        const updates = []
        const { max } = match
        if (max) delete match.max

        for (let field in pairs) {
            let value
            [ field, value ] = Query.#unpair(field, pairs)

            updates.push(`${field} = ${value}`)
        }

        if (!updates.length) return 'SELECT NULL'

        let query = `\nUPDATE ${table}`
        if (max) {
            query += `\nJOIN (SELECT MAX(${max}) AS max_${max} FROM ${table}`
            query += `\nWHERE ${Query.#match(match)}) AS latest`
            query += `\nON ${table}.${max} = latest.max_${max}`
        }
        query += `\nSET\n`
        query += updates.join(`,\n`)
        query += `\nWHERE ${Query.#match(match)}\n`

        return query
    }


    delete(match) {
        if (!Object.keys(match).length) return 'SELECT NULL'

        const table = Query.#_table(this.table, this.db)
        let query = `\nDELETE FROM ${table}`
        query += `\nWHERE ${Query.#match(match)}\n`

        return query
    }


    static hashField(field = {}, table) {
        if ('md5' in field || 'sha1' in field || 'sha2' in field)
            return Query.#field(field, table)
    }


    static #_table(table, db) {
        if (db) table = `${db}.${table}`
        if (db === false && table.indexOf('.') > -1) table = table.split('.')[1]

        return table
    }


    static #_field(field, table) {
        if (table) field = `${table}.${field}`
        else if (Query.#reserved.includes(field)) field = `\`${field}\``

        return field
    }


    static #_value(value, secret) {
        if (secret) {
            if (!value) return 'NULL'
            return `AES_ENCRYPT('${value}', '${secret}')`
        }
        else if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
        else if (!value && value !== 0) return 'NULL'
        else if (value === Query.timeStamp) return Query.timeStamp
        else if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`
        return value
    }


    static #field(field, table) {
        let resField

        if (Array.isArray(field))
            [ field, resField ] = field

        if (typeof field === 'object') {

            if ('aes' in field) {
                let secret
                [ field, secret ] = field.aes
                if (field[0] !== '_') field = `_${field}`
                if (!resField) resField = field.replace(/^_/, '')

                field = `AES_DECRYPT(${Query.#_field(field, table)}, '${secret}')`
            }

            else if ('date' in field) {
                field = field.date
                field = `DATE(${Query.#_field(field, table)})`
            }

            else if ('ip' in field) {
                field = field.ip
                if (field[0] !== '_') field = `_${field}`
                if (!resField) resField = field.replace(/^_/, '')

                field = `INET6_NTOA(${Query.#_field(field, table)})`
            }

            else if ('md5' in field || 'sha1' in field) {
                const prop = Object.keys(field)[0]
                field = field[prop]

                if (!resField) resField = field
                if (resField[0] !== '_') resField = `_${resField}`

                field = `${prop.toUpperCase()}(${Query.#_field(field, table)})`
            }

            else if ('sha2' in field) {
                let length = 512, secondLength
                field = field.sha2
                if (Array.isArray(field))
                    [ field, length, secondLength ] = field
                if (!resField) resField = field
                if (resField[0] !== '_') resField = `_${resField}`

                field = `SHA2(${Query.#_field(field, table)}, ${length})`
                if (length === 512 && secondLength) {
                    let substrLength

                    if (secondLength === 224) substrLength = 56
                    if (secondLength === 256) substrLength = 64

                    if (substrLength) field = `SUBSTRING(${field}, 1, ${substrLength})`
                }
            }

            else if ('max' in field || 'min' in field) {
                const prop = Object.keys(field)[0]
                field = field[prop]

                if (Array.isArray(field))
                    [ field, resField ] = field
                else
                    resField = prop + capitalizeFirst(field)

                field = Query.#_field(field, table)
                field = `${prop.toUpperCase()}(${field})`
            }

            else if ('compare' in field) {
                let condition
                [ field, resField, condition ] = field.compare
                const key = Object.keys(condition)[0]
                const oper = { eq: '=', ne: '!=' }[key]
                let value = condition[key]

                value = Query.#_value(value)
                field = Query.#_field(field, table)
                field = `(${field} ${oper} ${value})`
            }

            else if ('count' in field ) {
                [ field, resField ] = field.count

                field = Query.#_field(field, table)
                field = `COUNT(${field})`
            }

            else if ('countDist' in field ) {
                let options
                [ field, resField, options ] = field.countDist
                field = Query.#_field(field, table)

                if (options?.case) {
                    const { db, table, match } = options.case
                    const caseTable = Query.#_table(table, db)
                    const caseMatch = Query.#match(match, caseTable)

                    field = `COUNT(DISTINCT CASE WHEN ${caseMatch} THEN ${field} END)`
                } else
                    field = `COUNT(DISTINCT ${field})`
            }

            else if ('countCase' in field) {
                let pair
                [ pair, resField ] = field.countCase
                field = Object.keys(pair)[0]
                const value = Query.#value(pair[field])

                field = Query.#_field(field, table)
                field = `COUNT (CASE WHEN ${field} = ${value} THEN 1 END)`
            }

            else if ('concat' in field) {
                [ field, resField ] = field.concat

                field = field.map(item => {
                    if (item[0] === '^')
                        item = `'${item.replace(/\^/g, '')}'`
                    else
                        item = Query.#_field(item, table)

                    return item
                })

                field = `CONCAT(${field.join(', ')})`
            }

            else if ('route' in field) {
                field = field.route

                if (Array.isArray(field[0]))
                    [ field, resField ] = field

                field = field.map(item => Query.#_field(item, table))
                if (!resField) resField = 'route'

                field = `REPLACE(LOWER(CONCAT(${field.join(", '-', ")})), ' ', '-')`
            }

        } else
            field = Query.#_field(field, table)

        if (resField) field = `${field} AS ${resField}`

        return field
    }


    static #value(value) {
        let secret

        if (value instanceof Date) value = formatDateToString(value)
        else if (value !== null && typeof value === 'object') {
            if ('aes' in value)
                [ value, secret ] = value.aes
            else if ('ip' in value) return `INET6_ATON('${value.ip}')`
        }

        return Query.#_value(value, secret)
    }


    static #match(match = {}, table) { /* AND only */
        const chunks = []
        if (table) table = Query.#_table(table, false)

        for (let field in match) {
            let value = match[field]

            if (empty(value)) continue

            let operator = ' = ', extension = ''

            if (field === 'route' || field === 'concat') {
                const prop = field
                let fields
                [ fields, value ] = value[field]

                value = Query.#value(value)
                field = { [prop]: [ fields ] }
            }

            else if (Array.isArray(value))
                [ value, operator, extension ] = combine(value)

            else if (value !== null && typeof value === 'object') {

                if ('aes' in value || 'ip' in value) {
                    field = `_${field}`
                    value = Query.#value(value)
                }

                else if ('not' in value) {
                    value = value.not
                    if (empty(value)) continue

                    if (Array.isArray(value))
                        [ value, operator, extension ] = combine(value, false)
                    else {
                        value = Query.#value(value)
                        operator = ' != '
                    }

                }

                else if ('lt' in value) {
                    value = value.lt
                    if (empty(value)) continue

                    value = Query.#value(value)
                    operator = ' < '
                }

                else if ('lte' in value) {
                    value = value.lte
                    if (empty(value)) continue

                    value = Query.#value(value)
                    operator = ' <= '
                }

                else if ('gt' in value) {
                    value = value.gt
                    if (empty(value)) continue

                    value = Query.#value(value)
                    operator = ' > '
                }

                else if ('gte' in value) {
                    value = value.gte
                    if (empty(value)) continue

                    value = Query.#value(value)
                    operator = ' >= '
                }

                else if ('null' in value) {
                    value = value.null
                    if (empty(value)) continue

                    if (typeof value !== 'boolean') value = true
                    value = value ? 'NULL' : 'NOT NULL'
                }

                else if ('md5' in value || 'sha1' in value) {
                    const prop = Object.keys(value)[0]
                    value = value[prop]
                    if (empty(value)) continue

                    if (Array.isArray(value)) {
                        if (value.length) [ value, operator, extension ] = combine(value)
                        else value = Query.#value(null)
                    } else value = Query.#value(value)
                    field = { [prop]: field }
                }

                else if ('sha2' in value) {
                    let { length } = value
                    value = value.sha2
                    if (empty(value)) continue

                    if (length) {
                        let secondLength
                        if (Array.isArray(length))
                            [ length, secondLength] = length
                        field = [ field, length, secondLength ]
                    }

                    if (Array.isArray(value)) {
                        if (value.length) [ value, operator, extension ] = combine(value)
                        else value = Query.#value(null)
                    } else value = Query.#value(value)
                    field = { sha2: field }
                }

                // else if ('sha2' in value) {
                //    value = value.sha2

                //    if (Array.isArray(value)) {
                //        let length, secondLength
                //        [ value, length, secondLength ] = value
                //        field = [ field, length, secondLength ]
                //    }

                //    if (empty(value)) continue

                //    if (Array.isArray(value))
                //        [ value, operator, extension ] = combine(value)
                //    else value = Query.#value(value)
                //    field = { sha2: field }
                // }

            }

            else value = Query.#value(value)

            field = Query.#field(field, table).split(' AS ')[0]
            if (value === 'NULL' || value === 'NOT NULL')
                operator = ' IS '
            if (extension) extension = extension.replace('[FIELD]', field)

            let line = field + operator + value + extension
            if (extension) line = `(${line})`

            chunks.push(line)
        }

        return chunks.join('\nAND ')


        function empty(value) {
            return value === undefined || typeof value === 'undefined'
        }

        function combine(originalValues, eq = true) {
            let values = [ ...originalValues ]
            const operator = eq ? ' ' : ' NOT '
            const condition = eq ? 'OR' : 'AND'
            let extension = ''

            values.forEach((value, idx) => {
                value = Query.#value(value)

                if (value === 'NULL') {
                    if (!extension) extension = ` ${condition} [FIELD] IS${operator}NULL`
                } else values[idx] = value
            })
            if (extension) values = values.filter(value => value !== null)

            if (!values.length) return [ 'NULL', ' IS ', '' ]
            return [ `IN (${values.join(', ')})`, operator, extension ]
        }

    }

    static #search(searchStr, fields = [], table) {
        const chunks = []
        if (!Array.isArray(fields)) fields = [ fields ]
        if (table) table = Query.#_table(table, false)
        searchStr = searchStr.replace(/'/g, "''")

        fields.map(field => {
            field = Query.#field(field, table).split(' AS ')[0]
            chunks.push(`${field} LIKE '%${searchStr}%'`)
        })

        return chunks
    }


    static #sort(sort, table) {
        if (typeof sort === 'object') {
            if (Array.isArray(sort))
                sort = sort.map(item => resolve(item, table)).join(', ')
            else
                sort = resolve(sort, table)
        } else sort = `${Query.#field(sort, table)}`

        return sort


        function resolve(sort, table) {
            let order = ''

            if (typeof sort === 'object') {
                order = Object.keys(sort)[0]
                if (![ 'asc', 'desc' ].includes(order)) return

                sort = sort[order]
            }

            const field = Query.#field(sort, table)

            return (`${field} ${order.toUpperCase()}`).trim()
        }

    }


    static #unpair(field, pairs) {
        let value = pairs[field]

        if (value !== null && typeof value === 'object')
            if (('aes' in value || 'ip' in value) && field[0] !== '_') field = `_${field}`

        return [ Query.#field(field), Query.#value(value) ]
    }


    static #reserved = [ 'condition', 'in', 'or' ]


}



export default Query


const algorithms = {
    'MD5': [ 'md5' ],
    'SHA-1': [ 'sha1' ],

    // * SHA-2
    'SHA-224': [ 'sha2', 224 ],           // SHA-224 (224-bit)
    'SHA-256': [ 'sha2', 256 ],           // SHA-256 (256-bit)
    'SHA-384': [ 'sha2', 384 ],           // SHA-384 (384-bit)
    'SHA-512': [ 'sha2' ],                // SHA-512 (512-bit)
    'SHA-512/224': [ 'sha2', 512, 224 ],  // SHA-512/224 (224-bit, truncated)
    'SHA-512/256': [ 'sha2', 512, 256 ],  // SHA-512/256 (256-bit, truncated)
}


export const hash = (field, algorithm = 'MD5') => {
    if (!Object.keys(algorithms).includes(algorithm)) return field

    const [ prop, length, secondLength ] = algorithms[algorithm]
    field = { [prop]: length ? [ field, length ] : field }
    if (secondLength) field[prop].push(secondLength)

    return field
}


export const matchHash = (value, algorithm = 'MD5') => {
    if (!Object.keys(algorithms).includes(algorithm)) return value

    const [ prop, length, secondLength ] = algorithms[algorithm]
    value = { [prop]: value }
    if (length) value.length = length
    if (secondLength) value.length = [ length, secondLength ]

    return value
}

// export const matchHash = (value, algorithm = 'MD5') => {
//    if (!Object.keys(algorithms).includes(algorithm)) return value

//    const [ prop, length, secondLength ] = algorithms[algorithm]
//    value = { [prop]: length ? [ value, length ] : value }
//    if (secondLength) value[prop].push(secondLength)

//    return value
// }