import Query, { matchHash } from "./server/tools/utils/query.mjs"

console.log(Query.select('db_name', [
    {
        table: 'table1',
        fields: 'id',
        match: { id: matchHash('abc123', 'SHA-224') },
    },
]))