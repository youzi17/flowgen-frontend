import type { WorkflowNode } from '@/types/workflow'

// 内联实现createDefaultNode函数，因为utils/node-utils模块不存在
function createDefaultNode(id: string, type: 'data-process', x: number, y: number, data: DataProcessNodeData = {} as DataProcessNodeData): DataProcessNode {
  return {
    id,
    type,
    position: { x, y },
    data,
    width: 200,
    height: 120,
    status: 'idle' as const
  }
}

// 数据处理节点的处理类型
export type DataProcessType =
  | 'text_transform'
  | 'data_extraction'
  | 'format_conversion'
  | 'data_filtering'

// 文本操作类型
export type TextOperation =
  | 'toLowerCase'
  | 'toUpperCase'
  | 'trim'
  | 'removeSpaces'
  | 'to_upper'
  | 'to_lower'

// 替换规则接口
export interface ReplaceRule {
  search: string
  replace: string
}

// 文本转换选项接口
export interface TextTransformOptions {
  textOperations?: TextOperation[]
  replaceRules?: ReplaceRule[]
  textOperation?: string
  startIndex?: number
  length?: number
}

// 数据提取选项接口
export interface DataExtractionOptions {
  extractionType?: 'regex' | 'jsonPath' | 'xpath'
  expression?: string
  dataMappings?: string
}

// 格式转换选项接口
export interface FormatConversionOptions {
  targetFormat?: 'jsonToString' | 'stringToJson' | 'stringToArray' | 'arrayToString'
  delimiter?: string
}

// 数据过滤选项接口
export interface DataFilteringOptions {
  filterType?: 'contains' | 'notContains' | 'equals' | 'notEquals' | 'greaterThan' | 'lessThan'
  filterValue?: string
  filterField?: string
  arrayOperation?: string
  filterCondition?: string
  mapExpression?: string
  sortField?: string
  sortOrder?: string
}

// 数据处理转换选项的联合类型
export type TransformOptions = Partial<
  TextTransformOptions & DataExtractionOptions & FormatConversionOptions & DataFilteringOptions
>

// 数据处理节点数据接口
export interface DataProcessNodeData {
  processType?: DataProcessType
  inputField?: string
  outputField?: string
  transformOptions?: TransformOptions
  errorHandling?: boolean
  defaultValue?: string
  [key: string]: unknown
}

// 数据处理节点的完整接口
export interface DataProcessNode extends WorkflowNode {
  type: 'data-process'
  data: DataProcessNodeData
}

// 创建默认的数据处理节点
export function createDataProcessNode(id: string, x: number, y: number): DataProcessNode {
  return {
    ...createDefaultNode(id, 'data-process', x, y),
    data: {
      processType: 'text_transform',
      inputField: '',
      outputField: '',
      transformOptions: {
        textOperations: [],
        replaceRules: [],
        extractionType: 'regex',
        expression: '',
        targetFormat: 'jsonToString',
        delimiter: ',',
        filterType: 'contains',
        filterValue: '',
        filterField: '',
      },
    },
  }
}

// 处理文本转换操作的工具函数
export function applyTextOperations(text: string, operations: TextOperation[]): string {
  let result = text

  operations.forEach((operation) => {
    switch (operation) {
      case 'toLowerCase':
        result = result.toLowerCase()
        break
      case 'toUpperCase':
        result = result.toUpperCase()
        break
      case 'trim':
        result = result.trim()
        break
      case 'removeSpaces':
        result = result.replace(/\s+/g, '')
        break
    }
  })

  return result
}

// 应用替换规则
export function applyReplaceRules(text: string, rules: ReplaceRule[]): string {
  let result = text

  rules.forEach((rule) => {
    if (rule.search) {
      try {
        // 尝试作为正则表达式处理
        const regex = new RegExp(rule.search, 'g')
        result = result.replace(regex, rule.replace)
      } catch {
        // 如果不是有效的正则表达式，则作为普通字符串处理
        result = result.split(rule.search).join(rule.replace)
      }
    }
  })

  return result
}

// 从对象中获取字段值（支持点表示法）
export function getFieldValue(obj: Record<string, unknown>, fieldPath: string): unknown {
  if (!fieldPath) return obj

  const fields = fieldPath.split('.')
  let result: unknown = obj

  for (const field of fields) {
    if (result === null || result === undefined) {
      return undefined
    }
    result = (result as Record<string, unknown>)[field]
  }

  return result
}

// 设置对象字段值（支持点表示法）
export function setFieldValue(obj: Record<string, unknown>, fieldPath: string, value: unknown): void {
  if (!fieldPath) {
    Object.assign(obj, value)
    return
  }

  const fields = fieldPath.split('.')
  let current: Record<string, unknown> = obj

  for (let i = 0; i < fields.length - 1; i++) {
    const field = fields[i] as string
    if (!current[field]) {
      current[field] = {}
    }
    current = current[field] as Record<string, unknown>
  }

  current[fields[fields.length - 1] as string] = value
}
