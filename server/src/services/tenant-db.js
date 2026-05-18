const mysql = require('mysql2/promise')
const { getPlatformPool } = require('../config/database')

async function createTenantDatabase(dbName) {
  const pool = getPlatformPool()

  await pool.query(`CREATE DATABASE \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)

  // Copy table structure from template
  const [tables] = await pool.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?', ['lp_tenant_template'])

  const tenantPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
    charset: 'utf8mb4',
  })

  for (const { TABLE_NAME } of tables) {
    await tenantPool.query(`CREATE TABLE \`${TABLE_NAME}\` LIKE lp_tenant_template.\`${TABLE_NAME}\``)
  }

  await tenantPool.end()
}

async function seedTenantData(tenantId, dbName, phone, passwordHash) {
  const { getTenantPool } = require('../config/database')
  const pool = getTenantPool(dbName)

  // Default warehouse
  await pool.query(
    'INSERT INTO warehouses (code, name, address) VALUES (?, ?, ?)',
    ['DEFAULT', '默认仓库', '']
  )

  // Admin operator
  await pool.query(
    'INSERT INTO operators (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)',
    [phone, passwordHash, '管理员', 'admin']
  )

  return { tenantId, dbName }
}

module.exports = { createTenantDatabase, seedTenantData }
