<template>
  <div class="data-process-config-panel">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>数据处理节点配置</span>
        </div>
      </template>
      
      <!-- 基础配置 -->
      <el-form label-width="120px" class="config-form">
        <!-- 处理类型选择 -->
        <el-form-item label="处理类型">
          <el-select 
            v-model="localData.processType" 
            placeholder="请选择处理类型" 
            @change="handleProcessTypeChange"
            class="w-full"
          >
            <el-option label="文本转换" value="text_transform" />
            <el-option label="数据提取" value="data_extraction" />
            <el-option label="格式转换" value="format_conversion" />
            <el-option label="数据过滤" value="data_filtering" />
          </el-select>
        </el-form-item>
        
        <!-- 输入字段 -->
        <el-form-item label="输入字段">
          <el-input 
            v-model="localData.inputField" 
            placeholder="请输入字段名，支持点表示法"
            @input="updateNode"
          />
        </el-form-item>
        
        <!-- 输出字段 -->
        <el-form-item label="输出字段">
          <el-input 
            v-model="localData.outputField" 
            placeholder="请输入字段名，支持点表示法"
            @input="updateNode"
          />
        </el-form-item>
        
        <!-- 文本转换配置 -->
        <template v-if="localData.processType === 'text_transform'">
          <h4 class="config-section-title">文本操作</h4>
          <div class="text-operations">
            <el-checkbox-group 
              v-model="textOperations" 
              @change="updateNode"
            >
              <el-checkbox label="toLowerCase">转小写</el-checkbox>
              <el-checkbox label="toUpperCase">转大写</el-checkbox>
              <el-checkbox label="trim">去除首尾空格</el-checkbox>
              <el-checkbox label="removeSpaces">去除所有空格</el-checkbox>
            </el-checkbox-group>
          </div>
          
          <h4 class="config-section-title">替换规则</h4>
          <div class="replace-rules">
            <div 
              v-for="(rule, index) in replaceRules" 
              :key="index"
              class="replace-rule-item"
            >
              <el-input 
                v-model="rule.search" 
                placeholder="查找内容"
                @input="updateNode"
                size="small"
                class="search-input"
              />
              <el-input 
                v-model="rule.replace" 
                placeholder="替换为"
                @input="updateNode"
                size="small"
                class="replace-input"
              />
              <el-button 
                type="danger" 
                icon="Delete"
                @click="removeReplaceRule(index)"
                size="small"
              />
            </div>
            <el-button 
              type="primary" 
              icon="Plus"
              @click="addReplaceRule"
              size="small"
              class="add-rule-btn"
            >添加规则</el-button>
          </div>
        </template>
        
        <!-- 数据提取配置 -->
        <template v-if="localData.processType === 'data_extraction'">
          <h4 class="config-section-title">提取配置</h4>
          <el-form-item label="提取类型">
            <el-select 
              v-model="extractionType" 
              placeholder="请选择提取类型"
              @change="updateNode"
              class="w-full"
            >
              <el-option label="正则表达式" value="regex" />
              <el-option label="JSONPath" value="jsonPath" />
              <el-option label="XPath" value="xpath" />
            </el-select>
          </el-form-item>
          <el-form-item label="表达式">
            <el-input 
              v-model="expression" 
              placeholder="请输入表达式"
              @input="updateNode"
              type="textarea"
              :rows="2"
            />
            <div class="expression-tip">
              <el-tooltip content="正则: \d+ 匹配数字; JSONPath: $.data.items[0].name; XPath: //div[@class='example']">
                <span class="tip-text">点击查看示例</span>
              </el-tooltip>
            </div>
          </el-form-item>
        </template>
        
        <!-- 格式转换配置 -->
        <template v-if="localData.processType === 'format_conversion'">
          <h4 class="config-section-title">格式配置</h4>
          <el-form-item label="目标格式">
            <el-select 
              v-model="targetFormat" 
              placeholder="请选择目标格式"
              @change="updateNode"
              class="w-full"
            >
              <el-option label="JSON转字符串" value="jsonToString" />
              <el-option label="字符串转JSON" value="stringToJson" />
              <el-option label="字符串转数组" value="stringToArray" />
              <el-option label="数组转字符串" value="arrayToString" />
            </el-select>
          </el-form-item>
          <el-form-item 
            v-if="['stringToArray', 'arrayToString'].includes(targetFormat)"
            label="分隔符"
          >
            <el-input 
              v-model="delimiter" 
              placeholder="请输入分隔符"
              @input="updateNode"
            />
          </el-form-item>
        </template>
        
        <!-- 数据过滤配置 -->
        <template v-if="localData.processType === 'data_filtering'">
          <h4 class="config-section-title">过滤配置</h4>
          <el-form-item label="过滤类型">
            <el-select 
              v-model="filterType" 
              placeholder="请选择过滤类型"
              @change="updateNode"
              class="w-full"
            >
              <el-option label="包含" value="contains" />
              <el-option label="不包含" value="notContains" />
              <el-option label="等于" value="equals" />
              <el-option label="不等于" value="notEquals" />
              <el-option label="大于" value="greaterThan" />
              <el-option label="小于" value="lessThan" />
            </el-select>
          </el-form-item>
          <el-form-item label="过滤字段">
            <el-input 
              v-model="filterField" 
              placeholder="请输入要过滤的字段名"
              @input="updateNode"
            />
          </el-form-item>
          <el-form-item label="过滤值">
            <el-input 
              v-model="filterValue" 
              placeholder="请输入过滤值"
              @input="updateNode"
            />
          </el-form-item>
        </template>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DataProcessNode, DataProcessNodeData, TransformOptions } from '@/core/nodes/DataProcessNode'
import { createDataProcessNode } from '@/core/nodes/DataProcessNode'

