const AppError = require('../utils/AppError')

// 入库：更新库存（移动加权平均），记录流水
async function receiveStock(conn, { productId, warehouseId, qty, costPrice, orderType, orderId }) {
  await conn.query(
    `INSERT INTO inventories (product_id, warehouse_id, quantity, avg_cost)
     VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE
       avg_cost = ((quantity * avg_cost) + (VALUES(quantity) * VALUES(avg_cost))) / (quantity + VALUES(quantity)),
       quantity = quantity + VALUES(quantity)`,
    [productId, warehouseId, qty, costPrice]
  )

  await recordLedger(conn, { productId, warehouseId, type: 'in', qty, costPrice, orderType, orderId })
}

// 出库：检查库存充足，扣减，按当前均价记流水
async function deductStock(conn, { productId, warehouseId, qty, orderType, orderId }) {
  const [invs] = await conn.query(
    'SELECT quantity, avg_cost FROM inventories WHERE product_id = ? AND warehouse_id = ? FOR UPDATE',
    [productId, warehouseId]
  )

  if (invs.length === 0) {
    throw new AppError(400, '商品库存不存在')
  }

  const inv = invs[0]
  if (parseFloat(inv.quantity) < parseFloat(qty)) {
    throw new AppError(400, `库存不足，当前库存: ${inv.quantity}`)
  }

  const newQty = parseFloat(inv.quantity) - parseFloat(qty)
  const costPrice = parseFloat(inv.avg_cost)

  await conn.query(
    'UPDATE inventories SET quantity = ? WHERE product_id = ? AND warehouse_id = ?',
    [newQty, productId, warehouseId]
  )

  await recordLedger(conn, { productId, warehouseId, type: 'out', qty, costPrice, orderType, orderId })
  return costPrice
}

// 记录库存流水
async function recordLedger(conn, { productId, warehouseId, type, qty, costPrice, orderType, orderId }) {
  await conn.query(
    'INSERT INTO inventory_ledgers (product_id, warehouse_id, type, quantity, cost_price, order_type, order_id) VALUES (?,?,?,?,?,?,?)',
    [productId, warehouseId, type, qty, costPrice, orderType, orderId]
  )
}

module.exports = { receiveStock, deductStock, recordLedger }
