<template>
  <!-- 添加容器包装并绑定拖拽事件 -->
  <div
    class="canvas-container"
    @drop="onDrop"
    @dragover="onDragOver"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover.prevent
    @dragenter.prevent
    @drop.prevent
  >
    <VueFlow
      v-if="hasCurrentWorkflow && workflow.currentWorkflow"
      v-model:nodes="workflow.currentWorkflow!.nodes"
      v-model:edges="workflow.currentWorkflow!.edges"
      @node-click="onNodeClick"
      @node-dblclick="onNodeDblClick"
      @edge-click="onEdgeClick"
      @edge-dblclick="onEdgeDblClick"
      @connect="onConnect"
    >
      <template #empty-state>
        <div class="empty-workflow">
          <p>请创建或选择一个工作流</p>
        </div>
      </template>
      <Background />
      <Controls />

      <!-- 动态节点渲染 -->
      <template v-for="nodeType in nodeTypes" #[`node-${nodeType}`]="props" :key="nodeType">
        <component :is="getNodeComponent(nodeType)" v-bind="props" />
      </template>
    </VueFlow>
    <div v-else class="empty-canvas">
      <p>请创建或选择一个工作流</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow, useVueFlow, type Connection, type NodeMouseEvent } from '@vue-flow/core'
import { defineAsyncComponent, ref, computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow-store'
import { useUIStore } from '@/stores/ui-store'
import { useHistoryStore } from '@/stores/history-store'
import type { NodeType } from '@/types/workflow'

// 业务逻辑
const workflow = useWorkflowStore()
const ui = useUIStore()
const history = useHistoryStore()

// 使用 VueFlow 的 API 来转换坐标
const { project } = useVueFlow()

// 检查是否有当前工作流，避免空值错误
const hasCurrentWorkflow = computed(() => {
  return workflow.currentWorkflow !== null
})

// 当前选中的待删除元素
const elementToDelete = ref<{type: 'node' | 'edge'; id: string} | null>(null)

// 拖拽状态管理
const isDragOver = ref(false)

const nodeTypes = [
  'start',
  'ai-chat',
  'condition',
  'end',
  'data-process',
  'text-output',
] as NodeType[]

const getNodeComponent = (type: NodeType) => {
  return defineAsyncComponent(() => import(`@/ui/nodes/${type}-node.vue`))
}

const onNodeClick = (event: NodeMouseEvent) => {
  if (ui.isEditMode) {
    // 在编辑模式下，点击不选中节点，而是用于准备删除
    console.log('编辑模式下点击节点:', event.node.id)
  } else {
    ui.selectNode(event.node.id)
  }
}

const onNodeDblClick = (event: NodeMouseEvent) => {
  if (ui.isEditMode && hasCurrentWorkflow.value && workflow.currentWorkflow) {
    console.log('编辑模式下双击删除节点:', event.node.id)
    
    // 存储待删除元素
    elementToDelete.value = { type: 'node', id: event.node.id }
    
    // 显示确认对话框
    if (confirm(`确定要删除节点 "${(event.node.data as Record<string, unknown>)?.title || event.node.id}" 吗？`)) {
      // 调用工作流存储中的删除方法（后续实现）
      console.log('删除节点:', event.node.id)
      workflow.deleteNode(event.node.id)
      history.pushState()
    }
    
    // 清除待删除元素
    elementToDelete.value = null
  }
}

// 边点击事件类型
interface EdgeClickEvent {
  edge: { id: string; source: string; target: string }
}

const onEdgeClick = (event: EdgeClickEvent) => {
  if (ui.isEditMode) {
    console.log('编辑模式下点击连线:', event.edge.id)
    // 在编辑模式下高亮显示点击的连线
    if (event.edge) {
      // 这里可以添加连线高亮逻辑
      console.log('高亮连线:', event.edge.id)
    }
  }
}

const onEdgeDblClick = (event: EdgeClickEvent) => {
  if (ui.isEditMode && hasCurrentWorkflow.value && workflow.currentWorkflow) {
    console.log('编辑模式下双击删除连线:', event.edge.id)
    
    // 存储待删除元素
    elementToDelete.value = { type: 'edge', id: event.edge.id }
    
    // 显示确认对话框
    if (confirm('确定要删除这条连线吗？')) {
      // 调用工作流存储中的删除方法（后续实现）
      console.log('删除连线:', event.edge.id)
      workflow.deleteEdge(event.edge.id)
      history.pushState()
    }
    
    // 清除待删除元素
    elementToDelete.value = null
  }
}

const onConnect = (connection: Connection) => {
  workflow.addEdge({
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle || undefined,
    targetHandle: connection.targetHandle || undefined,
  })
  history.pushState()
}

// 增强 onDrop 事件处理
const onDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false

  console.log('📥 onDrop 事件触发!')

  // 获取多种格式的数据，优先使用节点类型格式
  const type =
    event.dataTransfer?.getData('application/node-type') ||
    event.dataTransfer?.getData('text/plain')
  const jsonData = event.dataTransfer?.getData('application/json')

  console.log('📥 接收到拖拽数据:', {
    nodeType: event.dataTransfer?.getData('application/node-type'),
    textType: event.dataTransfer?.getData('text/plain'),
    type: type,
    hasJson: !!jsonData,
  })

  if (!type) {
    console.error('❌ 未找到节点类型数据，检查拖拽源')
    return
  }

  try {
    // 使用 VueFlow 的 project 方法将屏幕坐标转换为画布坐标
    // 这样可以正确处理缩放和平移
    const position = project({
      x: event.clientX,
      y: event.clientY,
    })

    console.log('📍 转换后的画布坐标:', position)

    // 解析完整的节点数据
    if (jsonData) {
      try {
        const nodeData = JSON.parse(jsonData)
        console.log('📋 解析的节点数据:', nodeData)
        // 添加节点并合并默认数据
        const newNode = workflow.addNode(type as NodeType, position)
        if (nodeData.defaultData) {
          workflow.updateNodeData(newNode.id, nodeData.defaultData)
        }
      } catch (parseError) {
        console.error('❌ 解析节点数据失败:', parseError)
        workflow.addNode(type as NodeType, position)
      }
    } else {
      // 如果没有额外数据，只传递类型和位置
      workflow.addNode(type as NodeType, position)
    }

    history.pushState()
    console.log('✅ 节点添加成功:', type)
  } catch (error) {
    console.error('❌ 添加节点失败:', error)
  }
}

