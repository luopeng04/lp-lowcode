import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const tenant = ref(JSON.parse(localStorage.getItem('tenant') || 'null'))
  const operator = ref(JSON.parse(localStorage.getItem('operator') || 'null'))

  const isLoggedIn = computed(() => !!tenant.value)
  const canWrite = computed(() => ['admin', 'operator'].includes(operator.value?.role))
  const roleLabel = computed(() => {
    const map = { admin: '管理员', operator: '操作员', readonly: '只读' }
    return map[operator.value?.role] || ''
  })

  function setAuth(tenantData, operatorData) {
    tenant.value = tenantData
    operator.value = operatorData
    localStorage.setItem('tenant', JSON.stringify(tenantData))
    if (operatorData) localStorage.setItem('operator', JSON.stringify(operatorData))
  }

  function logout() {
    tenant.value = null
    operator.value = null
    localStorage.removeItem('tenant')
    localStorage.removeItem('operator')
  }

  return { tenant, operator, isLoggedIn, canWrite, roleLabel, setAuth, logout }
})
