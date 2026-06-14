// stores/app.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 全局加载状态（用于页面加载、按钮加载等）
  const loading = ref<boolean>(false)

  // 侧边栏折叠状态（用于后台管理布局）
  const sidebarCollapsed = ref<boolean>(false)

  // 当前主题模式：light / dark
  const theme = ref<'light' | 'dark'>('light')

  // 老年人模式状态
  const elderMode = ref<boolean>(false)

  // 全局的 loading 计数，支持多个异步操作同时控制 loading
  const loadingCount = ref<number>(0)

  // 显示 loading
  const showLoading = () => {
    loadingCount.value++
    loading.value = true
  }

  // 隐藏 loading（当所有请求完成后才隐藏）
  const hideLoading = () => {
    if (loadingCount.value > 0) {
      loadingCount.value--
    }
    if (loadingCount.value === 0) {
      loading.value = false
    }
  }

  // 重置 loading 状态（强制隐藏）
  const resetLoading = () => {
    loadingCount.value = 0
    loading.value = false
  }

  // 切换侧边栏折叠
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
  }

  // 初始化侧边栏状态（从 localStorage 读取）
  const initSidebar = () => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      sidebarCollapsed.value = saved === 'true'
    }
    // 初始化老年人模式
    const elderSaved = localStorage.getItem('elderMode')
    if (elderSaved !== null) {
      elderMode.value = elderSaved === 'true'
    }
  }

  // 切换主题
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme.value)
    localStorage.setItem('theme', theme.value)
  }

  // 初始化主题
  const initTheme = () => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved) {
      theme.value = saved
    }
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  // 切换老年人模式
  const toggleElderMode = () => {
    elderMode.value = !elderMode.value
    localStorage.setItem('elderMode', String(elderMode.value))
  }

  // 监听老年人模式变化，自动为 html 添加/移除 class
  watch(elderMode, (val) => {
    if (val) {
      document.documentElement.classList.add('elder-mode')
    } else {
      document.documentElement.classList.remove('elder-mode')
    }
  }, { immediate: true })

  return {
    loading,
    sidebarCollapsed,
    theme,
    elderMode,
    showLoading,
    hideLoading,
    resetLoading,
    toggleSidebar,
    initSidebar,
    toggleTheme,
    initTheme,
    toggleElderMode,
  }
})