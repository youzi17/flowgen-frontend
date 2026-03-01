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
/* 整体卡片 */
.data-process-node {
  width: 190px;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
  transition: box-shadow .18s, transform .18s;
}
.data-process-node:hover {
  box-shadow: 0 6px 18px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}
.data-process-node.is-selected {
  border-color: #14b8a6;
  box-shadow: 0 0 0 2.5px rgba(20,184,166,.22), 0 6px 18px rgba(0,0,0,.08);
}

/* 彩色 header */
.node-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 12px;
  background: #ccfbf1;
  border-radius: 10px 10px 0 0;
}
.node-header .el-icon {
  color: #0f766e;
  font-size: 16px;
  flex-shrink: 0;
}
.node-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #134e4a;
  flex: 1;
  letter-spacing: 0.01em;
}

/* body */
.node-content {
  padding: 8px 12px 10px;
  font-size: 11px;
}
.node-data {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}
.data-label { color: #9ca3af; }
.data-value {
  color: #374151;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: #f3f4f6;
  padding: 1px 6px;
  border-radius: 4px;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* footer */
.node-footer {
  padding: 0 12px 10px;
  display: flex;
  justify-content: space-between;
}

/* Handles */
:deep(.vue-flow__handle) {
  width: 10px; height: 10px;
  background: #fff;
  border: 2px solid #14b8a6;
  border-radius: 50%;
  transition: transform .15s, box-shadow .15s;
}
:deep(.vue-flow__handle:hover) {
  transform: scale(1.4);
  box-shadow: 0 0 0 3px rgba(20,184,166,.2);
}
:deep(.vue-flow__handle.vue-flow__handle-connected) { background: #14b8a6; }
</style>
