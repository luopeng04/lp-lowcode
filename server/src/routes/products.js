const { Router } = require('express')
const { getTenantPool } = require('../config/database')
const { requireRole } = require('../middleware/operator')

const router = Router()

router.use((req, res, next) => {
  if (!req.tenant) return res.status(400).json({ error: '未提供租户标识' })
  next()
})

const writeGuard = requireRole('admin', 'operator')
router.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) return writeGuard(req, res, next)
  next()
})

// GET /api/products
router.get('/api/products', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { search, category, page = 1, pageSize = 20 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(pageSize)

  let sql = 'SELECT * FROM products WHERE status = 1'
  const params = []
  if (search) {
    sql += ' AND (name LIKE ? OR code LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  if (category) {
    sql += ' AND category = ?'
    params.push(category)
  }
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)

  const [rows] = await pool.query(sql, params)

  let countSql = 'SELECT COUNT(*) as total FROM products WHERE status = 1'
  const countParams = []
  if (search) {
    countSql += ' AND (name LIKE ? OR code LIKE ?)'
    countParams.push(`%${search}%`, `%${search}%`)
  }
  if (category) {
    countSql += ' AND category = ?'
    countParams.push(category)
  }
  const [[{ total }]] = await pool.query(countSql, countParams)

  // Parse custom_data JSON
  const data = rows.map(r => ({
    ...r,
    custom_data: r.custom_data ? (typeof r.custom_data === 'string' ? JSON.parse(r.custom_data) : r.custom_data) : {},
  }))

  res.json({ data, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

// POST /api/products
router.post('/api/products', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { code, name, spec, unit, category, cost_price, sale_price, custom_data } = req.body
  if (!code || !name) return res.status(400).json({ error: '编码和名称不能为空' })

  const [dup] = await pool.query('SELECT id FROM products WHERE code = ?', [code])
  if (dup.length > 0) return res.status(409).json({ error: '商品编码已存在' })

  const [result] = await pool.query(
    'INSERT INTO products (code, name, spec, unit, category, cost_price, sale_price, custom_data) VALUES (?,?,?,?,?,?,?,?)',
    [code, name, spec || '', unit || '个', category || '', cost_price || 0, sale_price || 0,
      custom_data ? JSON.stringify(custom_data) : null]
  )
  res.status(201).json({ id: result.insertId })
})

// PUT /api/products/:id
router.put('/api/products/:id', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ error: '参数错误' })

  const { name, spec, unit, category, cost_price, sale_price, custom_data } = req.body
  const [existing] = await pool.query('SELECT id FROM products WHERE id = ? AND status = 1', [id])
  if (existing.length === 0) return res.status(404).json({ error: '商品不存在' })

  const updates = {}
  if (name !== undefined) updates.name = name
  if (spec !== undefined) updates.spec = spec
  if (unit !== undefined) updates.unit = unit
  if (category !== undefined) updates.category = category
  if (cost_price !== undefined) updates.cost_price = cost_price
  if (sale_price !== undefined) updates.sale_price = sale_price
  if (custom_data !== undefined) updates.custom_data = JSON.stringify(custom_data)

  if (Object.keys(updates).length > 0) {
    await pool.query('UPDATE products SET ? WHERE id = ?', [updates, id])
  }
  res.json({ ok: true })
})

// DELETE /api/products/:id
router.delete('/api/products/:id', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ error: '参数错误' })

  const [existing] = await pool.query('SELECT id FROM products WHERE id = ? AND status = 1', [id])
  if (existing.length === 0) return res.status(404).json({ error: '商品不存在' })

  await pool.query('UPDATE products SET status = 0 WHERE id = ?', [id])
  res.json({ ok: true })
})

// GET /api/categories
router.get('/api/categories', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY display_order')
  // Also include distinct categories from products table
  const [cats] = await pool.query('SELECT DISTINCT category FROM products WHERE status = 1 AND category != ""')
  const fromProducts = cats.map(c => ({ id: null, name: c.category }))
  res.json({ data: rows, fromProducts })
})

// POST /api/categories
router.post('/api/categories', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { name } = req.body
  if (!name) return res.status(400).json({ error: '分类名称不能为空' })
  const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name])
  res.status(201).json({ id: result.insertId })
})

// GET /api/custom-fields
router.get('/api/custom-fields', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const [rows] = await pool.query(
    'SELECT * FROM custom_fields WHERE entity = ? ORDER BY display_order',
    [req.query.entity || 'product']
  )
  res.json({ data: rows })
})

// POST /api/custom-fields
router.post('/api/custom-fields', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { entity = 'product', field_name, field_label, field_type, options, is_required } = req.body
  if (!field_name || !field_label) return res.status(400).json({ error: '字段名和标签不能为空' })

  const [dup] = await pool.query(
    'SELECT id FROM custom_fields WHERE entity = ? AND field_name = ?',
    [entity, field_name]
  )
  if (dup.length > 0) return res.status(409).json({ error: '字段名已存在' })

  const [result] = await pool.query(
    'INSERT INTO custom_fields (entity, field_name, field_label, field_type, options, is_required) VALUES (?,?,?,?,?,?)',
    [entity, field_name, field_label, field_type || 'text', options ? JSON.stringify(options) : null, is_required ? 1 : 0]
  )
  res.status(201).json({ id: result.insertId })
})

// DELETE /api/custom-fields/:id
router.delete('/api/custom-fields/:id', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ error: '参数错误' })

  await pool.query('DELETE FROM custom_fields WHERE id = ?', [id])
  res.json({ ok: true })
})

module.exports = router
