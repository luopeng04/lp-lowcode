<template>
  <div class="page">
    <div class="header">
      <h1>供应商管理</h1>
      <div class="header-actions" v-if="canWrite()">
        <button class="btn-secondary" @click="openFieldsModal">自定义字段</button>
        <button class="btn-primary" @click="openCreate">+ 新建供应商</button>
      </div>
    </div>

    <div class="toolbar">
      <input v-model="search" @input="onSearch" @keyup.enter="fetchList" placeholder="搜索名称/编码/联系人..." class="search" />
      <button class="btn-secondary" @click="fetchList">查询</button>
      <button class="btn-reset" @click="search='';fetchList()">重置</button>
    </div>

    <div class="table-wrap">
    <table>
      <thead>
        <tr><th>编码</th><th>名称</th><th>联系人</th><th>电话</th><th>地址</th><th>备注</th><th v-for="f in customFields" :key="f.field_name">{{ f.field_label }}</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="s in list" :key="s.id">
          <td>{{ s.code }}</td><td>{{ s.name }}</td><td>{{ s.contact || '-' }}</td>
          <td>{{ s.phone || '-' }}</td><td>{{ s.address || '-' }}</td><td>{{ s.remark || '-' }}</td>
          <td v-for="f in customFields" :key="f.field_name">{{ (s.custom_data || {})[f.field_name] || '-' }}</td>
          <td v-if="canWrite()">
            <button @click="openEdit(s)">编辑</button>
            <button class="btn-danger" @click="handleDelete(s)">删除</button>
          </td>
        </tr>
        <tr v-if="list.length === 0"><td :colspan="7 + customFields.length" :class="loading ? 'loading-row' : 'empty'">{{ loading ? '加载中...' : '暂无数据' }}</td></tr>
      </tbody>
    </table>
    </div>

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

          <div v-for="f in customFields" :key="f.field_name">
            <label>{{ f.field_label }} <span v-if="f.is_required" class="required">*</span></label>
            <input v-if="f.field_type === 'text' || f.field_type === 'number'" v-model="form.custom_data[f.field_name]" :type="f.field_type" />
            <select v-else-if="f.field_type === 'select'" v-model="form.custom_data[f.field_name]">
              <option value="">请选择</option>
              <option v-for="opt in (typeof f.options === 'string' ? JSON.parse(f.options) : f.options || [])" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <input v-else-if="f.field_type === 'date'" v-model="form.custom_data[f.field_name]" type="date" />
          </div>

          <p v-if="error" class="error">{{ error }}</p>
          <div class="modal-actions">
            <button type="button" @click="closeModal">取消</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </form>
      </div>
    </div>

    <CustomFieldsModal :visible="showFieldsModal" :fields="customFields" :newField="newField" :error="fieldError" @close="closeFieldsModal" @add="addField" @delete="deleteField" />

    <ConfirmModal v-if="confirmMsg" :message="confirmMsg" @confirm="onConfirm" @cancel="onCancel" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api.js'
import ConfirmModal from '../components/ConfirmModal.vue'
import CustomFieldsModal from '../components/CustomFieldsModal.vue'
import { debounce, canWrite } from '../utils.js'
import { useConfirm } from '../composables/useConfirm'
import { useCustomFields } from '../composables/useCustomFields'

const list = ref([]), search = ref(''), page = ref(1), total = ref(0), pageSize = 20, loading = ref(true)
const { confirmMsg, askConfirm, onConfirm, onCancel } = useConfirm()
const { customFields, showFieldsModal, fieldError, newField, fetchFields, openFieldsModal, closeFieldsModal, addField, deleteField } = useCustomFields('supplier')
const showModal = ref(false), editing = ref(null), saving = ref(false), error = ref('')
const form = reactive({ code: '', name: '', contact: '', phone: '', address: '', remark: '', custom_data: {} })

function onSearch() { page.value = 1; debouncedSearch() }
const debouncedSearch = debounce(fetchList, 300)

async function fetchList() {
  loading.value = true
  const data = await getSuppliers(search.value, page.value)
  list.value = data.data; total.value = data.total; loading.value = false
}

function openCreate() {
  editing.value = null; error.value = ''
  form.code = ''; form.name = ''; form.contact = ''; form.phone = ''; form.address = ''; form.remark = ''
  form.custom_data = {}
  showModal.value = true
}
function openEdit(s) {
  editing.value = s; error.value = ''
  form.code = s.code; form.name = s.name; form.contact = s.contact || ''; form.phone = s.phone || ''; form.address = s.address || ''; form.remark = s.remark || ''
  form.custom_data = { ...(s.custom_data || {}) }
  showModal.value = true
}
function closeModal() { showModal.value = false }

async function handleSave() {
  error.value = ''; saving.value = true
  try {
    const data = { code: form.code, name: form.name, contact: form.contact, phone: form.phone, address: form.address, remark: form.remark, custom_data: form.custom_data }
    if (editing.value) await updateSupplier(editing.value.id, data)
    else await createSupplier(data)
    closeModal(); await fetchList()
  } catch (e) { error.value = e.message } finally { saving.value = false }
}

async function handleDelete(s) {
  askConfirm(`确认删除供应商"${s.name}"？`, async () => {
    await deleteSupplier(s.id)
    await fetchList()
  })
}

onMounted(async () => { await fetchFields(); await fetchList() })
</script>

<style scoped>
.modal { width: 420px; }
.modal input { margin-bottom: 8px; }
.modal-actions { margin-top: 8px; }
</style>
