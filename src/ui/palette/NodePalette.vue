<template>
  <div class="node-palette">
    <h2 class="palette-title">节点库</h2>
    <div v-for="category in categories" :key="category.name" class="category-section">
      <div class="category-header" @click="toggleCategory(category.name)">
        <span class="category-icon">{{ getCategoryIcon(category.name) }}</span>
        <span class="category-name">{{ category.name }}</span>
        <el-icon class="expand-icon" :class="{ rotated: isCategoryActive(category.name) }">
          <ArrowDown />
        </el-icon>
      </div>
      <Transition name="slide-down">
        <div v-if="isCategoryActive(category.name)" class="node-list" style="--node-gap: 8px">
          <div
            v-for="nodeDef in category.nodes"
            :key="nodeDef.type"
            class="node-card"
            draggable="true"
            @dragstart="onDragStart(nodeDef, $event)"
            @dragend="onDragEnd"
            @mouseenter="hoveredNode = nodeDef.type"
            @mouseleave="hoveredNode = null"
          >
            <div class="node-content" :class="{ hovered: hoveredNode === nodeDef.type }">
              <div class="node-icon">
                <el-icon :size="20">
                  <component :is="getIconComponent(nodeDef.icon)" />
                </el-icon>
              </div>
              <div class="node-info">
                <div class="node-name">{{ nodeDef.name }}</div>
                <div class="node-desc">{{ nodeDef.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type Component } from 'vue'
import { useWorkflowStore } from '@/stores/workflow-store'
import type { NodeType } from '@/types/workflow'
import {
  Right,
  Close,
  ChatDotRound,
  Operation,
  DataLine,
  Document,
  ArrowDown,
  DataAnalysis,
} from '@element-plus/icons-vue'

// 模拟节点注册数据
interface NodeDefinition {
  type: NodeType
  name: string
  description: string
  icon: string
  category: string
  defaultData?: Record<string, any>
}

// 节点注册数据
const NodeRegistry = {
  getAllDefinitions: (): NodeDefinition[] => [
    {
      type: 'start',
      name: '开始节点',
      description: '工作流的起始点',
      icon: 'Right',
      category: '基础节点',
      defaultData: { initialData: {} },
    },
    {
      type: 'end',
      name: '结束节点',
      description: '工作流的结束点',
      icon: 'Close',
      category: '基础节点',
      defaultData: {},
    },
    {
      type: 'ai-chat',
      name: 'AI对话',
      description: '调用AI模型进行对话',
      icon: 'ChatDotRound',
      category: 'AI节点',
      defaultData: {
        prompt: '',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
      },
    },
    {
      type: 'condition',
      name: '条件判断',
      description: '根据条件分支执行',
      icon: 'Operation',
      category: '逻辑节点',
      defaultData: {
        condition: 'true',
      },
    },
    {
      type: 'data-process',
      name: '数据处理',
      description: '提供文本转换、数据提取、格式转换和数据过滤等数据处理功能',
      icon: 'DataAnalysis',
      category: '数据处理节点',
      defaultData: {
        processType: 'text_transform',
        inputField: '',
        outputField: '',
        transformOptions: {
          textOperations: [],
          replaceRules: [],
          extractionType: 'regex',
          expression: '',
          targetFormat: 'jsonToString',
          delimiter: ',',
          filterType: 'contains',
          filterValue: '',
          filterField: '',
        },
      },
    },
    {
      type: 'text-output',
      name: '文本输出',
      description: '格式化输出文本',
      icon: 'Document',
      category: '输出节点',
      defaultData: {
        template: '{{input}}',
      },
    },
  ],
}
  
  const workflowStore = useWorkflowStore()
const activeCategories = ref(['AI节点', '逻辑节点', '基础节点', '数据处理节点', '输出节点'])
const hoveredNode = ref<NodeType | null>(null)

// 重置所有分类为收起状态
const collapseAllCategories = () => {
  activeCategories.value = []
}

// 监听工作流执行状态，当开始执行时自动收起所有分类
  watch(
  () => workflowStore.isExecuting,
  (isExecuting) => {
    if (isExecuting) {
      collapseAllCategories()
    }
  }
)

// 暴露方法供外部调用
defineExpose({
  collapseAllCategories
})

// 图标组件映射
const iconComponents: Record<string, Component> = {
  Right: Right,
  Close: Close,
  ChatDotRound: ChatDotRound,
  Operation: Operation,
  DataLine: DataLine,
  Document: Document,
  DataAnalysis: DataAnalysis,
}

// 获取图标组件
const getIconComponent = (iconName: string): Component => {
  return iconComponents[iconName] || Operation
}

// 获取分类图标
const getCategoryIcon = (categoryName: string): string => {
  const iconMap: Record<string, string> = {
    基础节点: '📌',
    逻辑节点: '🔀',
    AI节点: '🤖',
    数据节点: '📊',
    数据处理节点: '📊',
    输出节点: '📤',
  }
  return iconMap[categoryName] || '📋'
}

// 业务逻辑
const categories = computed(() => {
  const allNodes = NodeRegistry.getAllDefinitions()
  const grouped: Record<string, NodeDefinition[]> = {}

  allNodes.forEach((node: NodeDefinition) => {
    const category = node.category || '基础'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(node)
  })

  // 调试日志
  console.log('分组的节点:', grouped)
  console.log('当前激活的分类:', activeCategories.value)

  return Object.entries(grouped).map(([name, nodes]) => ({
    name: name, // 直接使用节点定义中的分类名称
    nodes,
  }))
})

// 切换分类展开/收起
const toggleCategory = (categoryName: string) => {
  const index = activeCategories.value.indexOf(categoryName)
  if (index > -1) {
    activeCategories.value.splice(index, 1)
  } else {
    activeCategories.value.push(categoryName)
  }
}

// 检查分类是否激活
const isCategoryActive = (categoryName: string) => {
  return activeCategories.value.includes(categoryName)
}

const onDragStart = (nodeDef: NodeDefinition, event: DragEvent) => {
  if (!event.dataTransfer) return

  // 设置拖动时的视觉效果
  const element = event.target as HTMLElement
  if (element) {
    element.style.opacity = '0.6'
    element.style.transform = 'scale(0.95)'
  }

  // 设置多种格式的数据，确保接收方能够正确获取
  event.dataTransfer.setData('application/node-type', nodeDef.type)
  event.dataTransfer.setData('text/plain', nodeDef.type)
  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({
      type: nodeDef.type,
      name: nodeDef.name,
      defaultData: nodeDef.defaultData || {},
    }),
  )

  event.dataTransfer.effectAllowed = 'copy'

  if (event.dataTransfer.setDragImage) {
    const dragImage = createDragImage(nodeDef)
    event.dataTransfer.setDragImage(dragImage, 20, 20)
  }
}

