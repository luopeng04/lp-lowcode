<template>
  <div class="page">
    <div class="header">
      <h1>供应商管理</h1>
      <button v-if="canWrite()" class="btn-primary" @click="openCreate">+ 新建供应商</button>
    </div>

    <input v-model="search" @input="onSearch" placeholder="搜索名称/编码/联系人..." class="search" />

    <table>
      <thead>
        <tr><th>编码</th><th>名称</th><th>联系人</th><th>电话</th><th>地址</th><th>备注</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="s in list" :key="s.id">
          <td>{{ s.code }}</td><td>{{ s.name }}</td><td>{{ s.contact || '-' }}</td>
          <td>{{ s.phone || '-' }}</td><td>{{ s.address || '-' }}</td><td>{{ s.remark || '-' }}</td>
          <td v-if="canWrite()">
            <button @click="openEdit(s)">编辑</button>
            <button class="btn-danger" @click="handleDelete(s)">删除</button>
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

    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editing ? '编辑供应商' : '新建供应商' }}</h2>
        <form @submit.prevent="handleSave">
          <label>编码</label><input v-model="form.code" :disabled="!!editing" required />
          <label>名称</label><input v-model="form.name" required />
          <label>联系人</label><input v-model="form.contact" />
          <label>电话</label><input v-model="form.phone" />
          <label>地址</label><input v-model="form.address" />
          <label>备注</label><input v-model="form.remark" />
          <p v-if="error" class="error">{{ error }}</p>
          <div class="modal-actions">
            <button type="button" @click="closeModal">取消</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmModal v-if="confirmMsg" :message="confirmMsg" @confirm="onConfirm" @cancel="confirmMsg = ''" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api.js'
import ConfirmModal from '../components/ConfirmModal.vue'
import { debounce, canWrite } from '../utils.js'

const list = ref([]), search = ref(''), page = ref(1), total = ref(0), pageSize = 20

function onSearch() {
  page.value = 1
  debouncedSearch()
}
const debouncedSearch = debounce(fetchList, 300)
const showModal = ref(false), editing = ref(null), saving = ref(false), error = ref('')
const form = ref({ code: '', name: '', contact: '', phone: '', address: '', remark: '' })
const confirmMsg = ref(''), confirmAction = ref(null)

async function fetchList() {
  const data = await getSuppliers(search.value, page.value)
  list.value = data.data; total.value = data.total
}

function openCreate() {
  editing.value = null; error.value = ''
  form.value = { code: '', name: '', contact: '', phone: '', address: '', remark: '' }
  showModal.value = true
}

function openEdit(s) {
  editing.value = s; error.value = ''
  form.value = { code: s.code, name: s.name, contact: s.contact || '', phone: s.phone || '', address: s.address || '', remark: s.remark || '' }
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function handleSave() {
  error.value = ''; saving.value = true
  try {
    if (editing.value) await updateSupplier(editing.value.id, form.value)
    else await createSupplier(form.value)
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

async function handleDelete(s) {
  askConfirm(`确认删除供应商"${s.name}"？`, () => deleteSupplier(s.id))
}

onMounted(fetchList)
</script>

<style scoped>
.search { margin-bottom: 12px; }
.modal { width: 420px; }
.modal input { margin-bottom: 8px; }
.modal-actions { margin-top: 8px; }
</style>
