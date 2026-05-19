import { ref, reactive } from 'vue'
import { getCustomFields, createCustomField, deleteCustomField } from '../api.js'

export function useCustomFields(entity = 'product') {
  const customFields = ref([])
  const showFieldsModal = ref(false)
  const fieldError = ref('')
  const newField = reactive({
    field_name: '',
    field_label: '',
    field_type: 'text',
    optionsStr: '',
  })

  async function fetchFields() {
    const data = await getCustomFields(entity)
    customFields.value = data.data
  }

  function openFieldsModal() {
    fieldError.value = ''
    newField.field_name = ''
    newField.field_label = ''
    newField.field_type = 'text'
    newField.optionsStr = ''
    showFieldsModal.value = true
  }

  function closeFieldsModal() {
    showFieldsModal.value = false
  }

  async function addField() {
    fieldError.value = ''
    if (!newField.field_name || !newField.field_label) {
      fieldError.value = '请填写完整'
      return
    }
    const data = {
      entity,
      field_name: newField.field_name,
      field_label: newField.field_label,
      field_type: newField.field_type,
    }
    if (newField.field_type === 'select') {
      data.options = newField.optionsStr.split(',').map(s => s.trim()).filter(Boolean)
    }
    await createCustomField(data)
    await fetchFields()
    newField.field_name = ''
    newField.field_label = ''
    newField.field_type = 'text'
    newField.optionsStr = ''
  }

  async function deleteField(field) {
    if (!confirm(`删除字段"${field.field_label}"？`)) return
    await deleteCustomField(field.id)
    await fetchFields()
  }

  return {
    customFields,
    showFieldsModal,
    fieldError,
    newField,
    fetchFields,
    openFieldsModal,
    closeFieldsModal,
    addField,
    deleteField,
  }
}
