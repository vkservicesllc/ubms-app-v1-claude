/* Settings */
import db from '../../../settings/mysql.mjs'

/* Tools */
import Driver, { Application } from '../../../tools/core/driver.mjs'
import Team from '../../../tools/core/team.mjs'
import User from '../../../tools/core/user.mjs'
import Carrier from '../../../tools/core/carrier.mjs'
import Individual from '../../../tools/core/individual.mjs'
import Query from '../../../tools/utils/query.mjs'

const knex = require('../../../tools/utils/knex')
const sendError = require('../../../tools/utils/error')


const subQuery = (db, table, maxField, groupId) => knex
    .select('*')
    .from(`${db}.${table}`)
    .whereIn(maxField, function() {
        this.select(knex.raw(`MAX(${maxField})`))
            .from(`${db}.${table}`)
            .groupBy(groupId)
    })


export const dtDriverList = async (req, res) => {
    try {
        const sessionUser = res.session.user
        const { DS, unscoped } = sessionUser
        const permissions = await sessionUser.permissions() || {}

        if (!DS && !('d:drv/apl' in permissions)) return sendError.auth(req, res)

        let team, teamId = null
        if (req.session.team) team = await Team.fetch(res.session, { _id: req.session.team }, { hideRawId: false })
        if (team) teamId = team.id

        const { draw, start, length } = req.body
        const { blacklisted } = req.query

        const excludedConditions = ['p']
        if (false) excludedConditions.push('c') //! FILTER

        const baseQuery = knex(`${db.carrier}.drivers AS drv`)
            .select(
                knex.raw(Query.hashField(Driver.hashId(), 'drv')),
                knex.raw(Query.hashField(Individual.hashId('personId'), 'drv')),
                'psn.dob',
                'psn.gender',
                knex.raw('MAX(??) AS ??', ['nms.firstName', 'firstName']),
                knex.raw('MAX(??) AS ??', ['nms.middleName', 'middleName']),
                knex.raw('MAX(??) AS ??', ['nms.lastName', 'lastName']),
                knex.raw('MAX(??) AS ??', ['nms.suffix', 'suffix']),
                knex.raw('MAX(??) AS ??', ['phn.phone', 'phone']),
                knex.raw('MAX(??) AS ??', ['eml.email', 'email']),
                knex.raw('MAX(??) AS ??', ['adr.address1', 'address1']),
                knex.raw('MAX(??) AS ??', ['adr.address2', 'address2']),
                knex.raw('MAX(??) AS ??', ['adr.city', 'city']),
                knex.raw('MAX(??) AS ??', ['adr.state', 'state']),
                knex.raw('MAX(??) AS ??', ['adr.zip', 'zip']),
                knex.raw('MAX(??) AS ??', ['dls.state', 'dlState']),
                knex.raw('MAX(??) AS ??', ['dls.expiresOn', 'dlExpiresOn'])
            )
            .leftJoin(`${db.person}.individuals AS psn`, 'psn.id', 'drv.personId')
            .leftJoin(
                knex.raw('? AS nms', [ subQuery(db.person, 'names', 'since', 'personId') ]),
                'nms.personId',
                'drv.personId'
            )
            .leftJoin(
                knex.raw('? AS phn', [ subQuery(db.person, 'phones', 'since', 'personId') ]),
                'phn.personId',
                'drv.personId'
            )
            .leftJoin(
                knex.raw('? AS eml', [ subQuery(db.person, 'emails', 'since', 'personId') ]),
                'eml.personId',
                'drv.personId'
            )
            .leftJoin(
                knex.raw('? AS adr', [ subQuery(db.person, 'addresses', 'since', 'personId') ]),
                'adr.personId',
                'drv.personId'
            )
            .leftJoin(
                knex.raw('? AS dls', [ subQuery(db.person, 'identifications', 'issuedOn', 'personId') ]),
                'dls.personId',
                'drv.personId'
            )
            .leftJoin(`${db.carrier}.applications AS apl`, 'apl.driverId', 'drv.id')
            .leftJoin(`${db.online}.teams AS env`, 'env.id', 'apl.teamId')
            .whereNotIn('apl.condition', excludedConditions)
            .groupBy('drv.id')

                //! NEEDS TESTING
                if (teamId) baseQuery.where('apl.teamId', teamId)
                else baseQuery.andWhere(function() {
                    this.where('env.scoped', false).orWhereNull('env.scoped')
                })

        const totalCountQuery = knex.queryBuilder().count('* AS count').from(baseQuery.as('base'))
        const countQuery = knex.queryBuilder().count('* AS count').from(baseQuery.as('base'))

        baseQuery.limit(length).offset(start)

        const [
            data,
            [{ count: recordsFiltered }],
            [{ count: recordsTotal }],
        ] = await Promise.all([
            baseQuery,
            countQuery,
            totalCountQuery,
        ])

        res.json({
            draw,
            recordsTotal,
            recordsFiltered,
            data,
        })

    } catch (err) {
        sendError.server(req, res, err)
    }
}


