import { useAuthStore } from './stores/auth'

export function debounce(fn, delay = 300) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export function canWrite() {
  try {
    return useAuthStore().canWrite
  } catch {
    const operator = JSON.parse(localStorage.getItem('operator') || 'null')
    return operator && (operator.role === 'admin' || operator.role === 'operator')
  }
}
