const { Router } = require('express')
const { getTenantPool } = require('../config/database')

const router = Router()

router.use((req, res, next) => {
  if (!req.tenant) return res.status(400).json({ error: '未提供租户标识' })
  next()
})

function toCSV(columns, rows) {
  const header = columns.join(',')
  const body = rows.map(row => columns.map(c => {
    const val = row[c] != null ? String(row[c]) : ''
    // Escape quotes and wrap in quotes if contains comma or quote
    return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
  }).join(','))
  return '﻿' + [header, ...body].join('\n') // BOM for Excel UTF-8
}

// GET /api/export/inventory
router.get('/api/export/inventory', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { warehouse_id, category, search } = req.query

  let sql = `SELECT p.name as 商品名称, p.code as 商品编码, p.unit as 单位, p.category as 分类,
    w.name as 仓库, i.quantity as 数量, i.safety_stock as 安全库存, i.avg_cost as 均价,
    ROUND(i.quantity * i.avg_cost, 2) as 金额
    FROM inventories i
    JOIN products p ON i.product_id = p.id
    JOIN warehouses w ON i.warehouse_id = w.id
    WHERE 1=1`
  const params = []

  if (warehouse_id) { sql += ' AND i.warehouse_id = ?'; params.push(warehouse_id) }
  if (category) { sql += ' AND p.category = ?'; params.push(category) }
  if (search) { sql += ' AND (p.name LIKE ? OR p.code LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }

  sql += ' ORDER BY i.id'

  const [rows] = await pool.query(sql, params)
  const columns = ['商品名称', '商品编码', '单位', '分类', '仓库', '数量', '安全库存', '均价', '金额']
  const csv = toCSV(columns, rows)

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('库存汇总.csv')}`)
  res.send(csv)
})

// GET /api/export/inventory-ledger
router.get('/api/export/inventory-ledger', async (req, res) => {
  const pool = getTenantPool(req.tenant.db_name)
  const { start_date, end_date, warehouse_id, type } = req.query

  let sql = `SELECT il.created_at as 时间, p.name as 商品, p.code as 编码,
    w.name as 仓库, CASE il.type WHEN 'in' THEN '入库' ELSE '出库' END as 方向,
    il.quantity as 数量, il.cost_price as 成本价,
    COALESCE(po.order_no, so.order_no, '盘点调整') as 关联单据
    FROM inventory_ledgers il
    JOIN products p ON il.product_id = p.id
    JOIN warehouses w ON il.warehouse_id = w.id
    LEFT JOIN purchase_orders po ON il.order_type = 'purchase' AND il.order_id = po.id
    LEFT JOIN sales_orders so ON il.order_type = 'sale' AND il.order_id = so.id
    WHERE 1=1`
  const params = []

  if (start_date) { sql += ' AND il.created_at >= ?'; params.push(start_date) }
  if (end_date) { sql += ' AND il.created_at <= ?'; params.push(end_date + ' 23:59:59') }
  if (warehouse_id) { sql += ' AND il.warehouse_id = ?'; params.push(warehouse_id) }
  if (type) { sql += ' AND il.type = ?'; params.push(type) }

  sql += ' ORDER BY il.id DESC'

  const [rows] = await pool.query(sql, params)
  const columns = ['时间', '商品', '编码', '仓库', '方向', '数量', '成本价', '关联单据']
  const csv = toCSV(columns, rows)

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('库存流水.csv')}`)
  res.send(csv)
})

module.exports = router
