// Store模块统一导出

export { useWorkflowStore } from './workflow-store';
export { useUIStore } from './ui-store';
export { useHistoryStore } from './history-store';
export { useAuthStore } from './auth-store';

// 导出所有store的类型
export type { WorkflowState, WorkflowNode, Edge } from '@/types/workflow';
export type { ExecutionContext } from '@/core/workflow-engine/types';

// 导出Store初始化函数
export const initializeStores = async () => {
  const { useAuthStore } = await import('./auth-store');
  const { useWorkflowStore } = await import('./workflow-store');

  // 恢复登录状态
  const authStore = useAuthStore();
  await authStore.fetchMe();

  const workflowStore = useWorkflowStore();
  await workflowStore.initialize();
};

// 导出重置所有store的函数
export const resetStores = async () => {
  const { useWorkflowStore } = await import('./workflow-store');
  const { useUIStore } = await import('./ui-store');
  const { useHistoryStore } = await import('./history-store');
  
  const workflowStore = useWorkflowStore();
  const uiStore = useUIStore();
  const historyStore = useHistoryStore();
  
  workflowStore.createNewWorkflow();
  uiStore.clear();
  historyStore.clear();
};