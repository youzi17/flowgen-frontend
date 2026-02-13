<template>
  <div class="end-node" :class="{ 'is-selected': selected }">
    <div class="node-header">
      <el-icon :size="20" >
        <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
          <path d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.752 0 512 0zm0 928C286.656 928 96 737.344 96 512S286.656 96 512 96s416 190.656 416 416-190.656 416-416 416z" />
          <path d="M448 448h128v128H448z" />
        </svg>
      </el-icon>
      <span class="node-title">结束节点</span>
    </div>
    <div class="node-content">
      <div v-if="data?.outputFormat" class="node-data">
        <span class="data-label">输出格式:</span>
        <span class="data-value">{{ getFormatLabel(data.outputFormat) }}</span>
      </div>
      <div v-if="data?.saveResults" class="node-data"
        :class="{ 'success': data.saveResults }"
      >
        <span class="data-label">保存结果:</span>
        <span class="data-value">是</span>
      </div>
    </div>
    <div class="node-footer">
      <Handle
        type="target"
        :position="Position.Left"
        :id="'in'"
        class="custom-handle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useVueFlow, Handle, Position } from '@vue-flow/core';
import type { WorkflowNode } from '@/types/workflow';

interface EndNodeData {
  outputFormat?: string;
  saveResults?: boolean;
  [key: string]: unknown;
}

interface Props {
  id: string;
  data: EndNodeData;
  selected?: boolean;
  targetPosition?: string;
  sourcePosition?: string;
}

const props = defineProps<Props>();

const { getNodes } = useVueFlow();
const node = computed(() => {
  return getNodes.value.find(n => n.id === props.id) as WorkflowNode;
});

const getFormatLabel = (format: string): string => {
  const formatMap: Record<string, string> = {
    'json': 'JSON',
    'text': '纯文本',
    'html': 'HTML'
  };
  return formatMap[format] || format;
};
</script>

<style scoped>
.end-node {
  min-width: 200px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fa8072 0%, #ffd700 100%);
  color: #333;
  box-shadow: 0 4px 12px rgba(250, 128, 114, 0.4);
  transition: all 0.3s ease;
}

.end-node:hover {
  box-shadow: 0 6px 20px rgba(250, 128, 114, 0.5);
  transform: translateY(-2px);
}

.end-node.is-selected {
  box-shadow: 0 0 0 2px #333, 0 6px 20px rgba(250, 128, 114, 0.6);
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

.node-data.success {
  color: #28a745;
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
  justify-content: flex-start;
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
  border: 2px solid #fa8072;
}

:deep(.vue-flow__handle-connected) {
  background: #fa8072;
  border: 2px solid #333;
}
</style>