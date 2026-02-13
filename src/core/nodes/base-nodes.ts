import { NodeRegistry } from '../node-registry/registry';
import type { WorkflowNode } from '@/types/workflow';
import type { ExecutionContext } from '../workflow-engine/types';

/**
 * 注册基础节点类型
 * 包括开始节点、结束节点等核心功能节点
 */
export function registerBaseNodes(): void {
  // 开始节点（Start Node）
  NodeRegistry.registerNode({
    type: 'start',
    name: '开始节点',
    description: '工作流的起始点',
    category: 'basic',
    icon: 'VideoPlay',
    inputs: 0,
    outputs: 1,
    defaultData: {},
    executor: async (node: WorkflowNode, context: ExecutionContext) => {
      const startTime = Date.now();
      
      try {
        return {
          success: true,
          output: {
            message: '工作流开始执行',
            workflowId: node.id
          },
          executionTime: Date.now() - startTime,
          metadata: {
            startedAt: new Date().toISOString()
          }
        };
      } catch (error) {
        return {
          success: false,
          output: null,
          error: error instanceof Error ? error.message : '未知错误',
          executionTime: Date.now() - startTime
        };
      }
    }
  });

  // 结束节点（End Node）
  NodeRegistry.registerNode({
    type: 'end',
    name: '结束节点',
    description: '工作流的结束点',
    category: 'basic',
    icon: 'CircleClose',
    inputs: 1,
    outputs: 0,
    defaultData: {},
    executor: async (node: WorkflowNode, context: ExecutionContext) => {
      // 获取所有前置节点的输出
      const allResults = Object.values(context)
        .filter(result => result.success)
        .map(result => result.output);

      const startTime = Date.now();
      
      try {
        return {
          success: true,
          output: {
            summary: '工作流执行完成',
            results: allResults
          },
          executionTime: Date.now() - startTime,
          metadata: {
            completedAt: new Date().toISOString()
          }
        };
      } catch (error) {
        return {
          success: false,
          output: null,
          error: error instanceof Error ? error.message : '未知错误',
          executionTime: Date.now() - startTime
        };
      }
    }
  });

  // 文本输出节点（Text Output Node）
  NodeRegistry.registerNode({
    type: 'text-output',
    name: '文本输出',
    description: '输出文本信息',
    category: 'basic',
    icon: 'Document',
    inputs: 1,
    outputs: 1,
    defaultData: {
      text: '输出内容',
      format: 'plain'
    },
    executor: async (node: WorkflowNode, context: ExecutionContext) => {
      const { text = '' } = node.data || {};
      
      const startTime = Date.now();
      
      try {
        // 这里可以添加文本格式化逻辑
        const formattedText = text;
        
        return {
          success: true,
          output: {
            text,
            formattedText
          },
          executionTime: Date.now() - startTime,
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        return {
          success: false,
          output: null,
          error: error instanceof Error ? error.message : '未知错误',
          executionTime: Date.now() - startTime
        };
      }
    }
  });

  console.log('基础节点类型注册完成');
}