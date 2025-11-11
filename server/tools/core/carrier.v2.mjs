import Query, { hash, matchHash } from '../utils/query.mjs'
import db from '../../settings/mysql.mjs'

import Company from './company.mjs'



class Carrier extends Company {}


export default Carrier