export const dtApplicationList = async (req, res) => {
    try {
        const sessionUser = res.session.user
        const { DS, unscoped } = sessionUser
        const permissions = await sessionUser.permissions() || {}

        if (!DS && !('d:drv/apl' in permissions)) return sendError.auth(req, res)

        const { draw, start, length, columns, search, filter } = req.body
        const { archived } = req.query

        let team, teamId

        if (req.session.team) {
            team = await Team.fetch(res.session, { _id: req.session.team })
            teamId = team.id
        }


        /* STEP 1: Set up Select, Join and Count Default States */

        const applyJoins = query => {

            const nameSubQuery = subQuery(db.person, 'names', 'since', 'personId')
            const addressSubQuery = subQuery(db.carrier, 'application_addresses', 'since', 'appId')
            const companySubQuery = subQuery(db.business, 'company_names', 'since', 'companyId')

            query
                .leftJoin(`${db.carrier}.drivers AS drv`, 'drv.id', 'apl.driverId')
                .leftJoin(`${db.person}.individuals AS psn`, 'psn.id', 'drv.personId')
                .leftJoin(
                    knex.raw('? AS nms', [ nameSubQuery ]),
                    'nms.personId',
                    'psn.id'
                )
                .leftJoin(
                    knex.raw('? AS addr', [ addressSubQuery ]),
                    'addr.appId',
                    'apl.id'
                )
                .leftJoin(`${db.carrier}.application_DLs AS dl`, 'dl.appId', 'apl.id')
                .leftJoin(`${db.carrier}.application_beneficiaries AS benef`, 'benef.appId', 'apl.id')
                .leftJoin(`${db.carrier}.carriers AS crr`, 'apl.carrierId',' crr.id')
                .leftJoin(`${db.business}.companies AS cmp`, 'crr.companyId', 'cmp.id')
                .leftJoin(
                    knex.raw('? AS cnm', [ companySubQuery ]),
                    'cnm.companyId',
                    'cmp.id'
                )
                .leftJoin(knex.raw(`${db.online}.users AS usr ON apl.userId = usr.id`))
                .leftJoin(knex.raw(`${db.online}.teams AS env ON apl.teamId = env.id`))
        }

        const baseQuery = knex(`${db.carrier}.applications AS apl`)
            .select(
                knex.raw(Query.hashField(Application.hashId(), 'apl')),
                knex.raw(Query.hashField(Driver.hashId('driverId'))),
                knex.raw(Query.hashField(Team.hashId('teamId'))),
                knex.raw(Query.hashField(User.hashId('userId'))),
                knex.raw(Query.hashField(Carrier.hashId('carrierId'))),
                'apl.formId',
                'apl.condition',
                'apl.createdAt', //! will return ISO 8601 UTC timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
                'apl.finishedAt',
                'apl.position',
                'apl.step',
                'apl.firstName',
                'apl.middleName',
                'apl.lastName',
                'apl.suffix',
                'apl.dob',
                'apl.gender',
                'apl.email',
                'apl.phone',
                'apl.marital',
                'apl.medCard',
                'apl.dui',
                'apl.criminal',
                'apl.dotDat',
                'apl.citations',
                'apl.accidents',
                'apl.activeBusiness',
                'psn.dob AS originalDob',
                'psn.gender AS originalGender',
                'nms.firstName AS originalFirstName',
                'nms.middleName AS originalMiddleName',
                'nms.lastName AS originalLastName',
                'nms.suffix AS originalSuffix',
                'addr.state',
                'dl.commercial AS dlCommercial',
                'dl.state AS dlState',
                'benef.relation AS benefRelation',
                'benef.otherRel AS benefOtherRel',
                'cnm.busName',
                'cnm.coType',
                'cnm.alias AS companyAlias',
                'usr.firstName AS userFirstName',
                'usr.lastName AS userLastName',
                'usr.alias AS userAlias',
                'usr.condition AS userCondition',
                'usr.location AS userLocation',
                'usr.deletedAt AS userDeletedAt',
                'env.name AS teamName'
            )

        const countQuery = knex(`${db.carrier}.applications AS apl`).count('* AS count')
        const totalCountQuery = countQuery.clone()

        applyJoins(baseQuery)
        applyJoins(countQuery)
        totalCountQuery.leftJoin(knex.raw(`${db.online}.teams AS env ON apl.teamId = env.id`))

        if (teamId) {
            baseQuery.where({ teamId })
            countQuery.where({ teamId })
            totalCountQuery.where({ teamId })
        } else {
            const queries = [ baseQuery, countQuery, totalCountQuery ]

            queries.forEach(query => query.andWhere(function() {
                this.where('env.scoped', false).orWhereNull('env.scoped')
            }))
        }

                //! NEED TO USE AND WHERE
                const archiveWhere = archived === 'true'
                    ? 'whereNotNull'
                    : 'whereNull'

                baseQuery[archiveWhere]('archivedAt')
                countQuery[archiveWhere]('archivedAt')
                totalCountQuery[archiveWhere]('archivedAt')


        /* STEP 2: Prepare Filters */

        const filterParams = {
            company: {
                nullable: true,
                whereCond: 'orWhere',
                carrierIds: [],
            },
        }

        if (filter?.carriers) {
            filter.carriers = filter.carriers.split(',')

            if (filter.carriers.length && !filter.carriers.includes('null')) {
                filterParams.company.nullable = false
                filterParams.company.whereCond = 'where'
            }

            await Promise.all(filter.carriers.map(async (_id) => {
                if (_id !== 'null') {
                    const carrier = await Carrier.data(res.session, { _id })
                    const id = await carrier.id()

                    filterParams.company.carrierIds.push(id)
                }
            }))
        }

        if (filter?.user) {
            if (filter.user === 'null') {
                baseQuery.whereNull('userId')
                countQuery.whereNull('userId')
            } else {
                const userId = await (await User.data(res.session, { _id: filter.user, allowDeleted: true })).id()

                baseQuery.where('userId', userId)
                countQuery.where('userId', userId)
            }
        }

        function companyStateFilter() {
            const { nullable, whereCond, carrierIds } = filterParams.company

            if (nullable) this.whereNull('carrierId')
            if (!filter?.carriers || carrierIds.length)
                this[whereCond](function() {
                    this.where('cmp.confirmed', true)
                    if (carrierIds.length) this.whereIn('apl.carrierId', carrierIds)
                })
        }

        baseQuery.where(companyStateFilter)
        countQuery.where(companyStateFilter)

        if (filter?.conditions) {
            filter.conditions = filter.conditions.split(',')

            baseQuery.whereIn('apl.condition', filter.conditions)
            countQuery.whereIn('apl.condition', filter.conditions)
        }

        if (filter?.positions) {
            filter.positions = filter.positions.split(',')
            let nullable = false

            if (filter.positions.includes('null')) {
                nullable = true
                filter.positions = filter.positions.filter(value => value !== 'null')
            }

            if (filter.positions.length) {
                function positionFilter() {
                    this.whereIn('position', filter.positions)
                    if (nullable) this.orWhereNull('position')
                }

                baseQuery.where(positionFilter)
                countQuery.where(positionFilter)
            } else {
                baseQuery.whereNull('position')
                countQuery.whereNull('position')
            }
        }


        /* STEP 3: Prepare Search */

        const searchableColumns = columns
            .filter(column => column.data && column.data !== 'function' && column.searchable === 'true')
            .map(column => column.data)

        if (search && search.value && searchableColumns.length) {
            function searchFilter() {
                searchableColumns.forEach((field, i) => {
                    if (i === 0) this.where(`apl.${field}`, 'like', `%${search.value}%`)
                    else this.orWhere(`apl.${field}`, 'like', `%${search.value}%`)
                })
            }

            baseQuery.where(searchFilter)
            countQuery.where(searchFilter)
        }


        /* STEP 4: Prepare Orders and Limits */

        baseQuery
            .orderBy([
                { column: 'createdAt', order: 'desc' },
                { column: 'lastName', order: 'asc' },
                { column: 'firstName', order: 'asc' },
            ])
            .limit(length).offset(start)

        /* Obtain Data and Counts */
        const [
            data,
            [{ count: recordsFiltered }],
            [{ count: recordsTotal }],
        ] = await Promise.all([
            baseQuery,
            countQuery,
            totalCountQuery,
        ])

        res.json({
            draw,
            recordsTotal,
            recordsFiltered,
            data,
            actions: {
                data: {
                    comment: DS || permissions?.['d:drv/apl'].includes('1'),
                    create: DS || permissions?.['d:drv/apl'].includes('2'),
                    modify: DS || permissions?.['d:drv/apl'].includes('3'),
                    delete: DS || permissions?.['d:drv/apl'].includes('5'),
                },
                file: {
                    access: Object.keys(permissions).some(key => key.startsWith('f:drv')),
                },
            },
            aplAddress: `${res.hbs.addrBook.driver}/application/`,
            unscoped,
            stepLen: Application.list.step.length,
            sessionUser: {
                _id: sessionUser._id,
                DS: sessionUser.DS,
            },
        })
    } catch (err) {
        sendError.server(req, res, err)
    }
}