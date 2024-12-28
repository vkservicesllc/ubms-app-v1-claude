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
import inputLength from '../../client/global/modules/registry/length.mjs'
import patterns from '../../client/global/modules/registry/patterns.mjs'

/* Settings */
import db from '../settings/mysql.mjs'

/* Assets */
import Person from '../../client/global/modules/assets/person.mjs'

/* Tools */
import { reSuper } from '../../client/global/modules/tools/object.mjs'
import { stringifyBuffer } from '../../client/global/modules/tools/buffer.mjs'
import Query, { hash, matchHash } from '../tools/query.mjs'
import recognizeApi from '../tools/api.mjs'
import transporter, { sender } from '../tools/nodemailer.mjs'
import { generateRandomString } from '../tools/string.mjs'
import { processData } from '../tools/database.mjs'

const { validationResult } = require('express-validator')
const mysql = require('../tools/mysql')
const throwErr = require('../tools/error')


const query = {
    users: new Query(db.online, 'users'),
    tokens: new Query(db.online, 'tokens'),
    sessions: new Query(db.online, 'sessions'),
    registration: new Query(db.online, 'user_registration'),
    passReset: new Query(db.online, 'user_passreset'),
}


class User extends Person {
    constructor(data = {}, light = false) {}


    id = async () => (await mysql.execute(query.users.select('id', {
        match: { id: User.matchIdHash(this._id) },
    })))[0][0].id


    static #algorithm = 'SHA-512'

    static conditionList = {
        'A': 'Active',
        'I': 'Inactive',
        'L': 'Locked',
    }

    static locationList = {
        'US': 'USA',
        'MX': 'Mexico',
        'UA': 'Ukraine',
    }

    static statusList = {
        'U': 'User',
        'A': 'Admin',
        'S': 'Super Admin',
        'D': 'Developer',
    }


    static hashId = (field = 'id') => hash(field, User.#algorithm)

    static matchIdHash = value => matchHash(value, User.#algorithm)


    static login = async (req, res) => {}
    static session = async (req, res) => {}
    static logout = async (req, res) => {}


}


delete User.prefixList
delete User.suffixList
delete User.genderList
delete User.formSelect


export default User