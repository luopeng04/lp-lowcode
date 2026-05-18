const { Router } = require('express')
const { getTenantPool } = require('../config/database')
const { validateId, writeGuard } = require('../utils')

const router = Router()

router.use((req, res, next) => {
  if (!req.tenant) return res.status(400).json({ error: '未提供租户标识' })
  next()
})

writeGuard(router)

// Generate order number: PO-yyyyMMdd-XXXX
async function generateOrderNo(pool) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const [rows] = await pool.query(
    "SELECT order_no FROM purchase_orders WHERE order_no LIKE ? ORDER BY id DESC LIMIT 1",
    [`PO-${today}-%`]
  )
  const seq = rows.length > 0 ? parseInt(rows[0].order_no.slice(-4)) + 1 : 1
  return `PO-${today}-${String(seq).padStart(4, '0')}`
}

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

  let countSql = `SELECT COUNT(*) as total FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN warehouses w ON po.warehouse_id = w.id WHERE 1=1`
  const countParams = []
  if (search) { countSql += ' AND (po.order_no LIKE ? OR s.name LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`) }
  if (status) { countSql += ' AND po.status = ?'; countParams.push(status) }
  const [[{ total }]] = await pool.query(countSql, countParams)
  res.json({ data: rows, total, page: parseInt(page), pageSize: parseInt(pageSize) })
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

  res.json({ order: orders[0], items })
})

// POST /api/purchase-orders
router.post('/api/purchase-orders', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { supplier_id, warehouse_id, items, ordered_at } = req.body

  if (!supplier_id || !warehouse_id || !items || items.length === 0) {
    return res.status(400).json({ error: '供应商、仓库和商品明细不能为空' })
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

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const orderNo = await generateOrderNo(conn)
    const [result] = await conn.query(
      'INSERT INTO purchase_orders (order_no, supplier_id, warehouse_id, total_amount, ordered_at) VALUES (?,?,?,?,?)',
      [orderNo, supplier_id, warehouse_id, totalAmount, ordered_at || null]
    )
    const orderId = result.insertId

    for (const item of items) {
      await conn.query(
        'INSERT INTO purchase_order_items (order_id, product_id, quantity, unit_price, amount) VALUES (?,?,?,?,?)',
        [orderId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
      )
    }

    await conn.commit()
    res.status(201).json({ id: orderId, order_no: orderNo })
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
})

// PUT /api/purchase-orders/:id/confirm (draft → confirmed)
router.put('/api/purchase-orders/:id/confirm', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = validateId(req.params.id)
  if (!id) return res.status(400).json({ error: '参数错误' })

  const [orders] = await pool.query('SELECT * FROM purchase_orders WHERE id = ?', [id])
  if (orders.length === 0) return res.status(404).json({ error: '采购单不存在' })
  if (orders[0].status !== 'draft') return res.status(400).json({ error: '只能审核草稿状态的采购单' })

  await pool.query("UPDATE purchase_orders SET status = 'confirmed' WHERE id = ?", [id])
  res.json({ ok: true })
})

// PUT /api/purchase-orders/:id/receive (confirmed → received, update inventory)
router.put('/api/purchase-orders/:id/receive', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const id = validateId(req.params.id)
  if (!id) return res.status(400).json({ error: '参数错误' })

  const [orders] = await pool.query('SELECT * FROM purchase_orders WHERE id = ?', [id])
  if (orders.length === 0) return res.status(404).json({ error: '采购单不存在' })
  if (orders[0].status !== 'confirmed') return res.status(400).json({ error: '只能入库已审核的采购单' })

  const order = orders[0]
  const [items] = await pool.query('SELECT * FROM purchase_order_items WHERE order_id = ?', [id])

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    for (const item of items) {
      // Get current inventory
      const [invs] = await conn.query(
        'SELECT quantity, avg_cost FROM inventories WHERE product_id = ? AND warehouse_id = ?',
        [item.product_id, order.warehouse_id]
      )

      if (invs.length > 0) {
        const inv = invs[0]
        const newQty = parseFloat(inv.quantity) + parseFloat(item.quantity)
        // Weighted average cost
        const oldAmount = parseFloat(inv.quantity) * parseFloat(inv.avg_cost)
        const inAmount = parseFloat(item.quantity) * parseFloat(item.unit_price)
        const newAvg = (oldAmount + inAmount) / newQty

        await conn.query(
          'UPDATE inventories SET quantity = ?, avg_cost = ? WHERE product_id = ? AND warehouse_id = ?',
          [newQty, newAvg, item.product_id, order.warehouse_id]
        )
      } else {
        await conn.query(
          'INSERT INTO inventories (product_id, warehouse_id, quantity, avg_cost) VALUES (?,?,?,?)',
          [item.product_id, order.warehouse_id, item.quantity, item.unit_price]
        )
      }

      // Record inventory ledger
      await conn.query(
        "INSERT INTO inventory_ledgers (product_id, warehouse_id, type, quantity, cost_price, order_type, order_id) VALUES (?,?,?,?,?,?,?)",
        [item.product_id, order.warehouse_id, 'in', item.quantity, item.unit_price, 'purchase', id]
      )
    }

    await conn.query("UPDATE purchase_orders SET status = 'received' WHERE id = ?", [id])
    await conn.commit()
    res.json({ ok: true })
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
})

module.exports = router
