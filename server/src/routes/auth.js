const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { getPlatformPool } = require('../config/database')
const { createTenantDatabase, seedTenantData } = require('../services/tenant-db')

const router = Router()

// POST /api/auth/register
router.post('/api/auth/register', async (req, res) => {
  try {
    const { phone, password, name } = req.body

    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码不能为空' })
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少6位' })
    }

    const platform = getPlatformPool()

    // Check if phone already registered
    const [existing] = await platform.query('SELECT id FROM tenants WHERE phone = ?', [phone])
    if (existing.length > 0) {
      return res.status(409).json({ error: '该手机号已注册' })
    }

    const dbName = `lp_tenant_${phone}`
    const passwordHash = await bcrypt.hash(password, 10)
    const tenantName = name || `商户_${phone}`

    // Insert tenant record
    const [result] = await platform.query(
      'INSERT INTO tenants (name, db_name, phone) VALUES (?, ?, ?)',
      [tenantName, dbName, phone]
    )
    const tenantId = result.insertId

    // Create database + seed data
    await createTenantDatabase(dbName)
    await seedTenantData(tenantId, dbName, phone, passwordHash)

    res.status(201).json({
      tenant: {
        id: tenantId,
        name: tenantName,
        phone,
        dbName,
      },
    })
  } catch (err) {
    console.error('[register]', err)
    res.status(500).json({ error: '注册失败，请稍后重试' })
  }
})

// POST /api/auth/login
router.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码不能为空' })
    }

    const platform = getPlatformPool()
    const [rows] = await platform.query(
      'SELECT id, name, db_name, phone, status FROM tenants WHERE phone = ?',
      [phone]
    )

    if (rows.length === 0) {
      return res.status(401).json({ error: '手机号未注册' })
    }

    const tenant = rows[0]

    if (tenant.status !== 1) {
      return res.status(403).json({ error: '商户已被停用' })
    }

    // Verify password against tenant DB's operator table
    const { getTenantPool } = require('../config/database')
    const tenantPool = getTenantPool(tenant.db_name)
    const [operators] = await tenantPool.query(
      'SELECT id, username, password_hash, display_name, role FROM operators WHERE username = ? AND role = ?',
      [phone, 'admin']
    )

    if (operators.length === 0) {
      return res.status(401).json({ error: '账号或密码错误' })
    }

    const operator = operators[0]
    const valid = await bcrypt.compare(password, operator.password_hash)
    if (!valid) {
      return res.status(401).json({ error: '账号或密码错误' })
    }

    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        dbName: tenant.db_name,
        phone: tenant.phone,
      },
      operator: {
        id: operator.id,
        username: operator.username,
        displayName: operator.display_name,
        role: operator.role,
      },
    })
  } catch (err) {
    console.error('[login]', err)
    res.status(500).json({ error: '登录失败，请稍后重试' })
  }
})

module.exports = router
