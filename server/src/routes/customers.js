const { Router } = require('express')
const { getTenantPool } = require('../config/database')

const router = Router()

function validateId(id) {
  const n = parseInt(id, 10)
  if (isNaN(n) || n < 1) return null
  return n
}

router.use((req, res, next) => {
  if (!req.tenant) return res.status(400).json({ error: '未提供租户标识' })
  next()
})

router.get('/api/customers', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { search, page = 1, pageSize = 20 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(pageSize)

  let sql = 'SELECT * FROM customers WHERE status = 1'
  const params = []
  if (search) {
    sql += ' AND (name LIKE ? OR code LIKE ? OR contact LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)

  const [rows] = await pool.query(sql, params)
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) as total FROM customers WHERE status = 1' +
    (search ? ' AND (name LIKE ? OR code LIKE ? OR contact LIKE ?)' : ''),
    search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []
  )
  res.json({ data: rows, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.post('/api/customers', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { code, name, contact, phone, address, remark } = req.body
  if (!code || !name) return res.status(400).json({ error: '编码和名称不能为空' })

  const [dup] = await pool.query('SELECT id FROM customers WHERE code = ?', [code])
  if (dup.length > 0) return res.status(409).json({ error: '编码已存在' })

  const [result] = await pool.query(
    'INSERT INTO customers (code, name, contact, phone, address, remark) VALUES (?,?,?,?,?,?)',
    [code, name, contact || '', phone || '', address || '', remark || '']
  )
  res.status(201).json({ id: result.insertId })
})

router.put('/api/customers/:id', async (req, res) => {
  const id = validateId(req.params.id)
  if (!id) return res.status(400).json({ error: '参数错误' })

  const pool = getTenantPool(req.tenant.db_name)
  const { name, contact, phone, address, remark } = req.body
  const [existing] = await pool.query('SELECT id FROM customers WHERE id = ? AND status = 1', [id])
  if (existing.length === 0) return res.status(404).json({ error: '客户不存在' })

  const updates = {}
  if (name !== undefined) updates.name = name
  if (contact !== undefined) updates.contact = contact
  if (phone !== undefined) updates.phone = phone
  if (address !== undefined) updates.address = address
  if (remark !== undefined) updates.remark = remark

  if (Object.keys(updates).length > 0) {
    await pool.query('UPDATE customers SET ? WHERE id = ?', [updates, id])
  }
  res.json({ ok: true })
})

router.delete('/api/customers/:id', async (req, res) => {
  const id = validateId(req.params.id)
  if (!id) return res.status(400).json({ error: '参数错误' })

  const pool = getTenantPool(req.tenant.db_name)
  const [existing] = await pool.query('SELECT id FROM customers WHERE id = ? AND status = 1', [id])
  if (existing.length === 0) return res.status(404).json({ error: '客户不存在' })
  await pool.query('UPDATE customers SET status = 0 WHERE id = ?', [id])
  res.json({ ok: true })
})

module.exports = router
