import Query from "./server/tools/utils/query.mjs"


const batch = [
    {
        table: 'table',
        fields: '*',
        match: {
            id: {
                sha2: ['123abc', '321xyz', null],
            },
        },
    }
]

console.log(Query.select('db', batch))