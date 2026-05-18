<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="logo">lp 低代码平台</div>
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
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #1a1a2e;
  color: #eee;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.sidebar .logo {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #fff;
}

.sidebar nav a {
  display: block;
  color: #aab;
  text-decoration: none;
  padding: 8px 0;
  font-size: 14px;
}

.sidebar nav a:hover,
.sidebar nav a.router-link-active {
  color: #fff;
}

.sidebar .tenant-info {
  font-size: 13px; color: #8af; margin-bottom: 16px;
  padding: 8px 10px; background: rgba(255,255,255,.08); border-radius: 4px;
}
.sidebar .bottom {
  margin-top: auto; padding-top: 20px; border-top: 1px solid rgba(255,255,255,.1);
}
.sidebar .bottom a { color: #aab; text-decoration: none; font-size: 13px; cursor: pointer; }
.main {
  flex: 1;
  padding: 24px;
  background: #f5f6fa;
}
</style>
