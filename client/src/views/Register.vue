<template>
  <div class="auth-page">
    <div class="card">
      <h1>注册</h1>
      <form @submit.prevent="handleRegister">
        <label>手机号</label>
        <input v-model="phone" placeholder="请输入手机号" />

        <label>商户名称（选填）</label>
        <input v-model="name" placeholder="商户名称" />

        <label>密码</label>
        <input v-model="password" type="password" placeholder="至少6位密码" />

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
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    const data = await register(phone.value, password.value, name.value)
    router.push({ name: 'onboarding', query: { tenantId: data.tenant.id, dbName: data.tenant.dbName } })
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
  background: #f5f6fa;
}
.card {
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  width: 360px;
  box-shadow: 0 2px 12px rgba(0,0,0,.08);
}
h1 { font-size: 20px; margin-bottom: 20px; }
label { display: block; font-size: 13px; color: #555; margin: 12px 0 4px; }
input {
  width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px;
  font-size: 14px; box-sizing: border-box;
}
button {
  width: 100%; margin-top: 20px; padding: 10px; background: #1a56db;
  color: #fff; border: none; border-radius: 4px; font-size: 15px; cursor: pointer;
}
button:disabled { opacity: .6; cursor: not-allowed; }
.error { color: #d32; font-size: 13px; margin-top: 12px; }
.switch { margin-top: 16px; font-size: 13px; color: #888; text-align: center; }
</style>
