<template>
  <div class="data-process-node" :class="{ 'is-selected': selected }">
    <div class="node-header">
      <el-icon :size="20">
        <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
          <path
            d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.752 0 512 0zm0 928C286.656 928 96 737.344 96 512S286.656 96 512 96s416 190.656 416 416-190.656 416-416 416z"
          />
          <path d="M320 320h384v64H320zm0 128h384v64H320zm0 128h256v64H320z" />
        </svg>
      </el-icon>
      <span class="node-title">数据处理</span>
    </div>
    <div class="node-content">
      <div v-if="data?.processType" class="node-data">
        <span class="data-label">处理类型:</span>
        <span class="data-value">{{ getProcessTypeLabel(data.processType) }}</span>
      </div>
      <div v-if="data?.inputField" class="node-data">
        <span class="data-label">输入:</span>
        <span class="data-value">{{ data.inputField }}</span>
      </div>
      <div v-if="data?.outputField" class="node-data">
        <span class="data-label">输出:</span>
        <span class="data-value">{{ data.outputField }}</span>
      </div>
      <!-- 显示文本操作数量 -->
      <div
        v-if="
          data?.processType === 'text_transform' &&
          (data?.transformOptions?.textOperations?.length || 0) > 0
        "
        class="node-data"
      >
        <span class="data-label">文本操作:</span>
        <span class="data-value">{{ data.transformOptions?.textOperations?.length || 0 }}项</span>
      </div>
      <!-- 显示替换规则数量 -->
      <div
        v-if="
          data?.processType === 'text_transform' &&
          (data?.transformOptions?.replaceRules?.length || 0) > 0
        "
        class="node-data"
      >
        <span class="data-label">替换规则:</span>
        <span class="data-value">{{ data.transformOptions?.replaceRules?.length || 0 }}条</span>
      </div>
    </div>
    <div class="node-footer">
      <Handle type="target" :position="Position.Left" :id="'input'" class="custom-handle" />
      <Handle type="source" :position="Position.Right" :id="'output'" class="custom-handle" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { DataProcessNodeData } from '@/core/nodes/DataProcessNode'

// 定义转换选项类型
interface TransformOptions {
  textOperations?: Array<{ type: string; value?: string }>
  replaceRules?: Array<{ pattern: string; replacement: string }>
  expression?: string
  delimiter?: string
  filterField?: string
  filterValue?: string
}

// 扩展现有的数据类型定义
type EnhancedDataProcessNodeData = DataProcessNodeData & {
  transformOptions?: TransformOptions
}

interface Props {
  id: string
  data?: EnhancedDataProcessNodeData
  selected?: boolean
  targetPosition?: string
  sourcePosition?: string
}

const props = defineProps<Props>()

// 获取节点数据，确保安全访问
const data = computed(() => props.data || ({} as EnhancedDataProcessNodeData))

// 移除不必要的node计算属性，直接使用props

// 获取处理类型的显示标签
const getProcessTypeLabel = (type?: string): string => {
  if (!type) return ''
  const typeMap: Record<string, string> = {
    text_transform: '文本转换',
    data_extraction: '数据提取',
    format_conversion: '格式转换',
    data_filtering: '数据过滤',
    data_filter: '数据筛选',
    data_mapping: '数据映射',
    data_merge: '数据合并',
    data_split: '数据分割',
  }
  return typeMap[type] || type
}
</script>

<style scoped>
.data-process-node {
  min-width: 200px;
  border-radius: 8px;
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: #333;
  box-shadow: 0 4px 12px rgba(132, 250, 176, 0.4);
  transition: all 0.3s ease;
}

.data-process-node:hover {
  box-shadow: 0 6px 20px rgba(132, 250, 176, 0.5);
  transform: translateY(-2px);
}

.data-process-node.is-selected {
  box-shadow:
    0 0 0 2px #333,
    0 6px 20px rgba(132, 250, 176, 0.6);
}

.node-header {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.node-title {
  font-weight: 600;
  font-size: 14px;
}

.node-content {
  padding: 12px;
  font-size: 12px;
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
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.node-footer {
  padding: 0 12px 12px;
  display: flex;
  justify-content: space-between;
}

.custom-handle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-handle:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.2);
}

:deep(.vue-flow__handle-target) {
  background: #333;
  border: 2px solid #84fab0;
}

:deep(.vue-flow__handle-source) {
  background: #333;
  border: 2px solid #84fab0;
}

:deep(.vue-flow__handle-connected) {
  background: #84fab0;
  border: 2px solid #333;
}
</style>
