import { NodeRegistry } from '../node-registry/registry';
import { ParameterResolver } from '../utils/parameter-resolver';
import type { WorkflowNode } from '@/types/workflow';
import type { ExecutionContext } from '../workflow-engine/types';

// 定义条件配置接口
interface ConditionConfig {
  conditionType?: string;
  sourceField?: string;
  compareValue?: unknown;
  operator?: string;
}

/**
 * 注册逻辑相关节点类型
 * 包括条件节点等逻辑功能节点
 */
export function registerLogicNodes(): void {
  // 条件节点（Condition Node）
  NodeRegistry.registerNode({
    type: 'condition',
    name: '条件判断',
    description: '根据条件决定工作流执行路径',
    category: 'logic',
    icon: 'Operation',
    inputs: 1,
    outputs: 2,
    defaultData: {
      conditionType: 'text',
      sourceField: '',
      compareValue: '',
      operator: 'equals'
    },
    executor: async (node: WorkflowNode, context: ExecutionContext) => {
      const nodeData = node.data || {};
      const {
        conditionType = 'text',
        sourceField = '',
        compareValue = '',
        operator = 'equals'
      } = nodeData as ConditionConfig;
      
      // 解析动态参数
      let resolvedSourceField: unknown = sourceField;
      let resolvedCompareValue: unknown = compareValue;
      
      if (typeof sourceField === 'string') {
        resolvedSourceField = ParameterResolver.resolveTemplate(sourceField, context);
      }
      if (typeof compareValue === 'string') {
        resolvedCompareValue = ParameterResolver.resolveTemplate(compareValue, context);
      }
      
      // 执行条件判断
      let result = false;
      
      switch (operator) {
        case 'equals':
          result = resolvedSourceField === resolvedCompareValue;
          break;
        case 'not_equals':
          result = resolvedSourceField !== resolvedCompareValue;
          break;
        case 'contains':
          result = typeof resolvedSourceField === 'string' && 
                  typeof resolvedCompareValue === 'string' &&
                  resolvedSourceField.includes(resolvedCompareValue);
          break;
        case 'not_contains':
          result = typeof resolvedSourceField !== 'string' || 
                  typeof resolvedCompareValue !== 'string' ||
                  !resolvedSourceField.includes(resolvedCompareValue);
          break;
        case 'greater_than':
          result = Number(resolvedSourceField) > Number(resolvedCompareValue);
          break;
        case 'less_than':
          result = Number(resolvedSourceField) < Number(resolvedCompareValue);
          break;
        default:
          result = resolvedSourceField === resolvedCompareValue;
      }
      
      const startTime = Date.now();
      
      try {
        // 准备输出数据
        const conditionOutput = {
          result,
          conditionType,
          sourceField: resolvedSourceField,
          compareValue: resolvedCompareValue,
          operator,
          // true结果从第一个输出端口输出，false结果从第二个输出端口输出
          outputPort: result ? 'true' : 'false'
        };
        
        return {
          success: true,
          output: conditionOutput,
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

  console.log('逻辑节点类型注册完成');
}