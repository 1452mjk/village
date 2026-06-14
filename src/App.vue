<template>
  <!-- 路由视图，添加过渡动画 -->
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
        <component :is="Component" :key="$route.fullPath" />
    </transition>
  </router-view>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { ElLoading } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const appStore = useAppStore()
const userStore = useUserStore()

// 全局 loading 控制（使用 Element Plus 服务方式）
let loadingInstance: ReturnType<typeof ElLoading.service> | null = null

watch(() => appStore.loading, (val) => {
  if (val) {
    loadingInstance = ElLoading.service({
      fullscreen: true,
      text: '加载中...',
      lock: true,
      background: 'rgba(0, 0, 0, 0.7)'
    })
  } else {
    loadingInstance?.close()
  }
})

// 初始化主题（从 localStorage 读取并设置 data-theme）
appStore.initTheme()

// 如果用户已登录，尝试获取用户信息（可选）
if (userStore.token) {
  userStore.fetchUserInfo().catch(() => {
    // 获取失败时不处理，后续请求会重新登录
  })
}
</script>

<style scoped>
/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>