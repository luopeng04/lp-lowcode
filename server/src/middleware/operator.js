const { getTenantPool } = require('../config/database')

async function operatorMiddleware(req, res, next) {
  const operatorId = req.headers['x-operator-id']

  if (!operatorId || !req.tenant) {
    req.operator = null
    return next()
  }

  try {
    const pool = getTenantPool(req.tenant.db_name)
    const [rows] = await pool.query(
      'SELECT id, username, display_name, role, status FROM operators WHERE id = ? AND status = 1',
      [parseInt(operatorId)]
    )

    if (rows.length === 0) {
      req.operator = null
    } else {
      req.operator = rows[0]
    }
  } catch {
    req.operator = null
  }

  next()
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.operator) {
      return res.status(401).json({ error: '未登录' })
    }
    if (!roles.includes(req.operator.role)) {
      return res.status(403).json({ error: '权限不足' })
    }
    next()
  }
}

module.exports = { operatorMiddleware, requireRole }
