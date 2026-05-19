const { Router } = require('express')
const { getTenantPool } = require('../config/database')
const { validateId, writeGuard } = require('../utils')

const router = Router()

router.use((req, res, next) => {
  if (!req.tenant) return res.status(400).json({ error: '未提供租户标识' })
  next()
})

writeGuard(router)

// GET /api/inventory
router.get('/api/inventory', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { warehouse_id, category, search, page = 1, pageSize = 20 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(pageSize)

  let sql = `SELECT i.*, p.name as product_name, p.code as product_code, p.unit, p.category, w.name as warehouse_name
    FROM inventories i
    JOIN products p ON i.product_id = p.id
    JOIN warehouses w ON i.warehouse_id = w.id
    WHERE 1=1`
  const params = []

  if (warehouse_id) { sql += ' AND i.warehouse_id = ?'; params.push(warehouse_id) }
  if (category) { sql += ' AND p.category = ?'; params.push(category) }
  if (search) { sql += ' AND (p.name LIKE ? OR p.code LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }

  sql += ' ORDER BY i.id DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)

  const [rows] = await pool.query(sql, params)

  let countSql = 'SELECT COUNT(*) as total FROM inventories i JOIN products p ON i.product_id = p.id WHERE 1=1'
  const countParams = []
  if (warehouse_id) { countSql += ' AND i.warehouse_id = ?'; countParams.push(warehouse_id) }
  if (category) { countSql += ' AND p.category = ?'; countParams.push(category) }
  if (search) { countSql += ' AND (p.name LIKE ? OR p.code LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`) }
  const [[{ total }]] = await pool.query(countSql, countParams)

  res.json({ data: rows, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

// PUT /api/inventory/:id/safety-stock
router.put('/api/inventory/:id/safety-stock', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = validateId(req.params.id)
  if (!id) return res.status(400).json({ error: '参数错误' })
  const { safety_stock } = req.body
  if (safety_stock === undefined) return res.status(400).json({ error: '安全库存量不能为空' })

  await pool.query('UPDATE inventories SET safety_stock = ? WHERE id = ?', [safety_stock, id])
  res.json({ ok: true })
})

// GET /api/inventory-ledgers
router.get('/api/inventory-ledgers', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { product_id, warehouse_id, type, start_date, end_date, page = 1, pageSize = 20 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(pageSize)

  let sql = `SELECT il.*, p.name as product_name, p.code as product_code, w.name as warehouse_name,
      COALESCE(po.order_no, so.order_no, '盘点调整') as order_no
    FROM inventory_ledgers il
    JOIN products p ON il.product_id = p.id
    JOIN warehouses w ON il.warehouse_id = w.id
    LEFT JOIN purchase_orders po ON il.order_type = 'purchase' AND il.order_id = po.id
    LEFT JOIN sales_orders so ON il.order_type = 'sale' AND il.order_id = so.id
    WHERE 1=1`
  const params = []

  if (product_id) { sql += ' AND il.product_id = ?'; params.push(product_id) }
  if (warehouse_id) { sql += ' AND il.warehouse_id = ?'; params.push(warehouse_id) }
  if (type) { sql += ' AND il.type = ?'; params.push(type) }
  if (start_date) { sql += ' AND il.created_at >= ?'; params.push(start_date) }
  if (end_date) { sql += ' AND il.created_at <= ?'; params.push(end_date + ' 23:59:59') }

  sql += ' ORDER BY il.id DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)

  const [rows] = await pool.query(sql, params)

  let countSql = 'SELECT COUNT(*) as total FROM inventory_ledgers il JOIN products p ON il.product_id = p.id WHERE 1=1'
  const countParams = []
  if (product_id) { countSql += ' AND il.product_id = ?'; countParams.push(product_id) }
  if (warehouse_id) { countSql += ' AND il.warehouse_id = ?'; countParams.push(warehouse_id) }
  if (type) { countSql += ' AND il.type = ?'; countParams.push(type) }
  if (start_date) { countSql += ' AND il.created_at >= ?'; countParams.push(start_date) }
  if (end_date) { countSql += ' AND il.created_at <= ?'; countParams.push(end_date + ' 23:59:59') }
  const [[{ total }]] = await pool.query(countSql, countParams)

  res.json({ data: rows, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

// POST /api/inventory-check
router.post('/api/inventory-check', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { warehouse_id, items } = req.body
  if (!warehouse_id || !items || items.length === 0) {
    return res.status(400).json({ error: '仓库和盘点明细不能为空' })
  }

  const results = []
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    for (const item of items) {
      const [invs] = await conn.query(
        'SELECT * FROM inventories WHERE product_id = ? AND warehouse_id = ?',
        [item.product_id, warehouse_id]
      )
      const bookQty = invs.length > 0 ? parseFloat(invs[0].quantity) : 0
      const diff = parseFloat(item.actual_qty) - bookQty

      results.push({
        product_id: item.product_id,
        book_qty: bookQty,
        actual_qty: parseFloat(item.actual_qty),
        diff,
      })

      // Record adjustment
      if (diff !== 0) {
        const type = diff > 0 ? 'in' : 'out'
        await conn.query(
          "INSERT INTO inventory_ledgers (product_id, warehouse_id, type, quantity, cost_price, order_type, order_id) VALUES (?,?,?,?,0,'check',0)",
          [item.product_id, warehouse_id, type, Math.abs(diff)]
        )
        if (invs.length > 0) {
          await conn.query(
            'UPDATE inventories SET quantity = ? WHERE product_id = ? AND warehouse_id = ?',
            [item.actual_qty, item.product_id, warehouse_id]
          )
        }
      }
    }

    await conn.commit()
    res.json({ results })
  } catch (err) {
    await conn.rollback()
    console.error('[inventory-check]', err)
    res.status(500).json({ error: '盘点失败，请稍后重试' })
  } finally {
    conn.release()
  }
})

module.exports = router
