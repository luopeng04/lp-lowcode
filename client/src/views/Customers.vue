<template>
  <div class="page">
    <div class="header">
      <h1>客户管理</h1>
      <button v-if="canWrite()" class="btn-primary" @click="openCreate">+ 新建客户</button>
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
          <td v-if="canWrite()">
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
import { debounce, canWrite } from '../utils.js'

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
.search { margin-bottom: 12px; }
.modal { width: 420px; }
.modal input { margin-bottom: 8px; }
.modal-actions { margin-top: 8px; }
</style>
