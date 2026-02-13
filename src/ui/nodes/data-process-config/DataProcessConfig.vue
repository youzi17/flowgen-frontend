<template>
  <div class="data-process-config">
    <h2 class="config-title">数据处理配置</h2>
    <el-form ref="configForm" :model="formData" label-width="100px">
      <el-form-item label="处理类型">
        <el-select v-model="formData.processType" placeholder="请选择处理类型"
                     @change="handleProcessTypeChange">
          <el-option label="文本转换" value="text_transform" />
          <el-option label="数据提取" value="data_extraction" />
          <el-option label="格式转换" value="format_conversion" />
          <el-option label="数据过滤" value="data_filtering" />
        </el-select>
      </el-form-item>

      <el-form-item label="输入字段">
        <el-input v-model="formData.inputField" placeholder="输入数据字段路径" />
        <p class="field-hint">使用点表示法访问嵌套字段，例如: user.name</p>
      </el-form-item>

      <el-form-item label="输出字段">
        <el-input v-model="formData.outputField" placeholder="输出数据字段路径" />
        <p class="field-hint">结果将存储在这个字段中，默认为输入字段名加上_result后缀</p>
      </el-form-item>

      <!-- 文本转换配置 -->
      <div v-if="formData.processType === 'text_transform'">
        <el-form-item label="转换操作">
          <el-checkbox-group v-model="formData.transformOptions.textOperations">
            <el-checkbox label="toLowerCase" border>转小写</el-checkbox>
            <el-checkbox label="toUpperCase" border>转大写</el-checkbox>
            <el-checkbox label="trim" border>去除空白</el-checkbox>
            <el-checkbox label="removeSpaces" border>移除所有空格</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="替换规则">
          <div v-for="(rule, index) in formData.transformOptions.replaceRules" :key="index">
            <div class="replace-rule-row">
              <el-input v-model="rule.search" placeholder="查找内容" style="width: 200px; margin-right: 10px;" />
              <el-input v-model="rule.replace" placeholder="替换内容" style="width: 200px; margin-right: 10px;" />
              <el-button type="danger" icon="Delete" circle @click="removeReplaceRule(index)" />
            </div>
          </div>
          <el-button type="primary" icon="Plus" @click="addReplaceRule">添加替换规则<el/button>
        </el-form-item>
      </div>

      <!-- 数据提取配置 -->
      <div v-else-if="formData.processType === 'data_extraction'">
        <el-form-item label="提取方式">
          <el-select v-model="formData.transformOptions.extractionType" placeholder="选择提取方式">
            <el-option label="正则表达式" value="regex" />
            <el-option label="JSON路径" value="jsonPath" />
            <el-option label="XPath" value="xpath" />
          </el-select>
        </el-form-item>
        <el-form-item label="表达式">
          <el-input v-model="formData.transformOptions.expression" type="textarea" rows="3" placeholder="输入提取表达式" />
        </el-form-item>
      </div>

      <!-- 格式转换配置 -->
      <div v-else-if="formData.processType === 'format_conversion'">
        <el-form-item label="目标格式">
          <el-select v-model="formData.transformOptions.targetFormat" placeholder="选择目标格式">
            <el-option label="JSON 到字符串" value="jsonToString" />
            <el-option label="字符串到 JSON" value="stringToJson" />
            <el-option label="字符串到数组" value="stringToArray" />
            <el-option label="数组到字符串" value="arrayToString" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="['stringToArray', 'arrayToString'].includes(formData.transformOptions.targetFormat)" label="分隔符">
          <el-input v-model="formData.transformOptions.delimiter" placeholder="输入分隔符" />
        </el-form-item>
      </div>

      <!-- 数据过滤配置 -->
      <div v-else-if="formData.processType === 'data_filtering'">
        <el-form-item label="过滤条件">
          <el-select v-model="formData.transformOptions.filterType" placeholder="选择过滤类型">
            <el-option label="包含" value="contains" />
            <el-option label="不包含" value="notContains" />
            <el-option label="等于" value="equals" />
            <el-option label="不等于" value="notEquals" />
            <el-option label="大于" value="greaterThan" />
            <el-option label="小于" value="lessThan" />
          </el-select>
        </el-form-item>
        <el-form-item label="过滤值">
          <el-input v-model="formData.transformOptions.filterValue" placeholder="输入过滤值" />
        </el-form-item>
        <el-form-item label="过滤字段">
          <el-input v-model="formData.transformOptions.filterField" placeholder="输入过滤字段路径" />
        </el-form-item>
      </div>

      <el-form-item>
        <el-button type="primary" @click="saveConfig">保存配置</el-button>
        <el-button @click="resetConfig">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue'
