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
  background: var(--bg-page);
}
.card {
  background: var(--bg-surface);
  padding: 40px var(--space-xl);
  border-radius: var(--radius-lg);
  width: 400px;
  text-align: center;
  border: 1px solid var(--border-default);
}
.checkmark {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--color-success); color: #fff; font-size: 28px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto var(--space-md);
}
h1 { font-size: 22px; font-weight: var(--font-weight-semibold); margin-bottom: var(--space-sm); }
p { color: var(--text-secondary); font-size: var(--font-size-md); margin-bottom: var(--space-md); }
ul {
  text-align: left; margin: 0 auto var(--space-lg); padding: 0;
  list-style: none; font-size: var(--font-size-md); color: var(--text-secondary); max-width: 220px;
}
li::before { content: '• '; color: var(--color-success); }
button {
  padding: 10px 48px; background: var(--color-primary); color: #fff;
  border: none; border-radius: var(--radius-sm); font-size: 15px; cursor: pointer;
  font-family: var(--font-family); font-weight: var(--font-weight-medium);
  transition: background var(--transition-fast);
}
button:hover { background: var(--color-primary-hover); }
button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
</style>
