const { Router } = require('express')
const { getTenantPool } = require('../config/database')
const { validateId, writeGuard, parseCustomData } = require('../utils')
const { deductStock } = require('../services/inventory-engine')
const { generateOrderNo, withTransaction } = require('../services/order-machine')

const router = Router()

router.use((req, res, next) => {
  if (!req.tenant) return res.status(400).json({ error: '未提供租户标识' })
  next()
})

writeGuard(router)

// GET /api/sales-orders
router.get('/api/sales-orders', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { search, status, page = 1, pageSize = 20 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(pageSize)

  let sql = `SELECT so.*, c.name as customer_name, w.name as warehouse_name
    FROM sales_orders so
    LEFT JOIN customers c ON so.customer_id = c.id
    LEFT JOIN warehouses w ON so.warehouse_id = w.id
    WHERE 1=1`
  const params = []

  if (search) {
    sql += ' AND (so.order_no LIKE ? OR c.name LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  if (status) { sql += ' AND so.status = ?'; params.push(status) }
  sql += ' ORDER BY so.id DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)

  const [rows] = await pool.query(sql, params)
  const data = rows.map(parseCustomData)

  let countSql = `SELECT COUNT(*) as total FROM sales_orders so
    LEFT JOIN customers c ON so.customer_id = c.id
    LEFT JOIN warehouses w ON so.warehouse_id = w.id WHERE 1=1`
  const countParams = []
  if (search) { countSql += ' AND (so.order_no LIKE ? OR c.name LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`) }
  if (status) { countSql += ' AND so.status = ?'; countParams.push(status) }
  const [[{ total }]] = await pool.query(countSql, countParams)
  res.json({ data, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

// GET /api/sales-orders/:id
router.get('/api/sales-orders/:id', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = validateId(req.params.id)
  if (!id) return res.status(400).json({ error: '参数错误' })

  const [orders] = await pool.query(
    `SELECT so.*, c.name as customer_name, w.name as warehouse_name
     FROM sales_orders so
     LEFT JOIN customers c ON so.customer_id = c.id
     LEFT JOIN warehouses w ON so.warehouse_id = w.id
     WHERE so.id = ?`, [id]
  )
  if (orders.length === 0) return res.status(404).json({ error: '销售单不存在' })

  const [items] = await pool.query(
    `SELECT soi.*, p.name as product_name, p.code as product_code, p.unit
     FROM sales_order_items soi
     LEFT JOIN products p ON soi.product_id = p.id
     WHERE soi.order_id = ?`, [id]
  )

  res.json({ order: parseCustomData(orders[0]), items: items.map(parseCustomData) })
})

// POST /api/sales-orders
router.post('/api/sales-orders', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { customer_id, warehouse_id, items, ordered_at, custom_data } = req.body

  if (!customer_id || !warehouse_id || !items || items.length === 0) {
    return res.status(400).json({ error: '客户、仓库和商品明细不能为空' })
  }

  for (const item of items) {
    if (!item.product_id || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({ error: '商品数量必须大于0' })
    }
    if (item.unit_price < 0) {
      return res.status(400).json({ error: '单价不能为负数' })
    }
  }

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)

  const result = await withTransaction(pool, async (conn) => {
    const orderNo = await generateOrderNo(conn, { prefix: 'SO', table: 'sales_orders' })
    const [insertResult] = await conn.query(
      'INSERT INTO sales_orders (order_no, customer_id, warehouse_id, total_amount, ordered_at, custom_data) VALUES (?,?,?,?,?,?)',
      [orderNo, customer_id, warehouse_id, totalAmount, ordered_at || null, custom_data ? JSON.stringify(custom_data) : null]
    )
    const orderId = insertResult.insertId

    for (const item of items) {
      await conn.query(
        'INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price, amount, custom_data) VALUES (?,?,?,?,?,?)',
        [orderId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price, item.custom_data ? JSON.stringify(item.custom_data) : null]
      )
    }

    return { id: orderId, order_no: orderNo }
  })
  res.status(201).json(result)
})

// PUT /api/sales-orders/:id/confirm
router.put('/api/sales-orders/:id/confirm', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = validateId(req.params.id)
  if (!id) return res.status(400).json({ error: '参数错误' })

  const [orders] = await pool.query('SELECT * FROM sales_orders WHERE id = ?', [id])
  if (orders.length === 0) return res.status(404).json({ error: '销售单不存在' })
  if (orders[0].status !== 'draft') return res.status(400).json({ error: '只能审核草稿状态的销售单' })

  await pool.query("UPDATE sales_orders SET status = 'confirmed' WHERE id = ?", [id])
  res.json({ ok: true })
})

// PUT /api/sales-orders/:id/deliver (confirmed → delivered, decrease inventory)
router.put('/api/sales-orders/:id/deliver', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = validateId(req.params.id)
  if (!id) return res.status(400).json({ error: '参数错误' })

  const [orders] = await pool.query('SELECT * FROM sales_orders WHERE id = ?', [id])
  if (orders.length === 0) return res.status(404).json({ error: '销售单不存在' })
  if (orders[0].status !== 'confirmed') return res.status(400).json({ error: '只能出库已审核的销售单' })

  const order = orders[0]
  const [items] = await pool.query('SELECT * FROM sales_order_items WHERE order_id = ?', [id])

  await withTransaction(pool, async (conn) => {
    for (const item of items) {
      await deductStock(conn, {
        productId: item.product_id,
        warehouseId: order.warehouse_id,
        qty: item.quantity,
        orderType: 'sale',
        orderId: id,
      })
    }
    await conn.query("UPDATE sales_orders SET status = 'delivered' WHERE id = ?", [id])
  })
  res.json({ ok: true })
})

module.exports = router
