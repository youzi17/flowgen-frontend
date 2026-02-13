import type { NodeDefinition } from '@/core/workflow-engine/types'

/**
 * 节点注册表
 * 负责管理所有可用的节点类型定义
 */
export class NodeRegistry {
  // 存储节点定义的Map
  private static nodeDefinitions = new Map<string, NodeDefinition>()

  /**
   * 注册一个新的节点类型
   * @param definition 节点定义
   */
  static registerNode(definition: NodeDefinition): void {
    if (!definition.type) {
      throw new Error('节点定义必须包含type字段')
    }

    if (this.nodeDefinitions.has(definition.type)) {
      throw new Error(`节点类型 "${definition.type}" 已存在，不能重复注册`)
    }

    this.nodeDefinitions.set(definition.type, definition)
    console.log(`节点类型 ${definition.type} 已注册`)
  }

  /**
   * 获取指定类型的节点定义
   * @param type 节点类型
   * @returns 节点定义或undefined
   */
  static getDefinition(type: string): NodeDefinition | undefined {
    return this.nodeDefinitions.get(type)
  }

  /**
   * 获取所有已注册的节点定义
   * @returns 节点定义数组
   */
  static getAllDefinitions(): NodeDefinition[] {
    return Array.from(this.nodeDefinitions.values())
  }

  /**
   * 获取指定分类的节点定义
   * @param category 节点分类
   * @returns 该分类下的节点定义数组
   */
  static getDefinitionsByCategory(category: string): NodeDefinition[] {
    return Array.from(this.nodeDefinitions.values()).filter(
      (definition) => definition.category === category,
    )
  }

  /**
   * 检查节点类型是否已注册
   * @param type 节点类型
   * @returns 是否已注册
   */
  static hasType(type: string): boolean {
    return this.nodeDefinitions.has(type)
  }

  /**
   * 注销指定类型的节点定义
   * @param type 节点类型
   * @returns 是否成功注销
   */
  static unregisterNode(type: string): boolean {
    const result = this.nodeDefinitions.delete(type)
    if (result) {
      console.log(`节点类型 ${type} 已注销`)
    }
    return result
  }

  /**
   * 清空所有节点定义
   */
  static clear(): void {
    this.nodeDefinitions.clear()
    console.log('所有节点定义已清空')
  }
}
