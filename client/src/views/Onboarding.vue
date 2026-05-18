<template>
  <div class="onboarding-page">
    <div class="card">
      <div class="checkmark">✓</div>
      <h1>注册成功！</h1>
      <p>您的商户已创建，独立数据库已就绪。</p>
      <ul>
        <li>默认仓库已创建</li>
        <li>管理员账号已就绪</li>
        <li>进销存模板已加载</li>
      </ul>
      <button @click="goHome">进入系统</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/login')
}
</script>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6fa;
}
.card {
  background: #fff;
  padding: 40px 32px;
  border-radius: 8px;
  width: 400px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,.08);
}
.checkmark {
  width: 56px; height: 56px; border-radius: 50%;
  background: #16a34a; color: #fff; font-size: 28px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
}
h1 { font-size: 22px; margin-bottom: 8px; }
p { color: #666; font-size: 14px; margin-bottom: 16px; }
ul {
  text-align: left; margin: 0 auto 24px; padding: 0;
  list-style: none; font-size: 14px; color: #555; max-width: 220px;
}
li::before { content: '• '; color: #16a34a; }
button {
  padding: 10px 48px; background: #1a56db; color: #fff;
  border: none; border-radius: 4px; font-size: 15px; cursor: pointer;
}
</style>
