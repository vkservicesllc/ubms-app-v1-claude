/* Settings */
import db from '../../settings/mysql.mjs'

/* Assests */
import Individual from './individual.mjs'

/* Tools */
import { reSuper } from '../../client/global/modules/tools/utils/object.mjs'
import Query, { hash, matchHash } from '../tools/utils/query.mjs'

const mysql = require('../tools/utils/mysql')



class Student extends Individual {
    constructor(data = {}, light = false) {}
}



class Application {
    constructor(data = {}, light = false) {}
}



class StudentUser {
    constructor() {}

    static login = () => {}

    static session = () => {}

    static logout = () => {}

}



export default Student
export { Application, StudentUser }