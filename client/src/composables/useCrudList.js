import { ref } from 'vue'
import { debounce } from '../utils'

export function useCrudList({ fetchFn, createFn, updateFn, deleteFn, defaultForm, pageSize = 20 }) {
  const list = ref([])
  const search = ref('')
  const page = ref(1)
  const total = ref(0)
  const showModal = ref(false)
  const editing = ref(null)
  const saving = ref(false)
  const error = ref('')

  async function fetchList() {
    try {
      const data = await fetchFn({ search: search.value, page: page.value })
      list.value = data.data
      total.value = data.total
    } catch (e) {
      error.value = e.message
    }
  }

  function onSearch() {
    page.value = 1
    debouncedSearch()
  }

  const debouncedSearch = debounce(fetchList, 300)

  function openCreate() {
    editing.value = null
    error.value = ''
    Object.assign(defaultForm, getDefaultValues())
    showModal.value = true
  }

  function openEdit(item) {
    editing.value = item
    error.value = ''
    Object.assign(defaultForm, item)
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
  }

  function getDefaultValues() {
    const defaults = {}
    for (const key of Object.keys(defaultForm)) {
      defaults[key] = ''
    }
    return defaults
  }

  async function handleSave() {
    error.value = ''
    saving.value = true
    try {
      const data = { ...defaultForm }
      if (editing.value) {
        await updateFn(editing.value.id, data)
      } else {
        await createFn(data)
      }
      closeModal()
      await fetchList()
    } catch (e) {
      error.value = e.message
    } finally {
      saving.value = false
    }
  }

  async function handleDelete(item, confirmFn) {
    await confirmFn(() => deleteFn(item.id))
    await fetchList()
  }

  return {
    list, search, page, total, pageSize,
    showModal, editing, saving, error,
    fetchList, onSearch, debouncedSearch,
    openCreate, openEdit, closeModal,
    handleSave, handleDelete,
  }
}
