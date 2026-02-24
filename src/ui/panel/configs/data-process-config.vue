<template>
  <el-form
    label-position="top"
    :model="formState"
    :rules="rules"
    ref="formRef"
    @change="onFormChange"
  >
    <el-form-item label="处理类型" help="选择数据处理的方式">
      <el-select v-model="formState.processType" placeholder="选择处理类型">
        <el-option label="文本转换" value="text_transform" />
        <el-option label="数据映射" value="data_map" />
        <el-option label="数组操作" value="array_operation" />
      </el-select>
    </el-form-item>

    <el-form-item v-if="formState.processType === 'text_transform'" label="文本操作">
      <el-select v-model="formState.transformOptions.textOperation" placeholder="选择文本操作">
        <el-option label="转大写" value="to_upper" />
        <el-option label="转小写" value="to_lower" />
        <el-option label="去除空格" value="trim" />
        <el-option label="截取字符串" value="substring" />
      </el-select>
    </el-form-item>

    <el-form-item
      v-if="formState.transformOptions && formState.transformOptions.textOperation === 'substring'"
      label="截取参数"
    >
      <el-row :gutter="12">
        <el-col :span="12">
          <el-input-number
            v-model="formState.transformOptions.startIndex"
            label="起始位置"
            :min="0"
          />
        </el-col>
        <el-col :span="12">
          <el-input-number v-model="formState.transformOptions.length" label="长度" :min="1" />
        </el-col>
      </el-row>
    </el-form-item>

    <el-form-item
      v-if="formState.processType === 'data_map'"
      label="数据映射"
      help="定义输入字段到输出字段的映射关系，每行一个映射"
    >
      <el-input
        v-model="formState.transformOptions.dataMappings"
        type="textarea"
        :rows="4"
        placeholder="例如：\ninput_field1 -> output_field1\ninput_field2 -> output_field2"
        resize="none"
      />
    </el-form-item>

    <el-form-item v-if="formState.processType === 'array_operation'" label="数组操作">
      <el-select v-model="formState.transformOptions.arrayOperation" placeholder="选择数组操作">
        <el-option label="过滤" value="filter" />
        <el-option label="映射" value="map" />
        <el-option label="排序" value="sort" />
        <el-option label="去重" value="unique" />
        <el-option label="获取长度" value="length" />
      </el-select>
    </el-form-item>

    <!-- 数组操作配置 -->
    <el-form-item
      v-if="
        formState.processType === 'array_operation' &&
        formState.transformOptions &&
        formState.transformOptions.arrayOperation === 'filter'
      "
      label="过滤条件"
    >
      <el-input
        v-model="formState.transformOptions.filterCondition"
        type="textarea"
        :rows="2"
        placeholder="例如：item.value > 10 或 item.includes('关键词')"
        resize="none"
      />
      <div class="form-hint">使用JavaScript表达式，其中item代表数组中的每一项</div>
    </el-form-item>

    <el-form-item
      v-if="
        formState.processType === 'array_operation' &&
        formState.transformOptions &&
        formState.transformOptions.arrayOperation === 'map'
      "
      label="映射表达式"
    >
      <el-input
        v-model="formState.transformOptions.mapExpression"
        type="textarea"
        :rows="2"
        placeholder="例如：item.name 或 {id: item.id, text: item.content}"
        resize="none"
      />
      <div class="form-hint">使用JavaScript表达式，将数组项转换为新格式</div>
    </el-form-item>

    <el-form-item
      v-if="
        formState.processType === 'array_operation' &&
        formState.transformOptions &&
        formState.transformOptions.arrayOperation === 'sort'
      "
      label="排序配置"
    >
      <el-row :gutter="12">
        <el-col :span="12">
          <el-input
            v-model="formState.transformOptions.sortField"
            placeholder="排序字段 (例如：'name' 或 'id')"
          />
        </el-col>
        <el-col :span="12">
          <el-select v-model="formState.transformOptions.sortOrder" placeholder="排序顺序">
            <el-option label="升序" value="asc" />
            <el-option label="降序" value="desc" />
          </el-select>
        </el-col>
      </el-row>
    </el-form-item>

    <el-form-item label="输入字段" prop="inputField" help="指定要处理的输入字段路径">
      <div class="input-container">
        <VariableInput
          :model-value="formState.inputField || ''"
          @update:model-value="(v: string) => { formState.inputField = v }"
          placeholder="请输入字段名或引用其他节点的数据"
          :current-node-id="props.node.id"
          :exclude-node-types="['end']"
          @input="onFormChange"
        />
        <div class="help-text">
            <el-icon><HelpFilled /></el-icon>
            直接输入字段名或使用 <code>&lbrace;&lbrace;nodeId.output.field&rbrace;&rbrace;</code> 引用其他节点输出
          </div>
      </div>
    </el-form-item>

    <el-form-item label="输出字段" prop="outputField" help="指定处理结果的输出字段">
      <el-input v-model="formState.outputField" placeholder="例如：processedData" />
    </el-form-item>

    <!-- 通用配置 -->
    <el-form-item label="错误处理">
      <el-switch v-model="formState.errorHandling" active-text="启用错误处理" />
      <el-form-item v-if="formState.errorHandling" label="错误时的默认值">
        <el-input v-model="formState.defaultValue" placeholder="处理失败时返回的值" />
      </el-form-item>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { HelpFilled } from '@element-plus/icons-vue';
import VariableInput from '@/ui/components/VariableInput.vue';
import { ref, watch, computed } from 'vue'
import type { WorkflowNode } from '@/types/workflow'
import type { BaseNodeData } from '@/types/workflow'

