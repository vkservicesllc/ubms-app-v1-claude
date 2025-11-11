import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import Individual from './individual.mjs'



class Student extends Individual {
    static #algorithm = 'SHA-224'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Student Data')
    }

    static hashId = (field = 'id') => hash(field, Student.#algorithm)
    static matchIdHash = value => matchHash(value, Student.#algorithm)
}



class Application {
    static #algorithm = 'SHA-256'

    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Application Data')
    }

    static hashId = (field = 'id') => hash(field, Application.#algorithm)
    static matchIdHash = value => matchHash(value, Application.#algorithm)
}



class StudentUser {}



export default Student
export { Application, StudentUser }