interface Props {
  node: DataProcessNode
  updateNodeData: (nodeId: string, data: Partial<DataProcessNodeData>) => void
}

const props = defineProps<Props>()

// 确保transformOptions始终存在的辅助函数
const ensureTransformOptions = (data: DataProcessNodeData): TransformOptions => {
  if (!data.transformOptions) {
    return {
      textOperations: [],
      replaceRules: [],
      extractionType: 'regex',
      expression: '',
      targetFormat: 'jsonToString',
      delimiter: ',',
      filterType: 'contains',
      filterField: '',
      filterValue: ''
    }
  }
  return {
    textOperations: data.transformOptions.textOperations || [],
    replaceRules: data.transformOptions.replaceRules || [],
    extractionType: data.transformOptions.extractionType || 'regex',
    expression: data.transformOptions.expression || '',
    targetFormat: data.transformOptions.targetFormat || 'jsonToString',
    delimiter: data.transformOptions.delimiter || ',',
    filterType: data.transformOptions.filterType || 'contains',
    filterField: data.transformOptions.filterField || '',
    filterValue: data.transformOptions.filterValue || ''
  }
}

// 本地数据副本
const localData = ref<DataProcessNodeData>({
  ...props.node.data,
  transformOptions: ensureTransformOptions(props.node.data)
})

// 监听节点数据变化，更新本地副本
watch(() => props.node.data, (newData) => {
  localData.value = {
    ...newData,
    transformOptions: ensureTransformOptions(newData)
  }
}, { deep: true })

// 计算属性，用于安全地访问transformOptions的各个属性
const textOperations = computed({
  get: () => localData.value.transformOptions?.textOperations || [],
  set: (val) => {
    if (!localData.value.transformOptions) {
      localData.value.transformOptions = {} as TransformOptions
    }
    localData.value.transformOptions.textOperations = val
  }
})

const replaceRules = computed({
  get: () => localData.value.transformOptions?.replaceRules || [],
  set: (val) => {
    if (!localData.value.transformOptions) {
      localData.value.transformOptions = {} as TransformOptions
    }
    localData.value.transformOptions.replaceRules = val
  }
})

const extractionType = computed({
  get: () => localData.value.transformOptions?.extractionType || 'regex',
  set: (val) => {
    if (!localData.value.transformOptions) {
      localData.value.transformOptions = {} as TransformOptions
    }
    localData.value.transformOptions.extractionType = val
  }
})

const expression = computed({
  get: () => localData.value.transformOptions?.expression || '',
  set: (val) => {
    if (!localData.value.transformOptions) {
      localData.value.transformOptions = {} as TransformOptions
    }
    localData.value.transformOptions.expression = val
  }
})

const targetFormat = computed({
  get: () => localData.value.transformOptions?.targetFormat || 'jsonToString',
  set: (val) => {
    if (!localData.value.transformOptions) {
      localData.value.transformOptions = {} as TransformOptions
    }
    localData.value.transformOptions.targetFormat = val
  }
})

const delimiter = computed({
  get: () => localData.value.transformOptions?.delimiter || ',',
  set: (val) => {
    if (!localData.value.transformOptions) {
      localData.value.transformOptions = {} as TransformOptions
    }
    localData.value.transformOptions.delimiter = val
  }
})

const filterType = computed({
  get: () => localData.value.transformOptions?.filterType || 'contains',
  set: (val) => {
    if (!localData.value.transformOptions) {
      localData.value.transformOptions = {} as TransformOptions
    }
    localData.value.transformOptions.filterType = val
  }
})

const filterField = computed({
  get: () => localData.value.transformOptions?.filterField || '',
  set: (val) => {
    if (!localData.value.transformOptions) {
      localData.value.transformOptions = {} as TransformOptions
    }
    localData.value.transformOptions.filterField = val
  }
})

const filterValue = computed({
  get: () => localData.value.transformOptions?.filterValue || '',
  set: (val) => {
    if (!localData.value.transformOptions) {
      localData.value.transformOptions = {} as TransformOptions
    }
    localData.value.transformOptions.filterValue = val
  }
})

// 更新节点数据
const updateNode = () => {
  props.updateNodeData(props.node.id, { ...localData.value })
}

// 处理类型变化
const handleProcessTypeChange = () => {
  // 根据不同的处理类型，初始化相应的选项
  updateNode()
}

// 添加替换规则
const addReplaceRule = () => {
  const currentRules = [...replaceRules.value]
  currentRules.push({ search: '', replace: '' })
  replaceRules.value = currentRules
  updateNode()
}

// 移除替换规则
const removeReplaceRule = (index: number) => {
  const currentRules = [...replaceRules.value]
  currentRules.splice(index, 1)
  replaceRules.value = currentRules
  updateNode()
}
</script>

<style scoped>
.data-process-config-panel {
  padding: 16px;
  background: #f5f7fa;
  min-height: 100%;
}

.config-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.config-form {
  margin-top: 20px;
}

.config-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 12px 0;
  padding-left: 4px;
  border-left: 3px solid #409eff;
}

.text-operations {
  padding: 12px;
  background: #f0f9eb;
  border-radius: 4px;
  border: 1px solid #e6f7ff;
}

.replace-rules {
  padding: 12px;
  background: #f0f9eb;
  border-radius: 4px;
  border: 1px solid #e6f7ff;
}

.replace-rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.search-input,
.replace-input {
  flex: 1;
  min-width: 0;
}

.add-rule-btn {
  margin-top: 8px;
}

.expression-tip {
  margin-top: 8px;
  text-align: right;
}

.tip-text {
  color: #67c23a;
  cursor: pointer;
  font-size: 12px;
}

.tip-text:hover {
  text-decoration: underline;
}
</style>