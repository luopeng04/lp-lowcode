const { Router } = require('express')
const { getTenantPool } = require('../config/database')

const router = Router()

router.use((req, res, next) => {
  if (!req.tenant) return res.status(400).json({ error: '未提供租户标识' })
  next()
})

// GET /api/reports/sales-summary
router.get('/api/reports/sales-summary', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { period = 'day', product_id, customer_id, warehouse_id, start_date, end_date } = req.query

  let dateFormat
  if (period === 'week') dateFormat = '%Y-%u'
  else if (period === 'month') dateFormat = '%Y-%m'
  else dateFormat = '%Y-%m-%d'

  let sql = `SELECT DATE_FORMAT(so.updated_at, ?) as period,
    COUNT(DISTINCT so.id) as order_count,
    SUM(soi.quantity) as total_qty,
    SUM(soi.amount) as total_amount
    FROM sales_orders so
    JOIN sales_order_items soi ON so.id = soi.order_id
    WHERE so.status = 'delivered'`
  const params = [dateFormat]

  if (start_date) { sql += ' AND so.created_at >= ?'; params.push(start_date) }
  if (end_date) { sql += ' AND so.created_at <= ?'; params.push(end_date + ' 23:59:59') }
  if (customer_id) { sql += ' AND so.customer_id = ?'; params.push(customer_id) }
  if (warehouse_id) { sql += ' AND so.warehouse_id = ?'; params.push(warehouse_id) }

  sql += ' GROUP BY period ORDER BY period'

  const [rows] = await pool.query(sql, params)
  res.json({ data: rows })
})

// GET /api/reports/profit
router.get('/api/reports/profit', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { start_date, end_date, product_id } = req.query

  let sql = `SELECT p.name as product_name, p.code as product_code,
    SUM(soi.quantity) as total_qty,
    SUM(soi.amount) as revenue,
    SUM(il.cost_price * soi.quantity) as cost,
    SUM(soi.amount) - SUM(il.cost_price * soi.quantity) as profit
    FROM sales_orders so
    JOIN sales_order_items soi ON so.id = soi.order_id
    JOIN products p ON soi.product_id = p.id
    LEFT JOIN inventory_ledgers il ON il.order_id = so.id AND il.order_type = 'sale' AND il.product_id = soi.product_id
    WHERE so.status = 'delivered'`
  const params = []

  if (start_date) { sql += ' AND so.created_at >= ?'; params.push(start_date) }
  if (end_date) { sql += ' AND so.created_at <= ?'; params.push(end_date + ' 23:59:59') }
  if (product_id) { sql += ' AND soi.product_id = ?'; params.push(product_id) }

  sql += ' GROUP BY p.id ORDER BY profit DESC'

  const [rows] = await pool.query(sql, params)
  res.json({ data: rows })
})

// GET /api/reports/purchase-summary
router.get('/api/reports/purchase-summary', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { supplier_id, product_id, start_date, end_date } = req.query

  let sql = `SELECT s.name as supplier_name, p.name as product_name,
    COUNT(DISTINCT po.id) as order_count,
    SUM(poi.quantity) as total_qty,
    SUM(poi.amount) as total_amount
    FROM purchase_orders po
    JOIN purchase_order_items poi ON po.id = poi.order_id
    JOIN suppliers s ON po.supplier_id = s.id
    JOIN products p ON poi.product_id = p.id
    WHERE po.status = 'received'`
  const params = []

  if (start_date) { sql += ' AND po.created_at >= ?'; params.push(start_date) }
  if (end_date) { sql += ' AND po.created_at <= ?'; params.push(end_date + ' 23:59:59') }
  if (supplier_id) { sql += ' AND po.supplier_id = ?'; params.push(supplier_id) }
  if (product_id) { sql += ' AND poi.product_id = ?'; params.push(product_id) }

  sql += ' GROUP BY po.supplier_id, poi.product_id ORDER BY total_amount DESC'

  const [rows] = await pool.query(sql, params)
  res.json({ data: rows })
})

// GET /api/reports/turnover
router.get('/api/reports/turnover', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { warehouse_id, start_date, end_date } = req.query

  let sql = `SELECT p.name as product_name, p.code as product_code, w.name as warehouse_name,
    SUM(CASE WHEN il.type = 'in' THEN il.quantity ELSE 0 END) as total_in,
    SUM(CASE WHEN il.type = 'out' THEN il.quantity ELSE 0 END) as total_out,
    COUNT(DISTINCT il.id) as tx_count
    FROM inventory_ledgers il
    JOIN products p ON il.product_id = p.id
    JOIN warehouses w ON il.warehouse_id = w.id
    WHERE 1=1`
  const params = []

  if (start_date) { sql += ' AND il.created_at >= ?'; params.push(start_date) }
  if (end_date) { sql += ' AND il.created_at <= ?'; params.push(end_date + ' 23:59:59') }
  if (warehouse_id) { sql += ' AND il.warehouse_id = ?'; params.push(warehouse_id) }

  sql += ' GROUP BY il.product_id, il.warehouse_id ORDER BY tx_count DESC'

  const [rows] = await pool.query(sql, params)
  res.json({ data: rows })
})

module.exports = router
