import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import Individual from './individual.mjs'

import defProp from '../utils/data.mjs'
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'



class Student extends Individual {
    static #algorithm = 'SHA-224'

    static #batch = (session = {}, filter = {}) => {}


    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Student Data')

        options.single = defProp(options.single, true, 'boolean')
        options.hideRawId = defProp(options.hideRawId, false, 'boolean')
        options.hideSensitive = defProp(options.hideSensitive, true, 'boolean')
        super(data, options)

        const { single, hideRawId } = options

        const props = { _id: data._id, _personId: data._personId }
        if (!hideRawId) {
            props.id = data.id
            props.personId = data.personId
        }

        const props2 = {} //! add student's secondary properties

        reSuper(this, props, props2)

        if (single) {}
    }

    static hashId = (field = 'id') => hash(field, Student.#algorithm)
    static matchIdHash = value => matchHash(value, Student.#algorithm)


    static create = (session, data) => {}


    static fetch = (session, filter) => {}


}



class Application {
    static #algorithm = 'SHA-256'

    static #batch = (session = {}, filter = {}) => {}


    constructor(data = {}, options = {}) {
        if (!data?._id) throw new Error('Invalid Application Data')

        let { single, hideRawId } = options
        single = defProp(single, true, 'boolean')
        hideRawId = defProp(hideRawId, false, 'boolean')

        //! ...
    }

    static hashId = (field = 'id') => hash(field, Application.#algorithm)
    static matchIdHash = value => matchHash(value, Application.#algorithm)


    static create = (session, data) => {}


    static fetch = (session, filter) => {}


}



class StudentUser {}



export default Student
export { Application, StudentUser }