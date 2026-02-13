import type { ExecutionContext } from '@/core/workflow-engine/types';

/**
 * 参数解析器
 * 负责解析模板中的参数引用，支持从执行上下文中提取数据
 */
export class ParameterResolver {
  /**
   * 解析模板字符串中的参数引用
   * 支持格式：{{nodeId.output.field}} 或 {{nodeId}}
   * @param template 模板字符串
   * @param context 执行上下文
   * @returns 解析后的字符串
   */
  static resolveTemplate(template: string, context: ExecutionContext): string {
    if (!template || typeof template !== 'string') {
      return '';
    }
    
    // 使用正则表达式匹配 {{param}} 格式的参数引用
    return template.replace(/\{\{([^{}]+)\}\}/g, (match, paramPath) => {
      // 去除参数路径两端的空白
      const trimmedPath = paramPath.trim();
      
      try {
        // 解析参数值
        const value = this.resolveParameter(trimmedPath, context);
        
        // 如果解析成功，返回字符串形式的值
        if (value !== undefined && value !== null) {
          return String(value);
        }
        
        // 解析失败，返回原始匹配字符串
        return match;
      } catch (error) {
        console.warn(`解析参数 ${trimmedPath} 失败:`, error);
        return match;
      }
    });
  }
  
  /**
   * 从上下文中解析单个参数值
   * @param paramPath 参数路径，格式为 "nodeId.output.field" 或 "nodeId"
   * @param context 执行上下文
   * @returns 解析出的值
   */
  static resolveParameter(paramPath: string, context: ExecutionContext): unknown {
    // 分割参数路径
    const parts = paramPath.split('.');
    
    // 第一个部分应该是节点ID，确保不是undefined
    const nodeId = parts[0];
    if (!nodeId) {
      throw new Error('参数路径格式错误，缺少节点ID');
    }
    
    // 检查节点是否存在于上下文中
    if (!(nodeId in context) || context[nodeId] === undefined) {
      throw new Error(`节点 ${nodeId} 的执行结果不存在`);
    }
    
    const nodeResult = context[nodeId as keyof typeof context]!; // 使用类型断言
    
    // 如果节点执行失败，抛出错误
    if (!nodeResult.success) {
      throw new Error(`节点 ${nodeId} 执行失败: ${nodeResult.error || '未知错误'}`);
    }
    
    // 如果只有节点ID，返回整个输出
    if (parts.length === 1) {
      return nodeResult.output;
    }
    
    // 如果有多个部分，需要从output中继续查找
    let current: unknown = nodeResult.output;
    
    // 从第二部分开始遍历路径
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (!part) {
        throw new Error(`参数路径格式错误，索引 ${i} 为空`);
      }
      
      // 如果当前值是对象，尝试获取属性
      if (current && typeof current === 'object') {
        // 使用更安全的类型断言
        const currentObj = current as Record<string, unknown>;
        current = Object.prototype.hasOwnProperty.call(currentObj, part) 
          ? currentObj[part as keyof typeof currentObj] 
          : undefined;
      } else {
        // 如果当前值不是对象，无法继续解析
        throw new Error(`无法从 ${parts.slice(0, i).join('.')} 中解析 ${part}`);
      }
      
      // 如果中途遇到undefined或null，停止解析
      if (current === undefined || current === null) {
        break;
      }
    }
    
    return current;
  }
  
  /**
   * 解析对象中的所有模板字符串
   * 递归遍历对象的所有属性，解析字符串模板
   * @param obj 要解析的对象
   * @param context 执行上下文
   * @returns 解析后的对象
   */
  static resolveObject(obj: unknown, context: ExecutionContext): unknown {
    // 处理不同类型的值
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'string') {
      // 字符串类型直接解析模板
      return this.resolveTemplate(obj, context);
    }
    
    if (Array.isArray(obj)) {
      // 数组类型递归解析每个元素
      return obj.map(item => this.resolveObject(item, context));
    }
    
    if (typeof obj === 'object') {
      // 对象类型递归解析每个属性
      const resolvedObj: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        resolvedObj[key] = this.resolveObject(value, context);
      }
      
      return resolvedObj;
    }
    
    // 基本类型（数字、布尔等）直接返回
    return obj;
  }
  
  /**
   * 检查字符串是否包含参数引用
   * @param str 要检查的字符串
   * @returns 是否包含参数引用
   */
  static hasParameters(str: string): boolean {
    if (!str || typeof str !== 'string') {
      return false;
    }
    
    return /\{\{([^{}]+)\}\}/.test(str);
  }
}