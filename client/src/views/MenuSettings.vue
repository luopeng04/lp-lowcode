<template>
  <div class="page">
    <div class="header">
      <h1>菜单设置</h1>
    </div>

    <div class="table-wrap">
    <table>
      <thead>
        <tr><th>菜单名称</th><th>路径</th><th>状态</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="m in menus" :key="m.menu_path">
          <td>{{ m.menu_label }}</td>
          <td>{{ m.menu_path }}</td>
          <td><span :class="m.visible ? 'on' : 'off'">{{ m.visible ? '显示' : '隐藏' }}</span></td>
          <td>
            <button v-if="m.visible" class="btn-secondary" @click="toggle(m)">隐藏</button>
            <button v-else class="btn-primary" @click="toggle(m)">显示</button>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMenuSettings, updateMenuSetting } from '../api.js'

const menus = ref([])

async function load() {
  const data = await getMenuSettings()
  menus.value = data.data
}

async function toggle(m) {
  const newVisible = m.visible ? 0 : 1
  await updateMenuSetting(m.menu_path, newVisible)
  m.visible = newVisible
}

onMounted(load)
</script>

<style scoped>
.on { color: var(--color-success); }
.off { color: var(--text-muted); }
</style>
