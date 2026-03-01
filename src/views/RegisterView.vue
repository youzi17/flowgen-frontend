<template>
  <div class="auth-page">
    <div class="bg-orb bg-orb-1" />
    <div class="bg-orb bg-orb-2" />

    <div class="auth-card">
      <div class="auth-logo">
        <div class="logo-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#6366f1" />
            <path d="M7 14h4l3-6 3 12 3-6h4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <span class="logo-text">FlowGen</span>
      </div>

      <h1 class="auth-title">创建账号</h1>
      <p class="auth-subtitle">开始构建你的 AI 工作流</p>

      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">昵称</label>
          <input
            v-model="form.displayName"
            type="text"
            class="form-input"
            placeholder="你的名字"
            autocomplete="name"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input
            v-model="form.email"
            type="email"
            class="form-input"
            placeholder="your@email.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="至少 8 位"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner" />
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>

      <p class="auth-footer">
        已有账号？
        <router-link to="/login" class="auth-link">立即登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ email: '', password: '', displayName: '' })
const loading = ref(false)
const errorMsg = ref('')

const handleRegister = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    await auth.register(form.value)
    router.push('/workflows')
  } catch (e) {
    errorMsg.value = (e as Error).message || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 复用登录页样式 */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9ff;
  position: relative;
  overflow: hidden;
}
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  pointer-events: none;
}
.bg-orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #c7d2fe, #e0e7ff);
  top: -150px;
  right: -100px;
}
.bg-orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #ddd6fe, #ede9fe);
  bottom: -100px;
  left: -80px;
}
.auth-card {
  position: relative;
  z-index: 1;
  width: 420px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
}
.auth-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
}
.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #1e1b4b;
  letter-spacing: -0.3px;
}
.auth-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}
.auth-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 28px;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}
.form-input {
  height: 42px;
  padding: 0 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.form-input::placeholder {
  color: #9ca3af;
}
.error-msg {
  font-size: 13px;
  color: #ef4444;
  margin: 0;
  padding: 10px 12px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}
.btn-primary {
  height: 44px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s, transform 0.1s;
  margin-top: 4px;
}
.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:active:not(:disabled) { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.auth-footer {
  margin: 20px 0 0;
  text-align: center;
  font-size: 14px;
  color: #6b7280;
}
.auth-link {
  color: #6366f1;
  font-weight: 500;
  text-decoration: none;
}
.auth-link:hover { text-decoration: underline; }
</style>
