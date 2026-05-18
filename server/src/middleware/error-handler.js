function errorHandler(err, req, res, _next) {
  console.error('[error]', err)
  const status = err.status || 500
  res.status(status).json({
    error: err.message || '服务器内部错误',
  })
}

module.exports = errorHandler
