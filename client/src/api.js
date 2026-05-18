const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

export function register(phone, password, name) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ phone, password, name }),
  })
}

export function login(phone, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  })
}
