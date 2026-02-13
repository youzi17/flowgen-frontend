<template>
  <div class="ai-chat-node" :class="{ 'is-selected': selected }">
    <div class="node-header">
      <el-icon :size="20" >
        <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
          <path d="M512 0C229.248 0 0 229.248 0 512s229.248 512 512 512 512-229.248 512-512S794.752 0 512 0zm0 928C286.656 928 96 737.344 96 512S286.656 96 512 96s416 190.656 416 416-190.656 416-416 416z" />
          <path d="M672 464H544V336c0-8.8-7.2-16-16-16s-16 7.2-16 16v128H352c-8.8 0-16 7.2-16 16s7.2 16 16 16h128v128c0 8.8 7.2 16 16 16s16-7.2 16-16V496h128c8.8 0 16-7.2 16-16s-7.2-16-16-16z" />
        </svg>
      </el-icon>
      <span class="node-title">AI对话</span>
    </div>
    <div class="node-content">
      <div v-if="data?.model" class="node-data">
        <span class="data-label">模型:</span>
        <span class="data-value">{{ data.model }}</span>
      </div>
      <div v-if="data?.prompt" class="node-data">
        <span class="data-label">提示词:</span>
        <span class="data-value">{{ data.prompt.length > 20 ? data.prompt.substring(0, 20) + '...' : data.prompt }}</span>
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
import { computed } from 'vue';
import { useVueFlow, Handle, Position } from '@vue-flow/core';
import type { WorkflowNode } from '@/types/workflow';

interface Props {
  id: string;
  data: Record<string, any>;
  selected?: boolean;
  targetPosition?: string;
  sourcePosition?: string;
}

const props = defineProps<Props>();

const { getNodes } = useVueFlow();
const node = computed(() => {
  return getNodes.value.find(n => n.id === props.id) as WorkflowNode;
});
</script>

<style scoped>
.ai-chat-node {
  min-width: 200px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
  transition: all 0.3s ease;
}

.ai-chat-node:hover {
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.5);
  transform: translateY(-2px);
}

.ai-chat-node.is-selected {
  box-shadow: 0 0 0 2px white, 0 6px 20px rgba(79, 172, 254, 0.6);
}

.node-header {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
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
  opacity: 0.9;
}

.data-value {
  font-family: monospace;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
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
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-handle:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.3);
}

:deep(.vue-flow__handle-target) {
  background: white;
  border: 2px solid #4facfe;
}

:deep(.vue-flow__handle-source) {
  background: white;
  border: 2px solid #4facfe;
}

:deep(.vue-flow__handle-connected) {
  background: #4facfe;
  border: 2px solid white;
}
</style>