import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { WorkflowState, WorkflowNode, Edge, NodeType, BaseNodeData } from '@/types/workflow'
import type { ExecutionContext } from '@/core/workflow-engine/types'
import { WorkflowExecutor } from '@/core/workflow-engine/executor'
import { workflowApi } from '@/services/api'
import type { WorkflowDetailDto, WorkflowListItemDto } from '@/services/api'
import { useHistoryStore } from './history-store'
import { useUIStore } from './ui-store'

/**
 * 后端 WorkflowDetailDto -> 前端 WorkflowState 转换
 * 后端扁平字段 version/createdAt/updatedAt 映射到前端 metadata 嵌套结构
 */
function dtoToState(dto: WorkflowDetailDto): WorkflowState {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? undefined,
    nodes: dto.nodes,
    edges: dto.edges,
    metadata: {
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      version: dto.version,
    },
  }
}

/**
 * 后端列表项 WorkflowListItemDto -> 前端 WorkflowState 转换
 * 列表接口不返回 nodes/edges，用空数组占位
 */
function listItemToState(dto: WorkflowListItemDto): WorkflowState {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? undefined,
    nodes: [],
    edges: [],
    metadata: {
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      version: dto.version,
    },
  }
}

/** 创建空工作流（仅用于本地临时状态，尚未持久化到后端） */
function createEmptyWorkflow(): WorkflowState {
  return {
    id: '',
    name: '未命名工作流',
    description: '',
    nodes: [],
    edges: [],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  }
}

