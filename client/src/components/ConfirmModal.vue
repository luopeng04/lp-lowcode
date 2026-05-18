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
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal-sm { width: 360px; text-align: center; }
.msg { font-size: 15px; margin-bottom: 20px; color: #333; }
.modal-actions { display: flex; justify-content: center; gap: 12px; }
.modal-actions button { padding: 8px 28px; font-size: 14px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; }
.btn-danger-fill { background: #d32 !important; color: #fff !important; border-color: #d32 !important; }
</style>
