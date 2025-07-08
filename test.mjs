import Query from "./server/tools/utils/query.mjs"
import db from './server/settings/mysql.mjs'

const match = { id: 1 }

const batch = [
    {
        table: 'applications',
        fields: ['id', 'driverId'],
        match,
    },
        {
            table: 'driver',
            fields: 'personId',
            join: [ 'id', 'driverId' ],
        },
            {
                db: db.person,
                table: 'individuals',
                fields: [ 'dob', 'sex', { aes: [ 'ssn', '123' ] } ],
                join: [ 'id', 'personId', 1 ],
            },
                {
                    db: db.person,
                    table: 'names',
                    fields: [ 'firstName', 'middleName', 'lastName', 'suffix' ],
                    join: [ 'personId', 'id', {
                        table: 'individuals',
                        max: [ 'since', {
                            lessEq: [ { date: 'createdAt' }, 'applications' ],
                        } ],
                    } ],
                },
                {
                    db: db.person,
                    table: 'maritals',
                    fields: [ [ 'status', 'marital' ] ],
                    join: [ 'personId', 'id', {
                        table: 'individuals',
                        max: [ 'since', {
                            lessEq: [ { date: 'createdAt' }, 'applications' ],
                        } ],
                    } ]
                },
]


console.log(Query.select(db.carrier, batch))