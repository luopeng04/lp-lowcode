<template>
  <div class="page">
    <div class="header">
      <h1>仓库管理</h1>
      <button class="btn-primary" @click="openCreate">+ 新建仓库</button>
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
          <td>
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
import { debounce } from '../utils.js'

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
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
h1 { font-size: 20px; }
.btn-primary { padding: 8px 20px; background: #1a56db; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
.search { width: 240px; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; margin-bottom: 12px; }
table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 6px; overflow: hidden; }
th, td { padding: 10px 14px; text-align: left; font-size: 14px; border-bottom: 1px solid #eee; }
th { background: #f7f8fa; color: #555; font-weight: 600; }
td button { margin-right: 6px; padding: 4px 10px; font-size: 12px; border: 1px solid #ddd; border-radius: 3px; background: #fff; cursor: pointer; }
.btn-danger { color: #d32; border-color: #ecc; }
.empty { text-align: center; color: #999; padding: 40px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #fff; padding: 24px; border-radius: 8px; width: 400px; }
.modal h2 { font-size: 17px; margin-bottom: 16px; }
.modal label { display: block; font-size: 13px; color: #555; margin-bottom: 2px; }
.modal input { width: 100%; padding: 7px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; margin-bottom: 10px; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
.modal-actions button { padding: 7px 18px; font-size: 13px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; }
.modal-actions .btn-primary { background: #1a56db; color: #fff; border: none; }
.error { color: #d32; font-size: 13px; }
</style>
