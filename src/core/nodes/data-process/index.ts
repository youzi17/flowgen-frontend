// 数据处理节点模块入口

// 类型定义
export * from '../DataProcessNode'

// 处理器
export * from '../DataProcessNodeProcessor'

// 注册函数
export * from '../registerDataProcessNode'

// 节点UI组件
export { default as DataProcessNodeComponent } from '@/ui/nodes/data-process-node.vue'

// 配置面板组件
export { default as DataProcessConfigPanel } from '@/ui/config-panels/DataProcessConfigPanel.vue'

/**
 * 数据处理节点模块
 * 提供丰富的数据转换和处理功能
 */
export const dataProcessModule = {
  name: 'data-process',
  description: '数据处理模块',
  register: (nodeRegistry: { registerNodeType: (definition: unknown) => void }) => {
    import('../registerDataProcessNode').then(({ registerDataProcessNode }) => {
      registerDataProcessNode(nodeRegistry)
    })
  },
}

export default dataProcessModule
