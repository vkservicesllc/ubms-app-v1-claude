require('dotenv').config({ path: '../../.env' })
const {
    SITE__APP_NAME: appName,
    SITE__DEV_USER: initUser,
    SITE__DEV_PASS: initPass,
    SITE__DEV_FNAME: initFname,
    SITE__DEV_LNAME: initLname,
    SITE__DEV_ALIAS: initAlias,
    SITE__DEV_EMAIL: initEmail,
    DB__MYSQL_AES_SESSION_TOKEN: tokenSecret,
} = process.env

/* Registry */
import inputLength from '../../../client/global/modules/registry/length.mjs'

/* Settings */
import config, { addrBook, userApps } from '../../../config.mjs'
import db from '../../settings/mysql.mjs'

/* Tools */
import Team, { query as teamQuery } from './team.mjs'
import Company, { query as companyQuery } from './company.mjs'
import Carrier, { query as carrierQuery } from './carrier.mjs'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'
import recognizeApi from '../utils/api.mjs'
import transporter, { sender } from '../utils/nodemailer.mjs'
import { generateRandomString } from '../utils/string.mjs'
import { processData, logDeletion } from '../utils/database.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import { numeric } from '../../../client/global/modules/tools/utils/number.mjs'
import { stringifyBuffer } from '../../../client/global/modules/tools/utils/buffer.mjs'
import { sortArrayByObjectKey } from '../../../client/global/modules/tools/utils/sorter.mjs'
import { tel as formatTel } from '../../../client/global/modules/tools/utils/formatter.mjs'

const { validationResult } = require('express-validator')
const mysql = require('../utils/mysql')
const throwErr = require('../utils/error')


const query = {
    main: new Query(db.online, 'users'),
    registration: new Query(db.online, 'user_registration'),
    passReset: new Query(db.online, 'user_passreset'),
    roles: new Query(db.online, 'user_roles'),
    tokens: new Query(db.online, 'tokens'),
    sessions: new Query(db.online, 'sessions'),
    jx: {
        roles: new Query(db.online, 'user_role_map'),
        teams: new Query(db.online, 'user_team_map'),
        companies: new Query(db.business, 'user_company_map'),
    },
}


class User extends Person {
    constructor(data, options = {}) {
        if (!data?._id) throw new Error('Invalid User Data')

        super(data)

        let { single, login, hideRawId, hideSensitive } = options
        if (single === undefined || typeof single !== 'boolean') single = true
        if (login === undefined || typeof login !== 'boolean') login = false
        if (hideRawId === undefined || typeof hideRawId !== 'boolean') hideRawId = false
        if (hideSensitive === undefined || typeof hideSensitive !== 'boolean') hideSensitive = true

        const props = { _id: data._id, _simpleId: data._simpleId }
        if (!hideRawId) props.id = data.id

        if (single) {

            this.fetch = async (target, params = {}) => {
                let { mode } = params
                if (!['ids', 'assign'].includes(mode)) mode = 'applied'

                let batch
                const match = { userId: this.id || User.matchIdHash(this._id) }

                switch (target) {

                    case 'roles':
                        batch = [
                            {
                                table: query.jx.roles.table,
                                match,
                            },
                            {
                                table: query.roles.table,
                                join: [ 'id', 'roleId' ],
                            },
                        ]
                        break

                    case 'teams':
                        batch = [
                            {
                                table: query.jx.teams.table,
                                match,
                            },
                            {
                                table: query.teams.table,
                                join: [ 'id', 'teamId' ],
                            },
                        ]
                        break

                    case 'companies':
                    case 'carriers':
                        batch = [
                            {
                                table: query.jx.companies.table,
                                match,
                            },
                            {
                                table: companyQuery.main.table,
                                join: [ 'id', 'companyId' ],
                            },
                        ]
                        break
                }
            }

        }
    }


    static #algorithm = 'SHA-512'
    static hashId = (field = 'id') => hash(field, User.#algorithm)
    static hashSimpleId = (field = 'id') => hash(field)
    static matchIdHash = value => matchHash(value, User.#algorithm)
    static matchSimpleIdHash = value => matchHash(value)
}