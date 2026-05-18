<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="logo">lp 低代码平台</div>
      <div class="tenant-info" v-if="tenant">
        <span>{{ tenant.name }}</span>
      </div>
      <nav>
        <router-link to="/">首页</router-link>
        <router-link to="/warehouses">仓库管理</router-link>
        <router-link to="/suppliers">供应商管理</router-link>
        <router-link to="/customers">客户管理</router-link>
        <router-link to="/products">商品管理</router-link>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const tenant = ref(JSON.parse(localStorage.getItem('tenant') || 'null'))

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
