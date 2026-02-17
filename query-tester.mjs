import Query from "./server/tools/utils/query.mjs"


console.log(Query.select('db1', [
    {
        table: 'table1',
        fields: [ 'field1', 'field2' ],
        match: { field1: 5 },
    },
    {
        table: ['table2', 'asTable2'],
        fields: 'field1',
        jojn: [ 'field1', 'field2' ],
        match: { field1: 'seven' },
    }
]))