<template>
  <div class="page">
    <div class="header">
      <h1>操作员管理</h1>
      <button class="btn-primary" @click="openCreate">+ 新建操作员</button>
    </div>

    <table>
      <thead>
        <tr><th>用户名</th><th>显示名称</th><th>角色</th><th>状态</th><th>创建时间</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="o in list" :key="o.id">
          <td>{{ o.username }}</td>
          <td>{{ o.display_name }}</td>
          <td>{{ roleMap[o.role] }}</td>
          <td :class="{ disabled: o.status === 0 }">{{ o.status === 1 ? '正常' : '已禁用' }}</td>
          <td>{{ o.created_at?.slice(0,10) }}</td>
          <td>
            <button @click="openEdit(o)">编辑</button>
            <button v-if="o.status === 1" class="btn-warn" @click="handleDisable(o)">禁用</button>
            <button v-if="o.status === 0" @click="handleEnable(o)">启用</button>
            <button @click="openResetPwd(o)">重置密码</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Create/Edit modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editing ? '编辑操作员' : '新建操作员' }}</h2>
        <form @submit.prevent="handleSave">
          <label>用户名</label>
          <input v-model="form.username" :disabled="!!editing" required />
          <label>显示名称</label>
          <input v-model="form.display_name" required />
          <label v-if="!editing">密码</label>
          <input v-if="!editing" v-model="form.password" type="password" required minlength="6" />
          <label>角色</label>
          <select v-model="form.role">
            <option value="admin">管理员</option>
            <option value="operator">操作员</option>
            <option value="readonly">只读</option>
          </select>
          <p v-if="error" class="error">{{ error }}</p>
          <div class="modal-actions">
            <button type="button" @click="closeModal">取消</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reset password modal -->
    <div class="modal-overlay" v-if="showPwdModal" @click.self="closePwdModal">
      <div class="modal">
        <h2>重置密码 - {{ pwdTarget?.display_name }}</h2>
        <form @submit.prevent="handleResetPwd">
          <label>新密码</label>
          <input v-model="newPassword" type="password" required minlength="6" />
          <p v-if="pwdError" class="error">{{ pwdError }}</p>
          <div class="modal-actions">
            <button type="button" @click="closePwdModal">取消</button>
            <button type="submit" class="btn-primary">确认重置</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { getOperators, createOperator, updateOperator, resetPassword } from '../api.js'

const list = ref([])
const roleMap = { admin: '管理员', operator: '操作员', readonly: '只读' }
const showModal = ref(false), editing = ref(null), saving = ref(false), error = ref('')
const form = reactive({ username: '', display_name: '', password: '', role: 'operator' })
const showPwdModal = ref(false), pwdTarget = ref(null), newPassword = ref(''), pwdError = ref('')

async function fetchList() {
  const data = await getOperators()
  list.value = data.data
}

function openCreate() {
  editing.value = null; error.value = ''
  form.username = ''; form.display_name = ''; form.password = ''; form.role = 'operator'
  showModal.value = true
}

function openEdit(o) {
  editing.value = o; error.value = ''
  form.username = o.username; form.display_name = o.display_name; form.role = o.role
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function handleSave() {
  error.value = ''; saving.value = true
  try {
    if (editing.value) {
      await updateOperator(editing.value.id, { display_name: form.display_name, role: form.role })
    } else {
      await createOperator({ username: form.username, display_name: form.display_name, password: form.password, role: form.role })
    }
    closeModal(); await fetchList()
  } catch (e) { error.value = e.message } finally { saving.value = false }
}

async function handleDisable(o) {
  if (!confirm(`确认禁用操作员"${o.display_name}"？`)) return
  await updateOperator(o.id, { status: 0 })
  await fetchList()
}

async function handleEnable(o) {
  await updateOperator(o.id, { status: 1 })
  await fetchList()
}

function openResetPwd(o) {
  pwdTarget.value = o; newPassword.value = ''; pwdError.value = ''
  showPwdModal.value = true
}

function closePwdModal() { showPwdModal.value = false }

async function handleResetPwd() {
  pwdError.value = ''
  try {
    await resetPassword(pwdTarget.value.id, newPassword.value)
    closePwdModal()
  } catch (e) { pwdError.value = e.message }
}

onMounted(fetchList)
</script>

<style scoped>
.disabled { color: #d32; }
.btn-warn { color: #d32; border-color: #ecc; }
.modal { width: 400px; }
.modal input, .modal select { margin-bottom: 10px; }
.modal-actions { margin-top: 8px; }
</style>
