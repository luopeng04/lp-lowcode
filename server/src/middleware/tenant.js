const { getPlatformPool } = require('../config/database')

// Resolve tenant from X-Tenant-Id header and attach to req
async function tenantMiddleware(req, res, next) {
  const tenantId = req.headers['x-tenant-id']

  if (!tenantId) {
    req.tenant = null
    return next()
  }

  try {
    const pool = getPlatformPool()
    const [rows] = await pool.query(
      'SELECT id, name, db_name FROM tenants WHERE id = ? AND status = 1',
      [tenantId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: '商户不存在' })
    }

    req.tenant = rows[0]
  } catch (err) {
    return res.status(500).json({ error: '数据库错误' })
  }

  next()
}

module.exports = tenantMiddleware
