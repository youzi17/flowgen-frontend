import type { WorkflowNode } from '@/types/workflow';

// 执行上下文，存储每个节点的执行结果
export interface ExecutionContext {
  [nodeId: string]: NodeExecutionResult;
}

// 节点执行结果接口
export interface NodeExecutionResult {
  success: boolean;
  output: unknown;
  error?: string;
  executionTime: number;
  metadata?: Record<string, unknown>;
}

// 节点执行器函数类型
export type NodeExecutor = (
  node: WorkflowNode,
  context: ExecutionContext
) => Promise<unknown> | unknown;

// 节点定义接口
export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  icon: string | ComponentType;
  inputs: number;
  outputs: number;
  defaultData: Record<string, unknown>;
  executor: NodeExecutor;
}

// 组件类型
type ComponentType = {
  name: string;
  [key: string]: unknown;
};