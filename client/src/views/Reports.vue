<template>
  <div class="page">
    <h1>经营分析报表</h1>

    <div class="tabs">
      <button v-for="t in tabs" :key="t.key" :class="{ active: tab === t.key }" @click="tab = t.key">{{ t.label }}</button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input v-model="startDate" @change="load" type="date" />
      <span>至</span>
      <input v-model="endDate" @change="load" type="date" />
      <select v-model="period" @change="load" v-if="tab === 'sales'">
        <option value="day">按日</option>
        <option value="week">按周</option>
        <option value="month">按月</option>
      </select>
      <select v-model="warehouseFilter" @change="load" v-if="tab === 'sales' || tab === 'turnover'">
        <option value="">全部仓库</option>
        <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
      </select>
      <select v-model="productFilter" @change="load" v-if="tab === 'profit' || tab === 'purchase'">
        <option value="">全部商品</option>
        <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <button class="btn-primary" @click="load" style="margin-left:8px">查询</button>
    </div>

    <!-- Sales Summary -->
    <div v-if="tab === 'sales'">
      <table>
        <thead><tr><th>周期</th><th>订单数</th><th>销售数量</th><th>销售金额</th></tr></thead>
        <tbody>
          <tr v-for="r in data" :key="r.period">
            <td>{{ r.period }}</td><td>{{ r.order_count }}</td><td>{{ r.total_qty }}</td><td>{{ r.total_amount }}</td>
          </tr>
          <tr v-if="data.length === 0"><td colspan="4" class="empty">暂无数据</td></tr>
        </tbody>
      </table>
      <!-- Bar chart -->
      <div class="chart" v-if="data.length > 0">
        <div v-for="r in data" :key="r.period" class="bar-row">
          <span class="bar-label">{{ r.period }}</span>
          <div class="bar" :style="{ width: barWidth(r.total_amount) + '%' }"></div>
          <span class="bar-val">{{ r.total_amount }}</span>
        </div>
      </div>
    </div>

    <!-- Profit Analysis -->
    <div v-if="tab === 'profit'">
      <table>
        <thead><tr><th>商品</th><th>销量</th><th>收入</th><th>成本</th><th>毛利</th><th>利润率</th></tr></thead>
        <tbody>
          <tr v-for="r in data" :key="r.product_code">
            <td>{{ r.product_name }}</td><td>{{ r.total_qty }}</td><td>{{ r.revenue }}</td><td>{{ r.cost }}</td>
            <td :class="{ green: r.profit > 0, red: r.profit < 0 }">{{ r.profit }}</td>
            <td>{{ r.revenue > 0 ? ((r.profit / r.revenue) * 100).toFixed(1) + '%' : '-' }}</td>
          </tr>
          <tr v-if="data.length === 0"><td colspan="6" class="empty">暂无数据</td></tr>
        </tbody>
      </table>
      <!-- Bar chart -->
      <div class="chart" v-if="data.length > 0">
        <div v-for="r in data" :key="r.product_code" class="bar-row">
          <span class="bar-label">{{ r.product_name }}</span>
          <div class="bar profit" :style="{ width: profitBar(r) + '%' }"></div>
          <span class="bar-val">{{ r.profit }}</span>
        </div>
      </div>
    </div>

    <!-- Purchase Summary -->
    <div v-if="tab === 'purchase'">
      <table>
        <thead><tr><th>供应商</th><th>商品</th><th>订单数</th><th>采购数量</th><th>采购金额</th></tr></thead>
        <tbody>
          <tr v-for="r in data" :key="r.supplier_name + r.product_name">
            <td>{{ r.supplier_name }}</td><td>{{ r.product_name }}</td><td>{{ r.order_count }}</td><td>{{ r.total_qty }}</td><td>{{ r.total_amount }}</td>
          </tr>
          <tr v-if="data.length === 0"><td colspan="5" class="empty">暂无数据</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Turnover -->
    <div v-if="tab === 'turnover'">
      <table>
        <thead><tr><th>商品</th><th>仓库</th><th>入库总量</th><th>出库总量</th><th>操作次数</th></tr></thead>
        <tbody>
          <tr v-for="r in data" :key="r.product_name + r.warehouse_name">
            <td>{{ r.product_name }}</td><td>{{ r.warehouse_name }}</td><td>{{ r.total_in }}</td><td>{{ r.total_out }}</td><td>{{ r.tx_count }}</td>
          </tr>
          <tr v-if="data.length === 0"><td colspan="5" class="empty">暂无数据</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getWarehouses, getProducts } from '../api.js'