const onDragEnd = () => {
    // 恢复样式
    const elements = document.querySelectorAll('.node-card')
    elements.forEach((el) => {
      const htmlElement = el as HTMLElement
      htmlElement.style.opacity = ''
      htmlElement.style.transform = ''
    })
  }

const createDragImage = (nodeDef: NodeDefinition): HTMLElement => {
  const dragImage = document.createElement('div')
  dragImage.style.cssText = `
    padding: 8px 12px;
    background: white;
    border: 2px solid #8e4ccb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(142, 76, 203, 0.3);
    font-size: 13px;
    color: #5a2790;
    white-space: nowrap;
    font-weight: 500;
  `
  dragImage.textContent = nodeDef.name
  document.body.appendChild(dragImage)

  setTimeout(() => {
    if (document.body.contains(dragImage)) {
      document.body.removeChild(dragImage)
    }
  }, 100)

  return dragImage
}

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    AI: 'AI节点',
    逻辑: '逻辑节点',
    '数据处理': '数据处理节点',
    输出: '输出节点',
    基础: '基础节点',
  }
  // 调试日志
  console.log('原始分类名:', category, '映射后的分类名:', names[category] || category)
  return names[category] || category
}
</script>

<style scoped>
.node-palette {
  padding: 24px 20px;
  height: 100%;
  overflow-y: auto;
  background: #ffffff;
  border-right: 1px solid #d9c8f0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

/* 标题样式 */
.palette-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #5a2790;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0e8ff;
  letter-spacing: 0.5px;
}

