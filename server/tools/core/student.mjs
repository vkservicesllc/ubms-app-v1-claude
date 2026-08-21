/* Settings */
import db from '../../settings/mysql.mjs';

/* Tools */
import Individual from './individual.mjs';
import { reSuper } from '../../../client/global/modules/tools/utils/object.mjs';
import Query, { hash, matchHash } from '../utils/query.mjs';

const mysql = require('../utils/mysql');

class Student extends Individual {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Student Data');
    }
}

class Application {
    constructor(data = {}, { single = true, session, hideRawId = false, hideSensitive = true }) {
        if (!data?._id) throw new Error('Constructor Error: Invalid Student Application Data');
    }
}

class StudentUser {
    static mw = {
        login: async (req, res) => {},

        session: async (req, res) => {},

        verify: async (req, res, next) => {},

        logout: (req, res) => {
            if (req.session.user) delete req.session.user;
            if (res.session.user) delete res.session.user;

            return req.session.destroy((err) => {
                if (err) return res.status(500).send('Failed to log out');

                res.redirect('/');
            });
        },
    };
}

export default Student;
export { Application, StudentUser };
