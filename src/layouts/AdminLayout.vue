<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="appStore.sidebarCollapsed ? '64px' : '200px'" class="aside">
      <div class="logo" :class="{ collapsed: appStore.sidebarCollapsed }">
        <span v-if="!appStore.sidebarCollapsed">乡信·后台</span>
        <span v-else>乡</span>
      </div>

      <!-- 功能导航标题（非折叠时显示） -->
      <div v-if="!appStore.sidebarCollapsed" class="nav-title">
        <el-icon class="nav-icon"><Grid /></el-icon>
        <span>功能导航</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :collapse-transition="false"
        :unique-opened="true"
        :router="true"
        class="sidebar-menu"
        background-color="#2e5c4b"
        text-color="#e0f2e9"
        active-text-color="#ffd966"
      >
        <!-- 动态渲染菜单树 -->
        <template v-for="item in menuList" :key="item.path">
          <el-sub-menu v-if="item.children && item.children.length" :index="item.path">
            <template #title>
              <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.path"
              :index="child.path"
            >
              <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
              <span>{{ child.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="item.path">
            <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <!-- 右侧主区域 -->
    <el-container>
      <!-- 头部导航栏（简化版） -->
      <el-header class="header">
        <div class="header-left">
          <div class="platform-title">乡村便民信息综合服务平台</div>

          <el-icon class="collapse-btn" @click="appStore.toggleSidebar">
            <Fold v-if="!appStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>

          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentRouteTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">

        <!-- 老年人模式切换按钮 -->
          <el-tooltip :content="appStore.elderMode ? '正常模式' : '老年人模式'" placement="bottom">
            <el-button
              class="elder-mode-btn"
              :type="appStore.elderMode ? 'primary' : 'default'"
              :icon="ZoomIn"
              size="small"
              circle
              @click="appStore.toggleElderMode()"
            />
          </el-tooltip>
          

          <el-dropdown @command="handleCommand" class="user-dropdown">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.userInfo?.avatar" />
              <span class="username">{{ userStore.realName || roleDisplayName }}</span>
              <el-icon class="arrow-down"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
            
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view :key="$route.fullPath" v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

const { Fold, Expand, ArrowDown, Bell, Grid,ZoomIn} = Icons

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

// 当前激活菜单
const activeMenu = computed(() => route.path)

// 当前路由标题
const currentRouteTitle = computed(() => route.meta.title as string || '')

// 角色显示名称
const roleDisplayName = computed(() => {
  const map: Record<string, string> = {
    admin: '管理员',
    village_official: '村干部'
  }
  return map[userStore.role] || '管理员'
})

// ---------- 后台管理菜单定义 ----------
const adminMenus = [
  {
    path: '/admin/dashboard',
    title: '数据概览',
    icon: Icons.DataLine,
    roles: ['admin', 'village_official']
  },
  {
    path: '/admin/notice',
    title: '政策通知管理',
    icon: Icons.Bell,
    roles: ['admin', 'village_official'],
    children: [
      { path: '/admin/notice/list', title: '通知列表', icon: Icons.List, roles: ['admin', 'village_official'] },
      { path: '/admin/notice/publish', title: '发布通知', icon: Icons.Edit, roles: ['admin', 'village_official'] }
    ]
  },
  {
    path: '/admin/affair',
    title: '村务公开管理',
    icon: Icons.Document,
    roles: ['admin', 'village_official'],
    children: [
      { path: '/admin/affair/list', title: '村务列表', icon: Icons.List, roles: ['admin', 'village_official'] },
      { path: '/admin/affair/publish', title: '发布村务', icon: Icons.Edit, roles: ['admin', 'village_official'] },
      { path: '/admin/affair/feedback', title: '异议处理', icon: Icons.ChatDotRound, roles: ['admin', 'village_official'] },
       { path: '/admin/vote/list', title: '投票列表', icon: Icons.Pointer, roles: ['admin', 'village_official'] },
    { path: '/admin/vote/publish', title: '发起投票', icon: Icons.Edit, roles: ['admin', 'village_official'] } 
    ]
  },
  {
    path: '/admin/service',
    title: '生活便民服务管理',
    icon: Icons.Service,
    roles: ['admin', 'village_official'],
    children: [
      { path: '/admin/service/demand/list', title: '需求列表', icon: Icons.List, roles: ['admin', 'village_official'] },
      // { path: '/admin/service/demand/audit', title: '需求审核', icon: Icons.Edit, roles: ['admin', 'village_official'] }
    ]
  },
  {
    path: '/admin/product',
    title: '农产品对接管理',
    icon: Icons.Goods,
    roles: ['admin', 'village_official'],
    children: [
      { path: '/admin/product/list', title: '产品列表', icon: Icons.List, roles: ['admin', 'village_official'] },
      { path: '/admin/product/audit', title: '产品审核', icon: Icons.Check, roles: ['admin', 'village_official'] }
    ]
  },
  
  {
    path: '/admin/user',
    title: '用户管理',
    icon: Icons.User,
    roles: ['admin'],
    children: [
      { path: '/admin/user/list', title: '用户列表', icon: Icons.List, roles: ['admin'] },
      { path: '/admin/user/audit', title: '用户审核', icon: Icons.Edit, roles: ['admin'] }
    ]
  },
  
  
  {
    path: '/admin/profile',
    title: '个人中心',
    icon: Icons.UserFilled,
    roles: ['admin', 'village_official']
  },
]

// 递归过滤菜单
function filterMenus(menus: any[], role: string): any[] {
  return menus
    .filter(item => !item.roles || item.roles.includes(role))
    .map(item => {
      if (item.children) {
        const filteredChildren = filterMenus(item.children, role)
        return { ...item, children: filteredChildren }
      }
      return item
    })
    .filter(item => !item.children || item.children.length > 0)
}

// 计算当前角色可见菜单
const menuList = computed(() => {
  const role = userStore.role || 'village_official'
  return filterMenus(adminMenus, role)
})

// 头部下拉命令
const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/admin/profile')
      break
    case 'changePassword':
      router.push('/change-password')
      break
    case 'logout':
      ElMessageBox.confirm('确认退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        await userStore.logout()
        router.push('/login')
      })
      break
  }
}

