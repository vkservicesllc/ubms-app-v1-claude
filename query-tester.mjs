import Query from './server/tools/utils/query.mjs'

// console.log(Query.select('app_business', [
//     {
//         table: 'companies',
//         fields: 'id',
//     },
//     {
//         table: 'company_phones',
//         fields: 'phone',
//         join: [ 'companyId', 'id', {
//             max: 'since',
//         } ],
//     }
// ]))

const branch = 'admin'
let siteId


console.log(Query.select('app_online', [
    {
        table: 'users',
        fields: 'id',
    },
    {
        table: 'sessions',
        fields: 'lastLogin',
        join: [ 'userId', 'id', {
            max: [ 'lastLogin', { branch, siteId } ],
        } ],
    }
]))