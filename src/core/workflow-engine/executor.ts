import type { WorkflowNode, Edge } from '@/types/workflow';
import type { ExecutionContext, NodeExecutionResult } from './types';
import { NodeRegistry } from '../node-registry/registry';

/**
 * 工作流执行器
 * 负责按依赖顺序执行工作流中的所有节点
 */
export class WorkflowExecutor {
  private context: ExecutionContext = {};
  
  /**
   * 执行整个工作流
   * @param nodes 工作流中的所有节点
   * @param edges 工作流中的所有边
   * @returns 执行结果上下文
   */
  async execute(nodes: WorkflowNode[], edges: Edge[]): Promise<ExecutionContext> {
    // 重置上下文
    this.context = {};
    
    try {
      // 进行拓扑排序，确定节点执行顺序
      const sortedNodes = this.topologicalSort(nodes, edges);
      
      // 按顺序执行每个节点
      for (const node of sortedNodes) {
        await this.executeNode(node, edges);
      }
      
      return this.context;
    } catch (error) {
      console.error('工作流执行失败:', error);
      throw error;
    }
  }
  
  /**
   * 执行单个节点
   * @param node 要执行的节点
   * @param edges 工作流中的所有边
   */
  private async executeNode(node: WorkflowNode, edges: Edge[]): Promise<void> {
    const startTime = Date.now();
    let result: NodeExecutionResult;
    
    try {
      // 从节点注册表获取节点执行器
      const nodeDefinition = NodeRegistry.getDefinition(node.type);
      
      if (!nodeDefinition) {
        throw new Error(`未找到节点类型 ${node.type} 的定义`);
      }
      
      // 执行节点逻辑
      const output = await nodeDefinition.executor(node, this.context);
      
      // 记录成功结果
      result = {
        success: true,
        output,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      // 记录失败结果
      result = {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
      };
    }
    
    // 保存执行结果到上下文
    this.context[node.id] = result;
  }
  
  /**
   * 拓扑排序算法
   * 确定节点的执行顺序，确保依赖关系正确
   * @param nodes 所有节点
   * @param edges 所有边
   * @returns 排序后的节点数组
   */
  private topologicalSort(nodes: WorkflowNode[], edges: Edge[]): WorkflowNode[] {
    // 构建图的邻接表和入度表
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const nodeMap = new Map<string, WorkflowNode>();
    
    // 初始化数据结构
    nodes.forEach(node => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
      nodeMap.set(node.id, node);
    });
    
    // 构建图和计算入度
    edges.forEach(edge => {
      if (graph.has(edge.source) && nodeMap.has(edge.target)) {
        graph.get(edge.source)!.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    });
    
    // 找出所有入度为0的节点（没有前置依赖的节点）
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });
    
    // 如果没有入度为0的节点，尝试查找start类型的节点作为入口
    if (queue.length === 0) {
      const startNode = nodes.find(node => node.type === 'start');
      if (startNode) {
        queue.push(startNode.id);
      }
    }
    
    // 执行拓扑排序
    const sortedNodeIds: string[] = [];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      sortedNodeIds.push(nodeId);
      
      // 减少相邻节点的入度
      const neighbors = graph.get(nodeId) || [];
      for (const neighborId of neighbors) {
        const newInDegree = (inDegree.get(neighborId) || 1) - 1;
        inDegree.set(neighborId, newInDegree);
        
        if (newInDegree === 0) {
          queue.push(neighborId);
        }
      }
    }
    
    // 检查是否存在环
    if (sortedNodeIds.length !== nodes.length) {
      throw new Error('工作流中存在循环依赖，无法执行');
    }
    
    // 转换为节点对象数组
    return sortedNodeIds.map(id => nodeMap.get(id)!);
  }
}