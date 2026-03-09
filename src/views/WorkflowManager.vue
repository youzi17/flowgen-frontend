<template>
  <div class="wm-page">
    <!-- 顶部 header -->
    <header class="wm-header">
      <div class="header-left">
        <div class="logo">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#6366f1" />
            <path d="M7 14h4l3-6 3 12 3-6h4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="logo-name">FlowGen</span>
        </div>
      </div>
      <div class="header-right">
        <span class="user-name">{{ auth.user?.displayName || auth.user?.email }}</span>
        <button class="btn-ghost" @click="handleLogout">退出</button>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="wm-main">
      <!-- 页面标题区 -->
      <div class="page-hero">
        <div>
          <h1 class="page-title">我的工作流</h1>
          <p class="page-desc">构建、管理和运行你的 AI 工作流</p>
        </div>
        <div class="hero-actions">
          <div class="search-wrap">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="#9ca3af" stroke-width="1.5" />
              <path d="M11 11l3 3" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <input
              v-model="searchKeyword"
              class="search-input"
              placeholder="搜索工作流..."
            />
          </div>
          <button class="btn-outline" @click="importWorkflow">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1v9M4 7l3.5 3.5L11 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M1 12h13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            导入
          </button>
          <button class="btn-primary" @click="createNewWorkflow">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 2v11M2 7.5h11" stroke="white" stroke-width="2" stroke-linecap="round" />
            </svg>
            新建工作流
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner" />
        <span>加载中...</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredWorkflows.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="12" width="32" height="28" rx="4" stroke="#d1d5db" stroke-width="2" />
            <path d="M16 20h16M16 26h10" stroke="#d1d5db" stroke-width="2" stroke-linecap="round" />
            <circle cx="36" cy="36" r="8" fill="#6366f1" />
            <path d="M33 36h6M36 33v6" stroke="white" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </div>
        <p class="empty-title">{{ searchKeyword ? '没有找到匹配的工作流' : '还没有工作流' }}</p>
        <p class="empty-desc">{{ searchKeyword ? '换个关键词试试' : '点击「新建工作流」开始创建' }}</p>
      </div>

      <!-- Bento Grid 卡片列表 -->
      <div v-else class="workflow-grid">
        <div
          v-for="wf in filteredWorkflows"
          :key="wf.id"
          class="wf-card"
          @click="openWorkflow(wf.id)"
        >
          <!-- 卡片顶部色块 -->
          <div class="card-accent" :style="{ background: getAccentColor(wf.id) }" />

          <div class="card-body">
            <div class="card-top">
              <h3 class="card-title">{{ wf.name }}</h3>
              <!-- 操作菜单 -->
              <div class="card-menu" @click.stop>
                <button class="menu-trigger" @click="toggleMenu(wf.id)">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="3" r="1.2" fill="#6b7280" />
                    <circle cx="8" cy="8" r="1.2" fill="#6b7280" />
                    <circle cx="8" cy="13" r="1.2" fill="#6b7280" />
                  </svg>
                </button>
                <div v-if="activeMenu === wf.id" class="menu-dropdown">
                  <button class="menu-item" @click="duplicateWorkflow(wf.id)">复制</button>
                  <button class="menu-item" @click="exportWorkflow(wf)">导出</button>
                  <button class="menu-item menu-item-danger" @click="confirmDelete(wf.id)">删除</button>
                </div>
              </div>
            </div>

            <p class="card-desc">{{ wf.description || '暂无描述' }}</p>

            <div class="card-footer">
              <span class="card-date">{{ formatDate(wf.metadata.updatedAt) }}</span>
              <span class="card-version">v{{ wf.metadata.version }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 导入对话框 -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>导入工作流</h3>
          <button class="modal-close" @click="showImportModal = false">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="#6b7280" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <textarea
          v-model="importJson"
          class="modal-textarea"
          placeholder="粘贴工作流 JSON 数据..."
        />
        <div class="modal-footer">
          <button class="btn-ghost" @click="showImportModal = false">取消</button>
          <button class="btn-primary" @click="handleImport">导入</button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="deleteTargetId" class="modal-overlay" @click.self="deleteTargetId = null">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>确认删除</h3>
        </div>
        <p class="modal-text">删除后无法恢复，确定要删除这个工作流吗？</p>
        <div class="modal-footer">
          <button class="btn-ghost" @click="deleteTargetId = null">取消</button>
          <button class="btn-danger" @click="doDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow-store'
import { useAuthStore } from '@/stores/auth-store'
import type { WorkflowState } from '@/types/workflow'
import { workflowApi } from '@/services/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const workflowStore = useWorkflowStore()
const auth = useAuthStore()
const { workflows } = storeToRefs(workflowStore)

const searchKeyword = ref('')
const loading = ref(false)
const showImportModal = ref(false)
const importJson = ref('')
const activeMenu = ref<string | null>(null)
const deleteTargetId = ref<string | null>(null)

// 过滤工作流
const filteredWorkflows = computed(() => {
  if (!searchKeyword.value) return workflows.value
  const kw = searchKeyword.value.toLowerCase()
  return workflows.value.filter(
    (w) => w.name.toLowerCase().includes(kw) || w.description?.toLowerCase().includes(kw),
  )
})

// 根据 id 生成固定的渐变色
const ACCENTS = [
  'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%)',
  'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)',
  'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)',
  'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)',
  'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)',
  'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
]
const getAccentColor = (id: string) => {
  const idx = id.charCodeAt(0) % ACCENTS.length
  return ACCENTS[idx]
}

const formatDate = (dateString: string) => {
  const d = new Date(dateString)
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const toggleMenu = (id: string) => {
  activeMenu.value = activeMenu.value === id ? null : id
}

// 点击外部关闭菜单
const handleClickOutside = () => { activeMenu.value = null }
onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  loading.value = true
  try {
    await workflowStore.initialize()
  } finally {
    loading.value = false
  }
})
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

