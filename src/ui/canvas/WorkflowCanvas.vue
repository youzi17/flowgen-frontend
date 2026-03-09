<template>
  <!-- 画布容器，绑定拖拽事件 -->
  <div
    class="canvas-container"
    :class="{ 'drag-over': isDragOver }"
    @drop="onDrop"
    @dragover="onDragOver"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
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
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { defineAsyncComponent, ref, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useWorkflowStore } from '@/stores/workflow-store'
import { useUIStore } from '@/stores/ui-store'
import { useHistoryStore } from '@/stores/history-store'
import type { NodeType, BaseNodeData } from '@/types/workflow'

const workflow = useWorkflowStore()
const ui = useUIStore()
const history = useHistoryStore()

// VueFlow API - 用于坐标转换
const { project } = useVueFlow()

// 是否有当前工作流
const hasCurrentWorkflow = computed(() => workflow.currentWorkflow !== null)

// 拖拽悬停状态
const isDragOver = ref(false)

// 支持的节点类型列表
const nodeTypes: NodeType[] = [
  'start',
  'ai-chat',
  'condition',
  'end',
  'data-process',
  'text-output',
]

// 节点类型校验
const isValidNodeType = (type: string): type is NodeType =>
  (nodeTypes as string[]).includes(type)

// 异步组件缓存，避免重复创建
const nodeComponentCache = new Map<NodeType, ReturnType<typeof defineAsyncComponent>>()
const getNodeComponent = (type: NodeType) => {
  if (!nodeComponentCache.has(type)) {
    nodeComponentCache.set(type, defineAsyncComponent(() => import(`@/ui/nodes/${type}-node.vue`)))
  }
  return nodeComponentCache.get(type)!
}

// 节点点击
const onNodeClick = (event: NodeMouseEvent) => {
  if (!ui.isEditMode) {
    ui.selectNode(event.node.id)
  }
}

// 节点双击删除（编辑模式）
const onNodeDblClick = async (event: NodeMouseEvent) => {
  if (!ui.isEditMode || !hasCurrentWorkflow.value || !workflow.currentWorkflow) return

  const title = (event.node.data as BaseNodeData)?.title ?? event.node.id
  try {
    await ElMessageBox.confirm(`确定要删除节点 "${title}" 吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    workflow.deleteNode(event.node.id)
    history.pushState()
  } catch {
    // 用户取消，不做处理
  }
}

// 边点击事件类型
interface EdgeClickEvent {
  edge: { id: string; source: string; target: string }
}

const onEdgeClick = (_event: EdgeClickEvent) => {
  // 编辑模式下可扩展连线高亮逻辑
}

// 边双击删除（编辑模式）
const onEdgeDblClick = async (event: EdgeClickEvent) => {
  if (!ui.isEditMode || !hasCurrentWorkflow.value || !workflow.currentWorkflow) return

  try {
    await ElMessageBox.confirm('确定要删除这条连线吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    workflow.deleteEdge(event.edge.id)
    history.pushState()
  } catch {
    // 用户取消
  }
}

// 连接节点
const onConnect = (connection: Connection) => {
  workflow.addEdge({
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle || undefined,
    targetHandle: connection.targetHandle || undefined,
  })
  history.pushState()
}

// 拖拽放置 - 添加节点
const onDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false

  const type =
    event.dataTransfer?.getData('application/node-type') ||
    event.dataTransfer?.getData('text/plain')
  const jsonData = event.dataTransfer?.getData('application/json')

  if (!type || !isValidNodeType(type)) {
    console.warn('无效的节点类型:', type)
    return
  }

  try {
    // 使用 VueFlow 的 project 方法将屏幕坐标转换为画布坐标
    const position = project({ x: event.clientX, y: event.clientY })

    if (jsonData) {
      try {
        const nodeData = JSON.parse(jsonData) as { defaultData?: BaseNodeData }
        const newNode = workflow.addNode(type, position)
        if (nodeData.defaultData) {
          workflow.updateNodeData(newNode.id, nodeData.defaultData)
        }
      } catch {
        workflow.addNode(type, position)
      }
    } else {
      workflow.addNode(type, position)
    }

    history.pushState()
  } catch (error) {
    console.error('添加节点失败:', error)
  }
}

// 拖拽悬停
const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

// 拖拽进入画布
const onDragEnter = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = true
}

// 拖拽离开画布
const onDragLeave = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  const currentTarget = event.currentTarget as HTMLElement | null
  const relatedTarget = event.relatedTarget as Node | null
  if (!currentTarget || !relatedTarget || !currentTarget.contains(relatedTarget)) {
    isDragOver.value = false
  }
}
</script>

<style scoped>
/* 画布容器 */
.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #f8fafc;
  overflow: hidden;
}

.canvas-container.drag-over {
  background: rgba(99, 102, 241, 0.03);
  border: 2px dashed #a5b4fc;
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

/* 点阵网格背景 */
:deep(.vue-flow__background) {
  background-color: #f8fafc;
  background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px);
  background-size: 24px 24px;
}

/* 全局 handle 样式 */
:deep(.vue-flow__handle) {
  width: 10px;
  height: 10px;
  border: 2px solid #6366f1;
  background: white;
  border-radius: 50%;
  transition: transform .15s, box-shadow .15s;
}
:deep(.vue-flow__handle:hover) {
  transform: scale(1.4);
  box-shadow: 0 0 0 3px rgba(99,102,241,.18);
}
:deep(.vue-flow__handle.vue-flow__handle-connected) {
  background: #6366f1;
}

/* 连接线 */
:deep(.vue-flow__edge-path) {
  stroke: #a5b4fc;
  stroke-width: 2;
}
:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: #6366f1;
  stroke-width: 2.5;
}
:deep(.vue-flow__edge:hover .vue-flow__edge-path) {
  stroke: #818cf8;
}

/* 拖拽预览线 */
:deep(.vue-flow__connection-path) {
  stroke: #6366f1;
  stroke-width: 2;
  stroke-dasharray: 5 4;
}

/* 隐藏版权 */
:deep(.vue-flow__attribution) {
  display: none;
}

/* 空画布 */
.empty-canvas, .empty-workflow {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #d1d5db;
  font-size: 14px;
}

@media (max-width: 1024px) {
  :deep(.vue-flow__background) {
    background-size: 20px 20px;
  }
}
</style>
