# FlowGen Backend

> AI 工作流可视化编排平台后端服务

---

## 架构说明

### 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | NestJS | ^10.x |
| 语言 | TypeScript | ^5.x |
| ORM | TypeORM | ^0.3.x |
| 数据库 | PostgreSQL | ^15.x |
| 认证 | JWT + Passport | - |
| AI SDK | OpenAI / Anthropic / DashScope | - |

### 整体架构

```
Frontend (Vue 3 + React Flow)
        │ REST API / SSE
        ▼
Backend (NestJS)
├── Auth Module (JWT 认证)
├── Workflows Module (CRUD)
├── Execution Module (工作流执行引擎 + SSE)
└── AI Module (多提供商统一封装)
        │
        ▼
PostgreSQL (JSONB 存储)
```

### 核心模块

| 模块 | 职责 |
|------|------|
| **Auth** | 用户注册/登录，JWT 认证 |
| **Workflows** | 工作流 CRUD、导入导出 |
| **Execution** | 拓扑排序执行引擎、SSE 实时推送 |
| **AI** | OpenAI / Anthropic / 通义千问统一封装 |

### 数据库设计

```sql
-- 用户表
users (id, email, password_hash, display_name, created_at, updated_at)

-- 工作流表（节点和边以 JSONB 存储）
workflows (id, name, description, nodes JSONB, edges JSONB, version, user_id, created_at, updated_at)

-- 执行日志表
execution_logs (id, workflow_id, status, node_results JSONB, final_output JSONB, error_message, execution_time_ms, created_at)
```

**设计亮点**：
- JSONB 存储节点/边数据，灵活适配不同节点类型
- 级联删除，用户删除时自动清理关联数据
- 执行日志持久化，支持历史回溯

---

## 关键 Prompt 与 Vibe 思路

### 开发方法论：Superpowers 框架

**核心理念**：文档先行、充分讨论、渐进实现

```
需求理解 → 架构设计 → 文档撰写 → 代码实现 → 迭代优化
```

### 关键实践

#### 1. 文档驱动开发

**Prompt 策略**：让 AI 先理解上下文，再生成文档，最后实现代码。

```
示例流程：
1. "请阅读 docs/api/modules/ 目录下的文档，理解现有架构"
2. /backend-doc-writer → 生成模块文档
3. 人工审查文档
4. "根据文档实现代码，遵循：禁止 any、使用 ApiResponseDto"
```

#### 2. Skill 工具链

```
/backend-doc-writer   # 生成后端模块架构文档
/nestjs-code-review   # 审查后端代码质量
/vue-code-review      # 审查前端代码质量
```

#### 3. 约束明确

```
Prompt 模板：
"根据 [文档路径] 实现 [模块名称]，要求：
1. 严格遵循文档中的类型定义
2. 使用项目已有的 ApiResponseDto 统一响应格式
3. 禁止使用 any 类型
4. 每个函数必须有注释"
```

#### 4. 渐进式开发

- 每次只让 AI 完成一个明确任务
- 关键设计决策必须人工确认
- 用 skill 工具定期审查代码质量

### 本项目实践案例

**工作流执行引擎开发流程**：

1. **需求澄清**：确认条件分支、模板变量、错误处理
2. **文档生成**：`/backend-doc-writer` → `docs/api/modules/04-execution.md`
3. **代码实现**：AI 根据文档实现拓扑排序、节点执行器、参数解析器
4. **审查优化**：`/nestjs-code-review` → 发现循环依赖检测缺失 → AI 修复

---

## AI 调用逻辑

### 多提供商统一封装

```typescript
// 统一接口
interface AiCallParams {
  model: string;        // 'gpt-4o' | 'claude-3-5-sonnet' | 'qwen-turbo'
  prompt: string;
  temperature: number;
  maxTokens: number;
}

interface AiCallResult {
  text: string;
  model: string;
  usage: { promptTokens, completionTokens, totalTokens };
}

// AiService 根据模型前缀自动路由
async call(params: AiCallParams): Promise<AiCallResult> {
  if (params.model.startsWith('gpt')) return this.openaiProvider.call(params);
  if (params.model.startsWith('claude')) return this.anthropicProvider.call(params);
  if (params.model.startsWith('qwen')) return this.dashscopeProvider.call(params);
  throw new Error(`不支持的模型: ${params.model}`);
}
```

### 支持的 AI 提供商

