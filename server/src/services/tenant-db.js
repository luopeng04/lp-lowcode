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

async function seedTenantData(tenantId, dbName, phone, passwordHash, industryCode = 'general') {
  const { getTenantPool } = require('../config/database')
  const templates = require('../config/industry-templates')
  const pool = getTenantPool(dbName)

  // Default warehouse
  await pool.query(
    'INSERT INTO warehouses (code, name, address, is_default) VALUES (?, ?, ?, 1)',
    ['DEFAULT', '默认仓库', '']
  )

  // Admin operator
  await pool.query(
    'INSERT INTO operators (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)',
    [phone, passwordHash, '管理员', 'admin']
  )

  // Default menu items
  const menus = [
    { path: '/', label: '首页' },
    { path: '/warehouses', label: '仓库管理' },
    { path: '/suppliers', label: '供应商管理' },
    { path: '/customers', label: '客户管理' },
    { path: '/products', label: '商品管理' },
    { path: '/purchase-orders', label: '采购单' },
    { path: '/sales-orders', label: '销售单' },
    { path: '/inventory', label: '库存查询' },
    { path: '/inventory-ledger', label: '库存流水' },
    { path: '/reports', label: '经营报表' },
    { path: '/operators', label: '操作员管理' },
    { path: '/menu-settings', label: '菜单设置' },
  ]
  for (const m of menus) {
    await pool.query(
      'INSERT INTO menu_settings (menu_path, menu_label, visible) VALUES (?, ?, 1)',
      [m.path, m.label]
    )
  }

  // Apply industry template
  const template = templates[industryCode] || templates.general
  if (template.categories.length > 0) {
    for (const name of template.categories) {
      await pool.query('INSERT INTO categories (name, display_order) VALUES (?, ?)', [name, 0])
    }
  }
  if (template.customFields.length > 0) {
    for (const f of template.customFields) {
      await pool.query(
        'INSERT INTO custom_fields (entity, field_name, field_label, field_type, options) VALUES (?, ?, ?, ?, ?)',
        [f.entity, f.field_name, f.field_label, f.field_type, f.options ? JSON.stringify(f.options) : null]
      )
    }
  }
  for (const path of template.hideMenus) {
    await pool.query('UPDATE menu_settings SET visible = 0 WHERE menu_path = ?', [path])
  }

  return { tenantId, dbName, industry: { code: industryCode, name: template.name } }
}

module.exports = { createTenantDatabase, seedTenantData }