const createNewWorkflow = () => {
  workflowStore.createNewWorkflow()
  router.push('/workflow')
}

const openWorkflow = (id: string) => router.push(`/workflow/${id}`)

const duplicateWorkflow = async (id: string) => {
  const ok = await workflowStore.duplicateWorkflow(id)
  if (ok) ElMessage.success('已复制')
  else ElMessage.error('复制失败')
  activeMenu.value = null
}

const exportWorkflow = async (wf: WorkflowState) => {
  try {
    const data = await workflowApi.exportJson(wf.id)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${wf.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    ElMessage.error('导出失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
  activeMenu.value = null
}

const confirmDelete = (id: string) => {
  deleteTargetId.value = id
  activeMenu.value = null
}

const doDelete = async () => {
  if (!deleteTargetId.value) return
  const ok = await workflowStore.deleteWorkflow(deleteTargetId.value)
  if (ok) ElMessage.success('已删除')
  else ElMessage.error('删除失败')
  deleteTargetId.value = null
}

const importWorkflow = () => {
  importJson.value = ''
  showImportModal.value = true
}

const handleImport = async () => {
  try {
    const data = JSON.parse(importJson.value) as WorkflowState
    if (!data.name || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      throw new Error('数据格式不正确')
    }
    const ok = await workflowStore.importWorkflow(data)
    if (!ok) throw new Error('保存失败')
    showImportModal.value = false
    ElMessage.success('导入成功')
  } catch (e) {
    ElMessage.error('导入失败：' + (e as Error).message)
  }
}

const handleLogout = () => {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.wm-page {
  min-height: 100vh;
  background: #f8f9ff;
  display: flex;
  flex-direction: column;
}

/* Header */
.wm-header {
  height: 60px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.8);
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo-name {
  font-size: 16px;
  font-weight: 700;
  color: #1e1b4b;
  letter-spacing: -0.3px;
}
.user-name {
  font-size: 14px;
  color: #6b7280;
}

/* Main */
.wm-main {
  flex: 1;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 32px;
}

/* Hero */
.page-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 36px;
  gap: 24px;
  flex-wrap: wrap;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}
.page-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}
.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Search */
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 12px;
  pointer-events: none;
}
.search-input {
  height: 38px;
  padding: 0 14px 0 36px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  outline: none;
  width: 220px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.search-input::placeholder { color: #9ca3af; }

/* Buttons */
.btn-primary {
  height: 38px;
  padding: 0 16px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s;
}
.btn-primary:hover { background: #4f46e5; }

.btn-outline {
  height: 38px;
  padding: 0 14px;
  background: #fff;
  color: #374151;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.15s, background 0.15s;
}
.btn-outline:hover { border-color: #6366f1; color: #6366f1; }

.btn-ghost {
  height: 38px;
  padding: 0 14px;
  background: transparent;
  color: #6b7280;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.btn-ghost:hover { background: #f3f4f6; color: #374151; }

.btn-danger {
  height: 38px;
  padding: 0 16px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-danger:hover { background: #dc2626; }

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 0;
  color: #6b7280;
  font-size: 14px;
}
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Empty */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
  gap: 8px;
}
.empty-icon { margin-bottom: 8px; }
.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}
.empty-desc {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

/* Bento Grid */
.workflow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.wf-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.wf-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-accent {
  height: 6px;
  width: 100%;
}

.card-body {
  padding: 18px 18px 16px;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 8px;
}

/* 菜单 */
.card-menu { position: relative; }
.menu-trigger {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  flex-shrink: 0;
}
.menu-trigger:hover { background: #f3f4f6; }
.menu-dropdown {
  position: absolute;
  right: 0;
  top: 32px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  min-width: 100px;
  z-index: 20;
  overflow: hidden;
}
.menu-item {
  display: block;
  width: 100%;
  padding: 9px 14px;
  text-align: left;
  font-size: 13px;
  color: #374151;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.1s;
}
.menu-item:hover { background: #f9fafb; }
.menu-item-danger { color: #ef4444; }
.menu-item-danger:hover { background: #fef2f2; }

.card-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-date {
  font-size: 11px;
  color: #9ca3af;
}
.card-version {
  font-size: 11px;
  color: #c4b5fd;
  background: #f5f3ff;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 520px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.modal-sm { width: 360px; }
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}
.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-close:hover { background: #f3f4f6; }
.modal-textarea {
  width: 100%;
  height: 200px;
  padding: 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 13px;
  font-family: monospace;
  color: #111827;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}
.modal-textarea:focus { border-color: #6366f1; }
.modal-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
