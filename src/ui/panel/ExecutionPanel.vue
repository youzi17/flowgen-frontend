<template>
  <!-- 执行日志 Modal -->
  <el-dialog
    v-model="dialogVisible"
    title=""
    :width="720"
    :close-on-click-modal="!workflowStore.isExecuting"
    :close-on-press-escape="!workflowStore.isExecuting"
    :show-close="!workflowStore.isExecuting"
    class="execution-dialog"
    align-center
    destroy-on-close
  >
    <!-- 自定义 header -->
    <template #header>
      <div class="dialog-header">
        <div class="header-left">
          <el-icon class="title-icon"><VideoPlay /></el-icon>
          <span class="title-text">执行日志</span>
          <el-tag v-if="workflowStore.isExecuting" size="small" class="status-tag">
            <el-icon class="is-loading"><Loading /></el-icon>
            执行中
          </el-tag>
          <el-tag v-else-if="hasResults" :type="allSuccess ? 'success' : 'danger'" size="small">
            {{ allSuccess ? '执行成功' : '执行失败' }}
          </el-tag>
        </div>
      </div>
    </template>

    <!-- 标签页内容 -->
    <el-tabs v-model="activeTab" type="card" :closable="false" class="custom-tabs">
      <el-tab-pane label="执行日志">
        <!-- 时间信息 -->
        <div class="logs-header">
          <span class="execution-time-info">
            <span v-if="workflowStore.executionStartTime">
              开始: {{ formatDate(workflowStore.executionStartTime) }}
            </span>
            <span v-if="workflowStore.executionEndTime">
              | 结束: {{ formatDate(workflowStore.executionEndTime) }}
            </span>
            <span v-if="workflowStore.executionStartTime && workflowStore.executionEndTime">
              | 耗时: {{ getDuration() }}ms
            </span>
          </span>
          <el-button
            size="small"
            @click="copyLogs"
            :disabled="!hasLogs"
            class="copy-button"
          >
            复制日志
          </el-button>
        </div>
        <!-- 日志内容 -->
        <div class="logs-container">
          <pre v-if="hasLogs" ref="logsContainer" class="logs-content">{{ logs }}</pre>
          <div v-else class="empty-logs-state">
            <el-icon class="empty-logs-icon"><InfoFilled /></el-icon>
            <p class="empty-logs-title">日志会在执行后出现</p>
            <p class="empty-logs-text">点击“执行工作流”后，这里会实时展示运行过程。</p>
          </div>
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
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useWorkflowStore } from '@/stores/workflow-store'
import { useUIStore } from '@/stores/ui-store'
import { ElTabs, ElTabPane, ElTag, ElButton, ElMessage, ElDialog, ElIcon } from 'element-plus'
import { VideoPlay, Loading, InfoFilled } from '@element-plus/icons-vue'
import type { WorkflowNode } from '@/types/workflow'

const workflowStore = useWorkflowStore()
const uiStore = useUIStore()

// 标签页状态
const activeTab = ref('0')
// 日志容器引用
const logsContainer = ref<HTMLElement>()

// Dialog 可见性，双向绑定到 uiStore
const dialogVisible = computed({
  get: () => uiStore.executionPanelVisible,
  set: (value) => {
    uiStore.executionPanelVisible = value
  },
})

