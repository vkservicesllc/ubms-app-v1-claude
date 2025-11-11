import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import Individual from './individual.mjs'

import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs'



class Student extends Individual {
    static #algorithm = 'SHA-224'

    static #batch = ({ user: sessionUser = {} }, filter = {}) => {}


    constructor(data = {}, { single = true, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Student Data')

        super(data, { single, hideRawId, hideSensitive })

        const props = { _id: data._id, _personId: data._personId }
        if (!hideRawId) {
            props.id = data.id
            props.personId = data.personId
        }

        const props2 = {} //! add student's secondary properties

        reSuper(this, props, props2)

        if (single) {

            this.log = () => {}


            this.add = ({ user: sessionUser = {} }, { target, data = [] } = {}) => {
                if (!target) throw new Error('Instance Add Error: Target not supplied')

                let added = false, error

                //* ...

                return { added, error }
            }


            this.fetch = ({ user: sessionUser = {} }, { target, filter = {} } = {}) => {
                if (!target) throw new Error('Instance Fetch Error: Target not supplied')

                let data = [], error

                //* ...

                return { data, error }
            }


            this.update = ({ user: sessionUser = {} }, { target, data = [], ids = [] }) => {
                let updated = false, error

                if (!target) {
                    //* Update main
                } else {
                    //* Update relationships
                }

                //* ...

                return { updated, error }
            }


            this.delete = ({ user: sessionUser = {} }, { target, ids = [] }) => {
                let deleted = false, error

                if (!target) {
                    //* Delete main
                } else {
                    //* Delete relationships
                }

                //* ...

                return { deleted, error }
            }


        }
    }

    static hashId = (field = 'id') => hash(field, Student.#algorithm)
    static matchIdHash = value => matchHash(value, Student.#algorithm)


    static create = ({ user: sessionUser = {} }, data = {}) => {
        let created = false, error

        //* ...

        return { created, error }
    }


    static fetch = ({ user: sessionUser = {} } = {}, filter = {}) => {
        const batch = Role.#batch({ user: sessionUser }, filter)

        //* ...
    }


}



class Application {
    static #algorithm = 'SHA-256'

    static #batch = ({ user: sessionUser = {} }, filter = {}) => {}


    constructor(data = {}, { single = true, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Application Data')
    }

    static hashId = (field = 'id') => hash(field, Application.#algorithm)
    static matchIdHash = value => matchHash(value, Application.#algorithm)


    static create = ({ user: sessionUser = {} }, data = {}) => {
        let created = false, error

        //* ...

        return { created, error }
    }


    static fetch = ({ user: sessionUser = {} } = {}, filter = {}) => {
        const batch = Role.#batch({ user: sessionUser }, filter)

        //* ...
    }


}



class StudentUser {}



export default Student
export { Application, StudentUser }