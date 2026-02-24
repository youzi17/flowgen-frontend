<template>
  <div class="text-output-node" :class="{ 'is-selected': selected }">
    <div class="node-header">
      <el-icon :size="20" >
        <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
          <path d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.752 0 512 0zm0 928C286.656 928 96 737.344 96 512S286.656 96 512 96s416 190.656 416 416-190.656 416-416 416z" />
          <path d="M384 384h256v48H384zm0 128h256v48H384zm0 128h192v48H384z" />
        </svg>
      </el-icon>
      <span class="node-title">文本输出</span>
    </div>
    <div class="node-content">
      <div v-if="data?.outputType" class="node-data">
        <span class="data-label">输出类型:</span>
        <span class="data-value">{{ getOutputTypeLabel(data.outputType) }}</span>
      </div>
      <div v-if="data?.dataSource" class="node-data">
        <span class="data-label">数据源:</span>
        <span class="data-value">{{ data.dataSource }}</span>
      </div>
      <div v-if="data?.template" class="node-data template">
        <span class="data-label">模板:</span>
        <span class="data-value template-value">{{ data.template.length > 25 ? data.template.substring(0, 25) + '...' : data.template }}</span>
      </div>
    </div>
    <div class="node-footer">
      <Handle
        type="target"
        :position="Position.Left"
        :id="'in'"
        class="custom-handle"
      />
      <Handle
        type="source"
        :position="Position.Right"
        :id="'out'"
        class="custom-handle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

interface TextOutputNodeData {
  outputType?: string;
  dataSource?: string;
  template?: string;
  [key: string]: unknown;
}

interface Props {
  id: string;
  data: TextOutputNodeData;
  selected?: boolean;
  targetPosition?: string;
  sourcePosition?: string;
}

defineProps<Props>();

const getOutputTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    'plain_text': '纯文本',
    'markdown': 'Markdown',
    'html': 'HTML'
  };
  return typeMap[type] || type;
};
</script>

<style scoped>
.text-output-node {
  min-width: 200px;
  border-radius: 8px;
  background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
  color: #333;
  box-shadow: 0 4px 12px rgba(161, 196, 253, 0.4);
  transition: all 0.3s ease;
}

.text-output-node:hover {
  box-shadow: 0 6px 20px rgba(161, 196, 253, 0.5);
  transform: translateY(-2px);
}

.text-output-node.is-selected {
  box-shadow: 0 0 0 2px #333, 0 6px 20px rgba(161, 196, 253, 0.6);
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
  align-items: flex-start;
}

.node-data.template {
  flex-direction: column;
  gap: 4px;
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

.template-value {
  max-width: 100%;
  word-break: break-all;
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
  border: 2px solid #a1c4fd;
}

:deep(.vue-flow__handle-source) {
  background: #333;
  border: 2px solid #a1c4fd;
}

:deep(.vue-flow__handle-connected) {
  background: #a1c4fd;
  border: 2px solid #333;
}
</style>