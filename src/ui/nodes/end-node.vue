<template>
  <div class="flow-node end-node" :class="{ 'is-selected': selected }">
    <div class="node-header" style="background:#ffe4e6;">
      <div class="node-icon" style="color:#e11d48;">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor"/>
        </svg>
      </div>
      <span class="node-title" style="color:#9f1239;">结束</span>
    </div>
    <div v-if="data?.outputFormat || data?.saveResults" class="node-body">
      <div v-if="data?.outputFormat" class="node-row">
        <span class="row-label">输出格式</span>
        <span class="row-val">{{ formatLabel(String(data.outputFormat)) }}</span>
      </div>
      <div v-if="data?.saveResults" class="node-row">
        <span class="row-label">保存结果</span>
        <span class="row-val" style="color:#059669;">是</span>
      </div>
    </div>
    <div v-else class="node-empty">工作流终点</div>
    <Handle type="target" :position="Position.Left" id="in" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
interface Props {
  id: string
  data: { outputFormat?: string; saveResults?: boolean; [k: string]: unknown }
  selected?: boolean
}
defineProps<Props>()
const formatLabel = (f: string) => ({ json: 'JSON', text: '纯文本', html: 'HTML' }[f] ?? f)
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
  border-color: #f43f5e;
  box-shadow: 0 0 0 2.5px rgba(244,63,94,.2), 0 6px 18px rgba(0,0,0,.08);
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
.node-body { padding: 8px 12px 10px; }
.node-empty { padding: 6px 12px 10px; font-size: 11px; color: #d1d5db; }
.node-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
.row-label { font-size: 11px; color: #9ca3af; }
.row-val {
  font-size: 11px; color: #374151;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: #f3f4f6; padding: 1px 6px; border-radius: 4px;
}
:deep(.vue-flow__handle) {
  width: 10px; height: 10px;
  background: #fff; border: 2px solid #f43f5e; border-radius: 50%;
  transition: transform .15s, box-shadow .15s;
}
:deep(.vue-flow__handle:hover) {
  transform: scale(1.4);
  box-shadow: 0 0 0 3px rgba(244,63,94,.2);
}
:deep(.vue-flow__handle.vue-flow__handle-connected) { background: #f43f5e; }
</style>
