<template>
  <div class="page">
    <div class="header">
      <h1>采购单</h1>
      <div class="header-actions" v-if="canWrite()">
        <button class="btn-secondary" @click="openOrderFields">订单字段</button>
        <button class="btn-secondary" @click="openItemFields">明细字段</button>
        <button class="btn-primary" @click="openCreate">+ 新建采购单</button>
      </div>
    </div>

    <div class="toolbar">
      <input v-model="search" @input="onSearch" @keyup.enter="fetchList" placeholder="搜索单号/供应商..." class="search" />
      <select v-model="statusFilter" @change="onSearch" class="filter">
        <option value="">全部状态</option>
        <option value="draft">草稿</option>
        <option value="confirmed">已审核</option>
        <option value="received">已入库</option>
        <option value="cancelled">已取消</option>
      </select>
      <button class="btn-secondary" @click="fetchList">查询</button>
      <button class="btn-reset" @click="search='';statusFilter='';fetchList()">重置</button>
    </div>

    <div class="table-wrap">
    <table>
      <thead>
        <tr><th>单号</th><th>供应商</th><th>仓库</th><th>金额</th><th>状态</th><th>日期</th><th v-for="f in orderFields" :key="f.field_name">{{ f.field_label }}</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="po in list" :key="po.id">
          <td>
            <router-link :to="`/purchase-orders/${po.id}`">{{ po.order_no }}</router-link>
          </td>
          <td>{{ po.supplier_name }}</td><td>{{ po.warehouse_name }}</td>
          <td>{{ po.total_amount }}</td>
          <td><span :class="`status-${po.status}`">{{ statusMap[po.status] }}</span></td>
          <td>{{ po.ordered_at || po.created_at?.slice(0,10) }}</td>
          <td v-for="f in orderFields" :key="f.field_name">{{ (po.custom_data || {})[f.field_name] || '-' }}</td>
          <td v-if="canWrite()">
            <button v-if="po.status === 'draft'" @click="handleConfirm(po)">审核</button>
            <button v-if="po.status === 'confirmed'" class="btn-success" @click="handleReceive(po)">入库</button>
          </td>
        </tr>
        <tr v-if="list.length === 0"><td :colspan="7 + orderFields.length" :class="loading ? 'loading-row' : 'empty'">{{ loading ? '加载中...' : '暂无数据' }}</td></tr>
      </tbody>
    </table>
    </div>

    <div class="pager" v-if="total > pageSize">
      <button :disabled="page <= 1" @click="page--; fetchList()">上一页</button>
      <span>{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" @click="page++; fetchList()">下一页</button>
    </div>

    <!-- Create modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal modal-lg">
        <h2>新建采购单</h2>
        <form @submit.prevent="handleSave">
          <div class="row">
            <div>
              <label>供应商 *</label>
              <select v-model="form.supplier_id" required>
                <option value="">请选择</option>
                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
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

          <div v-for="f in orderFields" :key="f.field_name">
            <label>{{ f.field_label }}</label>
            <input v-if="f.field_type === 'text' || f.field_type === 'number'" v-model="form.custom_data[f.field_name]" :type="f.field_type" />
            <select v-else-if="f.field_type === 'select'" v-model="form.custom_data[f.field_name]">
              <option value="">请选择</option>
              <option v-for="opt in (typeof f.options === 'string' ? JSON.parse(f.options) : f.options || [])" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <input v-else-if="f.field_type === 'date'" v-model="form.custom_data[f.field_name]" type="date" />
          </div>

          <h3>商品明细</h3>
          <table class="item-table">
            <thead>
              <tr><th>商品</th><th>数量</th><th>单价</th><th>金额</th><th v-for="f in itemFields" :key="f.field_name">{{ f.field_label }}</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in form.items" :key="idx">
                <td>
                  <select v-model="item.product_id" required>
                    <option value="">请选择</option>
                    <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ p.code }})</option>
                  </select>
                </td>
                <td><input v-model.number="item.quantity" type="number" step="0.01" min="0.01" required /></td>
                <td><input v-model.number="item.unit_price" type="number" step="0.01" min="0" required /></td>
                <td>{{ (item.quantity * item.unit_price).toFixed(2) }}</td>
                <td v-for="f in itemFields" :key="f.field_name">
                  <input v-if="f.field_type === 'text' || f.field_type === 'number'" v-model="item.custom_data[f.field_name]" :type="f.field_type" style="width:80px" />
                  <select v-else-if="f.field_type === 'select'" v-model="item.custom_data[f.field_name]" style="width:80px">
                    <option value="">-</option>
                    <option v-for="opt in (typeof f.options === 'string' ? JSON.parse(f.options) : f.options || [])" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <input v-else-if="f.field_type === 'date'" v-model="item.custom_data[f.field_name]" type="date" style="width:110px" />
                </td>
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

    <CustomFieldsModal :visible="showOrderFieldsModal" :fields="orderFields" :newField="orderNewField" :error="orderFieldError" @close="closeOrderFields" @add="addOrderField" @delete="deleteOrderField" />
    <CustomFieldsModal :visible="showItemFieldsModal" :fields="itemFields" :newField="itemNewField" :error="itemFieldError" @close="closeItemFields" @add="addItemField" @delete="deleteItemField" />

    <ConfirmModal v-if="confirmMsg" :message="confirmMsg" @confirm="onConfirm" @cancel="confirmMsg = ''" />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { getProducts, getWarehouses, getSuppliers } from '../api.js'
