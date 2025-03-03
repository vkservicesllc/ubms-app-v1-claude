import Query from "./server/tools/query.mjs"



const db = 'online'
const table = 'users'

const fields = [ 'id', 'username' ]

console.log(Query.select(db, { table, fields }))