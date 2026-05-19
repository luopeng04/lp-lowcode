<template>
  <div class="modal-overlay" v-if="visible" @click.self="$emit('close')">
    <div class="modal">
      <h2>自定义字段配置</h2>
      <div v-if="fields.length === 0" class="hint">还没有自定义字段，添加一个吧。</div>
      <ul class="field-list" v-if="fields.length > 0">
        <li v-for="f in fields" :key="f.id">
          <span>{{ f.field_label }} <small>({{ f.field_type }})</small></span>
          <button class="btn-sm" @click="$emit('delete', f)">删除</button>
        </li>
      </ul>
      <hr />
      <h3>添加字段</h3>
      <label>字段名（英文）</label>
      <input v-model="newField.field_name" placeholder="如: brand" />
      <label>显示标签</label>
      <input v-model="newField.field_label" placeholder="如: 品牌" />
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
      <p v-if="error" class="error">{{ error }}</p>
      <div class="modal-actions">
        <button type="button" @click="$emit('close')">关闭</button>
        <button type="button" class="btn-primary" @click="$emit('add')">添加</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: Boolean,
  fields: { type: Array, default: () => [] },
  newField: { type: Object, required: true },
  error: { type: String, default: '' },
})

defineEmits(['close', 'add', 'delete'])
</script>

<style scoped>
.field-list { list-style: none; padding: 0; }
.field-list li { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-light); font-size: var(--font-size-md); }
.field-list li small { color: var(--text-muted); }
.hint { color: var(--text-muted); font-size: var(--font-size-base); margin-bottom: 10px; }
hr { border: none; border-top: 1px solid var(--border-light); margin: 12px 0; }
</style>
