<template>
  <div class="page">
    <router-link to="/purchase-orders" class="back">← 返回列表</router-link>

    <div v-if="order" class="card">
      <div class="header">
        <h1>{{ order.order_no }}</h1>
        <span :class="`status-${order.status}`">{{ statusMap[order.status] }}</span>
      </div>

      <div class="info">
        <div><label>供应商</label><span>{{ order.supplier_name }}</span></div>
        <div><label>仓库</label><span>{{ order.warehouse_name }}</span></div>
        <div><label>日期</label><span>{{ order.ordered_at || '-' }}</span></div>
        <div><label>金额</label><span class="amount">{{ order.total_amount }}</span></div>
        <div v-for="f in orderFields" :key="f.field_name">
          <label>{{ f.field_label }}</label><span>{{ (order.custom_data || {})[f.field_name] || '-' }}</span>
        </div>
      </div>

      <h3>商品明细</h3>
      <table>
        <thead>
          <tr><th>商品</th><th>编码</th><th>单位</th><th>数量</th><th>单价</th><th>金额</th><th v-for="f in itemFields" :key="f.field_name">{{ f.field_label }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.product_name }}</td>
            <td>{{ item.product_code }}</td>
            <td>{{ item.unit }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ item.unit_price }}</td>
            <td>{{ item.amount }}</td>
            <td v-for="f in itemFields" :key="f.field_name">{{ (item.custom_data || {})[f.field_name] || '-' }}</td>
          </tr>
        </tbody>
      </table>

      <div class="actions">
        <button class="btn-secondary" @click="window.print()">打印</button>
        <button v-if="order.status === 'draft' && canWrite()" class="btn-primary" @click="handleConfirm">审核通过</button>
        <button v-if="order.status === 'confirmed' && canWrite()" class="btn-success" @click="handleReceive">确认入库</button>
      </div>
    </div>

    <ConfirmModal v-if="confirmMsg" :message="confirmMsg" @confirm="onConfirm" @cancel="confirmMsg = ''" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmModal from '../components/ConfirmModal.vue'
import { getPurchaseOrder, confirmPurchaseOrder, receivePurchaseOrder, getCustomFields } from '../api.js'
import { canWrite } from '../utils.js'

const route = useRoute()
const router = useRouter()
const order = ref(null), items = ref([])
const orderFields = ref([]), itemFields = ref([])
const statusMap = { draft: '草稿', confirmed: '已审核', received: '已入库', cancelled: '已取消' }
const confirmMsg = ref(''), confirmAction = ref(null)

async function load() {
  const [orderData, of, itf] = await Promise.all([
    getPurchaseOrder(route.params.id),
    getCustomFields('purchase_order'),
    getCustomFields('purchase_order_item'),
  ])
  order.value = orderData.order; items.value = orderData.items
  orderFields.value = of.data; itemFields.value = itf.data
}

function askConfirm(msg, action) {
  confirmMsg.value = msg; confirmAction.value = action
}
async function onConfirm() {
  await confirmAction.value(); confirmMsg.value = ''; await load()
}

async function handleConfirm() {
  askConfirm('确认审核通过？', () => confirmPurchaseOrder(order.value.id))
}
async function handleReceive() {
  askConfirm('确认入库？库存将自动更新。', () => receivePurchaseOrder(order.value.id))
}

onMounted(load)
</script>

<style scoped>
.back { color: var(--color-primary); text-decoration: none; font-size: var(--font-size-base); display: inline-block; margin-bottom: 12px; }
.back:hover { text-decoration: underline; }
.card { background: var(--bg-surface); border-radius: var(--radius-md); padding: var(--space-lg); border: 1px solid var(--border-default); }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
h1 { font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); }
h3 { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); margin: var(--space-lg) 0 var(--space-sm); }
.info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.info label { font-size: var(--font-size-sm); color: var(--text-muted); display: block; }
.info span { font-size: 15px; }
.amount { color: var(--color-danger); font-weight: var(--font-weight-semibold); }
.actions { margin-top: var(--space-lg); display: flex; gap: 10px; }
.btn-primary, .btn-success { padding: 8px 24px; }

@media print {
  .info label { color: #555; }
}
</style>
