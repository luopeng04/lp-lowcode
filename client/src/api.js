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

// Suppliers
export function getSuppliers(search, page = 1) {
  const q = `?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`
  return request(`/suppliers${q}`)
}
export function createSupplier(data) {
  return request('/suppliers', { method: 'POST', body: JSON.stringify(data) })
}
export function updateSupplier(id, data) {
  return request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}
export function deleteSupplier(id) {
  return request(`/suppliers/${id}`, { method: 'DELETE' })
}

// Customers
export function getCustomers(search, page = 1) {
  const q = `?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`
  return request(`/customers${q}`)
}
export function createCustomer(data) {
  return request('/customers', { method: 'POST', body: JSON.stringify(data) })
}
export function updateCustomer(id, data) {
  return request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}
export function deleteCustomer(id) {
  return request(`/customers/${id}`, { method: 'DELETE' })
}

// Products
export function getProducts({ search, category, page = 1 } = {}) {
  const params = new URLSearchParams({ page })
  if (search) params.set('search', search)
  if (category) params.set('category', category)
  return request(`/products?${params}`)
}
export function createProduct(data) {
  return request('/products', { method: 'POST', body: JSON.stringify(data) })
}
export function updateProduct(id, data) {
  return request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}
export function deleteProduct(id) {
  return request(`/products/${id}`, { method: 'DELETE' })
}

// Categories
export function getCategories() {
  return request('/categories')
}
export function createCategory(name) {
  return request('/categories', { method: 'POST', body: JSON.stringify({ name }) })
}

// Custom fields
export function getCustomFields(entity = 'product') {
  return request(`/custom-fields?entity=${entity}`)
}
export function createCustomField(data) {
  return request('/custom-fields', { method: 'POST', body: JSON.stringify(data) })
}
export function deleteCustomField(id) {
  return request(`/custom-fields/${id}`, { method: 'DELETE' })
}
