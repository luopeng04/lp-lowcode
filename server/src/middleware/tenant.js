const { getPlatformPool } = require('../config/database')
const { parseBearerToken, verifyToken } = require('../services/auth-token')

// Resolve tenant from signed auth token and attach to req
async function tenantMiddleware(req, res, next) {
  const token = parseBearerToken(req)

  if (!token) {
    req.tenant = null
    req.auth = null
    return next()
  }

  try {
    const auth = verifyToken(token)
    const pool = getPlatformPool()
    const [rows] = await pool.query(
      'SELECT id, name, db_name FROM tenants WHERE id = ? AND status = 1',
      [auth.tenantId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: '商户不存在' })
    }

    if (rows[0].db_name !== auth.dbName) {
      return res.status(401).json({ error: '登录已失效，请重新登录' })
    }

    req.auth = auth
    req.tenant = rows[0]
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    return res.status(500).json({ error: '数据库错误' })
  }

  next()
}

module.exports = tenantMiddleware
