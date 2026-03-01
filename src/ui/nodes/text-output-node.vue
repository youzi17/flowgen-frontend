<template>
  <div class="flow-node text-output-node" :class="{ 'is-selected': selected }">
    <div class="node-header" style="background:#e0f2fe;">
      <div class="node-icon" style="color:#0284c7;">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor"/>
          <rect x="1" y="6" width="9" height="2" rx="1" fill="currentColor"/>
          <rect x="1" y="10" width="6" height="2" rx="1" fill="currentColor"/>
        </svg>
      </div>
      <span class="node-title" style="color:#0c4a6e;">文本输出</span>
      <span v-if="data?.outputType" class="node-tag" style="background:#bae6fd;color:#0369a1;">{{ typeLabel(String(data.outputType)) }}</span>
    </div>
    <div v-if="data?.template || data?.dataSource" class="node-body">
      <div v-if="data?.dataSource" class="node-row">
        <span class="row-label">数据源</span>
        <span class="row-val">{{ truncate(String(data.dataSource), 16) }}</span>
      </div>
      <div v-if="data?.template" class="node-row">
        <span class="row-label">模板</span>
        <span class="row-val">{{ truncate(String(data.template), 16) }}</span>
      </div>
    </div>
    <div v-else class="node-empty">配置输出模板</div>
    <Handle type="target" :position="Position.Left" id="in" />
    <Handle type="source" :position="Position.Right" id="out" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
interface Props {
  id: string
  data: { outputType?: string; dataSource?: string; template?: string; [k: string]: unknown }
  selected?: boolean
}
defineProps<Props>()
const truncate = (s: string, n: number) => s.length > n ? s.slice(0, n) + '…' : s
const typeLabel = (t: string) => ({ plain_text:'纯文本', markdown:'Markdown', html:'HTML' }[t] ?? t)
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
  border-color: #0ea5e9;
  box-shadow: 0 0 0 2.5px rgba(14,165,233,.22), 0 6px 18px rgba(0,0,0,.08);
}
.node-header {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 12px; border-radius: 10px 10px 0 0;
}
.node-icon {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.node-title { font-size: 12.5px; font-weight: 700; flex: 1; letter-spacing: 0.01em; }
.node-tag {
  font-size: 10px; font-weight: 600;
  padding: 1px 6px; border-radius: 5px;
}
.node-body { padding: 8px 12px 10px; }
.node-empty { padding: 6px 12px 10px; font-size: 11px; color: #d1d5db; }
.node-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
.row-label { font-size: 11px; color: #9ca3af; }
.row-val {
  font-size: 11px; color: #374151;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: #f3f4f6; padding: 1px 6px; border-radius: 4px;
  max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
:deep(.vue-flow__handle) {
  width: 10px; height: 10px;
  background: #fff; border: 2px solid #0ea5e9; border-radius: 50%;
  transition: transform .15s, box-shadow .15s;
}
:deep(.vue-flow__handle:hover) {
  transform: scale(1.4);
  box-shadow: 0 0 0 3px rgba(14,165,233,.2);
}
:deep(.vue-flow__handle.vue-flow__handle-connected) { background: #0ea5e9; }
</style>
