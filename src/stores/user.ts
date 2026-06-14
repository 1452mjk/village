import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginRequest, UserRole } from '@/types'
import { login as loginApi, logout as logoutApi, getUserInfo } from '@/api/auth'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { resetDynamicRoutes } from '@/router'
import axios from 'axios'

export const useUserStore = defineStore('user', () => {
  // state
  const token = ref<string | null>(sessionStorage.getItem('token'))
  const role = ref<UserRole | null>(sessionStorage.getItem('role') as UserRole | null)
  const realName = ref<string | null>(sessionStorage.getItem('realName'))
  const userInfo = ref<User | null>(null)
  const hasLoaded = ref<boolean>(false)

  // 初始化：如果已有 token，设置 axios 默认头
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  // getters
  const isLoggedIn = computed(() => !!token.value)
  const isVillager = computed(() => role.value === 'villager')
  const isVillageOfficial = computed(() => role.value === 'village_official')
  const isMerchant = computed(() => role.value === 'merchant')
  const isAdmin = computed(() => role.value === 'admin')

  // 新增：获取当前用户ID（从 userInfo 中提取）
  const userId = computed(() => userInfo.value?.id)

  // 登录
  const login = async (loginData: LoginRequest) => {
    try {
      const res = await loginApi(loginData)
      token.value = res.token
      const lowerRole = res.role.toLowerCase() as UserRole
      role.value = lowerRole
      realName.value = res.realName

      sessionStorage.setItem('token', res.token)
      sessionStorage.setItem('role', lowerRole)
      sessionStorage.setItem('realName', res.realName)

      // 设置 axios 默认头
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.token}`

      resetDynamicRoutes()
      await fetchUserInfo()
      hasLoaded.value = true
    } catch (error) {
      throw error
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      await logoutApi()
    } catch (error) {
      console.warn('登出接口调用失败', error)
    } finally {
      clearAuth()
    }
  }

  // 清除认证信息
  const clearAuth = () => {
    token.value = null
    role.value = null
    realName.value = null
    userInfo.value = null
    hasLoaded.value = false

    sessionStorage.removeItem('token')
    sessionStorage.removeItem('role')
    sessionStorage.removeItem('realName')

    delete axios.defaults.headers.common['Authorization']

    resetDynamicRoutes()
    router.replace('/login')
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    if (!token.value) {
      hasLoaded.value = true
      return
    }
    try {
      const res = await getUserInfo()
      userInfo.value = res
      hasLoaded.value = true
    } catch (error: any) {
      console.error('获取用户信息失败', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        token.value = null
        role.value = null
        userInfo.value = null
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('role')
        sessionStorage.removeItem('realName')
        delete axios.defaults.headers.common['Authorization']
      }
      hasLoaded.value = true
      throw error
    }
  }

  const setUserInfo = (info: User) => {
    userInfo.value = info
  }

  const setToken = (newToken: string) => {
    token.value = newToken
    sessionStorage.setItem('token', newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  return {
    token,
    role,
    realName,
    userInfo,
    hasLoaded,
    isLoggedIn,
    isVillager,
    isVillageOfficial,
    isMerchant,
    isAdmin,
    userId,  // 新增导出
    login,
    logout,
    clearAuth,
    fetchUserInfo,
    setUserInfo,
    setToken,
  }
})