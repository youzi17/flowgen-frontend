<template>
  <div class="execution-panel">
    <!-- 面板标题栏 - 用于展开/收起控制 -->
    <div class="panel-header" @click="togglePanel">
      <div class="panel-title">
        <el-icon class="title-icon"><VideoPlay /></el-icon>
        <span class="title-text">执行日志</span>
        <el-tag v-if="workflowStore.isExecuting" size="small" class="status-tag"> 执行中 </el-tag>
      </div>

      <!-- 面板操作按钮 -->
      <div class="panel-actions">
        <el-button
          type="text"
          @click.stop="togglePanel"
          size="default"
          :title="uiStore.executionPanelVisible ? '收起面板' : '展开面板'"
          class="expand-button"
        >
          <el-icon class="expand-icon" :class="{ rotated: isExpanded }">
            <ArrowUp v-if="isExpanded" /><ArrowDown v-else />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 内容区域 - 使用transition实现平滑展开/收起 -->
    <Transition name="slide-down">
      <div v-if="isExpanded" class="panel-content">
        <!-- 标签栏 -->
        <div class="tabs-container">
          <el-tabs v-model="activeTab" type="card" :closable="false" class="custom-tabs">
            <el-tab-pane label="执行日志">
              <div class="logs-header">
                <span class="execution-time-info">
                  <span v-if="workflowStore.executionStartTime"
                    >开始时间: {{ formatDate(workflowStore.executionStartTime) }}</span
                  >
                  <span v-if="workflowStore.executionEndTime">
                    | 结束时间: {{ formatDate(workflowStore.executionEndTime) }}</span
                  >
                  <span v-if="workflowStore.executionStartTime && workflowStore.executionEndTime">
                    | 总耗时: {{ getDuration() }}ms</span
                  >
                </span>
                <el-button
                  type="primary"
                  size="small"
                  @click="copyLogs"
                  :disabled="!workflowStore.executionLogs.length"
                  class="main-button"
                >
                  复制日志
                </el-button>
              </div>
              <div class="logs-container">
                <pre ref="logsContainer" class="logs-content">{{ logs }}</pre>
              </div>
            </el-tab-pane>
            <el-tab-pane label="执行结果">
              <div class="results-container">
                <div v-if="hasResults" class="result-list">
                  <div
                    v-for="(result, nodeId) in executionContext"
                    :key="nodeId"
                    class="result-item"
                  >
                    <div class="result-header">
                      <el-tag :type="result.success ? 'success' : 'danger'" size="small">
                        {{ result.success ? '成功' : '失败' }}
                      </el-tag>
                      <span class="node-id">节点: {{ getNodeName(String(nodeId)) }}</span>
                      <span class="execution-time">耗时: {{ result.executionTime }}ms</span>
                    </div>
                    <div v-if="result.output" class="result-output">
                      <div class="output-label">输出:</div>
                      <pre class="output-content">{{ JSON.stringify(result.output, null, 2) }}</pre>
                    </div>
                    <div v-if="result.error" class="result-error">
                      <div class="error-label">错误:</div>
                      <pre class="error-content">{{ result.error }}</pre>
                    </div>
                  </div>
                </div>
                <div v-else class="no-results">
                  <span>暂无执行结果</span>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useWorkflowStore } from '@/stores/workflow-store'
