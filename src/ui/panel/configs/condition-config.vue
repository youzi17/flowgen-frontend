<template>
  <el-form label-position="top"
    :model="formState"
    @change="onFormChange"
  >
    <el-form-item label="条件类型">
      <el-select v-model="formState.conditionType" placeholder="选择条件类型">
        <el-option label="文本包含" value="text_contains" />
        <el-option label="文本等于" value="text_equals" />
        <el-option label="数字大于" value="number_greater" />
        <el-option label="数字小于" value="number_less" />
      </el-select>
    </el-form-item>
    
    <el-form-item label="源数据">
      <el-input
        v-model="formState.sourceKey"
        placeholder="输入源数据键名，如：input.text"
      />
    </el-form-item>
    
    <el-form-item label="比较值">
      <el-input
        v-model="formState.compareValue"
        type="text"
        placeholder="输入比较值"
      />
    </el-form-item>
    
    <el-form-item label="真分支描述">
      <el-input
        v-model="formState.trueBranchLabel"
        placeholder="条件为真时的分支描述"
      />
    </el-form-item>
    
    <el-form-item label="假分支描述">
      <el-input
        v-model="formState.falseBranchLabel"
        placeholder="条件为假时的分支描述"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { WorkflowNode } from '@/types/workflow';
import type { BaseNodeData } from '@/types/workflow';

interface Props {
  node: WorkflowNode;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:config': [value: BaseNodeData];
}>();

// 表单状态
const formState = ref({
  conditionType: props.node.data.conditionType || 'text_contains',
  sourceKey: props.node.data.sourceKey || '',
  compareValue: props.node.data.compareValue || '',
  trueBranchLabel: props.node.data.trueBranchLabel || '条件为真',
  falseBranchLabel: props.node.data.falseBranchLabel || '条件为假'
});

// 监听节点数据变化
watch(
  () => props.node.data,
  (newData) => {
    formState.value = {
      conditionType: newData.conditionType || 'text_contains',
      sourceKey: newData.sourceKey || '',
      compareValue: newData.compareValue || '',
      trueBranchLabel: newData.trueBranchLabel || '条件为真',
      falseBranchLabel: newData.falseBranchLabel || '条件为假'
    };
  },
  { deep: true }
);

const onFormChange = () => {
  emit('update:config', { ...formState.value });
};
</script>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 20px;
}
</style>