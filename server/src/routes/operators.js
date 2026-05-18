const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { getTenantPool } = require('../config/database')
const { requireRole } = require('../middleware/operator')

const router = Router()

router.use((req, res, next) => {
  if (!req.tenant) return res.status(400).json({ error: '未提供租户标识' })
  next()
})

// All operator management routes require admin
router.use('/api/operators', requireRole('admin'))

// GET /api/operators
router.get('/api/operators', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const [rows] = await pool.query(
    'SELECT id, username, display_name, role, status, created_at FROM operators ORDER BY id'
  )
  res.json({ data: rows })
})

// POST /api/operators
router.post('/api/operators', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { username, display_name, password, role } = req.body

  if (!username || !display_name || !password) {
    return res.status(400).json({ error: '用户名、显示名称和密码不能为空' })
  }
  if (!['admin', 'operator', 'readonly'].includes(role)) {
    return res.status(400).json({ error: '无效的角色' })
  }

  const [dup] = await pool.query('SELECT id FROM operators WHERE username = ?', [username])
  if (dup.length > 0) return res.status(409).json({ error: '用户名已存在' })

  const passwordHash = await bcrypt.hash(password, 10)
  const [result] = await pool.query(
    'INSERT INTO operators (username, display_name, password_hash, role) VALUES (?,?,?,?)',
    [username, display_name, passwordHash, role]
  )
  res.status(201).json({ id: result.insertId })
})

// PUT /api/operators/:id (disable/enable)
router.put('/api/operators/:id', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ error: '参数错误' })

  const { status, display_name, role } = req.body

  const [existing] = await pool.query('SELECT id FROM operators WHERE id = ?', [id])
  if (existing.length === 0) return res.status(404).json({ error: '操作员不存在' })

  const updates = {}
  if (status !== undefined) updates.status = status
  if (display_name !== undefined) updates.display_name = display_name
  if (role !== undefined) {
    if (!['admin', 'operator', 'readonly'].includes(role)) {
      return res.status(400).json({ error: '无效的角色' })
    }
    updates.role = role
  }

  if (Object.keys(updates).length > 0) {
    await pool.query('UPDATE operators SET ? WHERE id = ?', [updates, id])
  }
  res.json({ ok: true })
})

// PUT /api/operators/:id/reset-password
router.put('/api/operators/:id/reset-password', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ error: '参数错误' })

  const { password } = req.body
  if (!password || password.length < 6) {
    return res.status(400).json({ error: '密码至少6位' })
  }

  const [existing] = await pool.query('SELECT id FROM operators WHERE id = ?', [id])
  if (existing.length === 0) return res.status(404).json({ error: '操作员不存在' })

  const passwordHash = await bcrypt.hash(password, 10)
  await pool.query('UPDATE operators SET password_hash = ? WHERE id = ?', [passwordHash, id])
  res.json({ ok: true })
})

module.exports = router
