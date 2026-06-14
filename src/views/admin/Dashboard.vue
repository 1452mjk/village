<template>
  <div class="dashboard-container">
    <!-- 欢迎语 -->
    <div class="welcome-section">
      <h2>欢迎回来，{{ userStore.realName || roleDisplayName }}</h2>
      <p>这是您今天的乡村管理数据概览</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="24" :sm="12" :md="6" v-for="card in statCards" :key="card.title">
        <el-card class="stat-card" :body-style="{ padding: '20px' }" shadow="hover">
          <div class="card-content">
            <div class="card-icon" :style="{ backgroundColor: card.bgColor }">
              <el-icon :size="24" :color="card.iconColor"><component :is="card.icon" /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ card.value }}</div>
              <div class="card-title">{{ card.title }}</div>
              <div class="card-trend" v-if="card.trend !== undefined">
                <span :class="card.trend > 0 ? 'up' : 'down'">
                  {{ card.trend > 0 ? '+' : '' }}{{ card.trend }}%
                </span>
                较昨日
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表和待办区域 -->
    <el-row :gutter="20" class="chart-todo-row">
      
      <el-col :xs="24" :lg="8">
        <el-card class="todo-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
              <el-button type="primary" link @click="goToAllTasks">查看全部</el-button>
            </div>
          </template>
          <div class="todo-list">
            <div v-for="item in todoList" :key="item.id" class="todo-item" @click="goToPage(item.route)">
              <el-badge :value="item.count" :hidden="item.count === 0" class="todo-badge">
                <el-icon :size="20"><component :is="item.icon" /></el-icon>
              </el-badge>
              <span class="todo-title">{{ item.title }}</span>
              <el-tag v-if="item.count > 0" size="small" :type="item.tagType">{{ item.count }}条</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近活动和快速入口 -->
    <el-row :gutter="20" class="recent-row">
      <el-col :xs="24" :lg="12">
        <el-card class="recent-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近发布的通知</span>
              <el-button type="primary" link @click="goToNoticeList">更多</el-button>
            </div>
          </template>
          <el-table :data="recentNotices" style="width: 100%" :show-header="false">
            <el-table-column prop="title" />
            <el-table-column prop="publishTime" width="120" align="right" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card class="recent-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>待审核列表</span>
            </div>
          </template>
          <div class="audit-list">
            <div v-for="item in auditItems" :key="item.name" class="audit-item" @click="goToPage(item.route)">
              <span>{{ item.name }}</span>
              <el-badge :value="item.count" :max="99" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

// 导入 API
import { getUserPage } from '@/api/user'          // 仅管理员可用
import { getNoticePage } from '@/api/notice'      // 村干部可用（需后端支持）
import { getProductPage } from '@/api/product'    // 仅管理员可用
import { getFeedbackList } from '@/api/affair'    // 村干部可用（需后端支持）

const { User, Notification, ChatDotRound, Goods, Edit, Document, Bell, UserFilled } = Icons

const router = useRouter()
const userStore = useUserStore()

// 角色显示名称
const roleDisplayName = computed(() => {
  const map: Record<string, string> = {
    admin: '管理员',
    village_official: '村干部',
  }
  return map[userStore.role] || '管理员'
})

// 统计数据（响应式对象，便于动态更新）
const stats = ref({
  totalUsers: 0,
  pendingUsers: 0,
  pendingFeedbacks: 0,
  publishedNotices: 0,
  pendingProducts: 0,
})

// 最近通知（实时数据）
const recentNotices = ref<{ title: string; publishTime: string }[]>([])

// 加载状态
const loading = ref(false)

// 根据角色过滤卡片
const statCards = computed(() => {
  const cards = [
    // 管理员可见卡片
    ...(userStore.isAdmin ? [
      {
        title: '总用户数',
        value: stats.value.totalUsers,
        icon: 'User',
        bgColor: '#ecf5ff',
        iconColor: '#409eff',
      },
      {
        title: '待审核用户',
        value: stats.value.pendingUsers,
        icon: 'UserFilled',
        bgColor: '#fdf6ec',
        iconColor: '#e6a23c',
      },
    ] : []),
    // 管理员和村干部都可见
    {
      title: '待处理反馈',
      value: stats.value.pendingFeedbacks,
      icon: 'ChatDotRound',
      bgColor: '#f0f9eb',
      iconColor: '#67c23a',
    },
    {
      title: '已发布通知',
      value: stats.value.publishedNotices,
      icon: 'Bell',
      bgColor: '#fef0f0',
      iconColor: '#f56c6c',
    },
    // 管理员可见产品相关（如有需要可添加）
    ...(userStore.isAdmin ? [
      {
        title: '待审核产品',
        value: stats.value.pendingProducts,
        icon: 'Goods',
        bgColor: '#e6f7ff',
        iconColor: '#1890ff',
      }
    ] : []),
  ]
  return cards
})

