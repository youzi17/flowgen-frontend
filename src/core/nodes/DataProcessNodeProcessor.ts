import type { DataProcessNode, DataProcessType, TransformOptions } from './DataProcessNode'
import {
  getFieldValue,
  setFieldValue,
  applyTextOperations,
  applyReplaceRules,
} from './DataProcessNode'

// 节点执行上下文类型
export interface NodeExecutionContext {
  data: Record<string, any>
  addError: (message: string, details?: string) => void
  [key: string]: any
}

/**
 * 数据处理节点处理器
 * 负责处理各种数据转换操作
 */
export class DataProcessNodeProcessor {
  /**
   * 执行节点的处理逻辑
   */
  async execute(node: DataProcessNode, context: NodeExecutionContext): Promise<boolean> {
    try {
      const { processType, inputField, outputField, transformOptions } = node.data

      // 获取输入数据
      const inputData = getFieldValue(context.data, inputField || '')

      if (inputData === undefined || inputData === null) {
        console.warn(`DataProcessNode: Input field "${inputField}" not found in context data`)
        // 输入数据不存在时，仍视为执行成功，但不执行转换
        return true
      }

      // 根据处理类型执行不同的转换
      let outputData: any
      // 确保transformOptions不是undefined
      const options = transformOptions || {}
      switch (processType) {
        case 'text_transform':
          outputData = this.processTextTransform(inputData, options)
          break
        case 'data_extraction':
          outputData = this.processDataExtraction(inputData, options)
          break
        case 'format_conversion':
          outputData = this.processFormatConversion(inputData, options)
          break
        case 'data_filtering':
          outputData = this.processDataFiltering(inputData, options)
          break
        default:
          console.warn(`DataProcessNode: Unknown process type "${processType}"`)
          outputData = inputData
      }

      // 设置输出数据
      setFieldValue(context.data, outputField || 'processedData', outputData)

      return true
    } catch (error) {
      console.error('Error executing DataProcessNode:', error)
      context.addError('数据处理失败', error instanceof Error ? error.message : String(error))
      return false
    }
  }

  /**
   * 处理文本转换
   */
  private processTextTransform(input: any, options: TransformOptions): string {
    // 确保输入是字符串
    let text = String(input)

    // 应用文本操作
    if (options.textOperations && Array.isArray(options.textOperations)) {
      text = applyTextOperations(text, options.textOperations)
    }

    // 应用替换规则
    if (options.replaceRules && Array.isArray(options.replaceRules)) {
      text = applyReplaceRules(text, options.replaceRules)
    }

    return text
  }

  /**
   * 处理数据提取
   */
  private processDataExtraction(input: any, options: TransformOptions): any {
    const { extractionType, expression } = options

    if (!expression) {
      return input
    }

    try {
      switch (extractionType) {
        case 'regex':
          return this.extractWithRegex(String(input), expression)
        case 'jsonPath':
          return this.extractWithJsonPath(input, expression)
        case 'xpath':
          return this.extractWithXPath(String(input), expression)
        default:
          return input
      }
    } catch (error) {
      console.error(`Error extracting data with ${extractionType}:`, error)
      return input
    }
  }

  /**
   * 使用正则表达式提取数据
   */
  private extractWithRegex(text: string, regexStr: string): any {
    try {
      const regex = new RegExp(regexStr, 'g')
      const matches = text.match(regex)

      // 如果有捕获组，返回第一个捕获组的结果，否则返回所有匹配项
      if (regexStr.includes('(') && regexStr.includes(')')) {
        const firstMatch = regex.exec(text)
        return firstMatch && firstMatch.length > 1 ? firstMatch[1] : matches
      }

      return matches
    } catch (error) {
      console.error('Invalid regex pattern:', error)
      return null
    }
  }

