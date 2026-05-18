<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal modal-sm">
      <p class="msg">{{ message }}</p>
      <div class="modal-actions">
        <button @click="$emit('cancel')">取消</button>
        <button class="btn-danger-fill" @click="$emit('confirm')">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ message: String })
defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; z-index: var(--z-confirm); }
.modal-sm { width: 360px; text-align: center; }
.msg { font-size: 15px; margin-bottom: var(--space-lg); color: var(--text-primary); }
.modal-actions { display: flex; justify-content: center; gap: 12px; }
.modal-actions button { padding: 8px 28px; font-size: var(--font-size-md); border: 1px solid var(--border-default); border-radius: var(--radius-sm); background: var(--bg-surface); cursor: pointer; font-family: var(--font-family); transition: border-color var(--transition-fast); }
.modal-actions button:hover { border-color: var(--text-muted); }
.btn-danger-fill { background: var(--color-danger) !important; color: #fff !important; border-color: var(--color-danger) !important; }
.btn-danger-fill:hover { background: var(--color-danger-hover) !important; }
</style>
