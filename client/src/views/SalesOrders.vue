<template>
  <div class="page">
    <div class="header">
      <h1>销售单</h1>
      <button v-if="canWrite()" class="btn-primary" @click="openCreate">+ 新建销售单</button>
    </div>

    <div class="toolbar">
      <input v-model="search" @input="onSearch" placeholder="搜索单号/客户..." class="search" />
      <select v-model="statusFilter" @change="onSearch" class="filter">
        <option value="">全部状态</option>
        <option value="draft">草稿</option>
        <option value="confirmed">已审核</option>
        <option value="delivered">已出库</option>
        <option value="cancelled">已取消</option>
      </select>
    </div>

    <table>
      <thead>
        <tr><th>单号</th><th>客户</th><th>仓库</th><th>金额</th><th>状态</th><th>日期</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="so in list" :key="so.id">
          <td><router-link :to="`/sales-orders/${so.id}`">{{ so.order_no }}</router-link></td>
          <td>{{ so.customer_name }}</td><td>{{ so.warehouse_name }}</td>
          <td>{{ so.total_amount }}</td>
          <td><span :class="`status-${so.status}`">{{ statusMap[so.status] }}</span></td>
          <td>{{ so.ordered_at || so.created_at?.slice(0,10) }}</td>
          <td v-if="canWrite()">
            <button v-if="so.status === 'draft'" @click="handleConfirm(so)">审核</button>
            <button v-if="so.status === 'confirmed'" class="btn-deliver" @click="handleDeliver(so)">出库</button>
          </td>
        </tr>
        <tr v-if="list.length === 0"><td colspan="7" class="empty">暂无数据</td></tr>
      </tbody>
    </table>

    <div class="pager" v-if="total > pageSize">
      <button :disabled="page <= 1" @click="page--; fetchList()">上一页</button>
      <span>{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" @click="page++; fetchList()">下一页</button>
    </div>

    <!-- Create modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal modal-lg">
        <h2>新建销售单</h2>
        <form @submit.prevent="handleSave">
          <div class="row">
            <div>
              <label>客户 *</label>
              <select v-model="form.customer_id" required>
                <option value="">请选择</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label>仓库 *</label>
              <select v-model="form.warehouse_id" required>
                <option value="">请选择</option>
                <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
              </select>
            </div>
          </div>
          <label>单据日期</label>
          <input v-model="form.ordered_at" type="date" />

          <h3>商品明细</h3>
          <table class="item-table">
            <thead>
              <tr><th>商品</th><th>数量</th><th>单价</th><th>金额</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in form.items" :key="idx">
                <td>
                  <select v-model="item.product_id" required>
                    <option value="">请选择</option>
                    <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                </td>
                <td><input v-model.number="item.quantity" type="number" step="0.01" min="0.01" required /></td>
                <td><input v-model.number="item.unit_price" type="number" step="0.01" min="0" required /></td>
                <td>{{ (item.quantity * item.unit_price).toFixed(2) }}</td>
                <td><button type="button" class="btn-sm" @click="form.items.splice(idx,1)">删除</button></td>
              </tr>
            </tbody>
          </table>
          <button type="button" class="btn-secondary" @click="addItem">+ 添加商品</button>

          <p v-if="error" class="error">{{ error }}</p>
          <div class="modal-actions">
            <button type="button" @click="closeModal">取消</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { getProducts, getWarehouses, getCustomers } from '../api.js'
import { getSalesOrders, createSalesOrder, confirmSalesOrder, deliverSalesOrder } from '../api.js'
import { debounce, canWrite } from '../utils.js'

const list = ref([]), search = ref(''), statusFilter = ref(''), page = ref(1), total = ref(0), pageSize = 20
const showModal = ref(false), saving = ref(false), error = ref('')
const customers = ref([]), warehouses = ref([]), products = ref([])
const statusMap = { draft: '草稿', confirmed: '已审核', delivered: '已出库', cancelled: '已取消' }
const form = reactive({ customer_id: '', warehouse_id: '', ordered_at: '', items: [] })

async function fetchList() {
  const data = await getSalesOrders({ search: search.value, status: statusFilter.value, page: page.value })
  list.value = data.data; total.value = data.total
}
function onSearch() { page.value = 1; debouncedSearch() }
const debouncedSearch = debounce(fetchList, 300)

async function loadMeta() {
  const [c, w, p] = await Promise.all([getCustomers(), getWarehouses(), getProducts()])
  customers.value = c.data; warehouses.value = w.data; products.value = p.data
}

function openCreate() {
  error.value = ''
  form.customer_id = ''; form.warehouse_id = ''; form.ordered_at = ''; form.items = []
  addItem()
  showModal.value = true
}
function closeModal() { showModal.value = false }
function addItem() { form.items.push({ product_id: '', quantity: 1, unit_price: 0 }) }

async function handleSave() {
  error.value = ''; saving.value = true
  try {
    await createSalesOrder({
      customer_id: form.customer_id, warehouse_id: form.warehouse_id,
      ordered_at: form.ordered_at || undefined,
      items: form.items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
    })
    closeModal(); await fetchList()
  } catch (e) { error.value = e.message } finally { saving.value = false }
}

async function handleConfirm(so) {
  if (!confirm(`确认审核销售单 ${so.order_no}？`)) return
  await confirmSalesOrder(so.id)
  await fetchList()
}

async function handleDeliver(so) {
  if (!confirm(`确认出库销售单 ${so.order_no}？库存将自动扣减。`)) return
  try {
    await deliverSalesOrder(so.id)
    await fetchList()
  } catch (e) { alert(e.message) }
}

onMounted(async () => { await loadMeta(); await fetchList() })
</script>

<style scoped>
.btn-deliver { padding: 4px 10px; background: #16a34a; color: #fff; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; }
td a { color: #1a56db; text-decoration: none; }
.status-draft { color: #888; }
.status-confirmed { color: #1a56db; }
.status-delivered { color: #16a34a; }
.status-cancelled { color: #d32; }
</style>
