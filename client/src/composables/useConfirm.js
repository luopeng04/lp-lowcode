import { ref } from 'vue'

export function useConfirm() {
  const confirmMsg = ref('')
  let confirmAction = null

  function askConfirm(msg, action) {
    confirmMsg.value = msg
    confirmAction = action
  }

  async function onConfirm() {
    try { await confirmAction() } catch (e) { alert(e.message) }
    confirmMsg.value = ''
  }

  function onCancel() {
    confirmMsg.value = ''
  }

  return { confirmMsg, askConfirm, onConfirm, onCancel }
}