onMounted(() => {
  appStore.initSidebar()
})
</script>

<style scoped>
/* 样式基本沿用原组件，仅微调 */

.layout-container {
  height: 100vh;
  width: 100%;
  background-color: #eaf7e1;
}

.aside {
  background-color: #2e5c4b;
  transition: width 0.3s;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #f5f5dc;
  background-color: #1f4a3a;
  white-space: nowrap;
  overflow: hidden;
  transition: all 0.3s;
}

.logo.collapsed {
  font-size: 20px;
}

.nav-title {
  height: 48px;
  line-height: 48px;
  padding-left: 16px;
  font-size: 14px;
  font-weight: 500;
  color: #d4e6d4;
  background-color: #2e5c4b;
  letter-spacing: 1px;
  border-bottom: 1px solid #1f4a3a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-icon {
  font-size: 18px;
}

.sidebar-menu {
  border-right: none;
}

:deep(.el-menu-item) {
  display: flex;
  align-items: center;
  height: 48px;
  line-height: 48px;
}

:deep(.el-menu-item:hover) {
  background-color: #3b6e5a !important;
}

:deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  color: #e0f2e9 !important;
  background-color: #2e5c4b !important;
}

:deep(.el-sub-menu__title:hover) {
  background-color: #3b6e5a !important;
}

.header {
  background-color: #ffffffcc;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #b8d9b0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  box-shadow: 0 2px 8px rgba(0, 40, 0, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.platform-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f4a3a;
  white-space: nowrap;
  letter-spacing: 0.5px;
  border-right: 1px solid #b8d9b0;
  padding-right: 20px;
  line-height: 30px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #2e5c4b;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.message-badge {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.message-icon {
  font-size: 22px;
  color: #2e5c4b;
}

.message-icon:hover {
  color: #1f4a3a;
}

.user-dropdown {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  background-color: #e2f0da;
  border-radius: 30px;
  border: 1px solid #a8cfaa;
  transition: all 0.2s;
}

.user-info:hover {
  background-color: #c9e0c0;
  border-color: #2e5c4b;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #1f4a3a;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow-down {
  font-size: 14px;
  color: #1f4a3a;
  margin-right: 4px;
}

.main {
  background-color: #f4fbf0;
  padding: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
/* 老年人模式全局样式 */
html.elder-mode {
  /* 基础字体放大 20% */
  font-size: 18px; /* 原浏览器默认通常为16px */
}

/* Element Plus 组件字体调整 */
.elder-mode .el-button,
.elder-mode .el-menu-item,
.elder-mode .el-sub-menu__title,
.elder-mode .el-table,
.elder-mode .el-input__inner,
.elder-mode .el-form-item__label,
.elder-mode .el-breadcrumb,
.elder-mode .el-card__header,
.elder-mode .el-card__body,
.elder-mode .el-dialog__body,
.elder-mode .el-message-box__content,
.elder-mode .el-dropdown-menu__item {
  font-size: 1.1rem;
}

/* 图标放大 */
.elder-mode .el-icon {
  font-size: 1.2em;
  width: 1.2em;
  height: 1.2em;
}

/* 标题适当放大 */
.elder-mode h1,
.elder-mode h2,
.elder-mode h3,
.elder-mode .page-header h2 {
  font-size: 1.5em;
}

/* 表格内容行高调整 */
.elder-mode .el-table .cell {
  line-height: 1.8;
}

/* 按钮内文字保持适当比例 */
.elder-mode .el-button {
  padding: 0.8em 1.2em;
}
</style>