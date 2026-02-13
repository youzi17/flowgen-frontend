<template>
  <el-form label-position="top"
    :model="formState"
    @change="onFormChange"
  >
    <el-form-item label="输出格式"
      help="定义工作流结束时的输出格式"
    >
      <el-select v-model="formState.outputFormat" placeholder="选择输出格式">
        <el-option label="JSON" value="json" />
        <el-option label="文本" value="text" />
        <el-option label="HTML" value="html" />
      </el-select>
    </el-form-item>
    
    <el-form-item label="输出字段"
      help="选择需要输出的字段，使用逗号分隔"
    >
      <el-input
        v-model="formState.outputFields"
        placeholder="例如：result,summary,status"
      />
    </el-form-item>
    
    <el-form-item label="成功消息"
      help="工作流成功完成时显示的消息"
    >
      <el-input
        v-model="formState.successMessage"
        placeholder="工作流执行成功！"
      />
    </el-form-item>
    
    <el-form-item label="保存结果"
      help="启用后，自动保存执行结果"
    >
      <el-switch v-model="formState.saveResults" />
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
  outputFormat: props.node.data.outputFormat || 'json',
  outputFields: props.node.data.outputFields || '',
  successMessage: props.node.data.successMessage || '工作流执行成功！',
  saveResults: props.node.data.saveResults || false
});

// 监听节点数据变化
watch(
  () => props.node.data,
  (newData) => {
    formState.value = {
      outputFormat: newData.outputFormat || 'json',
      outputFields: newData.outputFields || '',
      successMessage: newData.successMessage || '工作流执行成功！',
      saveResults: newData.saveResults || false
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