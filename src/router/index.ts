import { createRouter, createWebHistory } from 'vue-router'
import { defineAsyncComponent } from 'vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/workflows'
    },
    {
      path: '/workflows',
      name: 'workflows',
      component: defineAsyncComponent(() => import('@/views/WorkflowManager.vue')),
      meta: {
        title: '工作流管理'
      }
    },
    {
      path: '/workflow/:id?',
      name: 'workflow-editor',
      component: defineAsyncComponent(() => import('@/views/WorkflowEditor.vue')),
      meta: {
        title: '工作流编辑器'
      }
    }
  ],
})

// 全局前置守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - FlowGen` : 'FlowGen - AI工作流可视化编排平台'
  next()
})

export default router
