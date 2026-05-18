<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="logo">lp 进销存</div>
      <div class="tenant-info" v-if="tenant">
        <span>{{ tenant.name }}</span>
        <small>{{ roleLabel }}</small>
      </div>
      <nav>
        <router-link v-for="m in visibleMenus" :key="m.path" :to="m.path">{{ m.label }}</router-link>
      </nav>
      <div class="bottom">
        <a @click.prevent="logout" href="#">退出登录</a>
      </div>
    </aside>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const tenant = ref(JSON.parse(localStorage.getItem('tenant') || 'null'))
const operator = ref(JSON.parse(localStorage.getItem('operator') || 'null'))

const allMenus = [
  { path: '/', label: '首页', roles: ['admin', 'operator', 'readonly'] },
  { path: '/warehouses', label: '仓库管理', roles: ['admin', 'operator', 'readonly'] },
  { path: '/suppliers', label: '供应商管理', roles: ['admin', 'operator', 'readonly'] },
  { path: '/customers', label: '客户管理', roles: ['admin', 'operator', 'readonly'] },
  { path: '/products', label: '商品管理', roles: ['admin', 'operator', 'readonly'] },
  { path: '/purchase-orders', label: '采购单', roles: ['admin', 'operator', 'readonly'] },
  { path: '/sales-orders', label: '销售单', roles: ['admin', 'operator', 'readonly'] },
  { path: '/inventory', label: '库存查询', roles: ['admin', 'operator', 'readonly'] },
  { path: '/inventory-ledger', label: '库存流水', roles: ['admin', 'operator', 'readonly'] },
  { path: '/reports', label: '经营报表', roles: ['admin', 'operator', 'readonly'] },
  { path: '/operators', label: '操作员管理', roles: ['admin'] },
]

const visibleMenus = computed(() => {
  const role = operator.value?.role || 'readonly'
  return allMenus.filter(m => m.roles.includes(role))
})

const roleLabel = computed(() => {
  const map = { admin: '管理员', operator: '操作员', readonly: '只读' }
  return map[operator.value?.role] || ''
})

function logout() {
  localStorage.removeItem('tenant')
  localStorage.removeItem('operator')
  router.push('/login')
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  color: var(--text-on-dark);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
}

.sidebar .logo {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-lg);
  color: var(--text-on-dark-active);
}

.sidebar nav a {
  display: block;
  color: var(--text-on-dark-muted);
  text-decoration: none;
  padding: 8px 12px;
  margin: 2px -8px;
  font-size: var(--font-size-md);
  transition: all var(--transition-fast);
  border-radius: var(--radius-sm);
  border-left: 3px solid transparent;
}

.sidebar nav a:hover {
  color: var(--text-on-dark-active);
  background: var(--bg-sidebar-hover);
}

.sidebar nav a.router-link-exact-active {
  color: var(--text-on-dark-active);
  background: var(--bg-sidebar-hover);
  border-left-color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.sidebar nav a.router-link-active:not(.router-link-exact-active) {
  color: var(--text-on-dark-active);
}

.sidebar nav a:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.sidebar .tenant-info {
  font-size: var(--font-size-base); color: var(--color-primary-light); margin-bottom: var(--space-md);
  padding: 8px 10px; background: var(--bg-sidebar-hover); border-radius: var(--radius-sm);
}
.sidebar .bottom {
  margin-top: auto; padding-top: var(--space-lg); border-top: 1px solid rgba(255,255,255,.1);
}
.sidebar .bottom a { color: var(--text-on-dark-muted); text-decoration: none; font-size: var(--font-size-base); cursor: pointer; transition: color var(--transition-fast); }
.sidebar .bottom a:hover { color: var(--text-on-dark-active); }
.main {
  flex: 1;
  padding: var(--space-lg);
  background: var(--bg-page);
}
</style>
