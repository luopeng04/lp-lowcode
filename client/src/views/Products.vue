<template>
  <div class="page">
    <div class="header">
      <h1>商品管理</h1>
      <div class="header-actions" v-if="canWrite()">
        <button class="btn-secondary" @click="openCustomFields">自定义字段</button>
        <button class="btn-primary" @click="openCreate">+ 新建商品</button>
      </div>
    </div>

    <div class="toolbar">
      <input v-model="search" @input="onSearch" @keyup.enter="fetchList" placeholder="搜索名称/编码..." class="search" />
      <select v-model="categoryFilter" @change="onSearch" class="filter">
        <option value="">全部分类</option>
        <option v-for="c in categories" :key="c.name" :value="c.name">{{ c.name }}</option>
      </select>
      <button class="btn-secondary" @click="fetchList">查询</button>
      <button class="btn-reset" @click="search='';categoryFilter='';fetchList()">重置</button>
    </div>

    <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>编码</th><th>名称</th><th>规格</th><th>单位</th><th>分类</th>
          <th>成本价</th><th>销售价</th>
          <th v-for="f in customFields" :key="f.field_name">{{ f.field_label }}</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in list" :key="p.id">
          <td>{{ p.code }}</td><td>{{ p.name }}</td><td>{{ p.spec || '-' }}</td>
          <td>{{ p.unit }}</td><td>{{ p.category || '-' }}</td>
          <td>{{ p.cost_price }}</td><td>{{ p.sale_price }}</td>
          <td v-for="f in customFields" :key="f.field_name">
            {{ (p.custom_data || {})[f.field_name] || '-' }}
          </td>
          <td v-if="canWrite()">
            <button @click="openEdit(p)">编辑</button>
            <button class="btn-danger" @click="handleDelete(p)">删除</button>
          </td>
        </tr>
        <tr v-if="list.length === 0"><td :colspan="8 + customFields.length" :class="loading ? 'loading-row' : 'empty'">{{ loading ? '加载中...' : '暂无数据' }}</td></tr>
      </tbody>
    </table>
    </div>

    <div class="pager" v-if="total > pageSize">
      <button :disabled="page <= 1" @click="page--; fetchList()">上一页</button>
      <span>{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" @click="page++; fetchList()">下一页</button>
    </div>

    <!-- Product form modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editing ? '编辑商品' : '新建商品' }}</h2>
        <form @submit.prevent="handleSave">
          <label>编码 *</label><input v-model="form.code" :disabled="!!editing" required />
          <label>名称 *</label><input v-model="form.name" required />
          <div class="row">
            <div><label>规格</label><input v-model="form.spec" /></div>
            <div><label>单位</label><input v-model="form.unit" placeholder="个" /></div>
          </div>
          <div class="row">
            <div><label>分类</label>
              <select v-model="form.category">
                <option value="">未分类</option>
                <option v-for="c in categories" :key="c.name" :value="c.name">{{ c.name }}</option>
              </select>
            </div>
          </div>
          <div class="row">
            <div><label>成本价</label><input v-model.number="form.cost_price" type="number" step="0.01" /></div>
            <div><label>销售价</label><input v-model.number="form.sale_price" type="number" step="0.01" /></div>
          </div>

          <!-- Dynamic custom fields -->
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

    <!-- Custom fields config modal -->
    <div class="modal-overlay" v-if="showFieldsModal" @click.self="closeCustomFields">
      <div class="modal">
        <h2>自定义字段配置</h2>
        <div v-if="customFields.length === 0" class="hint">还没有自定义字段，添加一个吧。</div>
        <ul class="field-list" v-if="customFields.length > 0">
          <li v-for="f in customFields" :key="f.id">
            <span>{{ f.field_label }} <small>({{ f.field_type }})</small></span>
            <button class="btn-sm" @click="deleteField(f)">删除</button>
          </li>
        </ul>
        <hr />
        <h3>添加字段</h3>
        <label>字段名（英文）</label><input v-model="newField.field_name" placeholder="如: brand" />
        <label>显示标签</label><input v-model="newField.field_label" placeholder="如: 品牌" />
        <label>类型</label>
        <select v-model="newField.field_type">
          <option value="text">文本</option>
          <option value="number">数字</option>
          <option value="select">下拉</option>
          <option value="date">日期</option>
        </select>
        <div v-if="newField.field_type === 'select'">
          <label>选项（逗号分隔）</label>
          <input v-model="newField.optionsStr" placeholder="选项1,选项2,选项3" />
        </div>
        <p v-if="fieldError" class="error">{{ fieldError }}</p>
        <div class="modal-actions">
          <button type="button" @click="closeCustomFields">关闭</button>
          <button type="button" class="btn-primary" @click="addField">添加</button>
        </div>
      </div>
    </div>

    <ConfirmModal v-if="confirmMsg" :message="confirmMsg" @confirm="onConfirm" @cancel="confirmMsg = ''" />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getCategories, getCustomFields, createCustomField, deleteCustomField,
} from '../api.js'
import ConfirmModal from '../components/ConfirmModal.vue'
import { debounce, canWrite } from '../utils.js'

