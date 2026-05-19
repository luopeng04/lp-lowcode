import { useAuthStore } from './stores/auth'

const BASE = '/api'

function getAuthHeaders() {
  // Must be called inside a component setup or we fall back to localStorage
  try {
    const auth = useAuthStore()
    const headers = {}
    if (auth.tenant) headers['X-Tenant-Id'] = String(auth.tenant.id)
    if (auth.operator) headers['X-Operator-Id'] = String(auth.operator.id)
    return headers
  } catch {
    const tenant = JSON.parse(localStorage.getItem('tenant') || 'null')
    const operator = JSON.parse(localStorage.getItem('operator') || 'null')
    const headers = {}
    if (tenant) headers['X-Tenant-Id'] = String(tenant.id)
    if (operator) headers['X-Operator-Id'] = String(operator.id)
    return headers
  }
}

async function request(path, options = {}) {
  const authHeaders = getAuthHeaders()
  const headers = { 'Content-Type': 'application/json', ...authHeaders, ...options.headers }

  const res = await fetch(`${BASE}${path}`, { headers, ...options })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

// Auth
export function register(phone, password, name, industry) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ phone, password, name, industry }),
  })
}

export function login(phone, password, username) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password, username }),
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

// Menu settings
export function getMenuSettings() {
  return request('/menu-settings')
}
export function updateMenuSetting(menuPath, visible) {
  return request('/menu-settings', {
    method: 'PUT', body: JSON.stringify({ menu_path: menuPath, visible }),
  })
}

// Operators
export function getOperators() {
  return request('/operators')
}
export function createOperator(data) {
  return request('/operators', { method: 'POST', body: JSON.stringify(data) })
}
export function updateOperator(id, data) {
  return request(`/operators/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}
export function resetPassword(id, password) {
  return request(`/operators/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({ password }) })
}

// Purchase orders
export function getPurchaseOrders({ search, status, page = 1 } = {}) {
  const params = new URLSearchParams({ page })
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  return request(`/purchase-orders?${params}`)
}
export function getPurchaseOrder(id) {
  return request(`/purchase-orders/${id}`)
}
export function createPurchaseOrder(data) {
  return request('/purchase-orders', { method: 'POST', body: JSON.stringify(data) })
}
export function confirmPurchaseOrder(id) {
  return request(`/purchase-orders/${id}/confirm`, { method: 'PUT' })
}
export function receivePurchaseOrder(id) {
  return request(`/purchase-orders/${id}/receive`, { method: 'PUT' })
}

// Sales orders
export function getSalesOrders({ search, status, page = 1 } = {}) {
  const params = new URLSearchParams({ page })
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  return request(`/sales-orders?${params}`)
}
export function getSalesOrder(id) {
  return request(`/sales-orders/${id}`)
}
export function createSalesOrder(data) {
  return request('/sales-orders', { method: 'POST', body: JSON.stringify(data) })
}
export function confirmSalesOrder(id) {
  return request(`/sales-orders/${id}/confirm`, { method: 'PUT' })
}
export function deliverSalesOrder(id) {
  return request(`/sales-orders/${id}/deliver`, { method: 'PUT' })
}

// Inventory
export function getInventory({ warehouse_id, category, search, page = 1 } = {}) {
  const params = new URLSearchParams({ page })
  if (warehouse_id) params.set('warehouse_id', warehouse_id)
  if (category) params.set('category', category)
  if (search) params.set('search', search)
  return request(`/inventory?${params}`)
}
export function updateSafetyStock(id, safety_stock) {
  return request(`/inventory/${id}/safety-stock`, { method: 'PUT', body: JSON.stringify({ safety_stock }) })
}
export function getInventoryLedgers({ product_id, warehouse_id, type, start_date, end_date, page = 1 } = {}) {
  const params = new URLSearchParams({ page })
  if (product_id) params.set('product_id', product_id)
  if (warehouse_id) params.set('warehouse_id', warehouse_id)
  if (type) params.set('type', type)
  if (start_date) params.set('start_date', start_date)
  if (end_date) params.set('end_date', end_date)
  return request(`/inventory-ledgers?${params}`)
}
export function doInventoryCheck(data) {
  return request('/inventory-check', { method: 'POST', body: JSON.stringify(data) })
}

// Reports
export function getReport(path, params = {}) {
  const qs = new URLSearchParams(params).toString()
  return request(`/reports/${path}?${qs}`)
}
