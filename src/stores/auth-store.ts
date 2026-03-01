/**
 * Auth Store - 管理用户认证状态
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi, type UserInfo, type LoginDto, type RegisterDto } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  // 登录
  const login = async (dto: LoginDto) => {
    const result = await authApi.login(dto)
    token.value = result.token
    user.value = result.user
    localStorage.setItem('auth_token', result.token)
  }

  // 注册
  const register = async (dto: RegisterDto) => {
    const result = await authApi.register(dto)
    token.value = result.token
    user.value = result.user
    localStorage.setItem('auth_token', result.token)
  }

  // 获取当前用户信息（用于页面刷新后恢复状态）
  const fetchMe = async () => {
    if (!token.value) return
    try {
      user.value = await authApi.me()
    } catch {
      // token 失效，清除登录状态
      logout()
    }
  }

  // 登出
  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
  }

  return { token, user, isLoggedIn, login, register, fetchMe, logout }
})
