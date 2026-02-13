<template>
  <div class="condition-node" :class="{ 'is-selected': selected }">
    <div class="node-header">
      <el-icon :size="20">
        <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
          <path
            d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.752 0 512 0zm0 928C286.656 928 96 737.344 96 512S286.656 96 512 96s416 190.656 416 416-190.656 416-416 416z"
          />
          <path
            d="M736 448h-416c-8.8 0-16 7.2-16 16s7.2 16 16 16h416c8.8 0 16-7.2 16-16s-7.2-16-16-16z"
          />
          <path
            d="M736 544h-416c-8.8 0-16 7.2-16 16s7.2 16 16 16h416c8.8 0 16-7.2 16-16s-7.2-16-16-16z"
          />
        </svg>
      </el-icon>
      <span class="node-title">条件判断</span>
    </div>
    <div class="node-content">
      <div v-if="data?.conditionType" class="node-data">
        <span class="data-label">条件类型:</span>
        <span class="data-value">{{ getConditionTypeLabel(data.conditionType) }}</span>
      </div>
      <div v-if="data?.sourceField" class="node-data">
        <span class="data-label">源字段:</span>
        <span class="data-value">{{ data.sourceField }}</span>
      </div>
      <div v-if="data?.compareValue" class="node-data">
        <span class="data-label">比较值:</span>
        <span class="data-value">{{ data.compareValue }}</span>
      </div>
    </div>
    <div class="node-footer">
      <Handle type="target" :position="Position.Left" :id="'in'" class="custom-handle" />
      <div class="node-handles-source">
        <div class="source-handle-wrapper">
          <div class="source-handle-label">真</div>
          <Handle type="source" :position="Position.Right" :id="'true'" class="custom-handle" />
        </div>
        <div class="source-handle-wrapper">
          <div class="source-handle-label">假</div>
          <Handle type="source" :position="Position.Right" :id="'false'" class="custom-handle" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useVueFlow, Handle, Position } from '@vue-flow/core'
import type { WorkflowNode } from '@/types/workflow'

interface ConditionNodeData {
  conditionType?: string
  sourceField?: string
  compareValue?: string
  [key: string]: unknown
}

interface Props {
  id: string
  data: ConditionNodeData
  selected?: boolean
  targetPosition?: string
  sourcePosition?: string
}

const props = defineProps<Props>()

const { getNodes } = useVueFlow()
const node = computed(() => {
  return getNodes.value.find((n) => n.id === props.id) as WorkflowNode
})

const getConditionTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    equals: '等于',
    not_equals: '不等于',
    greater_than: '大于',
    less_than: '小于',
    contains: '包含',
    exists: '存在',
  }
  return typeMap[type] || type
}
</script>

<style scoped>
.condition-node {
  width: 192px;
  background: white;
  border-radius: 12px;
  border: 2px solid #fa709a;
  box-shadow: 0 4px 12px rgba(250, 112, 154, 0.4);
  transition: all 0.2s ease;
  /* 移除position: absolute，让Vue Flow管理节点位置 */
}

.condition-node:hover {
  box-shadow: 0 6px 20px rgba(250, 112, 154, 0.6);
  transform: translateY(-2px);
}

.condition-node.is-selected {
  box-shadow:
    0 0 0 2px white,
    0 6px 20px rgba(250, 112, 154, 0.8);
}

.node-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px 12px 0 0;
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: #333;
}

.node-title {
  font-weight: 600;
  font-size: 14px;
}

.node-content {
  padding: 16px;
  font-size: 12px;
  color: #333;
}

.node-data {
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
}

.data-label {
  opacity: 0.8;
}

.data-value {
  font-family: monospace;
  background: rgba(250, 112, 154, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.node-footer {
  padding: 0 16px 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.node-handles-source {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.source-handle-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.source-handle-label {
  font-size: 11px;
  font-weight: 500;
}

/* 连接点样式 */
.custom-handle {
  width: 16px;
  height: 16px;
  position: absolute;
  border: 2px solid #8e4ccb;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-handle:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(142, 76, 203, 0.3);
}

:deep(.vue-flow__handle-target) {
  width: 16px;
  height: 16px;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  border: 2px solid #8e4ccb;
  border-radius: 50%;
}

:deep(.vue-flow__handle-source) {
  width: 16px;
  height: 16px;
  right: -8px;
  top: auto;
  background: white;
  border: 2px solid #8e4ccb;
  border-radius: 50%;
}

:deep(.vue-flow__handle-connected) {
  background: #8e4ccb;
  border: 2px solid white;
}
</style>