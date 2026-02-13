<template>
  <div class="variable-input-container">
    <el-input
      v-model="localValue"
      :placeholder="props.placeholder"
      :type="props.type"
      :rows="props.rows"
      :disabled="props.disabled"
      :readonly="props.readonly"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <template v-if="props.type === 'text' && !props.disabled && !props.readonly" #append>
        <el-button
          type="primary"
          size="small"
          circle
          title="选择变量"
          @click.stop="openVariableSelector"
        >
          <el-icon><Link /></el-icon>
        </el-button>
      </template>
      <template v-else-if="props.type === 'textarea' && !props.disabled && !props.readonly" #suffix>
        <el-button
          type="primary"
          size="small"
          circle
          title="选择变量"
          @click.stop="openVariableSelector"
        >
          <el-icon><Link /></el-icon>
        </el-button>
      </template>
    </el-input>
    
    <VariableSelector
      v-if="isSelectorVisible"
      :visible="isSelectorVisible"
      :current-node-id="currentNodeId"
      @select="insertVariableByKey"
      @close="closeVariableSelector"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import VariableSelector from './VariableSelector.vue';
import { Link } from '@element-plus/icons-vue';

// 定义组件属性
interface Props {
  modelValue: string | object;
  placeholder?: string;
  type?: 'text' | 'textarea';
  rows?: number;
  resize?: string;
  disabled?: boolean;
  readonly?: boolean;
  currentNodeId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入',
  type: 'text',
  rows: 1,
  resize: 'none',
  disabled: false,
  readonly: false,
  currentNodeId: ''
});

// 定义事件
const emit = defineEmits<{
  'update:modelValue': [value: string];
  input: [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();

// 本地值
const localValue = ref(typeof props.modelValue === 'string' ? props.modelValue : JSON.stringify(props.modelValue || {}));

// 选择器可见状态
const isSelectorVisible = ref(false);

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  localValue.value = typeof newValue === 'string' ? newValue : JSON.stringify(newValue || {});
});

// 处理输入变化
const handleInput = (value: string) => {
  emit('update:modelValue', value);
  emit('input', value);
};

// 处理焦点事件
const handleFocus = (event: FocusEvent) => {
  emit('focus', event);
};

// 处理失焦事件
const handleBlur = (event: FocusEvent) => {
  emit('blur', event);
};

// 打开变量选择器
const openVariableSelector = () => {
  isSelectorVisible.value = true;
};

// 关闭变量选择器
const closeVariableSelector = () => {
  isSelectorVisible.value = false;
};

// 插入变量
const insertVariableByKey = (variableRef: string) => {
  // 尝试获取输入框元素并处理光标位置插入
  const inputElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
  
  // 确保当前值是字符串
  const currentStrValue = typeof localValue.value === 'string' ? localValue.value : JSON.stringify(localValue.value || {});
  
  if (inputElement && (inputElement.tagName === 'INPUT' || inputElement.tagName === 'TEXTAREA')) {
    const startPos = inputElement.selectionStart || 0;
    const endPos = inputElement.selectionEnd || 0;
    
    // 在光标位置插入变量引用
    const newValue = currentStrValue.substring(0, startPos) + variableRef + currentStrValue.substring(endPos);
    localValue.value = newValue;
    
    // 触发更新事件
    emit('update:modelValue', newValue);
    emit('input', newValue);
    
    // 尝试恢复焦点并设置光标位置
    setTimeout(() => {
      inputElement.focus();
      const newCursorPos = startPos + variableRef.length;
      inputElement.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  } else {
    // 如果无法获取输入框，直接在末尾添加
    const newValue = currentStrValue + variableRef;
    localValue.value = newValue;
    emit('update:modelValue', newValue);
    emit('input', newValue);
  }
  
  // 关闭选择器
  closeVariableSelector();
};
</script>

<style scoped>
.variable-input-container {
  position: relative;
  display: inline-block;
  width: 100%;
}
</style>