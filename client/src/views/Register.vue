<template>
  <div class="auth-page">
    <div class="card">
      <h1>注册</h1>
      <form @submit.prevent="handleRegister">
        <label>手机号</label>
        <input v-model="phone" placeholder="请输入手机号" />

        <label>商户名称（选填）</label>
        <input v-model="name" placeholder="商户名称" />

        <label>行业类型（选填，默认通用）</label>
        <select v-model="industry">
          <option value="general">通用</option>
          <option value="retail">零售</option>
          <option value="wholesale">批发</option>
          <option value="catering">餐饮</option>
          <option value="clothing">服装</option>
        </select>

        <label>密码</label>
        <input v-model="password" type="password" placeholder="至少6位密码" />

        <label>确认密码</label>
        <input v-model="confirmPassword" type="password" placeholder="再次输入密码" />

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      <p class="switch">
        已有账号？<router-link to="/login">去登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../api.js'

const router = useRouter()
const phone = ref('')
const name = ref('')
const industry = ref('general')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  if (!phone.value.trim()) { error.value = '请输入手机号'; return }
  if (!/^1[3-9]\d{9}$/.test(phone.value.trim())) { error.value = '手机号格式不正确'; return }
  if (!password.value) { error.value = '请输入密码'; return }
  if (password.value.length < 6) { error.value = '密码至少6位'; return }
  if (password.value !== confirmPassword.value) { error.value = '两次密码输入不一致'; return }

  loading.value = true
  try {
    const data = await register(phone.value.trim(), password.value, name.value.trim(), industry.value)
    router.push({
      name: 'onboarding',
      query: {
        tenantId: data.tenant.id,
        dbName: data.tenant.dbName,
        industry: data.industry?.code || 'general',
        industryName: data.industry?.name || '通用',
      },
    })
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
select {
  width: 100%; padding: 8px 12px; border: 1px solid var(--border-default); border-radius: var(--radius-sm);
  font-size: var(--font-size-md); box-sizing: border-box; font-family: var(--font-family);
  background: var(--bg-surface); transition: border-color var(--transition-fast);
  appearance: none; -webkit-appearance: none;
}
select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-light); }
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
</style>
