const {
    DB__MYSQL_HOST: host,
    DB__MYSQL_USER: user,
    DB__MYSQL_PASS: password,
} = Bun.env


const knex = require('knex')({
    client: 'mysql2',
    connection: { host, user, password, dateStrings: true },
})

module.exports = knex