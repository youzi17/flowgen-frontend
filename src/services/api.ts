/**
 * API 服务层 - 统一封装后端请求
 * 基于后端 ApiResponseDto 格式处理响应
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// 后端统一响应格式
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

// 获取存储的 token
function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

// 通用请求函数
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const json: ApiResponse<T> = await res.json()

  if (!res.ok || !json.success) {
    throw new Error(json.message || `请求失败 (${res.status})`)
  }

  return json.data
}

// ---- Auth ----

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  password: string
  displayName: string
}

export interface AuthResult {
  token: string  // 与后端 AuthResponseDto.token 字段一致
  user: UserInfo
}

export interface UserInfo {
  id: string
  email: string
  displayName: string
  createdAt: string
}

export const authApi = {
  login: (dto: LoginDto) =>
    request<AuthResult>('/auth/login', { method: 'POST', body: JSON.stringify(dto) }),

  register: (dto: RegisterDto) =>
    request<AuthResult>('/auth/register', { method: 'POST', body: JSON.stringify(dto) }),

  me: () => request<UserInfo>('/auth/me'),
}

// ---- Workflows ----

import type { WorkflowNode, Edge } from '@/types/workflow'

/** 工作流列表项（不含 nodes/edges 大字段） */
export interface WorkflowListItemDto {
  id: string
  name: string
  description: string | null
  version: number
  createdAt: string
  updatedAt: string
}

/** 工作流详情（含 nodes/edges） */
export interface WorkflowDetailDto extends WorkflowListItemDto {
  nodes: WorkflowNode[]
  edges: Edge[]
}

/** 创建工作流请求体 */
export interface CreateWorkflowDto {
  name: string
  description?: string
  nodes?: WorkflowNode[]
  edges?: Edge[]
}

/** 更新工作流请求体 */
export interface UpdateWorkflowDto {
  name?: string
  description?: string
  nodes?: WorkflowNode[]
  edges?: Edge[]
}

/** 导入工作流请求体 */
export interface ImportWorkflowDto {
  name: string
  description?: string | null
  nodes: WorkflowNode[]
  edges: Edge[]
  metadata?: {
    createdAt: string
    updatedAt: string
    version?: number
  }
}

export const workflowApi = {
  /** 获取当前用户的工作流列表 */
  list: () => request<WorkflowListItemDto[]>('/workflows'),

  /** 获取工作流详情 */
  get: (id: string) => request<WorkflowDetailDto>(`/workflows/${id}`),

  /** 创建工作流 */
  create: (dto: CreateWorkflowDto) =>
    request<WorkflowDetailDto>('/workflows', { method: 'POST', body: JSON.stringify(dto) }),

  /** 更新工作流 */
  update: (id: string, dto: UpdateWorkflowDto) =>
    request<WorkflowDetailDto>(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),

  /** 删除工作流 */
  delete: (id: string) => request<null>(`/workflows/${id}`, { method: 'DELETE' }),

  /** 复制工作流 */
  duplicate: (id: string) =>
    request<WorkflowDetailDto>(`/workflows/${id}/duplicate`, { method: 'POST' }),

  /** 导出工作流 JSON */
  exportJson: (id: string) => request<WorkflowDetailDto>(`/workflows/${id}/export`),

  /** 导入工作流 JSON */
  importJson: (dto: ImportWorkflowDto) =>
    request<WorkflowDetailDto>('/workflows/import', { method: 'POST', body: JSON.stringify(dto) }),
}

// ---- Execution ----

/** 异步执行启动响应（对应后端 ExecutionStartDto） */
export interface ExecutionStartDto {
  logId: string
  status: 'running'
}

export interface ExecutionLogDto {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'success' | 'failed'
  nodeResults: Record<string, unknown>
  finalOutput: unknown
  errorMessage?: string
  executionTimeMs?: number
  createdAt: string
}

export const executionApi = {
  /** 异步启动工作流执行，返回 logId 用于 SSE 订阅 */
  run: (workflowId: string, initialVariables?: Record<string, unknown>) =>
    request<ExecutionStartDto>(`/execution/${workflowId}/run`, {
      method: 'POST',
      body: JSON.stringify({ initialVariables }),
    }),

  logs: (workflowId: string) =>
    request<ExecutionLogDto[]>(`/execution/${workflowId}/logs`),

  logDetail: (logId: string) =>
    request<ExecutionLogDto>(`/execution/logs/${logId}`),
}
