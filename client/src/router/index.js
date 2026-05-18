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
      },
      {
        path: 'warehouses',
        name: 'warehouses',
        component: () => import('../views/Warehouses.vue'),
      },
      {
        path: 'suppliers',
        name: 'suppliers',
        component: () => import('../views/Suppliers.vue'),
      },
      {
        path: 'customers',
        name: 'customers',
        component: () => import('../views/Customers.vue'),
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('../views/Products.vue'),
      },
      {
        path: 'operators',
        name: 'operators',
        component: () => import('../views/Operators.vue'),
      },
      {
        path: 'purchase-orders',
        name: 'purchase-orders',
        component: () => import('../views/PurchaseOrders.vue'),
      },
      {
        path: 'purchase-orders/:id',
        name: 'purchase-order-detail',
        component: () => import('../views/PurchaseOrderDetail.vue'),
      },
      {
        path: 'sales-orders',
        name: 'sales-orders',
        component: () => import('../views/SalesOrders.vue'),
      },
      {
        path: 'sales-orders/:id',
        name: 'sales-order-detail',
        component: () => import('../views/SalesOrderDetail.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    const tenant = localStorage.getItem('tenant')
    if (!tenant) return '/login'
  }
})

export default router