// 判断所有节点是否执行成功
const allSuccess = computed(() => {
  const ctx = executionContext.value
  return Object.keys(ctx).length > 0 && Object.values(ctx).every((r) => r.success)
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

// 监听 dialog 打开，滚动日志到底部
watch(dialogVisible, (visible) => {
  if (visible && activeTab.value === '0') {
    nextTick(() => scrollLogsToBottom())
  }
})

// 计算执行上下文
const executionContext = computed(() => workflowStore.executionContext || {})

// 判断是否有执行结果
const hasResults = computed(() => Object.keys(executionContext.value).length > 0)

const hasLogs = computed(
  () => Array.isArray(workflowStore.executionLogs) && workflowStore.executionLogs.length > 0,
)

// 执行日志
const logs = computed(() => {
  if (hasLogs.value) {
    return workflowStore.executionLogs.join('\n')
  }
  return ''
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
/* Dialog header */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  color: #5f7ea8;
  font-size: 20px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #2f4559;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #5f7ea8;
  color: white;
  border: none;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}

/* Tabs */
.custom-tabs :deep(.el-tabs__header) {
  margin: 0 0 16px 0;
  border-bottom: 1px solid #dde7ef;
}

.custom-tabs :deep(.el-tabs__nav) {
  height: 40px;
  gap: 8px;
  padding: 4px 0;
}

.custom-tabs :deep(.el-tabs__item) {
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.custom-tabs :deep(.el-tabs__item:hover) {
  color: #496683;
  background-color: #f2f6fa;
  border-color: #dce7ef;
}

.custom-tabs :deep(.el-tabs__item.is-active) {
  background-color: #5f7ea8;
  color: white;
  border-color: #5f7ea8;
  box-shadow: 0 8px 18px rgba(95, 126, 168, 0.24);
}

/* 日志区域 */
.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  flex-wrap: wrap;
  gap: 8px;
}

.execution-time-info {
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-button {
  border-radius: 10px;
  font-size: 12px;
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
}

.logs-content {
  padding: 16px;
  background: rgba(246, 250, 252, 0.88);
  border: 1px solid #dde7ef;
  border-radius: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.empty-logs-state {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  padding: 24px;
  background: rgba(246, 250, 252, 0.82);
  border: 1px solid #dde7ef;
  border-radius: 12px;
}

.empty-logs-icon {
  font-size: 20px;
  color: #6d879f;
}

.empty-logs-title {
  margin: 0;
  color: #2f4559;
  font-size: 15px;
  font-weight: 600;
}

.empty-logs-text {
  margin: 0;
  color: #607284;
  font-size: 13px;
  line-height: 1.7;
}

/* 执行结果区域 */
.results-container {
  max-height: 400px;
  overflow-y: auto;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  padding: 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
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
  margin-top: 12px;
}

.output-label,
.error-label {
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 14px;
}

.output-label {
  color: #15803d;
}

.error-label {
  color: #b91c1c;
}

.output-content,
.error-content {
  padding: 14px;
  border-radius: 8px;
  overflow: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  margin: 0;
}

.output-content {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}

.error-content {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.no-results {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
  background: #fafafa;
  border-radius: 8px;
  padding: 40px;
}

/* 滚动条美化 */
.logs-container::-webkit-scrollbar,
.results-container::-webkit-scrollbar,
.output-content::-webkit-scrollbar,
.error-content::-webkit-scrollbar {
  width: 8px;
}

.logs-container::-webkit-scrollbar-track,
.results-container::-webkit-scrollbar-track,
.output-content::-webkit-scrollbar-track,
.error-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.logs-container::-webkit-scrollbar-thumb,
.results-container::-webkit-scrollbar-thumb,
.output-content::-webkit-scrollbar-thumb,
.error-content::-webkit-scrollbar-thumb {
  background: #c2d2e1;
  border-radius: 4px;
}

.logs-container::-webkit-scrollbar-thumb:hover,
.results-container::-webkit-scrollbar-thumb:hover,
.output-content::-webkit-scrollbar-thumb:hover,
.error-content::-webkit-scrollbar-thumb:hover {
  background: #6887a8;
}
</style>

<!-- 全局样式覆盖 el-dialog -->
<style>
.execution-dialog .el-dialog {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: linear-gradient(170deg, rgba(248, 251, 252, 0.96), rgba(243, 248, 251, 0.94));
  box-shadow: 0 22px 50px rgba(71, 95, 120, 0.2), 0 10px 26px rgba(0, 0, 0, 0.08);
}

.execution-dialog .el-dialog__header {
  padding: 16px 20px;
  margin: 0;
  background: rgba(241, 247, 251, 0.9);
  border-bottom: 1px solid #dde7ef;
}

.execution-dialog .el-dialog__body {
  padding: 20px;
}

/* 遮罩层 - 半透明灰色，突出 dialog */
.execution-dialog .el-overlay {
  background-color: rgba(62, 76, 90, 0.28);
  backdrop-filter: blur(4px);
}
</style>
