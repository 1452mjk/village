<template>
  <el-container class="web-layout">
    <!-- 顶部导航栏 -->
    <el-header class="web-header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-text">乡信·乡村便民</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          :router="true"
          class="nav-menu"
          background-color="transparent"
          text-color="#2e5c4b"
          active-text-color="#1f4a3a"
        >
          <template v-for="item in menuItems" :key="item.path">
            <el-sub-menu v-if="item.children && item.children.length" :index="item.path">
              <template #title>
                <span>{{ item.title }}</span>
              </template>
              <el-menu-item
                v-for="child in item.children"
                :key="child.path"
                :index="child.path"
              >
                {{ child.title }}
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="item.path">
              {{ item.title }}
            </el-menu-item>
          </template>
        </el-menu>
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

        <template v-if="!userStore.isLoggedIn">
          <el-button type="primary" size="small" @click="goToLogin">登录</el-button>
          <el-button size="small" @click="goToRegister">注册</el-button>
        </template>
        <template v-else>
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
        </template>
      </div>
    </el-header>

    <!-- 主内容区 -->
    <el-main class="web-main">
      <router-view :key="$route.fullPath" v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'  // 导入 appStore

const { ArrowDown, Bell, ZoomIn } = Icons  

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()  // 实例化 appStore

// 当前激活菜单（用于高亮）
const activeMenu = computed(() => route.path)

// 角色显示名称
const roleDisplayName = computed(() => {
  const map: Record<string, string> = {
    villager: '村民',
    merchant: '商户'
  }
  return map[userStore.role] || '村民'
})

// 跳转登录/注册
const goToLogin = () => router.push('/login')
const goToRegister = () => router.push('/register')

// 下拉命令处理
const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'logout':
      ElMessageBox.confirm('确认退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        await userStore.logout()
        router.push('/')
      })
      break
  }
}

// 定义菜单项类型
interface MenuItem {
  path: string
  title: string
  children?: MenuItem[]
}

// 村民菜单配置
const villagerMenus: MenuItem[] = [
  { path: '/', title: '首页' },
  { path: '/notice', title: '政策通知' },
  {
     path: '/affair',
    title: '村务公开',
    children: [
      { path: '/affair/list', title: '村务列表' },
      { path: '/vote/list', title: '投票列表' }
    ]
  },
  {
    path: '/service',
    title: '生活便民',
    children: [
      { path: '/service/demand/publish', title: '发布需求' },
      { path: '/service/demand/my', title: '我的需求' }
    ]
  },
  {
    path: '/product',
    title: '农产品对接',
    children: [
      { path: '/product/list', title: '农产品列表' },
      { path: '/product/publish', title: '发布产品' }
    ]
  }
]

// 商户菜单配置（在村民基础上增加待抢单需求）
const merchantMenus: MenuItem[] = [
  { path: '/', title: '首页' },
  { path: '/notice', title: '政策通知' },
  {
     path: '/affair',
    title: '村务公开',
    children: [
      { path: '/affair/list', title: '村务列表' },
      { path: '/vote/list', title: '投票列表' }
    ]
  },
  {
    path: '/service',
    title: '生活便民',
    children: [
      { path: '/service/demand/publish', title: '发布需求' },
      { path: '/service/demand/my', title: '我的需求' },
      { path: '/service/demand/pending', title: '待抢单需求' }
    ]
  },
  {
    path: '/product',
    title: '农产品对接',
    children: [
      { path: '/product/list', title: '农产品列表' },
      { path: '/product/publish', title: '发布产品' }
    ]
  }
]

// 根据登录状态和角色动态返回菜单
const menuItems = computed(() => {
  if (!userStore.isLoggedIn) {
    // 未登录仅显示公共菜单
    return [
      { path: '/', title: '首页' },
      { path: '/notice', title: '政策通知' }
    ]
  }
  if (userStore.role === 'villager') {
    return villagerMenus
  } else if (userStore.role === 'merchant') {
    return merchantMenus
  }
  // 其他角色（如 admin）暂时返回空菜单，可根据需要调整
  return []
})

onMounted(() => {
  console.log('WebLayout 已挂载')
})
</script>

<style scoped>
.web-layout {
  height: 100vh;
  width: 100%;
  background-color: #f9fff9;
}

.web-header {
  background-color: #ffffff;
  border-bottom: 2px solid #b8d9b0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  height: 70px;
  box-shadow: 0 2px 8px rgba(0, 40, 0, 0.05);
}


.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
}


.header-left {
  flex: 1; /* 让左侧区域占据剩余空间 */
  min-width: 0; /* 防止 flex 溢出 */
}

.logo {
  font-size: 22px;
  font-weight: bold;
  color: #1f4a3a;
  letter-spacing: 1px;
  white-space: nowrap;
}


.nav-menu {
  border-bottom: none !important;
  background: transparent !important;
}

.nav-menu {
  width: 100%; /* 菜单宽度占满左侧 */
}

:deep(.el-menu-item) {
  font-size: 16px;
  font-weight: 500;
  padding: 0 20px;
  height: 70px;
  line-height: 70px;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

:deep(.el-menu-item.is-active) {
  border-bottom-color: #2e5c4b !important;
  color: #1f4a3a !important;
  font-weight: 600;
}

:deep(.el-menu-item:hover) {
  background-color: #e2f0da !important;
  border-bottom-color: #7cb87b !important;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
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

.web-main {
  background-color: #f4fbf0;
  padding: 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.elder-mode-btn {
  margin-right: 8px;
  transition: all 0.3s;
}
.elder-mode-btn:hover {
  transform: scale(1.1);
}
</style>

<!-- 老年人模式全局样式（确保生效） -->
<style>
html.elder-mode {
  font-size: 18px;
}

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

.elder-mode .el-icon {
  font-size: 1.2em;
  width: 1.2em;
  height: 1.2em;
}

.elder-mode h1,
.elder-mode h2,
.elder-mode h3,
.elder-mode .page-header h2 {
  font-size: 1.5em;
}

.elder-mode .el-table .cell {
  line-height: 1.8;
}

.elder-mode .el-button {
  padding: 0.8em 1.2em;
}
</style>