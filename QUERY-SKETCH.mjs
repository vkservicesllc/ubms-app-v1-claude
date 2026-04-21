import Query from './server/tools/utils/query.mjs'


let join

//* CURRENT
join = [
    'personId', 'id', {
        table: query.person.main.table,
        max: 'since',
    },
]

//* DATE BASED
join = [
    'personId', 'id', {
        table: query.person.main.table,
        asOfMax: [
            'since',
            [ 'finishedAt', 'createdAt' ],
        ],
    },
]