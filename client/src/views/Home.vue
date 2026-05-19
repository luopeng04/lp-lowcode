<template>
  <div class="page">
    <div class="header">
      <div>
        <h1>lp 进销存</h1>
        <p class="page-desc">欢迎回来，{{ auth.tenant?.name || '商户' }}</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.productCount }}</div>
        <div class="stat-label">商品数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.warehouseCount }}</div>
        <div class="stat-label">仓库数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.pendingPO }}</div>
        <div class="stat-label">待处理采购单</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.pendingSO }}</div>
        <div class="stat-label">待处理销售单</div>
      </div>
    </div>

    <div class="quick-links">
      <h3>快捷操作</h3>
      <div class="links-grid">
        <router-link :to="{ path: '/purchase-orders', query: { new: '1' } }" class="quick-link">
          <span class="ql-icon">📋</span>
          <span class="ql-text">新建采购单</span>
        </router-link>
        <router-link :to="{ path: '/sales-orders', query: { new: '1' } }" class="quick-link">
          <span class="ql-icon">📦</span>
          <span class="ql-text">新建销售单</span>
        </router-link>
        <router-link to="/inventory" class="quick-link">
          <span class="ql-icon">🔍</span>
          <span class="ql-text">库存查询</span>
        </router-link>
        <router-link to="/reports" class="quick-link">
          <span class="ql-icon">📊</span>
          <span class="ql-text">经营报表</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getProducts, getWarehouses, getPurchaseOrders, getSalesOrders } from '../api.js'

const auth = useAuthStore()

const stats = ref({
  productCount: 0,
  warehouseCount: 0,
  pendingPO: 0,
  pendingSO: 0,
})

onMounted(async () => {
  try {
    const [p, w, po, so] = await Promise.all([
      getProducts(),
      getWarehouses(),
      getPurchaseOrders({ status: 'draft', pageSize: 1 }),
      getSalesOrders({ status: 'draft', pageSize: 1 }),
    ])
    stats.value.productCount = p.total ?? p.data?.length ?? 0
    stats.value.warehouseCount = w.total ?? w.data?.length ?? 0
    stats.value.pendingPO = po.total ?? 0
    stats.value.pendingSO = so.total ?? 0
  } catch (e) {
    // stats stay at 0
  }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}
.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  transition: border-color var(--transition-fast);
}
.stat-card:hover { border-color: var(--color-primary); }
.stat-value {
  font-size: 28px;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: 1.2;
}
.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--space-xs);
}
.quick-links { margin-top: var(--space-sm); }
.quick-links h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-md);
}
.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
}
.quick-link {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: border-color var(--transition-fast), background var(--transition-fast);
  cursor: pointer;
}
.quick-link:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}
.ql-icon { font-size: 24px; }
.ql-text {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}
</style>
