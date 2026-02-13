<template>
  <el-form label-position="top"
    :model="formState"
    @change="onFormChange"
  >
    <el-form-item label="AI模型">
      <el-select v-model="formState.model" placeholder="选择AI模型">
        <el-option label="GPT-3.5 Turbo" value="gpt-3.5-turbo" />
        <el-option label="GPT-4" value="gpt-4" />
      </el-select>
    </el-form-item>
    
    <el-form-item label="提示词">
      <div class="prompt-container">
        <VariableInput
          v-model="formState.prompt"
          type="textarea"
          :rows="4"
          placeholder="输入对话提示词..."
          :current-node-id="props.node.id"
          :exclude-node-types="['end']"
        />
        <div class="help-text">
            <el-icon><HelpFilled /></el-icon>
            支持使用 <code>&lbrace;&lbrace;nodeId.output.field&rbrace;&rbrace;</code> 格式引用其他节点的输出
          </div>
      </div>
    </el-form-item>
    
    <el-form-item label="温度">
      <div class="slider-container">
        <el-slider
          v-model="formState.temperature"
          :min="0"
          :max="1"
          :step="0.1"
          show-stops
          :show-tooltip="true"
        />
        <span class="slider-value">{{ formState.temperature }}</span>
      </div>
    </el-form-item>
    
    <el-form-item label="最大令牌数">
      <el-input-number
        v-model="formState.maxTokens"
        :min="100"
        :max="4096"
        :step="100"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { HelpFilled } from '@element-plus/icons-vue';
import VariableInput from '@/ui/components/VariableInput.vue';
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
  model: props.node.data.model || 'gpt-3.5-turbo',
  prompt: props.node.data.prompt || '',
  temperature: props.node.data.temperature || 0.7,
  maxTokens: props.node.data.maxTokens || 1000
});

// 监听节点数据变化
watch(
  () => props.node.data,
  (newData) => {
    formState.value = {
      model: newData.model || 'gpt-3.5-turbo',
      prompt: newData.prompt || '',
      temperature: newData.temperature || 0.7,
      maxTokens: newData.maxTokens || 1000
    };
  },
  { deep: true }
);

const onFormChange = () => {
  emit('update:config', { ...formState.value });
};
</script>

<style scoped>
.slider-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.slider-value {
  min-width: 30px;
  text-align: center;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

.prompt-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.help-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 4px 8px;
  background-color: var(--el-bg-color-soft);
  border-radius: 4px;
}

.help-text code {
  background-color: var(--el-fill-color-light);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: var(--el-font-family-mono);
  font-size: 11px;
  color: var(--el-color-primary);
}
</style>