import localforage from 'localforage'
import type { WorkflowState, AppSettings, WorkflowTemplate } from '@/types/workflow'

// 存储键名常量
const STORAGE_KEYS = {
  WORKFLOWS: 'flowgen:workflows',
  SETTINGS: 'flowgen:settings',
  TEMPLATES: 'flowgen:templates',
  CURRENT_WORKFLOW_ID: 'flowgen:currentWorkflowId',
} as const

// 配置 localforage
localforage.config({
  name: 'FlowGen',
  storeName: 'flowgen_data',
  description: 'AI工作流可视化编排平台数据存储',
})

/**
 * 存储管理器
 * 负责工作流、设置和模板的本地存储操作
 */
export class StorageManager {
  /**
   * 将对象转换为可安全存储的纯 JSON 对象
   * 移除响应式包装、函数、Map/Set、Symbol 等不可克隆内容
   */
  private sanitizeForStorage<T>(obj: T): T {
    try {
      return JSON.parse(JSON.stringify(obj))
    } catch (error) {
      console.error('数据包含不可序列化内容（如函数、Map、Set、循环引用等）:', error)
      throw new Error('无法保存包含不可序列化数据的对象')
    }
  }

  /**
   * 保存工作流
   * @param workflow 工作流对象
   */
  async saveWorkflow(workflow: WorkflowState): Promise<void> {
    try {
      // 清理输入数据
      const cleanWorkflow = this.sanitizeForStorage(workflow)

      // 获取现有工作流列表（已自动反序列化为普通对象）
      const workflows = await this.getWorkflows()

      // 查找并更新现有工作流，或添加新工作流
      const workflowIndex = workflows.findIndex((w) => w.id === cleanWorkflow.id)

      if (workflowIndex >= 0) {
        // 更新现有工作流
        workflows[workflowIndex] = {
          ...cleanWorkflow,
          metadata: {
            ...cleanWorkflow.metadata,
            updatedAt: new Date().toISOString(),
          },
        }
      } else {
        // 添加新工作流
        workflows.push({
          ...cleanWorkflow,
          metadata: {
            ...cleanWorkflow.metadata,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
      }

      // 再次清理整个列表以确保安全
      const cleanWorkflows = this.sanitizeForStorage(workflows)
      await localforage.setItem(STORAGE_KEYS.WORKFLOWS, cleanWorkflows)
      console.log(`工作流 ${cleanWorkflow.name} 已保存`)
    } catch (error) {
      console.error('保存工作流失败:', error)
      throw new Error('保存工作流失败')
    }
  }

  /**
   * 获取所有工作流
   * @returns 工作流数组
   */
  async getWorkflows(): Promise<WorkflowState[]> {
    try {
      const workflows = await localforage.getItem<WorkflowState[]>(STORAGE_KEYS.WORKFLOWS)
      return workflows || []
    } catch (error) {
      console.error('获取工作流列表失败:', error)
      return []
    }
  }

  /**
   * 根据ID获取工作流
   * @param id 工作流ID
   * @returns 工作流对象或undefined
   */
  async getWorkflowById(id: string): Promise<WorkflowState | undefined> {
    try {
      const workflows = await this.getWorkflows()
      return workflows.find((workflow) => workflow.id === id)
    } catch (error) {
      console.error(`获取工作流 ${id} 失败:`, error)
      return undefined
    }
  }

  /**
   * 删除工作流
   * @param id 工作流ID
   * @returns 是否删除成功
   */
  async deleteWorkflow(id: string): Promise<boolean> {
    try {
      const workflows = await this.getWorkflows()
      const updatedWorkflows = workflows.filter((workflow) => workflow.id !== id)

      await localforage.setItem(STORAGE_KEYS.WORKFLOWS, updatedWorkflows)

      // 如果删除的是当前工作流，清除当前工作流ID
      const currentWorkflowId = await this.getCurrentWorkflowId()
      if (currentWorkflowId === id) {
        await this.setCurrentWorkflowId(null)
      }

      console.log(`工作流 ${id} 已删除`)
      return true
    } catch (error) {
      console.error(`删除工作流 ${id} 失败:`, error)
      return false
    }
  }

  /**
   * 保存应用设置
   * @param settings 设置对象
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const cleanSettings = this.sanitizeForStorage(settings)
      await localforage.setItem(STORAGE_KEYS.SETTINGS, cleanSettings)
      console.log('应用设置已保存')
    } catch (error) {
      console.error('保存应用设置失败:', error)
      throw new Error('保存应用设置失败')
    }
  }

  /**
   * 获取应用设置
   * @returns 设置对象
   */
  async getSettings(): Promise<AppSettings> {
    try {
      const settings = await localforage.getItem<AppSettings>(STORAGE_KEYS.SETTINGS)
      return settings || this.getDefaultSettings()
    } catch (error) {
      console.error('获取应用设置失败:', error)
      return this.getDefaultSettings()
    }
  }

  /**
   * 获取默认设置
   * @returns 默认设置对象
   */
  private getDefaultSettings(): AppSettings {
    return {
      autoSave: true,
      defaultZoom: 1,
      theme: 'light',
      language: 'zh-CN',
    }
  }

  /**
   * 保存工作流模板
   * @param template 模板对象
   */
  async saveTemplate(template: WorkflowTemplate): Promise<void> {
    try {
      const cleanTemplate = this.sanitizeForStorage(template)
      const templates = await this.getTemplates()
      const templateIndex = templates.findIndex((t) => t.id === cleanTemplate.id)

      if (templateIndex >= 0) {
        templates[templateIndex] = cleanTemplate
      } else {
        templates.push(cleanTemplate)
      }

      const cleanTemplates = this.sanitizeForStorage(templates)
      await localforage.setItem(STORAGE_KEYS.TEMPLATES, cleanTemplates)
      console.log(`模板 ${cleanTemplate.name} 已保存`)
    } catch (error) {
      console.error('保存模板失败:', error)
      throw new Error('保存模板失败')
    }
  }

  /**
   * 获取所有模板
   * @returns 模板数组
   */
  async getTemplates(): Promise<WorkflowTemplate[]> {
    try {
      const templates = await localforage.getItem<WorkflowTemplate[]>(STORAGE_KEYS.TEMPLATES)
      return templates || []
    } catch (error) {
      console.error('获取模板列表失败:', error)
      return []
    }
  }

  /**
   * 删除模板
   * @param id 模板ID
   * @returns 是否删除成功
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const templates = await this.getTemplates()
      const updatedTemplates = templates.filter((template) => template.id !== id)

      await localforage.setItem(STORAGE_KEYS.TEMPLATES, updatedTemplates)
      console.log(`模板 ${id} 已删除`)
      return true
    } catch (error) {
      console.error(`删除模板 ${id} 失败:`, error)
      return false
    }
  }

  /**
   * 设置当前工作流ID
   * @param id 工作流ID或null
   */
  async setCurrentWorkflowId(id: string | null): Promise<void> {
    try {
      if (id === null) {
        await localforage.removeItem(STORAGE_KEYS.CURRENT_WORKFLOW_ID)
      } else {
        await localforage.setItem(STORAGE_KEYS.CURRENT_WORKFLOW_ID, id)
      }
    } catch (error) {
      console.error('设置当前工作流ID失败:', error)
    }
  }

  /**
   * 获取当前工作流ID
   * @returns 工作流ID或null
   */
  async getCurrentWorkflowId(): Promise<string | null> {
    try {
      return await localforage.getItem<string>(STORAGE_KEYS.CURRENT_WORKFLOW_ID)
    } catch (error) {
      console.error('获取当前工作流ID失败:', error)
      return null
    }
  }

  /**
   * 清除所有数据
   */
  async clearAll(): Promise<void> {
    try {
      await localforage.clear()
      console.log('所有存储数据已清除')
    } catch (error) {
      console.error('清除数据失败:', error)
      throw new Error('清除数据失败')
    }
  }
}
