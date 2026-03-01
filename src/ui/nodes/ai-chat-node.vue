<template>
  <div class="flow-node ai-node" :class="{ 'is-selected': selected }">
    <div class="node-header" style="background:#ede9fe;">
      <div class="node-icon" style="color:#7c3aed;">
        <!-- Sparkle / AI icon -->
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v2M7 11v2M1 7h2M11 7h2M3.22 3.22l1.41 1.41M9.37 9.37l1.41 1.41M3.22 10.78l1.41-1.41M9.37 4.63l1.41-1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="7" cy="7" r="2" fill="currentColor"/>
        </svg>
      </div>
      <span class="node-title" style="color:#4c1d95;">AI 对话</span>
      <span v-if="data?.model" class="node-tag" style="background:#ddd6fe;color:#5b21b6;">{{ shortModel(String(data.model)) }}</span>
    </div>
    <div v-if="data?.prompt" class="node-body">
      <div class="node-row">
        <span class="row-label">提示词</span>
        <span class="row-val">{{ truncate(String(data.prompt), 18) }}</span>
      </div>
    </div>
    <div v-else class="node-empty">配置模型与提示词</div>
    <Handle type="target" :position="Position.Left" id="in" />
    <Handle type="source" :position="Position.Right" id="out" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
interface Props {
  id: string
  data: { model?: string; prompt?: string; [k: string]: unknown }
  selected?: boolean
}
defineProps<Props>()
const truncate = (s: string, n: number) => s.length > n ? s.slice(0, n) + '…' : s
const shortModel = (m: string) => m.length > 12 ? m.slice(0, 12) + '…' : m
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
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2.5px rgba(139,92,246,.22), 0 6px 18px rgba(0,0,0,.08);
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
  max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
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
  background: #fff; border: 2px solid #8b5cf6; border-radius: 50%;
  transition: transform .15s, box-shadow .15s;
}
:deep(.vue-flow__handle:hover) {
  transform: scale(1.4);
  box-shadow: 0 0 0 3px rgba(139,92,246,.2);
}
:deep(.vue-flow__handle.vue-flow__handle-connected) { background: #8b5cf6; }
</style>
