import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import 'element-plus/dist/index.css'
// 导入Vue Flow样式
import './styles/element-theme.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { initializeCore } from './core'
import { initializeStores } from './stores'

// 初始化Core模块
initializeCore()

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 初始化stores
async function initApp() {
  try {
    await initializeStores()
    app.mount('#app')
  } catch (error) {
    console.error('应用初始化失败:', error)
    app.mount('#app') // 即使初始化失败也挂载应用
  }
}

initApp()
