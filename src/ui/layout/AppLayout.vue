<template>
  <el-config-provider :locale="zhCn">
    <div class="app-layout">
      <!-- 顶部导航栏 -->
      <header class="app-header">
        <!-- 左侧：Logo + 工作流名称 -->
        <div class="header-left">
          <router-link to="/workflows" class="header-logo">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#6366f1" />
              <path d="M7 14h4l3-6 3 12 3-6h4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="logo-text">FlowGen</span>
          </router-link>
          <div class="header-divider" />
          <span class="workflow-name">{{ workflowName }}</span>
        </div>

        <!-- 中间：工具栏 -->
        <div class="header-center">
          <Toolbar />
        </div>

        <!-- 右侧：用户信息 -->
        <div class="header-right">
          <span class="user-badge">{{ auth.user?.displayName || auth.user?.email || '未登录' }}</span>
        </div>
      </header>

      <!-- 主内容区域 -->
      <div class="main-container">
        <!-- 左侧节点面板 -->
        <aside class="sidebar">
          <NodePalette />
        </aside>

        <!-- 中间画布区域 -->
        <main class="canvas">
          <WorkflowCanvas />
        </main>

        <!-- 右侧配置面板 -->
        <aside v-if="ui.configPanelVisible && ui.selectedNode" class="config-panel">
          <ConfigPanel />
        </aside>
      </div>

      <!-- 底部执行面板 -->
      <div class="bottom-panel">
        <ExecutionPanel />
      </div>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useUIStore } from '@/stores/ui-store'
import { useWorkflowStore } from '@/stores/workflow-store'
import { useAuthStore } from '@/stores/auth-store'
import Toolbar from '@/ui/toolbar/MainToolbar.vue'
import NodePalette from '@/ui/palette/NodePalette.vue'
import WorkflowCanvas from '@/ui/canvas/WorkflowCanvas.vue'
import ConfigPanel from '@/ui/panel/ConfigPanel.vue'
import ExecutionPanel from '@/ui/panel/ExecutionPanel.vue'

const ui = useUIStore()
const workflow = useWorkflowStore()
const auth = useAuthStore()

const workflowName = computed(() => workflow.currentWorkflow?.name || '未命名工作流')

// 确保执行面板默认展开
ui.executionPanelVisible = true
</script>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8f9ff;
  min-width: 1024px;
}

/* 顶部导航栏 - glassmorphism */
.app-header {
  height: 56px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.8);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 7px;
  text-decoration: none;
}
.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: #1e1b4b;
  letter-spacing: -0.3px;
}

.header-divider {
  width: 1px;
  height: 18px;
  background: #e5e7eb;
}

.workflow-name {
  font-size: 13px;
  color: #6b7280;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-right {
  display: flex;
  align-items: center;
  min-width: 200px;
  justify-content: flex-end;
}

.user-badge {
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 10px;
  border-radius: 20px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 主内容区域 */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧侧边栏 */
.sidebar {
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #f0f0f5;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
}

/* 画布区域 */
.canvas {
  flex: 1;
  background: #f4f4f8;
  padding: 0;
  overflow: hidden;
  position: relative;
}

/* 配置面板（右侧） */
.config-panel {
  width: 300px;
  background: #ffffff;
  border-left: 1px solid #f0f0f5;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

/* 底部面板 */
.bottom-panel {
  flex-shrink: 0;
  border-top: 1px solid #f0f0f5;
  background: #ffffff;
}

@media (max-width: 1024px) {
  .app-layout { min-width: unset; }
  .sidebar, .config-panel { width: 260px; }
  .workflow-name, .user-badge { display: none; }
}
</style>