const tab = ref('sales')
const tabs = [
  { key: 'sales', label: '销售统计' },
  { key: 'profit', label: '利润分析' },
  { key: 'purchase', label: '采购汇总' },
  { key: 'turnover', label: '库存周转' },
]
const data = ref([])
const startDate = ref(''), endDate = ref(''), period = ref('day')
const warehouseFilter = ref(''), productFilter = ref('')
const warehouses = ref([]), products = ref([])

async function load() {
  const tenant = JSON.parse(localStorage.getItem('tenant') || '{}')
  const headers = { 'X-Tenant-Id': String(tenant.id) }

  let url = ''
  const params = new URLSearchParams()
  if (startDate.value) params.set('start_date', startDate.value)
  if (endDate.value) params.set('end_date', endDate.value)

  if (tab.value === 'sales') {
    url = '/api/reports/sales-summary'
    params.set('period', period.value)
    if (warehouseFilter.value) params.set('warehouse_id', warehouseFilter.value)
  } else if (tab.value === 'profit') {
    url = '/api/reports/profit'
    if (productFilter.value) params.set('product_id', productFilter.value)
  } else if (tab.value === 'purchase') {
    url = '/api/reports/purchase-summary'
    if (productFilter.value) params.set('product_id', productFilter.value)
  } else if (tab.value === 'turnover') {
    url = '/api/reports/turnover'
    if (warehouseFilter.value) params.set('warehouse_id', warehouseFilter.value)
  }

  const res = await fetch(`${url}?${params}`, { headers })
  const json = await res.json()
  data.value = json.data
}

function barWidth(val) {
  const max = Math.max(...data.value.map(r => parseFloat(r.total_amount || 0)), 1)
  return (parseFloat(val) / max) * 100
}

function profitBar(r) {
  const absMax = Math.max(...data.value.map(r2 => Math.abs(parseFloat(r2.profit || 0))), 1)
  return (Math.abs(parseFloat(r.profit || 0)) / absMax) * 100
}

watch(tab, load)

onMounted(async () => {
  const [w, p] = await Promise.all([getWarehouses(), getProducts()])
  warehouses.value = w.data; products.value = p.data
  await load()
})
</script>

<style scoped>
.tabs { display: flex; gap: 4px; margin-bottom: 12px; }
.tabs button { padding: 7px 16px; border: 1px solid #ddd; background: #fff; cursor: pointer; font-size: 13px; border-radius: 4px; }
.tabs button.active { background: #1a56db; color: #fff; border-color: #1a56db; }
.filters { display: flex; gap: 8px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; font-size: 13px; }
.filters input, .filters select { padding: 5px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; }
table { margin-bottom: 20px; }
.green { color: #16a34a; font-weight: 600; }
.red { color: #d32; font-weight: 600; }
.chart { margin-top: 8px; }
.bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.bar-label { width: 80px; font-size: 12px; text-align: right; color: #555; flex-shrink: 0; }
.bar { height: 18px; background: #1a56db; border-radius: 3px; min-width: 2px; transition: width .3s; }
.bar.profit { background: #16a34a; }
.bar-val { font-size: 12px; color: #555; width: 80px; flex-shrink: 0; }
</style>
