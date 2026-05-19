<template>
  <div class="page">
    <div class="header">
      <h1>库存流水</h1>
      <button class="btn-secondary" @click="exportCSV">导出 Excel</button>
    </div>

    <div class="toolbar">
      <input v-model="startDate" @change="fetchList" type="date" class="filter" />
      <span>至</span>
      <input v-model="endDate" @change="fetchList" type="date" class="filter" />
      <select v-model="warehouseFilter" @change="fetchList">
        <option value="">全部仓库</option>
        <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
      </select>
      <select v-model="typeFilter" @change="fetchList">
        <option value="">全部方向</option>
        <option value="in">入库</option>
        <option value="out">出库</option>
      </select>
      <select v-model="productFilter" @change="fetchList">
        <option value="">全部商品</option>
        <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <button class="btn-secondary" @click="fetchList">查询</button>
      <button class="btn-reset" @click="startDate='';endDate='';warehouseFilter='';typeFilter='';productFilter='';fetchList()">重置</button>
    </div>

    <div class="table-wrap">
    <table>
      <thead>
        <tr><th>时间</th><th>商品</th><th>仓库</th><th>方向</th><th>数量</th><th>成本价</th><th>关联单据</th></tr>
      </thead>
      <tbody>
        <tr v-for="l in list" :key="l.id">
          <td>{{ l.created_at?.slice(0,19) }}</td>
          <td>{{ l.product_name }}</td><td>{{ l.warehouse_name }}</td>
          <td :class="l.type === 'in' ? 'in' : 'out'">{{ l.type === 'in' ? '入库' : '出库' }}</td>
          <td>{{ l.quantity }}</td><td>{{ l.cost_price }}</td>
          <td>
            <router-link v-if="l.order_type === 'purchase'" :to="`/purchase-orders/${l.order_id}`">采购单 {{ l.order_no }}</router-link>
            <router-link v-else-if="l.order_type === 'sale'" :to="`/sales-orders/${l.order_id}`">销售单 {{ l.order_no }}</router-link>
            <span v-else class="text-muted">盘点调整</span>
          </td>
        </tr>
        <tr v-if="list.length === 0"><td colspan="7" :class="loading ? 'loading-row' : 'empty'">{{ loading ? '加载中...' : '暂无数据' }}</td></tr>
      </tbody>
    </table>
    </div>

    <div class="pager" v-if="total > pageSize">
      <button :disabled="page <= 1" @click="page--; fetchList()">上一页</button>
      <span>{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" @click="page++; fetchList()">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getInventoryLedgers, getWarehouses, getProducts } from '../api.js'

const list = ref([]), page = ref(1), total = ref(0), pageSize = 20, loading = ref(true)
const startDate = ref(''), endDate = ref(''), warehouseFilter = ref(''), typeFilter = ref(''), productFilter = ref('')
const warehouses = ref([]), products = ref([])

async function fetchList() {
  loading.value = true
  const data = await getInventoryLedgers({
    start_date: startDate.value || undefined,
    end_date: endDate.value || undefined,
    warehouse_id: warehouseFilter.value || undefined,
    type: typeFilter.value || undefined,
    product_id: productFilter.value || undefined,
    page: page.value,
  })
  list.value = data.data; total.value = data.total; loading.value = false
}

async function loadMeta() {
  const [w, p] = await Promise.all([getWarehouses(), getProducts()])
  warehouses.value = w.data; products.value = p.data
}

async function exportCSV() {
  const auth = useAuthStore()
  const params = new URLSearchParams()
  if (startDate.value) params.set('start_date', startDate.value)
  if (endDate.value) params.set('end_date', endDate.value)
  if (warehouseFilter.value) params.set('warehouse_id', warehouseFilter.value)
  if (typeFilter.value) params.set('type', typeFilter.value)
  if (productFilter.value) params.set('product_id', productFilter.value)
  const res = await fetch(`/api/export/inventory-ledger?${params}`, {
    headers: { 'X-Tenant-Id': String(auth.tenant.id) }
  })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = '库存流水.csv'; a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => { await loadMeta(); await fetchList() })
</script>

<style scoped>
.toolbar { flex-wrap: wrap; font-size: var(--font-size-base); }
.in { color: var(--color-success); font-weight: var(--font-weight-semibold); }
.out { color: var(--color-danger); font-weight: var(--font-weight-semibold); }
td a { color: var(--color-primary); text-decoration: none; }
td a:hover { text-decoration: underline; }
.text-muted { color: var(--text-muted); }
</style>
