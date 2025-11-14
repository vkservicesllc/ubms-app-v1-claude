/* Settings */
import db from '../../settings/mysql.mjs'

/* Tools */
import Individual from './individual.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'
import Query, { hash, matchHash } from '../utils/query.mjs'

const mysql = require('../utils/mysql')



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