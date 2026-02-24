import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { WorkflowNode } from '@/types/workflow'
import { useWorkflowStore } from './workflow-store'

// 用于管理通知自动关闭的定时器
const notificationTimers = new Map<string, number>()

export const useUIStore = defineStore('ui', () => {
  // State
  const selectedNodeId = ref<string | null>(null)
  const sidebarVisible = ref(true)
  const configPanelVisible = ref(true)
  const zoomLevel = ref(1)
  const executionPanelVisible = ref(false)
  const isEditMode = ref(false)
  const notificationQueue = ref<
    Array<{
      id: string
      type: 'success' | 'error' | 'warning' | 'info'
      message: string
      duration: number
    }>
  >([])

  // Computed
  const selectedNode = computed<WorkflowNode | null>(() => {
    if (!selectedNodeId.value) return null
    const workflowStore = useWorkflowStore()
    return (
      workflowStore.currentWorkflow?.nodes.find((node) => node.id === selectedNodeId.value) || null
    )
  })

  // Actions

  // 选择节点
  const selectNode = (nodeId: string | null) => {
    selectedNodeId.value = nodeId
  }

  // 切换侧边栏可见性
  const toggleSidebar = () => {
    sidebarVisible.value = !sidebarVisible.value
  }

  // 切换配置面板可见性
  const toggleConfigPanel = () => {
    configPanelVisible.value = !configPanelVisible.value
  }

  // 切换执行面板可见性
  const toggleExecutionPanel = () => {
    executionPanelVisible.value = !executionPanelVisible.value
  }

  // 调整缩放级别
  const setZoomLevel = (level: number) => {
    zoomLevel.value = Math.max(0.1, Math.min(3, level))
  }

  // 放大
  const zoomIn = () => {
    setZoomLevel(zoomLevel.value + 0.1)
  }

  // 缩小
  const zoomOut = () => {
    setZoomLevel(zoomLevel.value - 0.1)
  }

  // 重置缩放
  const resetZoom = () => {
    zoomLevel.value = 1
  }

  // 添加通知
  const addNotification = (options: {
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }) => {
    const cleanUUID = crypto.randomUUID().replace(/-/g, '')
    const id = `notification_${cleanUUID}`
    const duration = options.duration ?? 3000

    notificationQueue.value.push({
      id,
      type: options.type,
      message: options.message,
      duration,
    })

    // 清理可能存在的旧定时器（防重复）
    if (notificationTimers.has(id)) {
      clearTimeout(notificationTimers.get(id)!)
    }

    // 设置自动移除
    const timer = window.setTimeout(() => {
      removeNotification(id)
    }, duration)

    notificationTimers.set(id, timer)
    return id
  }

  // 移除通知
  const removeNotification = (id: string) => {
    // 清理定时器
    if (notificationTimers.has(id)) {
      clearTimeout(notificationTimers.get(id)!)
      notificationTimers.delete(id)
    }

    // 从队列中移除
    const index = notificationQueue.value.findIndex((n) => n.id === id)
    if (index > -1) {
      notificationQueue.value.splice(index, 1)
    }
  }

  // 显示成功通知
  const showSuccess = (message: string) => {
    return addNotification({ type: 'success', message })
  }

  // 显示错误通知
  const showError = (message: string) => {
    return addNotification({ type: 'error', message, duration: 5000 })
  }

  // 显示警告通知
  const showWarning = (message: string) => {
    return addNotification({ type: 'warning', message })
  }

  // 显示信息通知
  const showInfo = (message: string) => {
    return addNotification({ type: 'info', message })
  }

  // 清除所有通知
  const clearNotifications = () => {
    notificationQueue.value = []
    notificationTimers.forEach((timerId) => clearTimeout(timerId))
    notificationTimers.clear()
  }

  // 切换编辑模式
  const toggleEditMode = () => {
    isEditMode.value = !isEditMode.value
  }

  // 清除所有UI状态（仅重置与画布相关的状态）
  const clear = () => {
    selectedNodeId.value = null
    zoomLevel.value = 1
    isEditMode.value = false
    clearNotifications()
  }

  // 导出状态和方法
  return {
    // State
    selectedNodeId,
    sidebarVisible,
    configPanelVisible,
    zoomLevel,
    executionPanelVisible,
    isEditMode,
    notificationQueue,

    // Computed
    selectedNode,

    // Actions
    selectNode,
    toggleSidebar,
    toggleConfigPanel,
    toggleExecutionPanel,
    setZoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearNotifications,
    clear,
    toggleEditMode,
  }
})
