<template>
  <div class="page">
    <div class="header">
      <h1>客户管理</h1>
      <button class="btn-primary" @click="openCreate">+ 新建客户</button>
    </div>

    <input v-model="search" @input="onSearch" placeholder="搜索名称/编码/联系人..." class="search" />

    <table>
      <thead>
        <tr><th>编码</th><th>名称</th><th>联系人</th><th>电话</th><th>地址</th><th>备注</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="c in list" :key="c.id">
          <td>{{ c.code }}</td><td>{{ c.name }}</td><td>{{ c.contact || '-' }}</td>
          <td>{{ c.phone || '-' }}</td><td>{{ c.address || '-' }}</td><td>{{ c.remark || '-' }}</td>
          <td>
            <button @click="openEdit(c)">编辑</button>
            <button class="btn-danger" @click="handleDelete(c)">删除</button>
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
        <h2>{{ editing ? '编辑客户' : '新建客户' }}</h2>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api.js'
import { debounce } from '../utils.js'

const list = ref([]), search = ref(''), page = ref(1), total = ref(0), pageSize = 20

function onSearch() {
  page.value = 1
  debouncedSearch()
}
const debouncedSearch = debounce(fetchList, 300)
const showModal = ref(false), editing = ref(null), saving = ref(false), error = ref('')
const form = ref({ code: '', name: '', contact: '', phone: '', address: '', remark: '' })

async function fetchList() {
  const data = await getCustomers(search.value, page.value)
  list.value = data.data; total.value = data.total
}

function openCreate() {
  editing.value = null; error.value = ''
  form.value = { code: '', name: '', contact: '', phone: '', address: '', remark: '' }
  showModal.value = true
}

function openEdit(c) {
  editing.value = c; error.value = ''
  form.value = { code: c.code, name: c.name, contact: c.contact || '', phone: c.phone || '', address: c.address || '', remark: c.remark || '' }
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function handleSave() {
  error.value = ''; saving.value = true
  try {
    if (editing.value) await updateCustomer(editing.value.id, form.value)
    else await createCustomer(form.value)
    closeModal(); await fetchList()
  } catch (e) { error.value = e.message } finally { saving.value = false }
}

async function handleDelete(c) {
  if (!confirm(`确认删除客户"${c.name}"？`)) return
  try { await deleteCustomer(c.id); await fetchList() } catch (e) { alert(e.message) }
}

onMounted(fetchList)
</script>

<style scoped>
.page { max-width: 1100px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
h1 { font-size: 20px; }
.btn-primary { padding: 8px 20px; background: #1a56db; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
.search { width: 240px; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; margin-bottom: 12px; }
table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 6px; overflow: hidden; }
th, td { padding: 10px 12px; text-align: left; font-size: 13px; border-bottom: 1px solid #eee; }
th { background: #f7f8fa; color: #555; font-weight: 600; }
td button { margin-right: 6px; padding: 4px 10px; font-size: 12px; border: 1px solid #ddd; border-radius: 3px; background: #fff; cursor: pointer; }
.btn-danger { color: #d32; border-color: #ecc; }
.empty { text-align: center; color: #999; padding: 40px; }
.pager { display: flex; align-items: center; gap: 12px; margin-top: 16px; font-size: 13px; justify-content: center; }
.pager button { padding: 4px 12px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; }
.pager button:disabled { opacity: .4; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #fff; padding: 24px; border-radius: 8px; width: 420px; }
.modal h2 { font-size: 17px; margin-bottom: 16px; }
.modal label { display: block; font-size: 13px; color: #555; margin-bottom: 2px; }
.modal input { width: 100%; padding: 7px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; margin-bottom: 8px; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
.modal-actions button { padding: 7px 18px; font-size: 13px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; }
.modal-actions .btn-primary { border: none; }
.error { color: #d32; font-size: 13px; }
</style>
