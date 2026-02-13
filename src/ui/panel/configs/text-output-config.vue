<template>
  <el-form label-position="top"
    :model="formState"
    @change="onFormChange"
  >
    <el-form-item label="输出模板"
      help="使用模板语法定义输出文本"
    >
      <div class="input-container">
        <VariableInput
          v-model="formState.template"
          type="textarea"
          :rows="5"
          placeholder="例如：处理结果: {result}\n状态: {status}\n时间: {timestamp}"
          resize="none"
          :current-node-id="props.node.id"
          :exclude-node-types="['end']"
        />
        <div class="help-text">
            <el-icon><HelpFilled /></el-icon>
            支持 {字段名} 模板语法和 <code>&lbrace;&lbrace;nodeId.output.field&rbrace;&rbrace;</code> 变量引用
          </div>
      </div>
    </el-form-item>
    
    <el-form-item label="输出类型"
      help="选择输出内容的格式类型"
    >
      <el-select v-model="formState.outputType" placeholder="选择输出类型">
        <el-option label="纯文本" value="plain_text" />
        <el-option label="Markdown" value="markdown" />
        <el-option label="HTML" value="html" />
      </el-select>
    </el-form-item>
    
    <el-form-item label="数据来源"
      help="指定要使用的数据来源字段"
    >
      <div class="input-container">
        <VariableInput
          v-model="formState.dataSource"
          placeholder="例如：input 或 result.data"
          :current-node-id="props.node.id"
          :exclude-node-types="['end']"
        />
        <div class="help-text">
            <el-icon><HelpFilled /></el-icon>
            直接输入字段名或使用 <code>&lbrace;&lbrace;nodeId.output.field&rbrace;&rbrace;</code> 引用其他节点输出
          </div>
      </div>
    </el-form-item>
    
    <el-form-item label="启用时间戳"
      help="在输出中添加当前时间戳"
    >
      <el-switch v-model="formState.includeTimestamp" />
    </el-form-item>
    
    <el-form-item v-if="formState.includeTimestamp" label="时间戳格式"
      help="设置时间戳的显示格式"
    >
      <el-input
        v-model="formState.timestampFormat"
        placeholder="例如：YYYY-MM-DD HH:mm:ss"
      />
    </el-form-item>
    
    <el-form-item label="保存输出"
      help="将输出内容保存到工作流上下文中"
    >
      <el-switch v-model="formState.saveOutput" />
    </el-form-item>
    
    <el-form-item v-if="formState.saveOutput" label="保存字段"
      help="指定保存输出的字段名"
    >
      <el-input
        v-model="formState.outputField"
        placeholder="例如：formattedOutput"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { HelpFilled } from '@element-plus/icons-vue';
import VariableInput from '@/ui/components/VariableInput.vue';
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
  template: props.node.data.template || '输出内容: {data}',
  outputType: props.node.data.outputType || 'plain_text',
  dataSource: props.node.data.dataSource || 'input',
  includeTimestamp: props.node.data.includeTimestamp || false,
  timestampFormat: props.node.data.timestampFormat || 'YYYY-MM-DD HH:mm:ss',
  saveOutput: props.node.data.saveOutput || true,
  outputField: props.node.data.outputField || 'formattedOutput'
});

// 监听节点数据变化
watch(
  () => props.node.data,
  (newData) => {
    formState.value = {
      template: newData.template || '输出内容: {data}',
      outputType: newData.outputType || 'plain_text',
      dataSource: newData.dataSource || 'input',
      includeTimestamp: newData.includeTimestamp || false,
      timestampFormat: newData.timestampFormat || 'YYYY-MM-DD HH:mm:ss',
      saveOutput: newData.saveOutput || true,
      outputField: newData.outputField || 'formattedOutput'
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

/* 变量输入相关样式 */
.input-container {
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