// 工作流节点类型
export type NodeType = 'start' | 'end' | 'ai-chat' | 'condition' | 'data-process' | 'text-output';

// 节点执行状态
export type NodeStatus = 'idle' | 'executing' | 'success' | 'failed';

// 节点位置信息
export interface Position {
  x: number;
  y: number;
}

// 基础节点数据接口
export interface BaseNodeData {
  [key: string]: unknown;
}

// 工作流节点接口
export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: Position;
  data: BaseNodeData;
  width?: number;
  height?: number;
  status?: NodeStatus;
}

// 边（连接）接口
export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

// 工作流状态
export interface WorkflowState {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: Edge[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

// 工作流模板
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: Edge[];
  category: string;
}

// 应用设置
export interface AppSettings {
  autoSave: boolean;
  defaultZoom: number;
  theme: 'light' | 'dark';
  language: string;
}