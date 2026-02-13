<template>
  <el-config-provider :locale="zhCn">
    <div class="app-layout">
      <el-container>
        <!-- 顶部导航栏 -->
        <el-header class="app-header">
          <div class="toolbar-brand">
            <el-icon size="24"><Document /></el-icon>
            <span class="logo-text">工作流编辑器</span>
          </div>
          <Toolbar />
        </el-header>

        <!-- 主内容区域 -->
        <el-container
          class="main-container"
          :class="{ 'panel-expanded': ui.executionPanelVisible }"
        >
          <!-- 左侧节点面板 -->
          <el-aside width="320px" class="sidebar">
            <NodePalette />
          </el-aside>

          <!-- 中间画布区域 -->
          <el-main class="canvas">
            <WorkflowCanvas />
          </el-main>

          <!-- 右侧配置面板 -->
          <el-aside
            v-if="ui.configPanelVisible && ui.selectedNode"
            width="320px"
            class="config-panel"
          >
            <ConfigPanel />
          </el-aside>
        </el-container>

        <!-- 底部执行面板 -->
        <div class="bottom-panel">
          <ExecutionPanel />
        </div>
      </el-container>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useUIStore } from '@/stores/ui-store'
import { Document } from '@element-plus/icons-vue'
import Toolbar from '@/ui/toolbar/MainToolbar.vue'
import NodePalette from '@/ui/palette/NodePalette.vue'
import WorkflowCanvas from '@/ui/canvas/WorkflowCanvas.vue'
import ConfigPanel from '@/ui/panel/ConfigPanel.vue'
import ExecutionPanel from '@/ui/panel/ExecutionPanel.vue'

const ui = useUIStore()

// 确保执行面板默认是展开的
ui.executionPanelVisible = true
</script>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-width: 1024px; /* 桌面端最小宽度 */
}

/* 顶部导航栏 */
.app-header {
  background: #f0e8ff; /* bg-[#f0e8ff] - 柔和紫色 */
  color: var(--el-text-color-main-title);
  border-bottom: 1px solid #d9c8f0; /* border-b border-[#d9c8f0] */
  padding: 0 24px; /* px-6 = 24px */
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 60px; /* h-[60px] */
  transition: all 0.2s ease;
}

.toolbar-brand {
  display: flex;
  align-items: center;
  gap: 8px; /* space-x-2 = 8px */
}

.logo-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 主内容区域 */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧侧边栏 */
.sidebar {
  background: #ffffff; /* bg-white */
  border-right: 1px solid #e5e7eb; /* border-r border-gray-200 */
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  width: 320px; /* w-80 = 320px */
  flex-shrink: 0;
}

/* 画布区域 */
.canvas {
  background: #f8f6fa; /* bg-[#f8f6fa] - 极浅粉紫色 */
  padding: 0;
  flex: 1; /* 占满剩余空间 */
  overflow: hidden;
  position: relative;
}

/* 配置面板（右侧） */
.config-panel {
  background: #ffffff; /* bg-white */
  border-left: 1px solid #e5e7eb; /* border-gray-200 */
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 320px; /* w-80 = 320px */
  flex-shrink: 0;
}

/* 底部面板 */
.bottom-panel {
  flex-shrink: 0;
  border-top: 1px solid #e5e7eb; /* border-t border-gray-200 */
  background-color: #ffffff;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .app-layout {
    min-width: unset;
  }

  .sidebar,
  .config-panel {
    width: 280px;
  }

  .logo-text {
    display: none;
  }
}
</style>
