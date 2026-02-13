import { NodeRegistry } from '../node-registry/registry';
import { ParameterResolver } from '../utils/parameter-resolver';
import type { WorkflowNode } from '@/types/workflow';
import type { ExecutionContext } from '../workflow-engine/types';

// 定义数据处理节点配置接口
interface DataProcessConfig {
  inputField?: string;
  outputField?: string;
  processType?: string;
  transformOptions?: TransformOptions;
}

// 定义转换选项的接口
interface TransformOptions {
  operation?: string;
  format?: string;
  separator?: string;
  filter?: unknown;
  pattern?: string;
  replacement?: string;
  startIndex?: number;
  endIndex?: number;
  targetField?: string;
  defaultValue?: unknown;
  [key: string]: unknown;
}

/**
 * 注册数据处理相关节点类型
 * 包括数据处理节点等数据功能节点
 */
export function registerDataNodes(): void {
  // 数据处理节点（Data Process Node）
  NodeRegistry.registerNode({
    type: 'data-process',
    name: '数据处理',
    description: '对输入数据进行转换和处理',
    category: 'data',
    icon: 'DataLine',
    inputs: 1,
    outputs: 1,
    defaultData: {
      processType: 'text_transform',
      inputField: '',
      outputField: '',
      transformOptions: {}
    },
    executor: async (node: WorkflowNode, context: ExecutionContext) => {
      const {
        processType = 'text_transform',
        inputField = '',
        outputField = '',
        transformOptions = {}
      } = (node.data || {}) as DataProcessConfig;
      
      const startTime = Date.now();
      
      try {
        // 解析输入字段的值
        const inputData = ParameterResolver.resolveTemplate(inputField || '', context);
        let processedData: unknown = inputData;
        
        // 根据处理类型执行不同的数据处理逻辑
        switch (processType) {
          case 'text_transform':
            // 文本转换处理
            if (typeof inputData === 'string') {
              const options = (transformOptions || {}) as TransformOptions;
              const operation = options.operation || 'uppercase';
              
              switch (operation) {
                case 'uppercase':
                  processedData = inputData.toUpperCase();
                  break;
                case 'lowercase':
                  processedData = inputData.toLowerCase();
                  break;
                case 'trim':
                  processedData = inputData.trim();
                  break;
                case 'length':
                  processedData = String(inputData.length);
                  break;
                case 'substring':
                  const startIndex = Number(options.startIndex) || 0;
                  const endIndex = options.endIndex ? Number(options.endIndex) : inputData.length;
                  processedData = inputData.substring(startIndex, endIndex);
                  break;
                case 'replace':
                  const pattern = options.pattern || '';
                  const replacement = options.replacement || '';
                  processedData = inputData.replace(new RegExp(pattern, 'g'), replacement);
                  break;
                case 'split':
                  const separator = options.separator || ',';
                  processedData = inputData.split(separator);
                  break;
                case 'capitalize':
                  processedData = inputData.charAt(0).toUpperCase() + inputData.slice(1).toLowerCase();
                  break;
                default:
                  processedData = inputData;
              }
            }
            break;
            
          case 'data_map':
            // 数据映射处理
            if (typeof transformOptions === 'object' && transformOptions !== null) {
              const map = transformOptions as Record<string, unknown>;
              const dataKey = String(inputData);
              
              // 检查默认值
              if (transformOptions.defaultValue !== undefined && !(dataKey in map)) {
                processedData = transformOptions.defaultValue;
              } else if (dataKey in map) {
                // 确保processedData类型安全
                const mappedValue = map[dataKey];
                if (mappedValue !== undefined) {
                  processedData = mappedValue;
                }
              }
            }
            break;
            
          case 'array_operation':
            // 数组操作处理
            if (Array.isArray(inputData)) {
              const options = (transformOptions || {}) as TransformOptions;
              const operation = options.operation || 'count';
              
              switch (operation) {
                case 'count':
                  processedData = String(inputData.length);
                  break;
                case 'first':
                  processedData = inputData[0];
                  break;
                case 'last':
                  processedData = inputData[inputData.length - 1];
                  break;
                case 'join':
                  const separator = options.separator || ',';
                  processedData = inputData.join(separator);
                  break;
                case 'filter':
                  if (options.filter && typeof options.filter === 'object') {
                    const filter = options.filter as Record<string, unknown>;
                    processedData = inputData.filter(item => {
                      if (typeof item === 'object' && item !== null) {
                        return Object.entries(filter).every(([key, value]) => 
                          item[key as keyof typeof item] === value
                        );
                      }
                      return false;
                    });
                  }
                  break;
                case 'map':
                  if (options.targetField && typeof options.targetField === 'string') {
                    processedData = inputData.map(item => {
                      if (typeof item === 'object' && item !== null) {
                        return item[options.targetField as keyof typeof item];
                      }
                      return item;
                    });
                  }
                  break;
                case 'sort':
                  processedData = [...inputData].sort();
                  break;
                case 'reverse':
                  processedData = [...inputData].reverse();
                  break;
                default:
                  processedData = inputData;
              }
            }
            break;
            
          case 'number_transform':
            // 数字转换处理
            const numValue = Number(inputData);
            if (!isNaN(numValue)) {
              const options = (transformOptions || {}) as TransformOptions;
              const operation = options.operation || 'toFixed';
              
              switch (operation) {
                case 'toFixed':
                  const decimals = Number(options.decimals) || 2;
                  processedData = numValue.toFixed(decimals);
                  break;
                case 'round':
                  processedData = Math.round(numValue);
                  break;
                case 'floor':
                  processedData = Math.floor(numValue);
                  break;
                case 'ceil':
                  processedData = Math.ceil(numValue);
                  break;
                case 'abs':
                  processedData = Math.abs(numValue);
                  break;
                default:
                  processedData = numValue;
              }
            }
            break;
            
          default:
            processedData = inputData;
        }
        
        // 定义支持动态属性的输出对象
        const dataOutput: Record<string, unknown> = {
          processedData,
          processType,
          inputData
        };
        
        // 如果指定了输出字段，则将结果存储到指定字段
        if (outputField && typeof outputField === 'string') {
          dataOutput[outputField] = processedData;
        }
        
        return {
          success: true,
          output: dataOutput,
          executionTime: Date.now() - startTime,
          metadata: {
            processType,
            outputField,
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

  console.log('数据处理节点类型注册完成');
}