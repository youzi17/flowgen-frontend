<template>
  <el-drawer
    v-model="visible"
    title="节点配置"
    direction="rtl"
    size="400px"
  >
    <div v-if="selectedNode" class="config-content">
      <component
        :is="getConfigComponent(selectedNode.type)"
        :node="selectedNode"
        @update:config="onConfigUpdate"
      />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useUIStore } from '@/stores/ui-store';
import { useWorkflowStore } from '@/stores/workflow-store';
import { useHistoryStore } from '@/stores/history-store';
import type { NodeType } from '@/types/workflow';
import type { BaseNodeData } from '@/types/workflow';

// 业务逻辑
const ui = useUIStore();
const workflow = useWorkflowStore();
const history = useHistoryStore();

const visible = computed({
  get: () => !!ui.selectedNode,
  set: (value) => {
    if (!value) ui.selectNode(null);
  }
});

const selectedNode = computed(() => ui.selectedNode);

const getConfigComponent = (type: NodeType) => {
  return defineAsyncComponent(() => 
    import(`@/ui/panel/configs/${type}-config.vue`)
  );
};

const onConfigUpdate = (config: BaseNodeData) => {
  if (selectedNode.value) {
    workflow.updateNodeData(selectedNode.value.id, config);
    history.pushState();
  }
};
</script>

<style scoped>
.config-content {
  padding: 0 16px;
}
</style>