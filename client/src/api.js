const BASE = '/api'

async function request(path, options = {}) {
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (tenant) headers['X-Tenant-Id'] = String(tenant.id)

  const res = await fetch(`${BASE}${path}`, { headers, ...options })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

// Auth
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

// Warehouses
export function getWarehouses(search) {
  const q = search ? `?search=${encodeURIComponent(search)}` : ''
  return request(`/warehouses${q}`)
}

export function createWarehouse(data) {
  return request('/warehouses', { method: 'POST', body: JSON.stringify(data) })
}

export function updateWarehouse(id, data) {
  return request(`/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteWarehouse(id) {
  return request(`/warehouses/${id}`, { method: 'DELETE' })
}
