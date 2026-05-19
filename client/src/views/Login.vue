<template>
  <div class="auth-page">
    <div class="card">
      <h1>登录</h1>
      <form @submit.prevent="handleLogin">
        <label>手机号（商户号）</label>
        <input v-model="phone" placeholder="请输入商户手机号" />

        <label v-if="showUsername">操作员用户名</label>
        <input v-if="showUsername" v-model="username" placeholder="管理员留空" />

        <label>密码</label>
        <input v-model="password" type="password" placeholder="请输入密码" />

        <label class="toggle-user" @click="showUsername = !showUsername">
          {{ showUsername ? '管理员登录' : '操作员登录' }}
        </label>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <p class="switch">
        没有账号？<router-link to="/register">去注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { login } from '../api.js'

const router = useRouter()
const auth = useAuthStore()
const phone = ref('')
const username = ref('')
const password = ref('')
const showUsername = ref(false)
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const data = await login(phone.value, password.value, username.value || undefined)
    auth.setAuth(data.tenant, data.operator)
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
}
.card {
  background: var(--bg-surface);
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
  width: 360px;
  border: 1px solid var(--border-default);
}
h1 { font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-lg); }
label { display: block; font-size: var(--font-size-base); color: var(--text-secondary); margin: 12px 0 4px; font-weight: var(--font-weight-medium); }
input {
  width: 100%; padding: 8px 12px; border: 1px solid var(--border-default); border-radius: var(--radius-sm);
  font-size: var(--font-size-md); box-sizing: border-box; font-family: var(--font-family);
  transition: border-color var(--transition-fast);
}
input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-light); }
button {
  width: 100%; margin-top: 20px; padding: 10px; background: var(--color-primary);
  color: #fff; border: none; border-radius: var(--radius-sm); font-size: 15px; cursor: pointer;
  font-family: var(--font-family); font-weight: var(--font-weight-medium);
  transition: background var(--transition-fast);
}
button:hover { background: var(--color-primary-hover); }
button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
button:disabled { opacity: .6; cursor: not-allowed; }
.error { color: var(--color-danger); font-size: var(--font-size-base); margin-top: 12px; }
.switch { margin-top: var(--space-md); font-size: var(--font-size-base); color: var(--text-muted); text-align: center; }
.switch a { color: var(--color-primary); text-decoration: none; }
.toggle-user { color: var(--color-primary); cursor: pointer; font-size: var(--font-size-sm); margin-top: 0 !important; user-select: none; }
</style>
