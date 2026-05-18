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
import { login } from '../api.js'

const router = useRouter()
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
    localStorage.setItem('tenant', JSON.stringify(data.tenant))
    localStorage.setItem('operator', JSON.stringify(data.operator))
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
.toggle-user { color: #1a56db; cursor: pointer; font-size: 12px; margin-top: 0 !important; user-select: none; }
</style>
