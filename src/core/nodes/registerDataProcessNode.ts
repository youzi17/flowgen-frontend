import { createDataProcessNode } from './DataProcessNode'
import { DataProcessNodeProcessor } from './DataProcessNodeProcessor'
import type { DataProcessNode } from './DataProcessNode'

// 节点注册中心接口
interface NodeRegistry {
  registerNodeType: (definition: NodeTypeDefinition) => void
}

// 节点类型定义接口
export interface NodeTypeDefinition {
  type: string
  label: string
  description: string
  category: string
  icon: string
  color: string
  createNode: (id: string, x: number, y: number) => DataProcessNode
  processor: DataProcessNodeProcessor
  ports: Array<{
    id: string
    type: string
    label: string
    multiple: boolean
    allowTypes?: string[]
    dataType?: string
  }>
  configPanel: () => Promise<unknown>
}

// 节点注册函数类型
export type NodeRegisterFunction = (nodeRegistry: NodeRegistry) => void

/**
 * 数据处理节点的定义
 */
export const dataProcessNodeDefinition: NodeTypeDefinition = {
  type: 'data-process',
  label: '数据处理',
  description: '提供文本转换、数据提取、格式转换和数据过滤等数据处理功能',
  category: '数据处理',
  icon: 'DataAnalysis',
  color: '#667eea',
  createNode: (id: string, x: number, y: number) => createDataProcessNode(id, x, y),
  processor: new DataProcessNodeProcessor(),
  ports: [
    {
      id: 'input',
      type: 'target',
      label: '输入',
      multiple: false,
      allowTypes: ['*'],
    },
    {
      id: 'output',
      type: 'source',
      label: '输出',
      multiple: true,
      dataType: '*',
    },
  ],
  configPanel: () => import('@/ui/config-panels/DataProcessConfigPanel.vue'),
}

/**
 * 注册数据处理节点的函数
 */
export const registerDataProcessNode: NodeRegisterFunction = (nodeRegistry: NodeRegistry) => {
  // 注册数据处理节点
  nodeRegistry.registerNodeType(dataProcessNodeDefinition)

  // 注册数据处理相关的子节点类型（可选）
  // 这里可以注册更具体的数据处理节点类型

  console.log('数据处理节点注册完成')
}
