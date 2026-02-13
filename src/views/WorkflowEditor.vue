<template>
  <div class="workflow-editor">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="navbar-content">
        <div class="brand">
          <span class="logo">🔄</span>
          <span class="title">工作流编辑器</span>
        </div>
        <MainToolbar />
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧节点库 -->
      <div class="sidebar">
        <NodePalette />
      </div>
      <!-- 中间画布区域 -->
      <div class="canvas-container">
        <WorkflowCanvas />
      </div>
    </div>
    
    <!-- 底部执行面板 -->
    <Transition name="slide-up">
      <ExecutionPanel v-if="showBottomPanel" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow-store'
import { useUIStore } from '@/stores/ui-store'
import WorkflowCanvas from '@/ui/canvas/WorkflowCanvas.vue'
import NodePalette from '@/ui/palette/NodePalette.vue'
import MainToolbar from '@/ui/toolbar/MainToolbar.vue'
import ExecutionPanel from '@/ui/panel/ExecutionPanel.vue'
import ConditionNode from '@/ui/nodes/condition-node.vue'
import DataProcessNode from '@/ui/nodes/data-process-node.vue'
import ConditionConfig from '@/ui/panel/configs/condition-config.vue'
import DataProcessConfig from '@/ui/panel/configs/data-process-config.vue'

const route = useRoute()
const router = useRouter()
const workflowStore = useWorkflowStore()
const uiStore = useUIStore()

// 底部面板可见性
const showBottomPanel = computed(() => {
  return uiStore.executionPanelVisible
})

// 初始化工作流
onMounted(async () => {
  await workflowStore.initialize()
  
  // 从路由参数获取工作流ID
  const workflowId = route.params.id as string
  
  // 如果有ID，则加载工作流
  if (workflowId) {
    loadWorkflowById(workflowId)
  } else if (!workflowStore.currentWorkflow) {
    // 如果没有当前工作流，自动创建一个
    console.log('没有找到工作流，自动创建新工作流...')
    workflowStore.createNewWorkflow()
  }
  
  // 设置最小宽度
  document.body.style.minWidth = '1024px'
  
  // 清除之前选择的节点
  uiStore.selectNode(null)
})

const loadWorkflowById = async (id: string) => {
  try {
    const loaded = await workflowStore.loadWorkflow(id)
    if (!loaded) {
      router.push('/workflows')
    }
  } catch (error) {
    // 如果加载失败，重定向到工作流管理页面
    console.error('Failed to load workflow:', error)
    router.push('/workflows')
  }
}

// 监听路由变化，加载对应的工作流
watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId && newId) {
    loadWorkflowById(newId as string)
  }
})

// 监听工作流执行状态，自动显示底部面板
watch(() => workflowStore.isExecuting, (isExecuting) => {
  if (isExecuting) {
    // 直接设置UI store中的执行面板可见性
    uiStore.executionPanelVisible = true
  }
})
</script>

<style scoped>
.workflow-editor {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 1024px;
}

/* 顶部导航栏 */
.navbar {
  height: 60px; /* h-[60px] */
  background-color: #f0e8ff; /* bg-[#f0e8ff] 柔和紫色 */
  border-bottom: 1px solid #d9c8f0; /* border-b border-[#d9c8f0] */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.navbar-content {
  height: 100%;
  padding: 0 24px; /* px-6 = 24px */
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  font-size: 24px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #5a2790;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧节点库 */
.sidebar {
  width: 320px; /* w-80 = 320px */
  background-color: #fff;
  border-right: 1px solid #e2e8f0; /* border-r border-gray-200 */
  overflow-y: auto;
  flex-shrink: 0;
}

/* 中间画布区域 */
.canvas-container {
  flex: 1; /* flex-1 占满剩余空间 */
  background-color: #f8f6fa; /* bg-[#f8f6fa] 极浅粉紫色 */
  position: relative;
  overflow: auto;
}

/* 底部面板过渡动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
  transform-origin: bottom;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .navbar-content {
    padding: 0 16px;
  }
  
  .sidebar {
    width: 280px;
  }
}
</style>