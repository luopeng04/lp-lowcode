const { Router } = require('express')
const { getTenantPool } = require('../config/database')

const router = Router()

// Health check
router.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// Get current tenant info
router.get('/api/tenant', (req, res) => {
  if (!req.tenant) {
    return res.status(400).json({ error: '未提供租户标识' })
  }
  res.json({ tenant: req.tenant })
})

// Example: query products for current tenant
router.get('/api/products', async (req, res) => {
  if (!req.tenant) {
    return res.status(400).json({ error: '未提供租户标识' })
  }

  const pool = getTenantPool(req.tenant.db_name)
  const [rows] = await pool.query('SELECT * FROM products LIMIT 50')
  res.json({ data: rows })
})

module.exports = router