export const useWorkflowStore = defineStore('workflow', () => {
  // ========== State ==========
  const currentWorkflow = ref<WorkflowState | null>(null)
  const workflows = ref<WorkflowState[]>([])
  const executionContext = ref<ExecutionContext>({})
  const isExecuting = ref(false)
  const executionLogs = ref<string[]>([])
  const executionStartTime = ref<Date | null>(null)
  const executionEndTime = ref<Date | null>(null)

  // ========== Computed ==========
  const canExecute = computed(() => {
    return !isExecuting.value && currentWorkflow.value && currentWorkflow.value.nodes.length > 0
  })

  // ========== Actions ==========

  /** 初始化：从后端加载工作流列表 */
  const initialize = async () => {
    try {
      resetExecutionState()
      const list = await workflowApi.list()
      workflows.value = list.map(listItemToState)

      // 如果有工作流，加载第一个的详情
      if (workflows.value.length > 0 && workflows.value[0]) {
        const detail = await workflowApi.get(workflows.value[0].id)
        currentWorkflow.value = dtoToState(detail)
      } else {
        currentWorkflow.value = null
      }
    } catch (error) {
      console.error('初始化工作流失败:', error)
      currentWorkflow.value = null
      resetExecutionState()
    }
  }

  /** 添加节点到当前工作流 */
  const addNode = (type: NodeType, position: { x: number; y: number }) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type,
      position: { x: position.x, y: position.y },
      data: {},
      status: 'idle',
    }

    if (currentWorkflow.value) {
      currentWorkflow.value.nodes.push(newNode)
      currentWorkflow.value.metadata.updatedAt = new Date().toISOString()
    }

    return newNode
  }

  /** 添加边（连接） */
  const addEdge = (connection: {
    source: string
    target: string
    sourceHandle?: string
    targetHandle?: string
  }) => {
    const newEdge: Edge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    }

    if (currentWorkflow.value) {
      currentWorkflow.value.edges.push(newEdge)
      currentWorkflow.value.metadata.updatedAt = new Date().toISOString()
    }

    return newEdge
  }

  /** 更新节点数据 */
  const updateNodeData = (nodeId: string, data: BaseNodeData) => {
    if (!currentWorkflow.value) return
    const node = currentWorkflow.value.nodes.find((n) => n.id === nodeId)
    if (node) {
      node.data = { ...node.data, ...data }
      currentWorkflow.value.metadata.updatedAt = new Date().toISOString()
    }
  }

  /** 删除节点及其相关连线 */
  const deleteNode = (nodeId: string) => {
    if (!currentWorkflow.value) return null

    // 删除与该节点相关的所有连线
    currentWorkflow.value.edges = currentWorkflow.value.edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId,
    )

    // 删除节点
    const nodeIndex = currentWorkflow.value.nodes.findIndex((node) => node.id === nodeId)
    if (nodeIndex !== -1) {
      const removedNode = currentWorkflow.value.nodes.splice(nodeIndex, 1)[0]

      // 如果当前选中的是这个节点，清除选择
      const uiStore = useUIStore()
      if (uiStore.selectedNodeId === nodeId) {
        uiStore.selectNode(null)
      }

      currentWorkflow.value.metadata.updatedAt = new Date().toISOString()
      return removedNode
    }

    return null
  }

  /** 删除边 */
  const deleteEdge = (edgeId: string) => {
    if (!currentWorkflow.value) return null

    const edgeIndex = currentWorkflow.value.edges.findIndex((edge) => edge.id === edgeId)
    if (edgeIndex !== -1) {
      const removedEdge = currentWorkflow.value.edges.splice(edgeIndex, 1)[0]
      currentWorkflow.value.metadata.updatedAt = new Date().toISOString()
      return removedEdge
    }

    return null
  }

  /** 清空执行日志 */
  const clearExecutionLogs = () => {
    executionLogs.value = []
    executionStartTime.value = null
    executionEndTime.value = null
  }

  /** 重置执行状态（切换/新建工作流时调用） */
  const resetExecutionState = () => {
    executionContext.value = {}
    clearExecutionLogs()
    const uiStore = useUIStore()
    uiStore.executionPanelVisible = false
  }

  /** 添加执行日志 */
  const addExecutionLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString()
    executionLogs.value.push(`[${timestamp}] ${log}`)
  }

  /** 执行工作流（前端本地执行引擎） */
  const executeWorkflow = async () => {
    if (isExecuting.value) return

    isExecuting.value = true
    executionContext.value = {}
    clearExecutionLogs()

    try {
      // 显示执行面板
      const uiStore = useUIStore()
      uiStore.executionPanelVisible = true

      // 重置所有节点状态
      if (currentWorkflow.value) {
        currentWorkflow.value.nodes.forEach((node) => {
          node.status = 'idle'
        })
      }

      executionStartTime.value = new Date()
      addExecutionLog('开始执行工作流...')

      const executor = new WorkflowExecutor()
      const result = await executor.execute(
        currentWorkflow.value?.nodes || [],
        currentWorkflow.value?.edges || [],
      )

      executionContext.value = result
      executionEndTime.value = new Date()

      // 更新节点执行状态
      Object.keys(result).forEach((nodeId) => {
        const node = currentWorkflow.value?.nodes.find((n) => n.id === nodeId)
        const nodeResult = result[nodeId]
        if (node && nodeResult) {
          node.status = nodeResult.success ? 'success' : 'failed'
          addExecutionLog(
            `节点 ${nodeId} (${node.type}) 执行${nodeResult.success ? '成功' : '失败'}${nodeResult.error ? ': ' + nodeResult.error : ''}`,
          )
        }
      })

      addExecutionLog('工作流执行完成')
      return result
    } catch (error) {
      executionEndTime.value = new Date()
      addExecutionLog(`执行错误: ${error instanceof Error ? error.message : String(error)}`)
      console.error('执行工作流失败:', error)
      throw error
    } finally {
      isExecuting.value = false
    }
  }

  /** 关闭执行面板 */
  const closeExecutionPanel = () => {
    const uiStore = useUIStore()
    uiStore.executionPanelVisible = false
  }

  /** 保存当前工作流到后端 */
  const saveWorkflow = async () => {
    if (!currentWorkflow.value) return false

    try {
      const wf = currentWorkflow.value

      // 过滤掉前端运行时字段 status（后端不需要）
      const nodes = wf.nodes.map(({ status, ...rest }) => rest)

      if (!wf.id) {
        // 新建工作流（尚未持久化）
        const created = await workflowApi.create({
          name: wf.name || `工作流 ${workflows.value.length + 1}`,
          description: wf.description,
          nodes,
          edges: wf.edges,
        })
        currentWorkflow.value = dtoToState(created)

        // 添加到列表
        workflows.value.unshift(dtoToState(created))
      } else {
        // 更新已有工作流
        const updated = await workflowApi.update(wf.id, {
          name: wf.name,
          description: wf.description,
          nodes,
          edges: wf.edges,
        })
        currentWorkflow.value = dtoToState(updated)

        // 更新列表中的对应项
        const idx = workflows.value.findIndex((w) => w.id === wf.id)
        if (idx > -1) {
          workflows.value[idx] = dtoToState(updated)
        }
      }

      return true
    } catch (error) {
      console.error('保存工作流失败:', error)
      return false
    }
  }

  /** 从后端加载工作流详情 */
  const loadWorkflow = async (workflowId: string) => {
    try {
      resetExecutionState()
      const detail = await workflowApi.get(workflowId)
      currentWorkflow.value = dtoToState(detail)
      return true
    } catch (error) {
      console.error('加载工作流失败:', error)
      resetExecutionState()
      return false
    }
  }

  /** 创建新的空工作流（本地临时状态，保存时才持久化） */
  const createNewWorkflow = () => {
    const historyStore = useHistoryStore()
    historyStore.clear()
    currentWorkflow.value = createEmptyWorkflow()
    resetExecutionState()
  }

  /** 删除工作流 */
  const deleteWorkflow = async (workflowId: string) => {
    try {
      await workflowApi.delete(workflowId)

      // 从列表中移除
      workflows.value = workflows.value.filter((w) => w.id !== workflowId)

      // 如果删除的是当前工作流，清空
      if (currentWorkflow.value?.id === workflowId) {
        createNewWorkflow()
      }

      return true
    } catch (error) {
      console.error('删除工作流失败:', error)
      return false
    }
  }

  /** 复制工作流（通过后端 API，不影响 currentWorkflow） */
  const duplicateWorkflow = async (workflowId: string): Promise<boolean> => {
    try {
      const duplicated = await workflowApi.duplicate(workflowId)
      // 添加到列表头部
      workflows.value.unshift(dtoToState(duplicated))
      return true
    } catch (error) {
      console.error('复制工作流失败:', error)
      return false
    }
  }

  /** 导入工作流（通过后端 API，不影响 currentWorkflow） */
  const importWorkflow = async (data: WorkflowState): Promise<boolean> => {
    try {
      const imported = await workflowApi.importJson({
        name: data.name,
        description: data.description ?? null,
        nodes: data.nodes,
        edges: data.edges,
        metadata: data.metadata,
      })
      // 添加到列表头部
      workflows.value.unshift(dtoToState(imported))
      return true
    } catch (error) {
      console.error('导入工作流失败:', error)
      return false
    }
  }

  return {
    // State
    currentWorkflow,
    workflows,
    executionContext,
    isExecuting,
    executionLogs,
    executionStartTime,
    executionEndTime,

    // Computed
    canExecute,

    // Actions
    initialize,
    addNode,
    addEdge,
    updateNodeData,
    deleteNode,
    deleteEdge,
    executeWorkflow,
    closeExecutionPanel,
    clearExecutionLogs,
    addExecutionLog,
    saveWorkflow,
    loadWorkflow,
    createNewWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    importWorkflow,
  }
})
