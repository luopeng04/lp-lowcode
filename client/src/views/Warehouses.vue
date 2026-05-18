<template>
  <div class="page">
    <div class="header">
      <h1>仓库管理</h1>
      <button v-if="canWrite()" class="btn-primary" @click="openCreate">+ 新建仓库</button>
    </div>

    <input v-model="search" @input="debouncedSearch" placeholder="搜索名称或编码..." class="search" />

    <table>
      <thead>
        <tr>
          <th>编码</th><th>名称</th><th>联系人</th><th>地址</th><th>默认</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="w in list" :key="w.id">
          <td>{{ w.code }}</td>
          <td>{{ w.name }}</td>
          <td>{{ w.contact || '-' }}</td>
          <td>{{ w.address || '-' }}</td>
          <td>{{ w.is_default ? '✓' : '' }}</td>
          <td v-if="canWrite()">
            <button @click="openEdit(w)">编辑</button>
            <button v-if="!w.is_default" class="btn-danger" @click="handleDelete(w)">删除</button>
          </td>
        </tr>
        <tr v-if="list.length === 0">
          <td colspan="6" class="empty">暂无数据</td>
        </tr>
      </tbody>
    </table>

    <!-- Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editing ? '编辑仓库' : '新建仓库' }}</h2>
        <form @submit.prevent="handleSave">
          <label>编码</label>
          <input v-model="form.code" :disabled="!!editing" required />

          <label>名称</label>
          <input v-model="form.name" required />

          <label>联系人</label>
          <input v-model="form.contact" />

          <label>地址</label>
          <input v-model="form.address" />

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
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../api.js'
import { debounce, canWrite } from '../utils.js'

const list = ref([])
const search = ref('')
const debouncedSearch = debounce(fetchList, 300)
const showModal = ref(false)
const editing = ref(null)
const saving = ref(false)
const error = ref('')

const form = ref({ code: '', name: '', contact: '', address: '' })

async function fetchList() {
  const data = await getWarehouses(search.value)
  list.value = data.data
}

function openCreate() {
  editing.value = null
  form.value = { code: '', name: '', contact: '', address: '' }
  error.value = ''
  showModal.value = true
}

function openEdit(w) {
  editing.value = w
  form.value = { code: w.code, name: w.name, contact: w.contact || '', address: w.address || '' }
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleSave() {
  error.value = ''
  saving.value = true
  try {
    if (editing.value) {
      await updateWarehouse(editing.value.id, form.value)
    } else {
      await createWarehouse(form.value)
    }
    closeModal()
    await fetchList()
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

async function handleDelete(w) {
  if (!confirm(`确认删除仓库"${w.name}"？`)) return
  try {
    await deleteWarehouse(w.id)
    await fetchList()
  } catch (e) {
    alert(e.message)
  }
}

onMounted(fetchList)
</script>

<style scoped>
.page { max-width: 900px; }
.search { margin-bottom: 12px; }
th, td { padding: 10px 14px; font-size: 14px; }
.modal { width: 400px; }
.modal input { margin-bottom: 10px; }
.modal-actions { margin-top: 8px; }
</style>
