function errorHandler(err, req, res, _next) {
  console.error('[error]', err)

  // Business/user errors — pass through message
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message })
  }

  // Internal errors — mask to avoid leaking DB details
  res.status(500).json({ error: '服务器内部错误' })
}

module.exports = errorHandler
