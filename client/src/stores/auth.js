import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const tenant = ref(JSON.parse(localStorage.getItem('tenant') || 'null'))
  const operator = ref(JSON.parse(localStorage.getItem('operator') || 'null'))
  const token = ref(localStorage.getItem('authToken') || '')

  const isLoggedIn = computed(() => !!tenant.value && !!operator.value && !!token.value)
  const canWrite = computed(() => ['admin', 'operator'].includes(operator.value?.role))
  const roleLabel = computed(() => {
    const map = { admin: '管理员', operator: '操作员', readonly: '只读' }
    return map[operator.value?.role] || ''
  })

  function setAuth(tenantData, operatorData, tokenData) {
    tenant.value = tenantData
    operator.value = operatorData
    token.value = tokenData || ''
    localStorage.setItem('tenant', JSON.stringify(tenantData))
    if (operatorData) localStorage.setItem('operator', JSON.stringify(operatorData))
    if (tokenData) localStorage.setItem('authToken', tokenData)
  }

  function logout() {
    tenant.value = null
    operator.value = null
    token.value = ''
    localStorage.removeItem('tenant')
    localStorage.removeItem('operator')
    localStorage.removeItem('authToken')
  }

  return { tenant, operator, token, isLoggedIn, canWrite, roleLabel, setAuth, logout }
})
