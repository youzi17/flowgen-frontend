import { NodeRegistry } from '../node-registry/registry';
import { ParameterResolver } from '../utils/parameter-resolver';
import type { WorkflowNode } from '@/types/workflow';
import type { ExecutionContext } from '../workflow-engine/types';

// 定义AI节点配置接口
interface AINodeConfig {
  prompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 注册AI相关节点类型
 * 包括AI对话节点等AI功能节点
 */
export function registerAINodes(): void {
  // AI对话节点（AI Chat Node）
  NodeRegistry.registerNode({
    type: 'ai-chat',
    name: 'AI对话',
    description: '调用AI模型进行对话交互',
    category: 'ai',
    icon: 'ChatDotRound',
    inputs: 1,
    outputs: 1,
    defaultData: {
      prompt: '',
      model: 'gpt-3.5-turbo',
      temperature: 0.7
    },
    executor: async (node: WorkflowNode, context: ExecutionContext) => {
      // 获取节点数据
      const nodeData = node.data || {};
      const {
        prompt = '',
        model = 'gpt-3.5-turbo',
        temperature = 0.7,
        maxTokens = 1000
      } = nodeData as AINodeConfig;
      
      // 解析动态参数
      const resolvedPrompt = ParameterResolver.resolveTemplate(prompt || '', context);
      
      const startTime = Date.now();
      
      try {
        // 模拟AI调用（实际项目中这里会调用真实的AI API）
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = {
          text: `AI响应: ${resolvedPrompt}`,
          model,
          temperature,
          usage: { total_tokens: 100 }
        };
        
        return {
          success: true,
          output: response,
          executionTime: Date.now() - startTime,
          metadata: {
            prompt: resolvedPrompt,
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

  console.log('AI节点类型注册完成');
}