| 提供商 | 模型前缀 | SDK |
|--------|----------|-----|
| OpenAI | `gpt-*`, `o1-*`, `o3-*` | `openai` |
| Anthropic | `claude-*` | `@anthropic-ai/sdk` |
| 阿里云通义千问 | `qwen-*` | `openai` (兼容模式) |

### 懒加载设计

Provider 采用懒加载，避免未配置 API Key 时启动失败：

```typescript
private getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY 未配置');
  if (!this.client) this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return this.client;
}
```

### 当前实现：非流式调用

AI 节点执行完成后返回完整结果，通过 SSE 推送节点级进度。

**未来扩展**：可改造为流式调用，通过 EventEmitter 实时推送 AI 输出 chunk。

---

## 部署步骤说明

### 环境要求

- Node.js >= 18.x
- PostgreSQL >= 15.x

### 1. 安装与配置

```bash
git clone https://github.com/youzi17/flowgen-backend.git
cd flowgen-backend
npm install
cp .env.example .env
```

编辑 `.env`：

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=flowgen
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password

JWT_SECRET=your_jwt_secret_at_least_32_chars
JWT_EXPIRES_IN=7d

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DASHSCOPE_API_KEY=sk-...

PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

### 2. 创建数据库

```bash
psql -U postgres -c "CREATE DATABASE flowgen;"
```

### 3. 启动服务

```bash
npm run build
npm run start

# 验证
curl http://localhost:3000/api
# API 文档：http://localhost:3000/api-docs
```

首次启动时 TypeORM 自动创建所有表。

---

### 生产环境部署（含 DNS/HTTPS）

#### 方案：Nginx + Let's Encrypt

##### 1. 安装 Nginx 和 Certbot

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

##### 2. 配置 Nginx

```nginx
# /etc/nginx/sites-available/flowgen-api
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE 支持
        proxy_buffering off;
        proxy_cache off;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/flowgen-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

##### 3. 配置 DNS

域名服务商控制台添加 A 记录：

```
类型: A
主机记录: api
记录值: 服务器公网 IP
```

##### 4. 申请 SSL 证书

```bash
sudo certbot --nginx -d api.yourdomain.com
```

Certbot 自动配置 HTTPS，证书到期前自动续期。

##### 5. 安全加固

- 数据库强密码 + 只监听本地
- `JWT_SECRET` 至少 32 字符
- 生产环境 `CORS_ORIGIN` 设置为前端域名
- `.env` 文件权限设为 `600`

---

## API 文档

启动后访问：`http://localhost:3000/api-docs`

### 核心接口

#### 认证

```http
POST /api/auth/register
POST /api/auth/login
→ { access_token, user }
```

#### 工作流

```http
GET    /api/workflows           # 列表
POST   /api/workflows           # 创建
GET    /api/workflows/:id       # 详情
PUT    /api/workflows/:id       # 更新
DELETE /api/workflows/:id       # 删除
POST   /api/workflows/import    # 导入
GET    /api/workflows/:id/export # 导出
```

#### 执行

```http
POST /api/execution/:workflowId/run
→ { logId, status: "running" }

GET /api/execution/:logId/events  # SSE 实时进度
```

**SSE 事件流**：

```javascript
const eventSource = new EventSource(`/api/execution/${logId}/events`);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.type: 'execution.started' | 'node.start' | 'node.complete' | 'execution.completed' | 'execution.failed'
};
```

---

## 开发指南

### 项目结构

```
src/
├── common/          # 统一响应、异常过滤器、守卫
├── config/          # 数据库、应用配置
└── modules/
    ├── auth/        # 认证模块
    ├── workflows/   # 工作流 CRUD
    ├── execution/   # 执行引擎
    │   ├── engine/  # 拓扑排序、节点执行器、参数解析
    │   ├── nodes/   # 各节点类型执行器
    │   └── events/  # SSE 事件定义
    └── ai/          # AI 提供商封装
```

### 开发命令

```bash
npm run start:dev   # 开发环境（热重载）
npm run build       # 编译
npm run start       # 生产环境
npm run lint        # 代码检查
```

### 扩展节点类型

1. 创建执行器：`src/modules/execution/nodes/my-custom.executor.ts`
2. 注册到 `NODE_EXECUTORS` 映射表

### 扩展 AI 提供商

1. 创建 Provider：`src/modules/ai/providers/my-provider.provider.ts`
2. 在 `AiService.call()` 添加模型前缀路由

---

## License

MIT
