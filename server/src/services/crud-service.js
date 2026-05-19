const { Router } = require('express')
const { getTenantPool } = require('../config/database')
const { validateId, writeGuard } = require('../utils')

function createCrudRoutes({ table, fields, searchFields, entityName, jsonFields = [] }) {
  const router = Router()
  const label = entityName || table

  function parseJson(row) {
    const parsed = { ...row }
    for (const f of jsonFields) {
      parsed[f] = row[f] ? (typeof row[f] === 'string' ? JSON.parse(row[f]) : row[f]) : {}
    }
    return parsed
  }

  router.use((req, res, next) => {
    if (!req.tenant) return res.status(400).json({ error: '未提供租户标识' })
    next()
  })

  writeGuard(router)

  // GET list — paginated, searchable
  router.get(`/api/${table}`, async (req, res) => {
    const pool = getTenantPool(req.tenant.db_name)
    const { search, page = 1, pageSize = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)

    let sql = `SELECT * FROM ${table} WHERE status = 1`
    const params = []
    if (search && searchFields.length > 0) {
      const clauses = searchFields.map(f => `${f} LIKE ?`).join(' OR ')
      sql += ` AND (${clauses})`
      searchFields.forEach(() => params.push(`%${search}%`))
    }
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?'
    params.push(parseInt(pageSize), offset)

    const [rows] = await pool.query(sql, params)
    const data = rows.map(parseJson)

    let countSql = `SELECT COUNT(*) as total FROM ${table} WHERE status = 1`
    const countParams = []
    if (search && searchFields.length > 0) {
      const clauses = searchFields.map(f => `${f} LIKE ?`).join(' OR ')
      countSql += ` AND (${clauses})`
      searchFields.forEach(() => countParams.push(`%${search}%`))
    }
    const [[{ total }]] = await pool.query(countSql, countParams)

    res.json({ data, total, page: parseInt(page), pageSize: parseInt(pageSize) })
  })

  // POST create
  router.post(`/api/${table}`, async (req, res) => {
    const pool = getTenantPool(req.tenant.db_name)
    const hasRequired = fields.slice(0, 2).every(f => req.body[f])
    if (!hasRequired) return res.status(400).json({ error: '必填字段不能为空' })

    const [dup] = await pool.query(`SELECT id FROM ${table} WHERE ${fields[0]} = ?`, [req.body[fields[0]]])
    if (dup.length > 0) return res.status(409).json({ error: `${label}已存在` })

    const values = fields.map(f => {
      const val = req.body[f]
      if (jsonFields.includes(f)) return val ? JSON.stringify(val) : null
      return val || ''
    })
    const placeholders = fields.map(() => '?').join(',')
    const [result] = await pool.query(
      `INSERT INTO ${table} (${fields.join(',')}) VALUES (${placeholders})`,
      values
    )
    res.status(201).json({ id: result.insertId })
  })

  // PUT update
  router.put(`/api/${table}/:id`, async (req, res) => {
    const id = validateId(req.params.id)
    if (!id) return res.status(400).json({ error: '参数错误' })

    const pool = getTenantPool(req.tenant.db_name)
    const [existing] = await pool.query(`SELECT id FROM ${table} WHERE id = ? AND status = 1`, [id])
    if (existing.length === 0) return res.status(404).json({ error: `${label}不存在` })

    const updates = {}
    for (const f of fields.slice(1)) {
      if (req.body[f] !== undefined) {
        updates[f] = jsonFields.includes(f) ? JSON.stringify(req.body[f]) : req.body[f]
      }
    }
    if (Object.keys(updates).length > 0) {
      await pool.query(`UPDATE ${table} SET ? WHERE id = ?`, [updates, id])
    }
    res.json({ ok: true })
  })

  // DELETE soft delete
  router.delete(`/api/${table}/:id`, async (req, res) => {
    const id = validateId(req.params.id)
    if (!id) return res.status(400).json({ error: '参数错误' })

    const pool = getTenantPool(req.tenant.db_name)
    const [existing] = await pool.query(`SELECT id FROM ${table} WHERE id = ? AND status = 1`, [id])
    if (existing.length === 0) return res.status(404).json({ error: `${label}不存在` })
    await pool.query(`UPDATE ${table} SET status = 0 WHERE id = ?`, [id])
    res.json({ ok: true })
  })

  return router
}

module.exports = createCrudRoutes
