const { DB__MYSQL_HOST: host, DB__MYSQL_USER: user, DB__MYSQL_PASS: password } = Bun.env;

const mysql = require('mysql2/promise');

module.exports = mysql.createPool({
    host,
    user,
    password,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 50,
    dateStrings: true,
    typeCast: function (field, next) {
        if (field.type === 'DATE') return field.string() || '0000-00-00';

        return next();
    },
});
