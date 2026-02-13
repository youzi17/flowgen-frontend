<template>
  <div class="data-process-node" :class="{ selected: selected }">
    <div class="node-header">
      <div class="node-icon">
        <el-icon :size="20"><DataLine /></el-icon>
      </div>
      <h3 class="node-title">数据处理</h3>
      <div v-if="status" class="node-status" :class="status">
        <el-icon :size="16">
          <component :is="getStatusIcon(status)" />
        </el-icon>
      </div>
    </div>
    <div class="node-content">
      <p class="process-type">{{ getProcessTypeLabel(String(data.processType)) }}</p>
      <div class="node-handles">
        <div class="input-handle" data-handle-type="target" data-handle-position="left">
          <div class="handle-dot"></div>
        </div>
        <div class="output-handle" data-handle-type="source" data-handle-position="right">
          <div class="handle-dot"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WorkflowNode } from '@/types/workflow'
import { DataLine, Check, WarningFilled, Loading } from '@element-plus/icons-vue'

interface Props {
  node: WorkflowNode
  selected?: boolean
  status?: string
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  status: undefined,
})

const { node, selected, status } = props
const data = computed(() => node.data || { processType: 'text_transform' })

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return Check
    case 'failed':
      return WarningFilled
    case 'executing':
      return Loading
    default:
      return undefined
  }
}

const getProcessTypeLabel = (type?: string) => {
  const labels: Record<string, string> = {
    text_transform: '文本转换',
    data_extraction: '数据提取',
    format_conversion: '格式转换',
    data_filtering: '数据过滤',
  }
  return labels[type || 'text_transform'] || '未配置'
}
</script>

<style scoped>
.data-process-node {
  width: 220px;
  border-radius: 12px;
  background: #ffffff;
  border: 2px solid #d9c8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
}

.data-process-node.selected {
  border-color: #8e4ccb;
  box-shadow: 0 6px 20px rgba(142, 76, 203, 0.25);
  transform: translateY(-2px);
}

.node-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #8e4ccb, #a855f7);
  color: white;
  position: relative;
}

.node-icon {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.node-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.node-status {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.node-status.success {
  background: rgba(16, 185, 129, 0.2);
}

.node-status.failed {
  background: rgba(239, 68, 68, 0.2);
}

.node-status.executing {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.node-content {
  padding: 16px;
  position: relative;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.process-type {
  margin: 0;
  font-size: 13px;
  color: #4b5563;
  font-weight: 500;
  text-align: center;
  background: #fdf2f8;
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid #fbcfe8;
}

.node-handles {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  pointer-events: none;
}

.input-handle,
.output-handle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: all;
}

.input-handle {
  left: -8px;
}

.output-handle {
  right: -8px;
}

.handle-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #be123c;
  border: 2px solid white;
  box-shadow: 0 0 0 1px rgba(190, 18, 60, 0.3);
  transition: all 0.2s ease;
  cursor: pointer;
}

.handle-dot:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 2px rgba(190, 18, 60, 0.5);
}

.data-process-node.selected .handle-dot {
  background: #8e4ccb;
}

.data-process-node.dragging {
  opacity: 0.8;
  transform: scale(0.95);
}
</style>