// 增强拖拽悬停处理
const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
  console.log('↕️ onDragOver 事件触发')
}

// 添加拖拽进入事件
const onDragEnter = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = true
  console.log('🎯 拖拽进入画布')
}

// 添加拖拽离开事件
const onDragLeave = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  // 防止子元素触发 dragleave
  const currentTarget = event.currentTarget as HTMLElement | null
  const relatedTarget = event.relatedTarget as Node | null
  if (!currentTarget || !relatedTarget || !currentTarget.contains(relatedTarget)) {
    isDragOver.value = false
    console.log('👋 拖拽离开画布')
  }
}
</script>

<style scoped>
/* 画布容器 */
.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: var(--el-bg-color-canvas); /* 极浅粉紫色背景 bg-[#f8f6fa] */
  overflow: hidden;
}

.canvas-container.drag-over {
  background: rgba(var(--el-color-primary-rgb), 0.05);
  border: 2px dashed var(--el-color-primary);
  transition: all 0.2s ease;
}

/* Vue Flow 容器样式 */
:deep(.vue-flow__wrapper) {
  width: 100%;
  height: 100%;
  position: relative;
}

:deep(.vue-flow__container),
:deep(.vue-flow__renderer),
:deep(.vue-flow__viewport) {
  width: 100%;
  height: 100%;
}

/* 自定义网格点阵样式 - 按照设计要求实现 */
:deep(.vue-flow__background) {
  background-size: 20px 20px; /* 每20px一个点 */
  background-image:
    radial-gradient(var(--el-border-color-grid) 1px, transparent 1px),
    radial-gradient(var(--el-border-color-grid) 1px, transparent 1px);
  background-position: 0 0, 10px 10px; /* 交叉排列 */
  background-repeat: repeat;
  background-color: var(--el-bg-color-canvas);
}

/* 连接点样式 - 按照设计要求实现 */
:deep(.vue-flow__handle) {
  width: 16px; /* w-4 = 16px */
  height: 16px; /* h-4 = 16px */
  border: 2px solid var(--el-border-color-selected); /* border-2 border-[#8e4ccb] */
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

:deep(.vue-flow__handle-left) {
  left: -8px; /* 左侧连接点定位 */
}

:deep(.vue-flow__handle-right) {
  left: 100%; /* 右侧连接点定位 */
  margin-left: -8px;
}

/* 连接线样式 */
:deep(.vue-flow__edge) {
  stroke: var(--el-color-primary-light-3);
  stroke-width: 2;
}

:deep(.vue-flow__edge.animated) {
  stroke-dasharray: 5, 5;
  animation: dash 0.5s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}

/* 拖拽时的预览样式 */
:deep(.vue-flow__connection-path) {
  stroke: var(--el-color-primary);
  stroke-width: 2;
}

/* 滚动条样式 */
:deep(.vue-flow__attribution) {
  display: none; /* 隐藏默认版权信息 */
}

/* 空画布样式 */
.empty-canvas, .empty-workflow {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
  font-size: 16px;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  :deep(.vue-flow__background) {
    background-size: 16px 16px;
  }
}
</style>
