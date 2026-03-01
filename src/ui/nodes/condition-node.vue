<template>
  <div class="flow-node condition-node" :class="{ 'is-selected': selected }">
    <div class="node-header" style="background:#fef3c7;">
      <div class="node-icon" style="color:#d97706;">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1l6 6-6 6-6-6 6-6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M7 4v3M7 8.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="node-title" style="color:#92400e;">条件判断</span>
    </div>
    <div v-if="data?.conditionType || data?.sourceField" class="node-body">
      <div v-if="data?.conditionType" class="node-row">
        <span class="row-label">条件</span>
        <span class="row-val">{{ condLabel(String(data.conditionType)) }}</span>
      </div>
      <div v-if="data?.sourceField" class="node-row">
        <span class="row-label">字段</span>
        <span class="row-val">{{ truncate(String(data.sourceField), 14) }}</span>
      </div>
      <div v-if="data?.compareValue" class="node-row">
        <span class="row-label">比较值</span>
        <span class="row-val">{{ truncate(String(data.compareValue), 14) }}</span>
      </div>
    </div>
    <div v-else class="node-empty">配置条件规则</div>
    <!-- 出口标签 -->
    <div class="branch-labels">
      <span class="branch-tag true-tag">真</span>
      <span class="branch-tag false-tag">假</span>
    </div>
    <Handle type="target" :position="Position.Left" id="in" />
    <Handle type="source" :position="Position.Right" id="true" style="top: 35%;" />
    <Handle type="source" :position="Position.Right" id="false" style="top: 65%;" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
interface Props {
  id: string
  data: { conditionType?: string; sourceField?: string; compareValue?: string; [k: string]: unknown }
  selected?: boolean
}
defineProps<Props>()
const truncate = (s: string, n: number) => s.length > n ? s.slice(0, n) + '…' : s
const condLabel = (t: string) => ({ equals:'等于', not_equals:'不等于', greater_than:'大于', less_than:'小于', contains:'包含', exists:'存在' }[t] ?? t)
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
  border-color: #f59e0b;
  box-shadow: 0 0 0 2.5px rgba(245,158,11,.22), 0 6px 18px rgba(0,0,0,.08);
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
.node-body { padding: 8px 12px 4px; }
.node-empty { padding: 6px 12px 4px; font-size: 11px; color: #d1d5db; }
.node-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
.row-label { font-size: 11px; color: #9ca3af; }
.row-val {
  font-size: 11px; color: #374151;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: #f3f4f6; padding: 1px 6px; border-radius: 4px;
  max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
/* 分支标签 */
.branch-labels {
  display: flex;
  justify-content: flex-end;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  padding: 6px 14px 10px 0;
}
.branch-tag {
  font-size: 10px; font-weight: 600;
  padding: 1px 6px; border-radius: 4px;
}
.true-tag { background: #d1fae5; color: #065f46; }
.false-tag { background: #fee2e2; color: #991b1b; }
:deep(.vue-flow__handle) {
  width: 10px; height: 10px;
  background: #fff; border: 2px solid #f59e0b; border-radius: 50%;
  transition: transform .15s, box-shadow .15s;
}
:deep(.vue-flow__handle:hover) {
  transform: scale(1.4);
  box-shadow: 0 0 0 3px rgba(245,158,11,.2);
}
:deep(.vue-flow__handle.vue-flow__handle-connected) { background: #f59e0b; }
</style>
