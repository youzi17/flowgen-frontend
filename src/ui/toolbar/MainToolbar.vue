<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="workflow-actions">
        <el-button class="main-button save-button" @click="handleSave">
          <el-icon><Document /></el-icon>
          <span>保存</span>
        </el-button>
        <el-button
          type="primary"
          class="main-button run-button"
          @click="executeWorkflow"
          :disabled="!canExecute"
          :loading="isExecuting"
        >
          <el-icon><VideoPlay /></el-icon>
          <span>{{ isExecuting ? '执行中...' : '执行工作流' }}</span>
        </el-button>
      </div>
    </div>

    <div class="toolbar-right">
      <div class="history-actions">
        <el-button
          type="text"
          class="icon-button"
          @click="handleUndo"
          :disabled="!canUndo"
          title="撤销"
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <el-button
          type="text"
          class="icon-button"
          @click="handleRedo"
          :disabled="!canRedo"
          title="重做"
        >
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="view-actions">
        <el-button type="text" class="main-button ghost-button" @click="viewWorkflows">
          <el-icon><View /></el-icon>
          <span>查看已有工作流</span>
        </el-button>
        <el-button type="text" class="icon-button" @click="toggleSettings" title="设置">
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow-store'
import { useHistoryStore } from '@/stores/history-store'
import { useUIStore } from '@/stores/ui-store'
import { VideoPlay, ArrowLeft, ArrowRight, View, Setting, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 业务逻辑
const workflow = useWorkflowStore()
const history = useHistoryStore()
const _ui = useUIStore()
const router = useRouter()

// 本地设置面板可见性状态
const settingsVisible = ref(false)

const canExecute = computed(
  () => !workflow.isExecuting && workflow.currentWorkflow && workflow.currentWorkflow.nodes.length > 0,
)

const isExecuting = computed(() => workflow.isExecuting)

const canUndo = computed(() => history.canUndo)

const canRedo = computed(() => history.canRedo)

const executeWorkflow = async () => {
  try {
    await workflow.executeWorkflow()
    ElMessage.success('执行成功')
  } catch (error: unknown) {
    ElMessage.error(
      '执行失败: ' + ((error instanceof Error ? error.message : String(error)) || '未知错误'),
    )
  }
}

const handleSave = async () => {
  const success = await workflow.saveWorkflow()
  if (success) {
    ElMessage.success('保存成功')
  } else {
    ElMessage.error('保存失败')
  }
}

const handleUndo = () => {
  history.undo()
}

const handleRedo = () => {
  history.redo()
}

// 切换设置面板
const toggleSettings = () => {
  settingsVisible.value = !settingsVisible.value
  // 这里可以添加设置面板的具体逻辑
}

// 跳转到工作流管理页面
const viewWorkflows = () => {
  router.push('/workflows')
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  width: 100%;
}

/* 左侧工具栏 */
.toolbar-left {
  display: flex;
  align-items: center;
}

/* 右侧工具栏 */
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 18px;
}

/* 按钮组 */
.workflow-actions,
.history-actions,
.view-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.history-actions {
  gap: 8px; /* 撤销/重做按钮间距 */
}

/* 主要按钮样式 */
.main-button {
  padding: 10px 18px;
  border-radius: 14px;
  font-size: var(--el-button-font-size);
  height: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.main-button .el-icon {
  font-size: 16px;
}

.save-button {
  border: 1px solid #d6e2ec;
  background: rgba(248, 251, 252, 0.9);
  color: #45607a;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.run-button {
  background: linear-gradient(135deg, #6888aa, #547592);
  border-color: #5b7b99;
  box-shadow: 0 8px 20px rgba(84, 117, 146, 0.28);
}

.ghost-button {
  color: #607284;
  padding: 8px 10px;
}

.ghost-button:hover {
  color: #3f5b76;
  background: rgba(236, 243, 248, 0.85);
  border-radius: 12px;
}

/* 图标按钮样式 */
.icon-button {
  width: 44px; /* w-11 = 44px */
  height: 44px; /* h-11 = 44px */
  padding: 0;
  border-radius: 12px;
  background: rgba(247, 250, 252, 0.75);
  border: 1px solid rgba(214, 226, 236, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-button .el-icon {
  font-size: 18px;
  color: #607284;
}

.icon-button:hover .el-icon {
  color: #46627e;
}

.icon-button:disabled .el-icon {
  color: var(--el-text-color-placeholder);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .workflow-actions,
  .view-actions {
    gap: 16px;
  }

  .main-button {
    padding: 8px 16px;
    font-size: 13px;
  }

  .main-button span {
    display: none;
  }

  .main-button .el-icon {
    font-size: 16px;
  }
}
</style>
