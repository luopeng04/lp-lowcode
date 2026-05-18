const { Router } = require('express')
const { getTenantPool } = require('../config/database')
const { validateId, writeGuard } = require('../utils')

const router = Router()

router.use((req, res, next) => {
  if (!req.tenant) return res.status(400).json({ error: '未提供租户标识' })
  next()
})

writeGuard(router)

// GET /api/warehouses
router.get('/api/warehouses', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { search } = req.query
  let sql = 'SELECT * FROM warehouses WHERE status = 1'
  const params = []
  if (search) {
    sql += ' AND (name LIKE ? OR code LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  sql += ' ORDER BY is_default DESC, id ASC'
  const [rows] = await pool.query(sql, params)
  res.json({ data: rows })
})

// POST /api/warehouses
router.post('/api/warehouses', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { code, name, contact, address } = req.body

  if (!code || !name) {
    return res.status(400).json({ error: '编码和名称不能为空' })
  }

  // Check duplicate code
  const [dup] = await pool.query('SELECT id FROM warehouses WHERE code = ?', [code])
  if (dup.length > 0) {
    return res.status(409).json({ error: '仓库编码已存在' })
  }

  const [result] = await pool.query(
    'INSERT INTO warehouses (code, name, contact, address) VALUES (?, ?, ?, ?)',
    [code, name, contact || '', address || '']
  )
  res.status(201).json({ id: result.insertId })
})

// PUT /api/warehouses/:id
router.put('/api/warehouses/:id', async (req, res) => {
  const id = validateId(req.params.id)
  if (!id) return res.status(400).json({ error: '参数错误' })

  const pool = getTenantPool(req.tenant.db_name)
  const { name, contact, address, isDefault } = req.body

  const [existing] = await pool.query('SELECT id FROM warehouses WHERE id = ? AND status = 1', [id])
  if (existing.length === 0) {
    return res.status(404).json({ error: '仓库不存在' })
  }

  const updates = {}
  if (name !== undefined) updates.name = name
  if (contact !== undefined) updates.contact = contact
  if (address !== undefined) updates.address = address

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    if (Object.keys(updates).length > 0) {
      await conn.query('UPDATE warehouses SET ? WHERE id = ?', [updates, id])
    }

    if (isDefault) {
      await conn.query('UPDATE warehouses SET is_default = 0')
      await conn.query('UPDATE warehouses SET is_default = 1 WHERE id = ?', [id])
    }

    await conn.commit()
    res.json({ ok: true })
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
})

// DELETE /api/warehouses/:id (soft delete)
router.delete('/api/warehouses/:id', async (req, res) => {
  const id = validateId(req.params.id)
  if (!id) return res.status(400).json({ error: '参数错误' })

  const pool = getTenantPool(req.tenant.db_name)

  const [existing] = await pool.query(
    'SELECT id, is_default FROM warehouses WHERE id = ? AND status = 1',
    [id]
  )
  if (existing.length === 0) {
    return res.status(404).json({ error: '仓库不存在' })
  }
  if (existing[0].is_default) {
    return res.status(400).json({ error: '默认仓库不能删除' })
  }

  await pool.query('UPDATE warehouses SET status = 0 WHERE id = ?', [id])
  res.json({ ok: true })
})

module.exports = router
