import Query from './server/tools/utils/query.mjs'


const batch = [
    {
        table: 'applications',
        fields: 'id',
    },
    {
        db: 'app_person',
        table: 'names',
        join: [
            'personId', 'personId', {
                asOfMax: ['since', ['finishedAt', 'createdAt']],
            },
        ],
    },
]

console.log(Query.select('app_carrier', batch))