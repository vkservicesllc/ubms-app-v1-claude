/* Settings */
import db from '../settings/mysql.mjs'

/* Tools */
import Query, { hash, matchHash } from '../tools/query.mjs'

const { validationResult } = require('express-validator')
const mysql = require('../tools/mysql')
const throwErr = require('../tools/error')



class Team {
    constructor(data = {}, light = false) {}


    static #algorithm = 'MD5'

    static hashId = (field = 'id') => hash(field, Team.#algorithm)

    static matchIdHash = value => matchHash(value, Team.#algorithm)


}



export default Team