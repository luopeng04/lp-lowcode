const { requireRole } = require('./middleware/operator')

function validateId(id) {
  const n = parseInt(id, 10)
  if (isNaN(n) || n < 1) return null
  return n
}

function writeGuard(router) {
  const guard = requireRole('admin', 'operator')
  router.use((req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) return guard(req, res, next)
    next()
  })
}

module.exports = { validateId, writeGuard }
