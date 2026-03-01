<template>
  <div class="flow-node start-node" :class="{ 'is-selected': selected }">
    <!-- 彩色 header 区 -->
    <div class="node-header" style="background:#d1fae5;">
      <div class="node-icon" style="color:#059669;">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 2l9 5-9 5V2z" fill="currentColor"/>
        </svg>
      </div>
      <span class="node-title" style="color:#065f46;">开始</span>
      <span v-if="data?.autoExecute" class="node-tag" style="background:#a7f3d0;color:#065f46;">自动</span>
    </div>
    <!-- 白色 body -->
    <div v-if="data?.initialData" class="node-body">
      <div class="node-row">
        <span class="row-label">初始数据</span>
        <span class="row-val">{{ truncate(String(data.initialData), 16) }}</span>
      </div>
    </div>
    <div v-else class="node-empty">拖入画布后配置</div>
    <Handle type="source" :position="Position.Right" id="out" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
interface Props {
  id: string
  data: { initialData?: string; autoExecute?: boolean; [k: string]: unknown }
  selected?: boolean
}
defineProps<Props>()
const truncate = (s: string, n: number) => s.length > n ? s.slice(0, n) + '…' : s
</script>

<style scoped>
.flow-node {
  width: 190px;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
  transition: box-shadow .18s, transform .18s;
}
.flow-node:hover {
  box-shadow: 0 6px 18px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}
.flow-node.is-selected {
  border-color: #10b981;
  box-shadow: 0 0 0 2.5px rgba(16,185,129,.22), 0 6px 18px rgba(0,0,0,.08);
}
.node-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 12px;
  border-radius: 10px 10px 0 0;
}
.node-icon {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.node-title {
  font-size: 12.5px; font-weight: 700; flex: 1;
  letter-spacing: 0.01em;
}
.node-tag {
  font-size: 10px; font-weight: 600;
  padding: 1px 6px; border-radius: 5px;
}
.node-body {
  padding: 8px 12px 10px;
}
.node-empty {
  padding: 6px 12px 10px;
  font-size: 11px;
  color: #d1d5db;
}
.node-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 3px;
}
.row-label { font-size: 11px; color: #9ca3af; }
.row-val {
  font-size: 11px; color: #374151;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: #f3f4f6; padding: 1px 6px; border-radius: 4px;
  max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
/* Handle 统一样式 */
:deep(.vue-flow__handle) {
  width: 10px; height: 10px;
  background: #fff;
  border: 2px solid #10b981;
  border-radius: 50%;
  transition: transform .15s, box-shadow .15s;
}
:deep(.vue-flow__handle:hover) {
  transform: scale(1.4);
  box-shadow: 0 0 0 3px rgba(16,185,129,.2);
}
:deep(.vue-flow__handle.vue-flow__handle-connected) {
  background: #10b981;
}
</style>
