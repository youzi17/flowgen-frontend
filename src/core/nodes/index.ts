// 节点模块索引文件

// 导入各个节点模块
import { registerDataProcessNode } from './registerDataProcessNode'

/**
 * 注册所有节点类型
 */
export function registerAllNodes(nodeRegistry: { registerNodeType: (definition: unknown) => void }): void {
  // 注册数据处理节点
  registerDataProcessNode(nodeRegistry)
  
  // 可以在这里添加其他节点的注册
  
  console.log('所有节点注册完成')
}

// 导出所有节点相关功能
export * from './DataProcessNode'
export * from './DataProcessNodeProcessor'
export * from './registerDataProcessNode'

export default {
  register: registerAllNodes
}