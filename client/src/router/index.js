import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/Register.vue'),
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('../views/Onboarding.vue'),
  },
  {
    path: '/',
    component: () => import('../layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../views/Home.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'warehouses',
        name: 'warehouses',
        component: () => import('../views/Warehouses.vue'),
        meta: { title: '仓库管理' },
      },
      {
        path: 'suppliers',
        name: 'suppliers',
        component: () => import('../views/Suppliers.vue'),
        meta: { title: '供应商管理' },
      },
      {
        path: 'customers',
        name: 'customers',
        component: () => import('../views/Customers.vue'),
        meta: { title: '客户管理' },
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('../views/Products.vue'),
        meta: { title: '商品管理' },
      },
      {
        path: 'operators',
        name: 'operators',
        component: () => import('../views/Operators.vue'),
        meta: { title: '操作员管理' },
      },
      {
        path: 'purchase-orders',
        name: 'purchase-orders',
        component: () => import('../views/PurchaseOrders.vue'),
        meta: { title: '采购单' },
      },
      {
        path: 'purchase-orders/:id',
        name: 'purchase-order-detail',
        component: () => import('../views/PurchaseOrderDetail.vue'),
        meta: { title: '采购单详情' },
      },
      {
        path: 'sales-orders',
        name: 'sales-orders',
        component: () => import('../views/SalesOrders.vue'),
        meta: { title: '销售单' },
      },
      {
        path: 'sales-orders/:id',
        name: 'sales-order-detail',
        component: () => import('../views/SalesOrderDetail.vue'),
        meta: { title: '销售单详情' },
      },
      {
        path: 'inventory',
        name: 'inventory',
        component: () => import('../views/Inventory.vue'),
        meta: { title: '库存查询' },
      },
      {
        path: 'inventory-ledger',
        name: 'inventory-ledger',
        component: () => import('../views/InventoryLedger.vue'),
        meta: { title: '库存流水' },
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('../views/Reports.vue'),
        meta: { title: '经营报表' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  document.title = (to.meta.title ? `${to.meta.title} - ` : '') + 'lp 低代码平台'

  if (to.meta.requiresAuth) {
    const tenant = localStorage.getItem('tenant')
    if (!tenant) return '/login'
  }
})

export default router