// 待办事项（根据角色）
const todoList = computed(() => {
  const todos = []
  if (userStore.isAdmin) {
    todos.push(
      { id: 1, title: '待审核用户', count: stats.value.pendingUsers, icon: 'UserFilled', route: '/admin/user/audit', tagType: 'warning' },
      { id: 2, title: '待审核产品', count: stats.value.pendingProducts, icon: 'Goods', route: '/admin/product/audit', tagType: 'warning' }
    )
  }
  // 村干部可添加反馈待办（如果需要）
  // if (userStore.isVillageOfficial) {
  //   todos.push({ id: 3, title: '待处理反馈', count: stats.value.pendingFeedbacks, icon: 'ChatDotRound', route: '/admin/feedback/list', tagType: 'warning' })
  // }
  return todos
})

// 待审核项（根据角色）
const auditItems = computed(() => {
  const items = []
  if (userStore.isAdmin) {
    items.push(
      { name: '待审核用户', count: stats.value.pendingUsers, route: '/admin/user/audit' },
      { name: '待审核产品', count: stats.value.pendingProducts, route: '/admin/product/audit' }
    )
  }
  // 如果需要展示反馈待审核，可添加
  // if (userStore.isVillageOfficial) {
  //   items.push({ name: '待处理反馈', count: stats.value.pendingFeedbacks, route: '/admin/feedback/list' })
  // }
  return items
})

// 获取统计数据
const fetchStats = async () => {
  loading.value = true
  try {
    // 初始化统计值
    stats.value = {
      totalUsers: 0,
      pendingUsers: 0,
      pendingFeedbacks: 0,
      publishedNotices: 0,
      pendingProducts: 0,
    }

    // 根据角色并发调用有权限的接口
    const promises = []

    // 管理员专属接口
    if (userStore.isAdmin) {
      promises.push(
        getUserPage({ page: 1, size: 1 }).then(res => {
          stats.value.totalUsers = res.total || 0
        }).catch(() => {})
      )
      promises.push(
        getUserPage({ page: 1, size: 1, status: 0 }).then(res => {
          stats.value.pendingUsers = res.total || 0
        }).catch(() => {})
      )
      promises.push(
        getProductPage({ page: 1, size: 1, status: 0 }).then(res => {
          stats.value.pendingProducts = res.total || 0
        }).catch(() => {})
      )
    }

    // 村干部和管理员都可见的接口
    promises.push(
      getFeedbackList({ page: 1, size: 1, status: 0 }).then(res => {
        stats.value.pendingFeedbacks = res.total || 0
      }).catch(() => {})
    )
    promises.push(
      getNoticePage({ page: 1, size: 1, status: 1 }).then(res => {
        stats.value.publishedNotices = res.total || 0
      }).catch(() => {})
    )

    // 最近发布的通知（村干部和管理员都可见）
    promises.push(
      getNoticePage({ page: 1, size: 5, sort: 'publishTime,desc' }).then(res => {
        recentNotices.value = (res.records || []).map((item: any) => ({
          title: item.title,
          publishTime: item.publishTime || item.createTime,
        }))
      }).catch(() => {})
    )

    await Promise.all(promises)
  } catch (error) {
    console.error('获取仪表盘数据失败', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

// 跳转到查看全部待办（管理员跳转到用户审核，村干部可跳转到反馈列表）
const goToAllTasks = () => {
  if (userStore.isAdmin) {
    router.push('/admin/user/audit')
  } else {
    router.push('/admin/feedback/list') // 假设反馈列表路由
  }
}

// 跳转到对应页面
const goToPage = (path: string) => {
  router.push(path)
}

// 跳转到通知列表
const goToNoticeList = () => {
  router.push('/admin/notice/list')
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
/* 样式保持不变，仅列出关键部分 */
.dashboard-container {
  padding: 20px;
}
.welcome-section {
  margin-bottom: 30px;
}
.stat-cards {
  margin-bottom: 30px;
}
.stat-card .card-content {
  display: flex;
  align-items: center;
}
.stat-card .card-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}
.stat-card .card-info {
  flex: 1;
}
.stat-card .card-value {
  font-size: 28px;
  font-weight: bold;
  line-height: 1.2;
}
.stat-card .card-title {
  color: #909399;
  font-size: 14px;
}
.stat-card .card-trend {
  font-size: 12px;
  margin-top: 4px;
}
.stat-card .card-trend .up {
  color: #67c23a;
}
.stat-card .card-trend .down {
  color: #f56c6c;
}
.chart-todo-row,
.recent-row {
  margin-bottom: 30px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.todo-list {
  /* 样式 */
}
.todo-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.todo-item:last-child {
  border-bottom: none;
}
.todo-badge {
  margin-right: 12px;
}
.todo-title {
  flex: 1;
}
.audit-list {
  /* 样式 */
}
.audit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.audit-item:last-child {
  border-bottom: none;
}
</style>