const list = ref([]), search = ref(''), categoryFilter = ref(''), page = ref(1), total = ref(0), pageSize = 20, loading = ref(true)
const categories = ref([])
const customFields = ref([])
const showModal = ref(false), editing = ref(null), saving = ref(false), error = ref('')
const form = reactive({ code: '', name: '', spec: '', unit: '个', category: '', cost_price: 0, sale_price: 0, custom_data: {} })
const confirmMsg = ref(''), confirmAction = ref(null)
const showFieldsModal = ref(false), fieldError = ref('')
const newField = reactive({ field_name: '', field_label: '', field_type: 'text', optionsStr: '' })

async function fetchList() {
  loading.value = true
  const data = await getProducts({ search: search.value, category: categoryFilter.value, page: page.value })
  list.value = data.data; total.value = data.total; loading.value = false
}

function onSearch() { page.value = 1; debouncedSearch() }
const debouncedSearch = debounce(fetchList, 300)

async function loadMeta() {
  const [catData, fieldData] = await Promise.all([getCategories(), getCustomFields()])
  categories.value = [...catData.data.filter(c => c.id), ...catData.fromProducts]
  customFields.value = fieldData.data
}

function openCreate() {
  editing.value = null; error.value = ''
  form.code = ''; form.name = ''; form.spec = ''; form.unit = '个'
  form.category = ''; form.cost_price = 0; form.sale_price = 0
  form.custom_data = {}
  showModal.value = true
}

function openEdit(p) {
  editing.value = p; error.value = ''
  form.code = p.code; form.name = p.name; form.spec = p.spec || ''
  form.unit = p.unit; form.category = p.category || ''
  form.cost_price = p.cost_price; form.sale_price = p.sale_price
  form.custom_data = { ...(p.custom_data || {}) }
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function handleSave() {
  error.value = ''; saving.value = true
  try {
    const data = {
      code: form.code, name: form.name, spec: form.spec, unit: form.unit,
      category: form.category, cost_price: form.cost_price, sale_price: form.sale_price,
      custom_data: form.custom_data,
    }
    if (editing.value) await updateProduct(editing.value.id, data)
    else await createProduct(data)
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

async function handleDelete(p) {
  askConfirm(`确认删除商品"${p.name}"？`, () => deleteProduct(p.id))
}

function openCustomFields() { fieldError.value = ''; newField.field_name = ''; newField.field_label = ''; newField.field_type = 'text'; newField.optionsStr = ''; showFieldsModal.value = true }

function closeCustomFields() { showFieldsModal.value = false }

async function addField() {
  fieldError.value = ''
  if (!newField.field_name || !newField.field_label) { fieldError.value = '请填写完整'; return }
  try {
    const data = { field_name: newField.field_name, field_label: newField.field_label, field_type: newField.field_type }
    if (newField.field_type === 'select') {
      data.options = newField.optionsStr.split(',').map(s => s.trim()).filter(Boolean)
    }
    await createCustomField(data)
    await loadMeta()
    newField.field_name = ''; newField.field_label = ''; newField.field_type = 'text'; newField.optionsStr = ''
  } catch (e) { fieldError.value = e.message }
}

async function deleteField(f) {
  if (!confirm(`删除字段"${f.field_label}"？`)) return
  await deleteCustomField(f.id)
  await loadMeta()
}

onMounted(async () => { await loadMeta(); await fetchList() })
</script>

<style scoped>
.header-actions { display: flex; gap: 10px; }
.required { color: var(--color-danger); }
.field-list { list-style: none; padding: 0; }
.field-list li { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-light); font-size: var(--font-size-md); }
.field-list li small { color: var(--text-muted); }
.hint { color: var(--text-muted); font-size: var(--font-size-base); margin-bottom: 10px; }
hr { border: none; border-top: 1px solid var(--border-light); margin: 12px 0; }
</style>
