const { Router } = require('express')

const router = Router()

// Health check — no tenant required
router.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

module.exports = router
