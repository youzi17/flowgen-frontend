import { createRouter, createWebHistory } from 'vue-router'
import { defineAsyncComponent } from 'vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/workflows',
    },
    {
      path: '/login',
      name: 'login',
      component: defineAsyncComponent(() => import('@/views/LoginView.vue')),
      meta: { title: '登录', public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: defineAsyncComponent(() => import('@/views/RegisterView.vue')),
      meta: { title: '注册', public: true },
    },
    {
      path: '/workflows',
      name: 'workflows',
      component: defineAsyncComponent(() => import('@/views/WorkflowManager.vue')),
      meta: { title: '工作流管理' },
    },
    {
      path: '/workflow/:id?',
      name: 'workflow-editor',
      component: defineAsyncComponent(() => import('@/views/WorkflowEditor.vue')),
      meta: { title: '工作流编辑器' },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - FlowGen` : 'FlowGen - AI工作流可视化编排平台'

  // 非公开页面需要登录
  const token = localStorage.getItem('auth_token')
  if (!to.meta.public && !token) {
    next({ name: 'login' })
    return
  }

  // 已登录时访问登录/注册页，跳转到工作流列表
  if (to.meta.public && token) {
    next({ name: 'workflows' })
    return
  }

  next()
})

export default router