import type { WorkflowNode } from '@/types/workflow'
import { ElMessage } from 'element-plus'

interface TransformOptions {
  textOperations?: string[]
  replaceRules?: { search: string; replace: string }[]
  extractionType?: string
  expression?: string
  targetFormat?: string
  delimiter?: string
  filterType?: string
  filterValue?: string
  filterField?: string
}

interface DataProcessNodeData {
  processType?: string
  inputField?: string
  outputField?: string
  transformOptions?: TransformOptions
}

interface Props {
  node: WorkflowNode
}

interface Emits {
  (e: 'update:node', node: WorkflowNode): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const configForm = ref()

// 表单数据
const formData = reactive({
  processType: 'text_transform',
  inputField: '',
  outputField: '',
  transformOptions: {
    textOperations: [] as string[],
    replaceRules: [] as { search: string; replace: string }[],
    extractionType: 'regex',
    expression: '',
    targetFormat: 'jsonToString',
    delimiter: ',',
    filterType: 'contains',
    filterValue: '',
    filterField: ''
  }
})

// 初始化表单数据
const initFormData = () => {
  const nodeData = props.node.data as DataProcessNodeData || {}
  formData.processType = nodeData.processType || 'text_transform'
  formData.inputField = nodeData.inputField || ''
  formData.outputField = nodeData.outputField || ''
  formData.transformOptions = {
    textOperations: nodeData.transformOptions?.textOperations || [],
    replaceRules: nodeData.transformOptions?.replaceRules || [],
    extractionType: nodeData.transformOptions?.extractionType || 'regex',
    expression: nodeData.transformOptions?.expression || '',
    targetFormat: nodeData.transformOptions?.targetFormat || 'jsonToString',
    delimiter: nodeData.transformOptions?.delimiter || ',',
    filterType: nodeData.transformOptions?.filterType || 'contains',
    filterValue: nodeData.transformOptions?.filterValue || '',
    filterField: nodeData.transformOptions?.filterField || ''
  }
}

// 监听节点变化
watch(
  () => props.node,
  () => {
    nextTick(() => {
      initFormData()
    })
  },
  { deep: true, immediate: true }
)

// 处理类型变化
const handleProcessTypeChange = () => {
  // 重置相应的选项
  const processType = formData.processType
  if (processType !== 'text_transform') {
    formData.transformOptions.textOperations = []
    formData.transformOptions.replaceRules = []
  }
  if (processType !== 'data_extraction') {
    formData.transformOptions.extractionType = 'regex'
    formData.transformOptions.expression = ''
  }
  if (processType !== 'format_conversion') {
    formData.transformOptions.targetFormat = 'jsonToString'
    formData.transformOptions.delimiter = ','
  }
  if (processType !== 'data_filtering') {
    formData.transformOptions.filterType = 'contains'
    formData.transformOptions.filterValue = ''
    formData.transformOptions.filterField = ''
  }
}

// 添加替换规则
const addReplaceRule = () => {
  formData.transformOptions.replaceRules.push({ search: '', replace: '' })
}

// 移除替换规则
const removeReplaceRule = (index: number) => {
  formData.transformOptions.replaceRules.splice(index, 1)
}

// 保存配置
const saveConfig = () => {
  const updatedNode = {
    ...props.node,
    data: {
      ...formData
    }
  }
  emit('update:node', updatedNode)
  ElMessage.success('配置保存成功')
}

// 重置配置
const resetConfig = () => {
  initFormData()
  ElMessage.info('配置已重置')
}
</script>

<style scoped>
.data-process-config {
  padding: 20px;
  background: #faf5ff;
  border-radius: 12px;
  height: 100%;
  overflow-y: auto;
}

.config-title {
  font-size: 18px;
  font-weight: 700;
  color: #5a2790;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #d9c8f0;
}

.field-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 0;
}

.replace-rule-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.replace-rule-row:last-child {
  margin-bottom: 0;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-select),
:deep(.el-input) {
  width: 100%;
  max-width: 400px;
}

:deep(.el-form-item__label) {
  color: #4b5563;
  font-weight: 600;
}

:deep(.el-checkbox) {
  margin-right: 16px;
  margin-bottom: 8px;
}

:deep(.el-button) {
  margin-right: 10px;
}

:deep(.el-button:last-child) {
  margin-right: 0;
}

:deep(.el-form-item__error) {
  font-size: 12px;
}
</style>