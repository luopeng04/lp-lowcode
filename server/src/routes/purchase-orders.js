const { Router } = require('express')
const { getTenantPool } = require('../config/database')
const { validateId, writeGuard, parseCustomData } = require('../utils')
const { receiveStock } = require('../services/inventory-engine')
const { generateOrderNo, withTransaction, withDuplicateRetry } = require('../services/order-machine')
const AppError = require('../utils/AppError')

const router = Router()

router.use((req, res, next) => {
  if (!req.tenant) return res.status(400).json({ error: '未提供租户标识' })
  next()
})

writeGuard(router)

// GET /api/purchase-orders
router.get('/api/purchase-orders', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { search, status, page = 1, pageSize = 20 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(pageSize)

  let sql = `SELECT po.*, s.name as supplier_name, w.name as warehouse_name
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN warehouses w ON po.warehouse_id = w.id
    WHERE 1=1`
  const params = []

  if (search) {
    sql += ' AND (po.order_no LIKE ? OR s.name LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  if (status) {
    sql += ' AND po.status = ?'
    params.push(status)
  }
  sql += ' ORDER BY po.id DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)

  const [rows] = await pool.query(sql, params)
  const data = rows.map(parseCustomData)

  let countSql = `SELECT COUNT(*) as total FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN warehouses w ON po.warehouse_id = w.id WHERE 1=1`
  const countParams = []
  if (search) { countSql += ' AND (po.order_no LIKE ? OR s.name LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`) }
  if (status) { countSql += ' AND po.status = ?'; countParams.push(status) }
  const [[{ total }]] = await pool.query(countSql, countParams)
  res.json({ data, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

// GET /api/purchase-orders/:id
router.get('/api/purchase-orders/:id', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = validateId(req.params.id)
  if (!id) return res.status(400).json({ error: '参数错误' })

  const [orders] = await pool.query(
    `SELECT po.*, s.name as supplier_name, w.name as warehouse_name
     FROM purchase_orders po
     LEFT JOIN suppliers s ON po.supplier_id = s.id
     LEFT JOIN warehouses w ON po.warehouse_id = w.id
     WHERE po.id = ?`, [id]
  )
  if (orders.length === 0) return res.status(404).json({ error: '采购单不存在' })

  const [items] = await pool.query(
    `SELECT poi.*, p.name as product_name, p.code as product_code, p.unit
     FROM purchase_order_items poi
     LEFT JOIN products p ON poi.product_id = p.id
     WHERE poi.order_id = ?`, [id]
  )

  res.json({ order: parseCustomData(orders[0]), items: items.map(parseCustomData) })
})

// POST /api/purchase-orders
router.post('/api/purchase-orders', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { supplier_id, warehouse_id, items, ordered_at, custom_data } = req.body

  if (!supplier_id || !warehouse_id || !items || items.length === 0) {
    return res.status(400).json({ error: '供应商、仓库和商品明细不能为空' })
  }

  for (const item of items) {
    item.product_id = validateId(item.product_id)
    item.quantity = Number(item.quantity)
    item.unit_price = Number(item.unit_price ?? 0)
    if (!item.product_id || !Number.isFinite(item.quantity) || item.quantity <= 0) {
      return res.status(400).json({ error: '商品数量必须大于0' })
    }
    if (!Number.isFinite(item.unit_price) || item.unit_price < 0) {
      return res.status(400).json({ error: '单价不能为负数' })
    }
  }

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)

  const result = await withDuplicateRetry(() => withTransaction(pool, async (conn) => {
    const [[supplier]] = await conn.query('SELECT id FROM suppliers WHERE id = ? AND status = 1', [supplier_id])
    if (!supplier) throw new AppError(400, '供应商不存在或已停用')

    const [[warehouse]] = await conn.query('SELECT id FROM warehouses WHERE id = ? AND status = 1', [warehouse_id])
    if (!warehouse) throw new AppError(400, '仓库不存在或已停用')

    const productIds = [...new Set(items.map(item => Number(item.product_id)))]
    const placeholders = productIds.map(() => '?').join(',')
    const [products] = await conn.query(
      `SELECT id FROM products WHERE id IN (${placeholders}) AND status = 1`,
      productIds
    )
    if (products.length !== productIds.length) {
      throw new AppError(400, '商品不存在或已停用')
    }

    const orderNo = await generateOrderNo(conn, { prefix: 'PO', table: 'purchase_orders' })
    const [insertResult] = await conn.query(
      'INSERT INTO purchase_orders (order_no, supplier_id, warehouse_id, total_amount, ordered_at, custom_data) VALUES (?,?,?,?,?,?)',
      [orderNo, supplier_id, warehouse_id, totalAmount, ordered_at || null, custom_data ? JSON.stringify(custom_data) : null]
    )
    const orderId = insertResult.insertId

    for (const item of items) {
      await conn.query(
        'INSERT INTO purchase_order_items (order_id, product_id, quantity, unit_price, amount, custom_data) VALUES (?,?,?,?,?,?)',
        [orderId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price, item.custom_data ? JSON.stringify(item.custom_data) : null]
      )
    }

    return { id: orderId, order_no: orderNo }
  }))
  res.status(201).json(result)
})

// PUT /api/purchase-orders/:id/confirm (draft → confirmed)
router.put('/api/purchase-orders/:id/confirm', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = validateId(req.params.id)
  if (!id) return res.status(400).json({ error: '参数错误' })

  await withTransaction(pool, async (conn) => {
    const [orders] = await conn.query('SELECT * FROM purchase_orders WHERE id = ? FOR UPDATE', [id])
    if (orders.length === 0) throw new AppError(404, '采购单不存在')
    if (orders[0].status !== 'draft') throw new AppError(400, '只能审核草稿状态的采购单')

    await conn.query("UPDATE purchase_orders SET status = 'confirmed' WHERE id = ?", [id])
  })
  res.json({ ok: true })
})

// PUT /api/purchase-orders/:id/receive (confirmed → received, update inventory)
router.put('/api/purchase-orders/:id/receive', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = validateId(req.params.id)
  if (!id) return res.status(400).json({ error: '参数错误' })

  await withTransaction(pool, async (conn) => {
    const [orders] = await conn.query('SELECT * FROM purchase_orders WHERE id = ? FOR UPDATE', [id])
    if (orders.length === 0) throw new AppError(404, '采购单不存在')
    if (orders[0].status !== 'confirmed') throw new AppError(400, '只能入库已审核的采购单')

    const order = orders[0]
    const [items] = await conn.query('SELECT * FROM purchase_order_items WHERE order_id = ?', [id])
    for (const item of items) {
      await receiveStock(conn, {
        productId: item.product_id,
        warehouseId: order.warehouse_id,
        qty: item.quantity,
        costPrice: item.unit_price,
        orderType: 'purchase',
        orderId: id,
      })
    }
    await conn.query("UPDATE purchase_orders SET status = 'received' WHERE id = ?", [id])
  })
  res.json({ ok: true })
})

module.exports = router
