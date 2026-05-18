<template>
  <div class="page">
    <h1>库存流水</h1>

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
    </div>

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
          <td>{{ l.order_type }}-{{ l.order_id }}</td>
        </tr>
        <tr v-if="list.length === 0"><td colspan="7" class="empty">暂无数据</td></tr>
      </tbody>
    </table>

    <div class="pager" v-if="total > pageSize">
      <button :disabled="page <= 1" @click="page--; fetchList()">上一页</button>
      <span>{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" @click="page++; fetchList()">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getInventoryLedgers, getWarehouses, getProducts } from '../api.js'

const list = ref([]), page = ref(1), total = ref(0), pageSize = 20
const startDate = ref(''), endDate = ref(''), warehouseFilter = ref(''), typeFilter = ref(''), productFilter = ref('')
const warehouses = ref([]), products = ref([])

async function fetchList() {
  const data = await getInventoryLedgers({
    start_date: startDate.value || undefined,
    end_date: endDate.value || undefined,
    warehouse_id: warehouseFilter.value || undefined,
    type: typeFilter.value || undefined,
    product_id: productFilter.value || undefined,
    page: page.value,
  })
  list.value = data.data; total.value = data.total
}

async function loadMeta() {
  const [w, p] = await Promise.all([getWarehouses(), getProducts()])
  warehouses.value = w.data; products.value = p.data
}

onMounted(async () => { await loadMeta(); await fetchList() })
</script>

<style scoped>
.page { max-width: 1100px; }
h1 { font-size: 20px; margin-bottom: 16px; }
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-wrap: wrap; font-size: 13px; }
.filter, select { padding: 5px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; }
table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 6px; overflow: hidden; }
th, td { padding: 8px 12px; text-align: left; font-size: 13px; border-bottom: 1px solid #eee; }
th { background: #f7f8fa; color: #555; font-weight: 600; }
.in { color: #16a34a; font-weight: 600; }
.out { color: #d32; font-weight: 600; }
.empty { text-align: center; color: #999; padding: 40px; }
.pager { display: flex; align-items: center; gap: 12px; margin-top: 16px; font-size: 13px; justify-content: center; }
.pager button { padding: 4px 12px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; }
.pager button:disabled { opacity: .4; cursor: not-allowed; }
</style>