import { getPurchaseOrders, createPurchaseOrder, confirmPurchaseOrder, receivePurchaseOrder } from '../api.js'
import ConfirmModal from '../components/ConfirmModal.vue'
import CustomFieldsModal from '../components/CustomFieldsModal.vue'
import { debounce, canWrite } from '../utils.js'
import { useCustomFields } from '../composables/useCustomFields'

const route = useRoute()
const list = ref([]), search = ref(''), statusFilter = ref(''), page = ref(1), total = ref(0), pageSize = 20, loading = ref(true)
const showModal = ref(false), saving = ref(false), error = ref('')
const suppliers = ref([]), warehouses = ref([]), products = ref([])
const statusMap = { draft: '草稿', confirmed: '已审核', received: '已入库', cancelled: '已取消' }
const confirmMsg = ref(''), confirmAction = ref(null)

const orderFieldsCtx = useCustomFields('purchase_order')
const itemFieldsCtx = useCustomFields('purchase_order_item')
const { customFields: orderFields, showFieldsModal: showOrderFieldsModal, fieldError: orderFieldError, newField: orderNewField, fetchFields: fetchOrderFields, openFieldsModal: openOrderFields, closeFieldsModal: closeOrderFields, addField: addOrderField, deleteField: deleteOrderField } = orderFieldsCtx
const { customFields: itemFields, showFieldsModal: showItemFieldsModal, fieldError: itemFieldError, newField: itemNewField, fetchFields: fetchItemFields, openFieldsModal: openItemFields, closeFieldsModal: closeItemFields, addField: addItemField, deleteField: deleteItemField } = itemFieldsCtx

const form = reactive({ supplier_id: '', warehouse_id: '', ordered_at: '', custom_data: {}, items: [] })

async function fetchList() {
  loading.value = true
  const data = await getPurchaseOrders({ search: search.value, status: statusFilter.value, page: page.value })
  list.value = data.data; total.value = data.total; loading.value = false
}
function onSearch() { page.value = 1; debouncedSearch() }
const debouncedSearch = debounce(fetchList, 300)

async function loadMeta() {
  const [s, w, p] = await Promise.all([getSuppliers(), getWarehouses(), getProducts()])
  suppliers.value = s.data; warehouses.value = w.data; products.value = p.data
}

function openCreate() {
  error.value = ''
  form.supplier_id = ''; form.warehouse_id = ''; form.ordered_at = ''; form.custom_data = {}; form.items = []
  addItem()
  showModal.value = true
}
function closeModal() { showModal.value = false }
function addItem() { form.items.push({ product_id: '', quantity: 1, unit_price: 0, custom_data: {} }) }

async function handleSave() {
  error.value = ''; saving.value = true
  try {
    await createPurchaseOrder({
      supplier_id: form.supplier_id, warehouse_id: form.warehouse_id,
      ordered_at: form.ordered_at || undefined,
      custom_data: form.custom_data,
      items: form.items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price, custom_data: i.custom_data })),
    })
    closeModal(); await fetchList()
  } catch (e) { error.value = e.message } finally { saving.value = false }
}

function askConfirm(msg, action) {
  confirmMsg.value = msg; confirmAction.value = action
}
async function onConfirm() {
  try { await confirmAction.value() } catch (e) { alert(e.message) }
  confirmMsg.value = ''; await fetchList()
}

async function handleConfirm(po) {
  askConfirm(`确认审核采购单 ${po.order_no}？`, () => confirmPurchaseOrder(po.id))
}
async function handleReceive(po) {
  askConfirm(`确认入库采购单 ${po.order_no}？库存将自动更新。`, () => receivePurchaseOrder(po.id))
}

onMounted(async () => {
  await loadMeta()
  await fetchOrderFields()
  await fetchItemFields()
  await fetchList()
  if (route.query.new === '1' && canWrite()) openCreate()
})
</script>

<style scoped>
.btn-success { padding: 4px 10px; font-size: var(--font-size-sm); }
td a { color: var(--color-primary); text-decoration: none; }
td a:hover { text-decoration: underline; }
.status-draft { color: var(--color-draft); background: none; padding: 0; }
.status-confirmed { color: var(--color-info); background: none; padding: 0; }
.status-received { color: var(--color-success); background: none; padding: 0; }
.status-cancelled { color: var(--color-danger); background: none; padding: 0; }
</style>
