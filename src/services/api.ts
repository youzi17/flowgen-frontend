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

export interface WorkflowDto {
  id: string
  name: string
  description?: string
  nodes: unknown[]
  edges: unknown[]
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateWorkflowDto {
  name: string
  description?: string
  nodes?: unknown[]
  edges?: unknown[]
}

export interface UpdateWorkflowDto {
  name?: string
  description?: string
  nodes?: unknown[]
  edges?: unknown[]
}

export const workflowApi = {
  list: () => request<WorkflowDto[]>('/workflows'),

  get: (id: string) => request<WorkflowDto>(`/workflows/${id}`),

  create: (dto: CreateWorkflowDto) =>
    request<WorkflowDto>('/workflows', { method: 'POST', body: JSON.stringify(dto) }),

  update: (id: string, dto: UpdateWorkflowDto) =>
    request<WorkflowDto>(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),

  delete: (id: string) => request<void>(`/workflows/${id}`, { method: 'DELETE' }),

  duplicate: (id: string) =>
    request<WorkflowDto>(`/workflows/${id}/duplicate`, { method: 'POST' }),

  exportJson: (id: string) => request<WorkflowDto>(`/workflows/${id}/export`),

  importJson: (data: unknown) =>
    request<WorkflowDto>('/workflows/import', { method: 'POST', body: JSON.stringify(data) }),
}

// ---- Execution ----

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
  run: (workflowId: string) =>
    request<ExecutionLogDto>(`/execution/${workflowId}/run`, { method: 'POST' }),

  logs: (workflowId: string) =>
    request<ExecutionLogDto[]>(`/execution/${workflowId}/logs`),

  logDetail: (logId: string) =>
    request<ExecutionLogDto>(`/execution/logs/${logId}`),
}
