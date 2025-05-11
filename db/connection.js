const mysql = require('mysql2/promise');

async function getConnection() {
    return await mysql.createConnection({
      socketPath: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
}

module.exports = { getConnection };