/* 分类区块 */
.category-section {
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
}

/* 分类头部 */
.category-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  background-color: #faf5ff;
  margin-bottom: 12px;
  user-select: none;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.category-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(142, 76, 203, 0.1), transparent);
  transition: left 0.5s ease;
}

.category-header:hover {
  background-color: #f0e8ff;
  transform: translateX(3px);
  border-color: #d9c8f0;
}

.category-header:hover::before {
  left: 100%;
}

.category-icon {
  font-size: 18px;
  margin-right: 12px;
  width: 24px;
  text-align: center;
}

.category-name {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #5a2790;
}

.expand-icon {
  color: #8e4ccb;
  font-size: 16px;
  transition: transform 0.3s ease;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

/* 节点列表 */
.node-list {
  display: flex;
  flex-direction: column;
  gap: var(--node-gap, 8px);
  padding-left: 12px;
}

/* 节点卡片 */
.node-card {
  cursor: grab;
  transition: all 0.2s ease;
  position: relative;
}

.node-card:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.node-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  padding: 2px;
  background: linear-gradient(135deg, #8e4ccb, #c084fc);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.node-card:hover::after {
  opacity: 1;
}

.node-content {
  padding: 12px; /* p-3 = 12px */
  border-radius: 8px; /* rounded-lg = 8px */
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
}

.node-content.hovered {
  border-color: #8e4ccb;
  box-shadow: 0 6px 20px rgba(142, 76, 203, 0.2);
  transform: translateY(-2px);
  background: linear-gradient(135deg, #ffffff, #faf5ff);
}

/* 节点图标 - 根据节点类型使用不同颜色 */
.node-icon {
  color: #8e4ccb;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: #faf5ff;
  border-radius: 6px;
  transition: all 0.2s ease;
}

/* 为不同类型的节点设置不同的图标背景色 */
.node-card:nth-child(1) .node-icon {
  /* 开始节点 */
  background-color: #f0fdf4;
  color: #15803d;
}

.node-card:nth-child(2) .node-icon {
  /* 结束节点 */
  background-color: #f5f3ff;
  color: #7c3aed;
}

.node-card:nth-child(3) .node-icon {
  /* AI对话节点 */
  background-color: #f0f9ff;
  color: #0369a1;
}

.node-card:nth-child(4) .node-icon {
  /* 条件判断节点 */
  background-color: #fffbeb;
  color: #b45309;
}

.node-card:nth-child(5) .node-icon {
  /* 数据处理节点 */
  background-color: #fdf2f8;
  color: #be123c;
}

.node-card:nth-child(6) .node-icon {
  /* 文本输出节点 */
  background-color: #eff6ff;
  color: #1e40af;
}

.node-content.hovered .node-icon {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(142, 76, 203, 0.2);
}

/* 节点信息 */
.node-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.node-content.hovered .node-name {
  color: #8e4ccb;
}

.node-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}

.node-content.hovered .node-desc {
  color: #8b5cf6;
}

/* 过渡动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  margin-bottom: 0;
  transform: translateX(-10px);
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateX(0);
}

/* 滚动条样式 */
.node-palette::-webkit-scrollbar {
  width: 6px;
}

.node-palette::-webkit-scrollbar-track {
  background: #f9fafb;
  border-radius: 3px;
}

.node-palette::-webkit-scrollbar-thumb {
  background: #d9c8f0;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.node-palette::-webkit-scrollbar-thumb:hover {
  background: #8e4ccb;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .node-palette {
    padding: 20px 16px;
  }

  .palette-title {
    font-size: 18px;
  }

  .node-desc {
    display: none;
  }

  .node-content {
    padding: 10px;
    gap: 10px;
  }

  .node-icon {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 768px) {
  .node-palette {
    padding: 16px 12px;
  }

  .category-header {
    padding: 10px 12px;
  }

  .node-content {
    padding: 8px;
    gap: 8px;
  }

  .node-icon {
    width: 32px;
    height: 32px;
  }

  .node-name {
    font-size: 13px;
  }
}
</style>
