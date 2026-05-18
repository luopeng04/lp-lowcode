const mysql = require('mysql2/promise')
require('dotenv').config()

const poolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
}

const platformPool = mysql.createPool({
  ...poolConfig,
  database: process.env.DB_PLATFORM,
})

const tenantPools = new Map()

function getTenantPool(database) {
  if (!tenantPools.has(database)) {
    tenantPools.set(database, mysql.createPool({
      ...poolConfig,
      database,
    }))
  }
  return tenantPools.get(database)
}

function getPlatformPool() {
  return platformPool
}

module.exports = { getPlatformPool, getTenantPool }
