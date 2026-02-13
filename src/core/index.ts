// Core模块入口文件
// 导出所有核心功能模块

// 工作流引擎相关
export { WorkflowExecutor } from './workflow-engine/executor';
export type { ExecutionContext, NodeExecutionResult, NodeExecutor, NodeDefinition } from './workflow-engine/types';

// 节点注册表
export { NodeRegistry } from './node-registry/registry';

// 存储管理器
export { StorageManager } from './storage/storage-manager';

// 工具函数
export { ParameterResolver } from './utils/parameter-resolver';

// 节点注册函数
import { registerBaseNodes } from './nodes/base-nodes';
import { registerAINodes } from './nodes/ai-nodes';
import { registerLogicNodes } from './nodes/logic-nodes';
import { registerDataNodes } from './nodes/data-nodes';

export { registerBaseNodes, registerAINodes, registerLogicNodes, registerDataNodes };

/**
 * 初始化Core模块
 * 注册所有节点类型
 */
export function initializeCore(): void {
  // 注册所有节点类型
  registerBaseNodes();
  registerAINodes();
  registerLogicNodes();
  registerDataNodes();
  
  console.log('Core模块初始化完成');
}