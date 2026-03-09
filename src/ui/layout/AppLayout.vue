<template>
  <el-config-provider :locale="zhCn">
    <div class="app-layout">
      <!-- 顶部导航栏 -->
      <header class="app-header">
        <!-- 左侧：Logo + 工作流名称 -->
        <div class="header-left">
          <router-link to="/workflows" class="header-logo">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#6f8ea8" />
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
</script>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background:
    radial-gradient(1100px 500px at -15% -20%, rgba(168, 202, 208, 0.28) 0%, rgba(168, 202, 208, 0) 65%),
    radial-gradient(900px 420px at 105% -25%, rgba(196, 186, 224, 0.22) 0%, rgba(196, 186, 224, 0) 62%),
    linear-gradient(145deg, #eef2f5 0%, #f6f4f1 45%, #edf2f7 100%);
  min-width: 1024px;
}

/* 顶部导航栏 - glassmorphism */
.app-header {
  height: 62px;
  background: rgba(247, 250, 252, 0.7);
  backdrop-filter: blur(14px) saturate(105%);
  -webkit-backdrop-filter: blur(14px) saturate(105%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 10px 28px rgba(77, 101, 126, 0.1);
  margin: 12px 14px 10px;
  border-radius: 18px;
  padding: 0 18px;
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
  color: #2f495f;
  letter-spacing: -0.3px;
}

.header-divider {
  width: 1px;
  height: 18px;
  background: #e5e7eb;
}

.workflow-name {
  font-size: 13px;
  color: #6a7887;
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
  color: #5e6f80;
  background: rgba(245, 248, 250, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  padding: 5px 10px;
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
  gap: 12px;
  padding: 0 14px 14px;
}

/* 左侧侧边栏 */
.sidebar {
  width: 280px;
  background: rgba(248, 251, 252, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(78, 99, 123, 0.08);
  backdrop-filter: blur(12px);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
}

/* 画布区域 */
.canvas {
  flex: 1;
  background: rgba(246, 249, 251, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 20px;
  box-shadow: 0 10px 28px rgba(74, 96, 122, 0.08);
  backdrop-filter: blur(10px);
  padding: 0;
  overflow: hidden;
  position: relative;
}

/* 配置面板（右侧） */
.config-panel {
  width: 300px;
  background: rgba(248, 251, 252, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(78, 99, 123, 0.08);
  backdrop-filter: blur(12px);
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

/* 底部面板 */
.bottom-panel {
  flex-shrink: 0;
  background: transparent;
}

@media (max-width: 1024px) {
  .app-layout { min-width: unset; }
  .sidebar, .config-panel { width: 260px; }
  .workflow-name, .user-badge { display: none; }
  .main-container { gap: 8px; padding: 0 10px 10px; }
  .app-header { margin: 10px 10px 8px; }
}
</style>
