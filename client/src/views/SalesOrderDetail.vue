<template>
  <div class="page">
    <router-link to="/sales-orders" class="back">← 返回列表</router-link>

    <div v-if="order" class="card">
      <div class="header">
        <h1>{{ order.order_no }}</h1>
        <span :class="`status-${order.status}`">{{ statusMap[order.status] }}</span>
      </div>

      <div class="info">
        <div><label>客户</label><span>{{ order.customer_name }}</span></div>
        <div><label>仓库</label><span>{{ order.warehouse_name }}</span></div>
        <div><label>日期</label><span>{{ order.ordered_at || '-' }}</span></div>
        <div><label>金额</label><span class="amount">{{ order.total_amount }}</span></div>
      </div>

      <h3>商品明细</h3>
      <table>
        <thead><tr><th>商品</th><th>编码</th><th>单位</th><th>数量</th><th>单价</th><th>金额</th></tr></thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.product_name }}</td><td>{{ item.product_code }}</td><td>{{ item.unit }}</td>
            <td>{{ item.quantity }}</td><td>{{ item.unit_price }}</td><td>{{ item.amount }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="canWrite()" class="actions">
        <button v-if="order.status === 'draft'" class="btn-primary" @click="handleConfirm">审核通过</button>
        <button v-if="order.status === 'confirmed'" class="btn-deliver" @click="handleDeliver">确认出库</button>
      </div>
    </div>

    <ConfirmModal v-if="confirmMsg" :message="confirmMsg" @confirm="onConfirm" @cancel="confirmMsg = ''" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ConfirmModal from '../components/ConfirmModal.vue'
import { getSalesOrder, confirmSalesOrder, deliverSalesOrder } from '../api.js'
import { canWrite } from '../utils.js'

const route = useRoute()
const order = ref(null), items = ref([])
const statusMap = { draft: '草稿', confirmed: '已审核', delivered: '已出库', cancelled: '已取消' }
const confirmMsg = ref(''), confirmAction = ref(null)

async function load() {
  const data = await getSalesOrder(route.params.id)
  order.value = data.order; items.value = data.items
}

function askConfirm(msg, action) {
  confirmMsg.value = msg; confirmAction.value = action
}
async function onConfirm() {
  await confirmAction.value(); confirmMsg.value = ''; await load()
}

async function handleConfirm() {
  askConfirm('确认审核通过？', () => confirmSalesOrder(order.value.id))
}
async function handleDeliver() {
  askConfirm('确认出库？库存将自动扣减。', async () => {
    try { await deliverSalesOrder(order.value.id) } catch (e) { alert(e.message) }
  })
}

onMounted(load)
</script>

<style scoped>
.back { color: #1a56db; text-decoration: none; font-size: 13px; display: inline-block; margin-bottom: 12px; }
.card { background: #fff; border-radius: 8px; padding: 24px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h1 { font-size: 20px; }
h3 { font-size: 14px; margin: 20px 0 8px; }
.status-draft { padding: 4px 10px; border-radius: 12px; font-size: 12px; background: #eee; color: #888; }
.status-confirmed { padding: 4px 10px; border-radius: 12px; font-size: 12px; background: #e0e7ff; color: #1a56db; }
.status-delivered { padding: 4px 10px; border-radius: 12px; font-size: 12px; background: #dcfce7; color: #16a34a; }
.info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.info label { font-size: 12px; color: #888; display: block; }
.info span { font-size: 15px; }
.amount { color: #d32; font-weight: 600; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px 12px; text-align: left; font-size: 13px; border-bottom: 1px solid #eee; }
th { background: #f7f8fa; color: #555; }
.actions { margin-top: 24px; display: flex; gap: 10px; }
.btn-primary { padding: 8px 24px; background: #1a56db; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
.btn-deliver { padding: 8px 24px; background: #16a34a; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }

@media print {
  .sidebar, .actions, .back, .bottom { display: none !important; }
  .main { padding: 0 !important; background: #fff !important; }
  .card { box-shadow: none; padding: 0; }
  .header h1 { font-size: 22px; }
  .info label { color: #555; }
  table th { background: #eee; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .status-delivered, .status-confirmed, .status-draft { background: none !important; padding: 0; }
}
</style>