import { useUIStore } from '@/stores/ui-store'
import { ElTabs, ElTabPane, ElTag, ElButton, ElMessage } from 'element-plus'
import { VideoPlay, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import type { WorkflowNode } from '@/types/workflow'

const workflowStore = useWorkflowStore()
const uiStore = useUIStore()

// 标签页状态
const activeTab = ref('0')
// 日志容器引用
const logsContainer = ref<HTMLElement>()

// 计算面板是否展开（默认展开状态）
const isExpanded = computed({
  get: () => uiStore.executionPanelVisible,
  set: (value) => {
    uiStore.executionPanelVisible = value
  },
})

// 切换面板展开/收起
const togglePanel = () => {
  isExpanded.value = !isExpanded.value
}

// 监听面板状态变化，自动滚动日志到底部
watch(isExpanded, (newValue) => {
  if (newValue && activeTab.value === '0') {
    nextTick(() => {
      scrollLogsToBottom()
    })
  }
})

// 复制日志到剪贴板
const copyLogs = async () => {
  try {
    await navigator.clipboard.writeText(logs.value)
    ElMessage.success('日志已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制日志失败')
  }
}

// 格式化日期时间
const formatDate = (date: Date) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 计算执行时长
const getDuration = () => {
  if (!workflowStore.executionStartTime || !workflowStore.executionEndTime) {
    return 0
  }
  return Math.round(
    new Date(workflowStore.executionEndTime).getTime() -
      new Date(workflowStore.executionStartTime).getTime(),
  )
}

// 滚动日志到底部
const scrollLogsToBottom = async () => {
  await nextTick()
  if (logsContainer.value) {
    logsContainer.value.scrollTop = logsContainer.value.scrollHeight
  }
}

// 监听日志变化，自动滚动到底部
watch(
  () => workflowStore.executionLogs,
  () => {
    scrollLogsToBottom()
  },
  { deep: true },
)

// 监听标签页切换，切换到日志标签时滚动到底部
watch(activeTab, (newTab) => {
  if (newTab === '0') {
    scrollLogsToBottom()
  }
})

// 计算执行上下文
const executionContext = computed(() => workflowStore.executionContext || {})

// 判断是否有执行结果
const hasResults = computed(() => Object.keys(executionContext.value).length > 0)

// 执行日志
const logs = computed(() => {
  if (Array.isArray(workflowStore.executionLogs) && workflowStore.executionLogs.length > 0) {
    return workflowStore.executionLogs.join('\n')
  }
  return '暂无执行日志\n请执行工作流查看日志输出'
})

// 根据节点ID获取节点名称
const getNodeName = (nodeId: string): string => {
  if (!workflowStore.currentWorkflow) return nodeId
  const node = workflowStore.currentWorkflow.nodes.find((n: WorkflowNode) => n.id === nodeId)
  if (!node) return nodeId

  const nodeNames: Record<string, string> = {
    start: '开始节点',
    end: '结束节点',
    'ai-chat': 'AI对话',
    condition: '条件判断',
    'data-process': '数据处理',
    'text-output': '文本输出',
  }

  return nodeNames[node.type] || node.type
}
</script>

<style scoped>
/* 执行面板主容器 */
.execution-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-top: 1px solid #d9c8f0;
  box-shadow: 0 -2px 12px rgba(217, 200, 240, 0.1);
}

/* 面板标题栏 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 16px;
  background: #faf5ff;
  border-bottom: 1px solid #f0e8ff;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
  user-select: none;
}

.panel-header:hover {
  background: #f0e8ff;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  color: #8e4ccb;
  font-size: 20px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #5a2790;
}

.status-tag {
  background-color: #8e4ccb;
  color: white;
  border: none;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.expand-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.expand-button:hover {
  background-color: #f0e8ff;
}

.expand-icon {
  font-size: 20px;
  color: #8e4ccb;
  transition: transform 0.3s ease;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.main-button {
  padding: 8px 16px;
  border-radius: 8px;
  background-color: #8e4ccb;
  border: 1px solid #8e4ccb;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  height: 36px;
}

.main-button:hover:not(:disabled) {
  background-color: #7c3aed;
  border-color: #7c3aed;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(142, 76, 203, 0.3);
}

.main-button:disabled {
  background-color: #e9d5ff;
  border-color: #e9d5ff;
  color: #a855f7;
}

/* 内容区域 */
.panel-content {
  height: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #ffffff;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 500px;
  overflow: hidden;
}

.slide-down-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.tabs-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.custom-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.custom-tabs .el-tabs__header {
  padding: 0 24px;
  margin: 0;
  border-bottom: 1px solid #f0e8ff;
  background-color: #ffffff;
}