  /**
   * 使用JSONPath提取数据
   */
  private extractWithJsonPath(obj: any, jsonPath: string): any {
    // 简单的JSONPath实现
    // 支持：$.property, $.array[0], $.nested.property

    // 移除开头的$符号
    const path = jsonPath.startsWith('$') ? jsonPath.slice(1) : jsonPath

    if (!path) {
      return obj
    }

    try {
      // 处理点表示法
      if (path.startsWith('.')) {
        return this.getNestedProperty(obj, path.slice(1))
      }

      // 处理数组索引
      if (path.startsWith('[') && path.includes(']')) {
        const index = parseInt(path.slice(1, path.indexOf(']')))
        if (Array.isArray(obj) && index >= 0 && index < obj.length) {
          return obj[index]
        }
      }

      return obj
    } catch (error) {
      console.error('JSONPath extraction failed:', error)
      return null
    }
  }

  /**
   * 获取嵌套属性
   */
  private getNestedProperty(obj: any, propertyPath: string): any {
    const properties = propertyPath.split('.')
    let result = obj

    for (const prop of properties) {
      // 检查是否是数组索引
      if (prop.startsWith('[') && prop.endsWith(']')) {
        const index = parseInt(prop.slice(1, -1))
        if (Array.isArray(result) && index >= 0 && index < result.length) {
          result = result[index]
        } else {
          return undefined
        }
      } else {
        if (result && typeof result === 'object' && prop in result) {
          result = result[prop]
        } else {
          return undefined
        }
      }
    }

    return result
  }

  /**
   * 使用XPath提取数据（简化实现）
   */
  private extractWithXPath(xmlStr: string, xpath: string): any {
    // 注意：在浏览器环境中，我们可以使用DOMParser来处理XML
    // 这里提供一个简化的实现，实际使用时可能需要引入专门的XPath库
    console.warn('XPath extraction is not fully implemented in this simplified version')
    return null
  }

  /**
   * 处理格式转换
   */
  private processFormatConversion(input: any, options: TransformOptions): any {
    const { targetFormat, delimiter = ',' } = options

    try {
      switch (targetFormat) {
        case 'jsonToString':
          return JSON.stringify(input)
        case 'stringToJson':
          if (typeof input === 'string') {
            return JSON.parse(input)
          }
          return input
        case 'stringToArray':
          if (typeof input === 'string') {
            return input.split(delimiter).map((item: string) => item.trim())
          }
          return input
        case 'arrayToString':
          if (Array.isArray(input)) {
            return input.join(delimiter)
          }
          return String(input)
        default:
          return input
      }
    } catch (error) {
      console.error(`Format conversion to ${targetFormat} failed:`, error)
      return input
    }
  }

  /**
   * 处理数据过滤
   */
  private processDataFiltering(input: any, options: TransformOptions): any {
    const filterType = options.filterType || 'contains'
    const filterValue = options.filterValue || ''
    const filterField = options.filterField || ''

    // 如果是数组，过滤数组中的每个元素
    if (Array.isArray(input)) {
      return input.filter((item) => this.applyFilter(item, filterType, filterValue, filterField))
    }

    // 如果是对象，检查是否匹配过滤条件
    if (typeof input === 'object' && input !== null) {
      return this.applyFilter(input, filterType, filterValue, filterField) ? input : null
    }

    // 如果是基本类型，直接比较
    return this.applyFilter(input, filterType, filterValue, '') ? input : null
  }

  /**
   * 应用过滤条件
   */
  private applyFilter(
    value: any,
    filterType: string,
    filterValue: string,
    filterField: string,
  ): boolean {
    let compareValue: any = value

    // 如果指定了字段，从对象中获取字段值
    if (filterField && typeof value === 'object' && value !== null) {
      compareValue = getFieldValue(value, filterField)
    }

    compareValue = String(compareValue)

    switch (filterType) {
      case 'contains':
        return compareValue.includes(filterValue)
      case 'notContains':
        return !compareValue.includes(filterValue)
      case 'equals':
        return compareValue === filterValue
      case 'notEquals':
        return compareValue !== filterValue
      case 'greaterThan':
        return parseFloat(compareValue) > parseFloat(filterValue)
      case 'lessThan':
        return parseFloat(compareValue) < parseFloat(filterValue)
      default:
        return true
    }
  }
}
