import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { WorkflowState } from '@/types/workflow';
import { useWorkflowStore } from './workflow-store';

// 历史记录的最大数量
const MAX_HISTORY_SIZE = 50;

// 深度克隆工作流状态
function deepCloneWorkflow(workflow: WorkflowState): WorkflowState {
  return JSON.parse(JSON.stringify(workflow));
}

export const useHistoryStore = defineStore('history', () => {
  // State
  const past = ref<WorkflowState[]>([]);
  const future = ref<WorkflowState[]>([]);
  const isRecording = ref(true); // 是否正在记录历史
  
  // Computed
  const canUndo = computed(() => past.value.length > 0);
  const canRedo = computed(() => future.value.length > 0);
  
  // Actions
  
  // 记录当前状态到历史
  const pushState = () => {
    if (!isRecording.value) return;
    
    const workflowStore = useWorkflowStore();
    
    // 确保当前工作流存在
    if (!workflowStore.currentWorkflow) return;
    
    // 克隆当前工作流状态
    const currentState = deepCloneWorkflow(workflowStore.currentWorkflow);
    
    // 添加到历史记录
    past.value.push(currentState);
    
    // 清空重做栈
    future.value = [];
    
    // 限制历史记录数量
    if (past.value.length > MAX_HISTORY_SIZE) {
      past.value.shift(); // 移除最旧的记录
    }
  };
  
  // 撤销操作
  const undo = () => {
    if (!canUndo.value) return;
    
    const workflowStore = useWorkflowStore();
    
    // 先关闭记录，避免撤销操作本身被记录
    const wasRecording = isRecording.value;
    isRecording.value = false;
    
    try {
        // 保存当前状态到重做栈（如果存在）
        if (workflowStore.currentWorkflow) {
          const currentState = deepCloneWorkflow(workflowStore.currentWorkflow);
          future.value.push(currentState);
        }
      
      // 恢复到上一个状态
      const previousState = past.value.pop()!;
      workflowStore.currentWorkflow = previousState;
    } finally {
      // 恢复记录状态
      isRecording.value = wasRecording;
    }
  };
  
  // 重做操作
  const redo = () => {
    if (!canRedo.value) return;
    
    const workflowStore = useWorkflowStore();
    
    // 先关闭记录，避免重做操作本身被记录
    const wasRecording = isRecording.value;
    isRecording.value = false;
    
    try {
        // 保存当前状态到历史栈（如果存在）
        if (workflowStore.currentWorkflow) {
          const currentState = deepCloneWorkflow(workflowStore.currentWorkflow);
          past.value.push(currentState);
        }
      
      // 恢复到下一个状态
      const nextState = future.value.pop()!;
      workflowStore.currentWorkflow = nextState;
    } finally {
      // 恢复记录状态
      isRecording.value = wasRecording;
    }
  };
  
  // 开始批量操作（临时暂停历史记录）
  const startBatchOperation = () => {
    isRecording.value = false;
  };
  
  // 结束批量操作（恢复历史记录并记录最终状态）
  const endBatchOperation = () => {
    isRecording.value = true;
    pushState();
  };
  
  // 清除历史记录
  const clear = () => {
    past.value = [];
    future.value = [];
  };
  
  // 替换当前状态（用于加载新工作流时不记录历史）
  const replaceCurrentState = () => {
    if (past.value.length > 0) {
      const workflowStore = useWorkflowStore();
      // 确保当前工作流存在
      if (workflowStore.currentWorkflow) {
        const currentState = deepCloneWorkflow(workflowStore.currentWorkflow);
        past.value[past.value.length - 1] = currentState;
      }
    }
  };
  
  // 获取历史记录摘要（用于调试或显示）
  const getHistorySummary = computed(() => {
    return {
      past: past.value.map((w, i) => ({
        index: i,
        name: w.name,
        nodes: w.nodes.length,
        edges: w.edges.length,
        timestamp: w.metadata.updatedAt
      })),
      future: future.value.map((w, i) => ({
        index: i,
        name: w.name,
        nodes: w.nodes.length,
        edges: w.edges.length,
        timestamp: w.metadata.updatedAt
      })),
      maxSize: MAX_HISTORY_SIZE
    };
  });
  
  // 导出状态和方法
  return {
    // State
    past,
    future,
    isRecording,
    
    // Computed
    canUndo,
    canRedo,
    getHistorySummary,
    
    // Actions
    pushState,
    undo,
    redo,
    startBatchOperation,
    endBatchOperation,
    clear,
    replaceCurrentState
  };
});