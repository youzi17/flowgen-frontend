import { ref, computed, toRaw } from 'vue'
import { defineStore } from 'pinia'
import type { WorkflowState, WorkflowNode, Edge, NodeType, BaseNodeData } from '@/types/workflow'
import type { ExecutionContext } from '@/core/workflow-engine/types'
import { WorkflowExecutor } from '@/core/workflow-engine/executor'
import { StorageManager } from '@/core/storage/storage-manager'
import { useHistoryStore } from './history-store'
import { useUIStore } from './ui-store'

// 创建空工作流
function createEmptyWorkflow(): WorkflowState {
  return {
    id: `workflow-${Date.now()}`,
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
  // State
  const currentWorkflow = ref<WorkflowState | null>(null)
  const workflows = ref<WorkflowState[]>([])
  const executionContext = ref<ExecutionContext>({})
  const isExecuting = ref(false)
  const executionLogs = ref<string[]>([])
  const executionStartTime = ref<Date | null>(null)
  const executionEndTime = ref<Date | null>(null)

  // 存储管理器实例
  const storageManager = new StorageManager()

  // Computed
  const canExecute = computed(() => {
    return !isExecuting.value && currentWorkflow.value && currentWorkflow.value.nodes.length > 0
  })

  // 创建新工作流的方法将在下方定义

  // Actions

  // 初始化工作流
  const initialize = async () => {
    try {
      // 加载保存的工作流列表
      workflows.value = await storageManager.getWorkflows()

      // 如果有保存的工作流，加载第一个
      if (workflows.value.length > 0 && workflows.value[0]) {
        currentWorkflow.value = workflows.value[0]
      } else {
        // 自动创建一个新的空工作流，让用户可以立即开始拖拽节点
        currentWorkflow.value = createEmptyWorkflow()
        console.log('自动创建新工作流:', currentWorkflow.value.id)
      }
    } catch (error) {
      console.error('初始化工作流失败:', error)
      // 即使初始化失败，也创建一个空工作流
      currentWorkflow.value = createEmptyWorkflow()
    }
  }

  // 添加节点
  const addNode = (type: string, position: { x: number; y: number }) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as NodeType,
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

  // 添加边
  const addEdge = (connection: {
    source: string
    target: string
    sourceHandle?: string
    targetHandle?: string
  }) => {
    const newEdge: Edge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  // 更新节点数据
  const updateNodeData = (nodeId: string, data: BaseNodeData) => {
    if (!currentWorkflow.value) return
    const node = currentWorkflow.value.nodes.find((n) => n.id === nodeId)
    if (node) {
      node.data = { ...node.data, ...data }
      currentWorkflow.value.metadata.updatedAt = new Date().toISOString()
    }
  }

  // 删除节点及其相关连线
  const deleteNode = (nodeId: string) => {
    if (!currentWorkflow.value) return null
    
    // 1. 删除与该节点相关的所有连线
    const edgesToRemove = currentWorkflow.value.edges.filter(
      edge => edge.source === nodeId || edge.target === nodeId
    )
    
    // 记录要删除的连线ID
    const edgeIdsToRemove = edgesToRemove.map(edge => edge.id)
    
    // 从edges数组中过滤掉这些连线
    currentWorkflow.value.edges = currentWorkflow.value.edges.filter(
      edge => !edgeIdsToRemove.includes(edge.id)
    )
    
    console.log(`删除了 ${edgeIdsToRemove.length} 条与节点 ${nodeId} 相关的连线`)
    
    // 2. 删除节点
    if (!currentWorkflow.value) return null
    const nodeIndex = currentWorkflow.value.nodes.findIndex(node => node.id === nodeId)
    if (nodeIndex !== -1) {
      const removedNode = currentWorkflow.value.nodes.splice(nodeIndex, 1)[0]
      console.log(`删除了节点: ${nodeId} (${removedNode?.type || 'unknown'})`)
      
      // 3. 清理相关数据（如果有）
      // 不再需要清理data属性，因为WorkflowState类型中不存在此属性
      
      // 4. 如果当前选中的是这个节点，清除选择
      const uiStore = useUIStore()
      if (uiStore.selectedNodeId === nodeId) {
        uiStore.clear()
      }
      
      currentWorkflow.value.metadata.updatedAt = new Date().toISOString()
      return removedNode
    }
    
    return null
  }

  // 删除边
  const deleteEdge = (edgeId: string) => {
    if (!currentWorkflow.value) return null
    
    const edgeIndex = currentWorkflow.value.edges.findIndex(edge => edge.id === edgeId)
    if (edgeIndex !== -1) {
      const removedEdge = currentWorkflow.value.edges.splice(edgeIndex, 1)[0]
      console.log(`删除了连线: ${edgeId}`)
      currentWorkflow.value.metadata.updatedAt = new Date().toISOString()
      return removedEdge
    }
    
    return null
  }

  // 清空执行日志
  const clearExecutionLogs = () => {
    executionLogs.value = []
    executionStartTime.value = null
    executionEndTime.value = null
  }

  // 添加执行日志
  const addExecutionLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString()
    executionLogs.value.push(`[${timestamp}] ${log}`)
  }

  // 执行工作流
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

  // 关闭执行面板
  const closeExecutionPanel = () => {
    const uiStore = useUIStore()
    uiStore.executionPanelVisible = false
  }

  // 保存工作流
  const saveWorkflow = async () => {
    try {
      // 确保有名称
      if (currentWorkflow.value) {
        if (!currentWorkflow.value.name || currentWorkflow.value.name === '未命名工作流') {
          currentWorkflow.value.name = `工作流 ${workflows.value.length + 1}`
        }

        // 更新时间戳
        currentWorkflow.value.metadata.updatedAt = new Date().toISOString()

        // 保存到本地存储
        await storageManager.saveWorkflow(toRaw(currentWorkflow.value))
      }

      // 更新工作流列表
      if (currentWorkflow.value) {
        const existingIndex = workflows.value.findIndex((w) => w.id === currentWorkflow.value!.id)
        if (existingIndex > -1) {
          workflows.value[existingIndex] = { ...currentWorkflow.value }
        } else {
          workflows.value.push({ ...currentWorkflow.value })
        }
      }

      // 工作流列表会在saveWorkflow中自动更新，不需要单独保存

      return true
    } catch (error) {
      console.error('保存工作流失败:', error)
      return false
    }
  }

  // 加载工作流
  const loadWorkflow = async (workflowId: string) => {
    try {
      const workflow = await storageManager.getWorkflowById(workflowId)
      if (workflow) {
        currentWorkflow.value = workflow
        // 重置执行上下文
        executionContext.value = {}
        return true
      }
      return false
    } catch (error) {
      console.error('加载工作流失败:', error)
      return false
    }
  }

  // 创建新工作流
  const createNewWorkflow = () => {
    const historyStore = useHistoryStore()
    historyStore.clear()
    currentWorkflow.value = createEmptyWorkflow()
    executionContext.value = {}
  }

  // 删除工作流
  const deleteWorkflow = async (workflowId: string) => {
    try {
      await storageManager.deleteWorkflow(workflowId)

      // 从列表中移除
      workflows.value = workflows.value.filter((w) => w.id !== workflowId)

      // 如果删除的是当前工作流，创建新的空工作流
      if (currentWorkflow.value && currentWorkflow.value.id === workflowId) {
        createNewWorkflow()
      }

      // 工作流列表会在saveWorkflow中自动更新，不需要单独保存

      return true
    } catch (error) {
      console.error('删除工作流失败:', error)
      return false
    }
  }

  // 复制工作流（不影响 currentWorkflow）
  const duplicateWorkflow = async (workflowId: string): Promise<boolean> => {
    const wf = workflows.value.find((w) => w.id === workflowId)
    if (!wf) return false
    const { v4: uuidv4 } = await import('uuid')
    const copy: WorkflowState = {
      ...wf,
      id: uuidv4(),
      name: `${wf.name} (副本)`,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      },
    }
    // 暂存当前工作流，保存副本后恢复
    const prev = currentWorkflow.value
    currentWorkflow.value = copy
    const ok = await saveWorkflow()
    currentWorkflow.value = prev
    return ok
  }

  // 导入工作流（不影响 currentWorkflow）
  const importWorkflow = async (data: WorkflowState): Promise<boolean> => {
    const { v4: uuidv4 } = await import('uuid')
    const imported: WorkflowState = {
      ...data,
      id: uuidv4(),
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      },
    }
    const prev = currentWorkflow.value
    currentWorkflow.value = imported
    const ok = await saveWorkflow()
    currentWorkflow.value = prev
    return ok
  }

  // 导出状态和方法
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
