<template>
  <el-form label-position="top"
    :model="formState"
    @change="onFormChange"
  >
    <el-form-item label="初始数据"
      help="定义工作流启动时的初始输入数据"
    >
      <el-input
        v-model="formState.inputData"
        type="textarea"
        :rows="6"
        placeholder="输入JSON格式的初始数据，例如：{'input': 'Hello World'}"
        resize="none"
      />
    </el-form-item>
    
    <el-form-item label="自动执行"
      help="启用后，工作流加载时会自动执行"
    >
      <el-switch v-model="formState.autoExecute" />
    </el-form-item>
    
    <el-form-item label="执行间隔"
      help="自动执行模式下，两次执行之间的间隔（毫秒）"
      :rules="[{ required: formState.autoExecute, message: '请输入执行间隔', trigger: 'blur' }]"
    >
      <el-input-number
        v-model="formState.executeInterval"
        :min="1000"
        :max="3600000"
        :step="1000"
        :disabled="!formState.autoExecute"
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
  inputData: props.node.data.inputData || '{"input": ""}',
  autoExecute: props.node.data.autoExecute || false,
  executeInterval: props.node.data.executeInterval || 5000
});

// 监听节点数据变化
watch(
  () => props.node.data,
  (newData) => {
    formState.value = {
      inputData: newData.inputData || '{"input": ""}',
      autoExecute: newData.autoExecute || false,
      executeInterval: newData.executeInterval || 5000
    };
  },
  { deep: true }
);

const onFormChange = () => {
  // 验证JSON格式
  try {
    if (formState.value.inputData) {
      JSON.parse(String(formState.value.inputData || '{}'));
    }
  } catch (_error) {
    console.warn('初始数据格式不正确，需要是有效的JSON');
  }
  
  emit('update:config', { ...formState.value });
};
</script>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 20px;
}
</style>