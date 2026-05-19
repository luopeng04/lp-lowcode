// Generate order number: PREFIX-yyyyMMdd-XXXX
async function generateOrderNo(conn, { prefix, table }) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const [rows] = await conn.query(
    `SELECT order_no FROM ${table} WHERE order_no LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}-${today}-%`]
  )
  const seq = rows.length > 0 ? parseInt(rows[0].order_no.slice(-4)) + 1 : 1
  return `${prefix}-${today}-${String(seq).padStart(4, '0')}`
}

// Transaction wrapper — handles begin, commit, rollback, release
async function withTransaction(pool, fn) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

module.exports = { generateOrderNo, withTransaction }
