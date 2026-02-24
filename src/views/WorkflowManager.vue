<template>
  <div class="workflow-manager">
    <div class="manager-header">
      <el-space>
        <el-button type="primary" @click="createNewWorkflow">
          <el-icon><Plus /></el-icon>
          新建工作流
        </el-button>
        <el-button @click="importWorkflow">
          <el-icon><Upload /></el-icon>
          导入工作流
        </el-button>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索工作流..."
          style="width: 300px"
          :prefix-icon="Search"
        />
      </el-space>
    </div>

    <el-divider />

    <el-row :gutter="16">
      <el-col 
        v-for="workflow in filteredWorkflows" 
        :key="workflow.id"
        :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
      >
        <el-card 
          class="workflow-card"
          :body-style="{ padding: '0px' }"
          @click="openWorkflow(workflow.id)"
        >
          <div class="card-content">
            <div class="card-header">
              <h3>{{ workflow.name }}</h3>
              <el-dropdown @click.stop>
                <el-button text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="duplicateWorkflow(workflow.id)">
                      <el-icon><CopyDocument /></el-icon>
                      复制
                    </el-dropdown-item>
                    <el-dropdown-item @click="exportSingleWorkflow(workflow)">
                      <el-icon><Download /></el-icon>
                      导出
                    </el-dropdown-item>
                    <el-dropdown-item 
                      @click="deleteWorkflow(workflow.id)" 
                      class="danger-item"
                    >
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            
            <div class="card-body">
              <p class="description">{{ workflow.description || '暂无描述' }}</p>
              <div class="stats">
                <span>节点: {{ workflow.nodes.length }}</span>
                <span>连接: {{ workflow.edges.length }}</span>
              </div>
              <div class="metadata">
                更新于: {{ formatDate(workflow.metadata.updatedAt) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 导入对话框 -->
    <el-dialog
      v-model="showImportModal"
      title="导入工作流"
      width="600px"
      @close="showImportModal = false"
    >
      <el-input
        v-model="importJson"
        type="textarea"
        placeholder="粘贴工作流JSON数据..."
        :rows="10"
      />
      <template #footer>
        <el-button @click="showImportModal = false">取消</el-button>
        <el-button type="primary" @click="handleImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useWorkflowStore } from '@/stores/workflow-store';
import { ElMessage } from 'element-plus';
import type { WorkflowState } from '@/types/workflow';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  Upload,
  Search,
  MoreFilled,
  CopyDocument,
  Download,
  Delete
} from '@element-plus/icons-vue';

const router = useRouter();
const workflowStore = useWorkflowStore();
const { workflows } = storeToRefs(workflowStore);

const searchKeyword = ref('');
const showImportModal = ref(false);
const importJson = ref('');

// 过滤后的工作流列表
const filteredWorkflows = computed(() => {
  if (!searchKeyword.value) return workflows.value;
  
  const keyword = searchKeyword.value.toLowerCase();
  return workflows.value.filter(workflow => 
    workflow.name.toLowerCase().includes(keyword) ||
    workflow.description?.toLowerCase().includes(keyword)
  );
});

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 创建新工作流
const createNewWorkflow = () => {
  workflowStore.createNewWorkflow();
  router.push('/workflow');
};

// 打开工作流
const openWorkflow = (workflowId: string) => {
  router.push(`/workflow/${workflowId}`);
};

// 复制工作流
const duplicateWorkflow = async (workflowId: string) => {
  const workflow = workflows.value.find(w => w.id === workflowId);
  if (workflow) {
    const _newWorkflow: WorkflowState = {
      ...workflow,
      id: uuidv4(),
      name: `${workflow.name} (副本)`,
      metadata: {
        ...workflow.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }
    };
    
    await workflowStore.saveWorkflow();
    ElMessage.success('工作流已复制');
  }
};

// 导出单个工作流
const exportSingleWorkflow = (workflow: WorkflowState) => {
  const dataStr = JSON.stringify(workflow, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${workflow.name}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
};

// 删除工作流
const deleteWorkflow = async (workflowId: string) => {
  const confirmDelete = await ElMessageBox.confirm(
    '确定要删除这个工作流吗？此操作不可撤销。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).catch(() => false);
  
  if (confirmDelete) {
    const success = await workflowStore.deleteWorkflow(workflowId);
    if (success) {
      ElMessage.success('工作流已删除');
    } else {
      ElMessage.error('删除失败');
    }
  }
};

// 导入工作流
const importWorkflow = () => {
  importJson.value = '';
  showImportModal.value = true;
};

// 处理导入
const handleImport = async () => {
  try {
    const workflowData = JSON.parse(importJson.value) as WorkflowState;
    
    // 验证必要字段
    if (!workflowData.name || !Array.isArray(workflowData.nodes) || !Array.isArray(workflowData.edges)) {
      throw new Error('工作流数据格式不正确');
    }
    
    // 生成新ID
    workflowData.id = uuidv4();
    workflowData.metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
    
    // 保存导入的工作流
    await workflowStore.saveWorkflow();
    showImportModal.value = false;
    ElMessage.success('工作流导入成功');
  } catch (error) {
    ElMessage.error('导入失败：' + (error as Error).message);
  }
};

// 从 ElMessageBox 中导入
import { ElMessageBox } from 'element-plus';
</script>

<style scoped>
.workflow-manager {
  padding: 24px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.workflow-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.workflow-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--el-box-shadow-light);
}

.card-content {
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
}

.description {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 8px;
}

.metadata {
  font-size: 11px;
  color: var(--el-text-color-disabled);
  text-align: right;
}

.danger-item {
  color: var(--el-color-error);
}
</style>