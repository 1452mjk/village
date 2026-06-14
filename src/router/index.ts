import { createRouter, createWebHistory  } from 'vue-router'
import { baseRoutes } from './baseRoutes'
import { adminRoutes } from './adminRoutes'
import { webRoutes } from './webRoutes'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

import type { RouteRecordNormalized } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: baseRoutes
})

let dynamicRoutesAdded = false

router.beforeEach(async (to, from, next) => {
  console.log('【守卫】进入', to.path, 'matched:', to.matched.map(r => r.path), '动态已添加?', dynamicRoutesAdded)
  const userStore = useUserStore()

  // 确保用户信息已加载
  if (!userStore.hasLoaded) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      console.error('fetchUserInfo 失败', error)
      // 加载失败（如 token 过期），清理并跳转登录
      userStore.clearAuth()
      return // 停止当前导航，因为 clearAuth 已经触发跳转
    }
  }

  const isLoggedIn = userStore.isLoggedIn
  const role = userStore.role

 // 动态添加路由（只执行一次）
 if (!dynamicRoutesAdded) {
  console.log('即将添加路由，当前登录状态:', isLoggedIn, '角色:', role)
  router.addRoute(webRoutes)
  if (isLoggedIn && (role === 'admin' || role === 'village_official')) {
    router.addRoute(adminRoutes)
  }
  console.log('添加后路由表:', router.getRoutes().map(r => r.path))
  dynamicRoutesAdded = true

    // 验证解析
    const resolved = router.resolve(to.fullPath)
    console.log('解析结果:', resolved.matched.map((r: RouteRecordNormalized) => r.path))

    // 重新发起导航（使用 replace 避免历史记录问题）
    return next(to.path)

     console.log('第二次守卫 matched 详情:', to.matched.map(r => ({
    path: r.path,
    name: r.name,
    componentName: r.components?.default?.name // 获取默认组件的 name
  })))

  // return next(to.fullPath)
}

  // 检查路由是否存在
 if (to.matched.length === 0) {
    console.warn('未匹配到路由，跳转404', to.path)
    next('/404')
    return
  }
  // 检查是否需要登录
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  if (requiresAuth && !isLoggedIn) {
    ElMessage.warning('请先登录')
    next('/login')
    return
  }

  // 检查角色权限
  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles) {
    if (!isLoggedIn || !role) {
      next('/login')
      return
    }
    if (!requiredRoles.includes(role)) {
      next('/403')
      return
    }
  }

  next()
})

export function resetDynamicRoutes() {
  if (router.hasRoute('Admin')) {
    router.removeRoute('Admin')
  }
  if (router.hasRoute('Web')) {
    router.removeRoute('Web')
  }
  dynamicRoutesAdded = false
}

export default router