// 定义转换选项类型
interface TransformOptions {
  textOperation?: string
  startIndex?: number
  length?: number
  dataMappings?: string
  arrayOperation?: string
  filterCondition?: string
  mapExpression?: string
  sortField?: string
  sortOrder?: string
  // 添加更多可能的选项
  expression?: string
  delimiter?: string
  filterField?: string
  filterValue?: string
  replaceRules?: Array<{ pattern: string; replacement: string }>
  textOperations?: Array<{ type: string; value?: string }>
}

// 定义数据处理节点数据类型
interface DataProcessNodeData extends BaseNodeData {
  processType?: string
  inputField?: string
  outputField?: string
  transformOptions?: TransformOptions
  errorHandling?: boolean
  defaultValue?: string
  // 兼容旧格式的属性
  textOperation?: string
  startIndex?: number
  length?: number
  dataMappings?: string
  arrayOperation?: string
  filterCondition?: string
  mapExpression?: string
  sortField?: string
  sortOrder?: string
}

interface Props {
  node: WorkflowNode & { data: DataProcessNodeData }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:config': [value: DataProcessNodeData]
}>()
const formRef = ref<InstanceType<typeof import('element-plus')['ElForm']> | null>(null)

// 计算属性：格式化后的节点数据
const nodeData = computed(() => {
  const data = props.node?.data || {}
  return {
    processType: data.processType || 'text_transform',
    inputField: data.inputField || '',
    outputField: data.outputField || 'processedData',
    transformOptions: data.transformOptions || {},
    errorHandling: data.errorHandling || false,
    defaultValue: data.defaultValue || '',
  }
})

// 表单状态类型，确保transformOptions始终存在
interface FormState extends Omit<DataProcessNodeData, 'transformOptions'> {
  transformOptions: TransformOptions
}

// 表单状态 - 初始化完整的transformOptions结构
const formState = ref<FormState>({
  processType: nodeData.value.processType || 'text_transform',
  inputField: nodeData.value.inputField || '',
  outputField: nodeData.value.outputField || 'processedData',
  transformOptions: {
    textOperation: 'to_upper',
    startIndex: 0,
    length: 10,
    dataMappings: '',
    arrayOperation: 'filter',
    filterCondition: '',
    mapExpression: '',
    sortField: '',
    sortOrder: 'asc',
    expression: '',
    delimiter: ',',
    filterField: '',
    filterValue: '',
    replaceRules: [],
    textOperations: [],
  },
  errorHandling: nodeData.value.errorHandling || false,
  defaultValue: nodeData.value.defaultValue || '',
})

// 表单验证规则
const rules = {
  inputField: [
    { required: true, message: '请输入字段路径', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\.\[\]]+$/, message: '字段路径格式不正确', trigger: 'blur' },
  ],
  outputField: [
    { required: true, message: '请输入输出字段', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '输出字段只能包含字母、数字和下划线', trigger: 'blur' },
  ],
}

// 监听节点数据变化
watch(
  nodeData,
  (newData) => {
    // 初始化完整的transformOptions结构
    formState.value = {
      processType: newData.processType || 'text_transform',
      inputField: newData.inputField || '',
      outputField: newData.outputField || 'processedData',
      transformOptions: {
        textOperation: newData.transformOptions?.textOperation || 'to_upper',
        startIndex: newData.transformOptions?.startIndex || 0,
        length: newData.transformOptions?.length || 10,
        dataMappings: newData.transformOptions?.dataMappings || '',
        arrayOperation: newData.transformOptions?.arrayOperation || 'filter',
        filterCondition: newData.transformOptions?.filterCondition || '',
        mapExpression: newData.transformOptions?.mapExpression || '',
        sortField: newData.transformOptions?.sortField || '',
        sortOrder: newData.transformOptions?.sortOrder || 'asc',
        expression: newData.transformOptions?.expression || '',
        delimiter: newData.transformOptions?.delimiter || ',',
        filterField: newData.transformOptions?.filterField || '',
        filterValue: newData.transformOptions?.filterValue || '',
        replaceRules: newData.transformOptions?.replaceRules || [],
        textOperations: newData.transformOptions?.textOperations || [],
      },
      errorHandling: newData.errorHandling || false,
      defaultValue: newData.defaultValue || '',
    }
  },
  { deep: true, immediate: true },
)

// 验证表单并更新配置
const onFormChange = async () => {
  try {
    // 验证表单
    if (formRef.value) {
      await formRef.value.validateField(['inputField', 'outputField'])
    }

    // 验证数据映射格式
    if (
      formState.value.processType === 'data_map' &&
      formState.value.transformOptions.dataMappings
    ) {
      const mappings = formState.value.transformOptions.dataMappings.split('\n')
      for (const mapping of mappings) {
        if (mapping.trim() && !mapping.includes('->')) {
          throw new Error('数据映射格式错误，请使用 "输入字段 -> 输出字段" 格式')
        }
      }
    }

    // 提交更新
    emit('update:config', { ...formState.value })
  } catch (error) {
    console.warn('表单验证失败:', error)
  }
}
</script>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 20px;
}

.form-hint {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
  font-style: italic;
}

.el-form-item__error {
  font-size: 12px;
  margin-top: 4px;
}

/* 增强表单交互效果 */
:deep(.el-input__wrapper:focus-within),
:deep(.el-select__wrapper:focus-within) {
  box-shadow: 0 0 0 2px rgba(142, 76, 203, 0.2);
}

:deep(.el-input-number:focus-within) {
  box-shadow: 0 0 0 2px rgba(142, 76, 203, 0.2);
}

/* 增强切换操作的视觉效果 */
:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #8e4ccb;
}

/* 平滑过渡动画 */
.el-form-item {
  transition: all 0.3s ease;
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
