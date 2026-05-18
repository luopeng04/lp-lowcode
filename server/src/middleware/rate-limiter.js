const attempts = new Map()

// Clean expired entries every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of attempts) {
    if (now - entry.resetAt > 60000) attempts.delete(key)
  }
}, 60000)

function loginLimiter(req, res, next) {
  const key = req.ip || 'unknown'
  const now = Date.now()

  if (!attempts.has(key)) {
    attempts.set(key, { count: 1, resetAt: now })
    return next()
  }

  const entry = attempts.get(key)

  if (now - entry.resetAt > 60000) {
    // Reset after 1 minute
    attempts.set(key, { count: 1, resetAt: now })
    return next()
  }

  entry.count++
  if (entry.count > 5) {
    return res.status(429).json({ error: '请求过于频繁，请稍后再试' })
  }

  next()
}

module.exports = loginLimiter
