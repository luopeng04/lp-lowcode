const crypto = require('crypto')
const AppError = require('../utils/AppError')

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

function getSecret() {
  return process.env.AUTH_SECRET || 'lp-dev-secret-change-me'
}

function base64UrlEncode(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value)
  return buffer.toString('base64url')
}

function base64UrlJson(value) {
  return base64UrlEncode(JSON.stringify(value))
}

function signPart(input) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(input)
    .digest('base64url')
}

function signToken(payload) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const body = {
    ...payload,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  }
  const unsigned = `${base64UrlJson(header)}.${base64UrlJson(body)}`
  return `${unsigned}.${signPart(unsigned)}`
}

function parseBearerToken(req) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token
}

function verifyToken(token) {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new AppError(401, '登录已失效，请重新登录')
  }

  const unsigned = `${parts[0]}.${parts[1]}`
  const expected = signPart(unsigned)
  const provided = parts[2]
  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    throw new AppError(401, '登录已失效，请重新登录')
  }

  let payload
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
  } catch {
    throw new AppError(401, '登录已失效，请重新登录')
  }

  const now = Math.floor(Date.now() / 1000)
  if (!payload.exp || payload.exp < now) {
    throw new AppError(401, '登录已过期，请重新登录')
  }

  return payload
}

module.exports = { signToken, verifyToken, parseBearerToken }