.custom-tabs .el-tabs__nav {
  height: 44px;
  gap: 12px;
  padding: 8px 0;
}

.custom-tabs .el-tabs__item {
  padding: 8px 20px;
  border-radius: 20px;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.custom-tabs .el-tabs__item:hover {
  color: #8e4ccb;
  background-color: #faf5ff;
  border-color: #f0e8ff;
}

.custom-tabs .el-tabs__item.is-active {
  background-color: #8e4ccb;
  color: white;
  border-color: #8e4ccb;
  box-shadow: 0 2px 8px rgba(142, 76, 203, 0.2);
}

.custom-tabs .el-tabs__content {
  flex: 1;
  padding: 24px;
  overflow: hidden;
  background-color: #ffffff;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  flex-wrap: wrap;
  gap: 12px;
}

.execution-time-info {
  font-size: 13px;
  color: var(--el-text-color-subtitle);
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ====== 关键修复区域 ====== */

.logs-container,
.results-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100% - 60px); /* 留出顶部空间 */
  max-height: 40vh; /* 设置一个合理最大高度 */
  overflow-y: auto; /* 当内容超出时允许垂直滚动 */
}

.logs-content {
  flex: 1;
  padding: 16px;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow-y: auto; /* 👈 确保可滚动 */
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 执行结果区域 */
.result-list {
  flex: 1;
  overflow-y: auto; /* 👈 允许列表滚动 */
  /*padding: 8px 0;*/
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%; /* 👈 占满可用空间 */
}

.result-item {
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 12px;
  max-height: 400px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.node-id {
  font-weight: 600;
  color: #4b5563;
  font-size: 14px;
}

.execution-time {
  color: #6b7280;
  font-size: 13px;
  background-color: #f9fafb;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.result-output,
.result-error {
  margin-top: 16px;
  flex: 1;
}

.output-label,
.error-label {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
}

.output-label {
  color: #15803d;
}

.error-label {
  color: #b91c1c;
}

/* 👇 核心修复：确保输出内容可滚动 */
.output-content,
.error-content {
  padding: 20px;
  border-radius: 8px;
  overflow: auto; /* 👈 关键：启用滚动 */
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px; /* 可调整 */
  min-height: 80px;
  transition: all 0.2s ease;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}

.output-content {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}

.output-content:hover {
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
}

.error-content {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.error-content:hover {
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
}

/* 滚动条美化 */
.output-content::-webkit-scrollbar,
.error-content::-webkit-scrollbar,
.logs-content::-webkit-scrollbar {
  width: 10px;
}

.output-content::-webkit-scrollbar-track,
.error-content::-webkit-scrollbar-track,
.logs-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 5px;
}

.output-content::-webkit-scrollbar-thumb,
.error-content::-webkit-scrollbar-thumb,
.logs-content::-webkit-scrollbar-thumb {
  background: #d9c8f0;
  border-radius: 5px;
  border: 2px solid #f1f5f9;
}

.output-content::-webkit-scrollbar-thumb:hover,
.error-content::-webkit-scrollbar-thumb:hover,
.logs-content::-webkit-scrollbar-thumb:hover {
  background: #8e4ccb;
}

.no-results {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-description);
  font-size: 14px;
  background: #fafafa;
  border-radius: 8px;
  padding: 40px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .panel-header {
    padding: 8px 16px;
  }

  .panel-content {
    height: 400px;
  }

  .logs-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .main-button {
    width: 100%;
    justify-content: center;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .logs-content,
  .output-content,
  .error-content {
    font-size: 11px;
    padding: 12px;
  }

  .custom-tabs .el-tabs__content {
    padding: 16px;
  }

  .custom-tabs .el-tabs__header {
    padding: 0 16px;
  }

  .custom-tabs .el-tabs__item {
    padding: 6px 16px;
    font-size: 13px;
  }
}

@media (max-width: 640px) {
  .panel-content {
    height: 300px;
  }

  .custom-tabs .el-tabs__content {
    padding: 12px;
  }

  .result-item {
    padding: 12px;
  }
}
</style>
