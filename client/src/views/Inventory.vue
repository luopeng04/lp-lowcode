<template>
  <div class="page">
    <div class="header">
      <h1>库存查询</h1>
      <button class="btn-secondary" @click="exportCSV">导出 Excel</button>
    </div>

    <div class="toolbar">
      <input v-model="search" @input="onSearch" @keyup.enter="fetchList" placeholder="搜索商品..." class="search" />
      <select v-model="warehouseFilter" @change="onSearch">
        <option value="">全部仓库</option>
        <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
      </select>
      <select v-model="categoryFilter" @change="onSearch">
        <option value="">全部分类</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <button class="btn-secondary" @click="fetchList">查询</button>
      <button class="btn-reset" @click="search='';warehouseFilter='';categoryFilter='';fetchList()">重置</button>
    </div>

    <div class="table-wrap">
    <table>
      <thead>
        <tr><th>商品</th><th>编码</th><th>仓库</th><th>分类</th><th>数量</th><th>安全库存</th><th>均价</th><th>金额</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="r in list" :key="r.id" :class="{ warn: r.quantity <= r.safety_stock && r.safety_stock > 0 }">
          <td>{{ r.product_name }}</td><td>{{ r.product_code }}</td><td>{{ r.warehouse_name }}</td>
          <td>{{ r.category || '-' }}</td>
          <td :class="{ low: r.quantity <= r.safety_stock && r.safety_stock > 0 }">{{ r.quantity }}</td>
          <td>{{ r.safety_stock }}</td><td>{{ r.avg_cost }}</td>
          <td>{{ (r.quantity * r.avg_cost).toFixed(2) }}</td>
          <td v-if="canWrite()"><button @click="openSafety(r)">设置安全库存</button></td>
        </tr>
        <tr v-if="list.length === 0"><td colspan="9" class="empty">暂无数据</td></tr>
      </tbody>
    </table>
    </div>

    <!-- Safety stock modal -->
    <div class="modal-overlay" v-if="showSafety" @click.self="closeSafety">
      <div class="modal">
        <h2>设置安全库存 - {{ safetyTarget?.product_name }}</h2>
        <form @submit.prevent="handleSafety">
          <label>安全库存量</label>
          <input v-model.number="safetyValue" type="number" step="0.01" min="0" />
          <p v-if="safetyError" class="error">{{ safetyError }}</p>
          <div class="modal-actions">
            <button type="button" @click="closeSafety">取消</button>
            <button type="submit" class="btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Stock check -->
    <div v-if="canWrite()" class="card">
      <h2>库存盘点</h2>
      <select v-model="checkWarehouse" class="check-select">
        <option value="">选择仓库</option>
        <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
      </select>
      <button class="btn-secondary" @click="loadCheckItems">加载商品</button>

      <table v-if="checkItems.length > 0" class="check-table">
        <thead><tr><th>商品</th><th>账面数量</th><th>实盘数量</th><th>差异</th></tr></thead>
        <tbody>
          <tr v-for="(item, idx) in checkItems" :key="idx">
            <td>{{ item.product_name }}</td>
            <td>{{ item.book_qty }}</td>
            <td><input v-model.number="item.actual_qty" type="number" step="0.01" /></td>
            <td :class="{ diff: (item.actual_qty - item.book_qty) !== 0 }">{{ (item.actual_qty - item.book_qty).toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
      <button v-if="checkItems.length > 0" class="btn-primary check-submit" @click="submitCheck">保存盘点结果</button>
      <p v-if="checkResult" class="success">{{ checkResult }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getInventory, updateSafetyStock, getWarehouses, doInventoryCheck } from '../api.js'
import { debounce, canWrite } from '../utils.js'

const list = ref([]), search = ref(''), warehouseFilter = ref(''), categoryFilter = ref('')
const page = ref(1), total = ref(0), pageSize = 20
const warehouses = ref([]), categories = ref([])
const showSafety = ref(false), safetyTarget = ref(null), safetyValue = ref(0), safetyError = ref('')
const checkWarehouse = ref(''), checkItems = ref([]), checkResult = ref('')

async function fetchList() {
  const data = await getInventory({
    search: search.value, warehouse_id: warehouseFilter.value, category: categoryFilter.value, page: page.value
  })
  list.value = data.data; total.value = data.total
}
function onSearch() { page.value = 1; debouncedSearch() }
const debouncedSearch = debounce(fetchList, 300)

async function loadMeta() {
  const w = await getWarehouses()
  warehouses.value = w.data
}

function openSafety(r) {
  safetyTarget.value = r; safetyValue.value = r.safety_stock; safetyError.value = ''
  showSafety.value = true
}
function closeSafety() { showSafety.value = false }
async function handleSafety() {
  safetyError.value = ''
  try {
    await updateSafetyStock(safetyTarget.value.id, safetyValue.value)
    closeSafety()
    await fetchList()
  } catch (e) { safetyError.value = e.message }
}

async function loadCheckItems() {
  if (!checkWarehouse.value) return
  const data = await getInventory({ warehouse_id: checkWarehouse.value, pageSize: 1000 })
  checkItems.value = data.data.map(r => ({
    product_id: r.product_id, product_name: r.product_name,
    book_qty: parseFloat(r.quantity), actual_qty: 0,
  }))
}

async function submitCheck() {
  await doInventoryCheck({ warehouse_id: checkWarehouse.value, items: checkItems.value.map(i => ({
    product_id: i.product_id, actual_qty: i.actual_qty || 0
  }))})
  checkResult.value = '盘点完成！库存已更新。'
  await fetchList()
}

async function exportCSV() {
  const auth = useAuthStore()
  const params = new URLSearchParams()
  if (warehouseFilter.value) params.set('warehouse_id', warehouseFilter.value)
  if (categoryFilter.value) params.set('category', categoryFilter.value)
  if (search.value) params.set('search', search.value)
  const res = await fetch(`/api/export/inventory?${params}`, {
    headers: { 'X-Tenant-Id': String(auth.tenant.id) }
  })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = '库存汇总.csv'; a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => { await loadMeta(); await fetchList() })
</script>

<style scoped>
h2 { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: 12px; }
.warn { background: var(--color-warning-light); }
.low { color: var(--color-danger); font-weight: var(--font-weight-bold); }
.diff { color: var(--color-danger); font-weight: var(--font-weight-bold); }
.card { background: var(--bg-surface); border-radius: var(--radius-md); padding: var(--space-lg); margin-top: var(--space-lg); border: 1px solid var(--border-default); }
.check-select { width: 200px; display: block; margin-bottom: 12px; }
.check-table { margin-top: 12px; }
.check-submit { margin-top: 12px; }
.modal { width: 380px; }
.modal input { margin-bottom: 10px; }
.modal-actions { margin-top: 8px; }
.success { color: var(--color-success); font-size: var(--font-size-md); margin-top: var(--space-sm); }
</style>
