<template>
  <el-popover
    placement="bottom"
    :width="400"
    trigger="manual"
    v-model:visible="displayVisible"
    popper-class="variable-selector-popover"
    @hide="onClose"
  >
    
    <div class="variable-selector-content">
      <h4 class="selector-title">选择变量引用</h4>
      
      <!-- 可用节点列表 -->
      <el-tree
        v-if="availableNodes.length > 0"
        :data="availableNodes"
        node-key="id"
        :default-expand-all="true"
        @node-click="handleNodeClick"
      >
        <template #default="{ node }">
          <div class="node-item">
            <span class="node-label">{{ node.label }}</span>
            <el-tooltip content="插入变量" placement="top">
              <el-button 
                type="primary" 
                size="small" 
                @click.stop="selectVariable(node.value)"
                :disabled="!node.value"
              >
                <el-icon><Plus /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </template>
      </el-tree>
      
      <div v-else class="no-nodes-message">
        暂无可用的节点变量
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkflowStore } from '@/stores/workflow-store';
import { Plus } from '@element-plus/icons-vue';
import type { NodeType } from '@/types/workflow';

// 定义组件的参数
interface Props {
  // 当前节点ID，用于过滤掉不能引用自身的情况
  currentNodeId?: string;
  // 可选：要排除的节点类型
  excludeNodeTypes?: NodeType[];
  // 控制显示/隐藏
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currentNodeId: '',
  excludeNodeTypes: () => [],
  visible: false
});

// 定义事件
const emit = defineEmits<{
  'select': [variableRef: string];
  'close': [];
}>();

// 状态管理
import { watch } from 'vue';
const displayVisible = ref(props.visible);
const workflowStore = useWorkflowStore();

// 监听visible属性变化
watch(() => props.visible, (newValue) => {
  displayVisible.value = newValue;
});

// 计算可用的节点及其字段
const availableNodes = computed(() => {
  const nodes = workflowStore.currentWorkflow?.nodes || [];
  
  return nodes
    .filter(node => {
      // 过滤掉当前节点和被排除的节点类型
      return node.id !== props.currentNodeId && 
             !props.excludeNodeTypes.includes(node.type as NodeType);
    })
    .map(node => {
      // 构建节点树结构
      const nodeItem: { id: string; label: string; value: string; children: { id: string; label: string; value: string; isLeaf: boolean }[] } = {
        id: node.id,
        label: `${getDisplayName(node.type)} (${node.id})`,
        value: `{{${node.id}}}`,
        children: []
      };
      
      // 根据节点类型添加可能的字段
      nodeItem.children.push(
        { 
          id: `${node.id}-output`, 
          label: '完整输出', 
          value: `{{${node.id}}}`,
          isLeaf: true
        },
        { 
          id: `${node.id}-output-data`, 
          label: '输出数据', 
          value: `{{${node.id}.output}}`,
          isLeaf: true
        }
      );
      
      // 根据节点类型添加特定字段
      switch (node.type) {
        case 'ai-chat':
          nodeItem.children.push(
            { id: `${node.id}-content`, label: 'AI回复内容', value: `{{${node.id}.output.content}}`, isLeaf: true }
          );
          break;
        case 'data-process':
          nodeItem.children.push(
            { id: `${node.id}-processed`, label: '处理后数据', value: `{{${node.id}.output.processedData}}`, isLeaf: true }
          );
          break;
        case 'text-output':
          nodeItem.children.push(
            { id: `${node.id}-text`, label: '文本输出', value: `{{${node.id}.output.text}}`, isLeaf: true }
          );
          break;
        default:
          // 其他节点类型的通用字段
          break;
      }
      
      return nodeItem;
    });
});

// 根据节点类型获取显示名称
function getDisplayName(nodeType: string): string {
  const typeMap: Record<string, string> = {
    'start': '开始节点',
    'end': '结束节点',
    'ai-chat': 'AI对话节点',
    'condition': '条件节点',
    'data-process': '数据处理节点',
    'text-output': '文本输出节点'
  };
  
  return typeMap[nodeType] || nodeType;
}

// 处理节点点击事件
function handleNodeClick(node: { isLeaf?: boolean; value?: string }) {
  if (node.isLeaf && node.value) {
    selectVariable(node.value);
  }
}

// 选择变量
function selectVariable(variableRef: string) {
  emit('select', variableRef);
  displayVisible.value = false;
}

// 处理关闭事件
const onClose = () => {
  emit('close');
}
</script>

<style scoped>
.variable-selector-content {
  padding: 8px 0;
}

.selector-title {
  margin: 0 0 12px 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.node-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.node-label {
  flex: 1;
  font-size: 14px;
}

.no-nodes-message {
  text-align: center;
  padding: 20px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

:deep(.el-button--small) {
  padding: 4px 8px;
}
</style>