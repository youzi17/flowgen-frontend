<template>
  <div class="start-node" :class="{ 'is-selected': selected }">
    <div class="node-header">
      <el-icon :size="20">
        <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
          <path
            d="M985.6 544l-300.8-384c-19.2-24.32-51.2-38.4-83.2-35.84-30.72 2.56-58.88 19.2-74.24 46.08L38.4 544c-19.2 25.6-19.2 57.6 0 83.2l486.4 614.4c15.36 26.88 43.52 43.52 74.24 46.08 32 2.56 64-11.52 83.2-35.84l300.8-384c19.2-25.6 19.2-57.6 0-83.2z m-499.2 288L115.2 576l268.8-345.6 268.8 345.6-268.8 345.6z"
          />
        </svg>
      </el-icon>
      <span class="node-title">开始节点</span>
    </div>
    <div class="node-content">
      <div v-if="data?.initialData" class="node-data">
        <span class="data-label">初始数据:</span>
        <span class="data-value">{{
          data.initialData.length > 20
            ? data.initialData.substring(0, 20) + '...'
            : data.initialData
        }}</span>
      </div>
      <div v-if="data?.autoExecute" class="node-data">
        <span class="data-label">自动执行:</span>
        <span class="data-value">是</span>
      </div>
    </div>
    <div class="node-footer">
      <Handle type="source" :position="Position.Right" :id="'out'" class="custom-handle" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

interface StartNodeData {
  initialData?: string
  autoExecute?: boolean
  [key: string]: unknown
}

interface Props {
  id: string
  data: StartNodeData
  selected?: boolean
  targetPosition?: string
  sourcePosition?: string
}

defineProps<Props>()
</script>

<style scoped>
.start-node {
  width: 192px;
  background: rgb(245, 240, 240);
  border-radius: 12px;
  border: 2px solid #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.2s ease;
  /* 移除position: absolute，让Vue Flow管理节点位置 */
}

.start-node:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  transform: translateY(-2px);
}

.start-node.is-selected {
  box-shadow:
    0 0 0 2px white,
    0 6px 20px rgba(102, 126, 234, 0.8);
}

.node-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px 12px 0 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
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
  opacity: 0.9;
}

.data-value {
  font-family: monospace;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
}

.node-footer {
  padding: 0 16px 16px;
  display: flex;
  justify-content: flex-end;
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

:deep(.vue-flow__handle-source) {
  width: 16px;
  height: 16px;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  border: 2px solid #8e4ccb;
  border-radius: 50%;
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

:deep(.vue-flow__handle-connected) {
  background: #8e4ccb;
  border: 2px solid white;
}
</style>
