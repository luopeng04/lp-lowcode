const { Router } = require('express')
const { getTenantPool } = require('../config/database')
const { requireRole } = require('../middleware/operator')

const router = Router()

router.use((req, res, next) => {
  if (!req.tenant) return res.status(400).json({ error: '未提供租户标识' })
  next()
})

router.get('/api/menu-settings', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const [rows] = await pool.query('SELECT * FROM menu_settings ORDER BY id')
  res.json({ data: rows })
})

router.put('/api/menu-settings', requireRole('admin'), async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { menu_path, visible } = req.body
  if (!menu_path) return res.status(400).json({ error: '参数错误' })
  await pool.query('UPDATE menu_settings SET visible = ? WHERE menu_path = ?', [
    visible ? 1 : 0,
    menu_path,
  ])
  res.json({ ok: true })
})

module.exports = router
