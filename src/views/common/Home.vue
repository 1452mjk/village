<template>
  <div class="home-container">
    <!-- 加载状态 -->
    <div v-loading="loading" class="loading-wrapper" v-if="loading"></div>

    <template v-else>
      <!-- 欢迎横幅 -->
      <el-card class="welcome-card" shadow="never">
        <div class="welcome-content">
          <div>
            <h2>你好，{{ userStore.realName || roleText }}！</h2>
            <p class="welcome-desc">{{ welcomeMessage }}</p>
          </div>
          <div class="weather-time">
            <el-icon><Sunny /></el-icon>
            <span>{{ currentDate }} {{ currentWeekday }}</span>
          </div>
        </div>
      </el-card>

      <!-- 快捷入口卡片 -->
      <el-row :gutter="20" class="quick-actions">
        <el-col :xs="12" :sm="8" :md="6" v-for="action in quickActions" :key="action.path">
          <el-card class="action-card" :body-style="{ padding: '20px' }" shadow="hover" @click="goToPage(action.path)">
            <div class="action-content">
              <el-icon :size="32" :color="action.color"><component :is="action.icon" /></el-icon>
              <span class="action-title">{{ action.title }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 两栏信息区 -->
      <el-row :gutter="20" class="info-section">
        <!-- 左侧：最新通知 -->
        <el-col :xs="24" :md="12">
          <el-card class="info-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span><el-icon><Bell /></el-icon> 最新通知</span>
                <el-button type="primary" link @click="goToPage('/notice')">查看更多</el-button>
              </div>
            </template>
            <div v-if="notices.length === 0" class="empty-text">暂无通知</div>
            <div v-for="item in notices" :key="item.id" class="info-item" @click="goToNotice(item.id)">
              <el-badge :hidden="item.isTop !== 1" class="top-badge" value="置顶" type="danger" />
              <span class="info-title">{{ item.title }}</span>
              <span class="info-time">{{ formatDate(item.publishTime) }}</span>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：最新村务公开 -->
        <el-col :xs="24" :md="12">
          <el-card class="info-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span><el-icon><Document /></el-icon> 最新村务</span>
                <el-button type="primary" link @click="goToPage('/affair/list')">查看更多</el-button>
              </div>
            </template>
            <div v-if="affairs.length === 0" class="empty-text">暂无村务</div>
            <div v-for="item in affairs" :key="item.id" class="info-item" @click="goToAffair(item.id)">
              <span class="info-title">{{ item.title }}</span>
              <span class="info-time">{{ formatDate(item.publishTime) }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 农产品推荐（商户可见更多，村民可见热销） -->
      <el-card class="product-section" shadow="hover" v-if="products.length > 0">
        <template #header>
          <div class="card-header">
            <span><el-icon><Goods /></el-icon> 农产品推荐</span>
            <el-button type="primary" link @click="goToPage('/product/list')">查看更多</el-button>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="item in products" :key="item.id">
            <div class="product-item" @click="goToProduct(item.id)">
              <el-image :src="item.images?.[0]" fit="cover" class="product-image">
                <template #error>
                  <div class="image-error">暂无图片</div>
                </template>
              </el-image>
              <div class="product-info">
                <div class="product-name">{{ item.name }}</div>
                <div class="product-price">¥{{ item.price }} / {{ item.specifications || '斤' }}</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 商户专属：待抢单需求 -->
      <el-card class="demand-section" shadow="hover" v-if="isMerchant && pendingDemands.length > 0">
        <template #header>
          <div class="card-header">
            <span><el-icon><ChatDotRound /></el-icon> 待抢单需求</span>
            <el-button type="primary" link @click="goToPage('/service/demand/pending')">查看更多</el-button>
          </div>
        </template>
        <div v-for="item in pendingDemands" :key="item.id" class="demand-item" @click="goToDemand(item.id)">
          <span class="demand-title">{{ item.title }}</span>
          <span class="demand-price">¥{{ item.budget }}</span>
          <span class="demand-time">{{ formatDate(item.publishTime) }}</span>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getNoticePage } from '@/api/notice'
import { getAffairPage } from '@/api/affair'
import { getProductPage } from '@/api/product'
// 修正：从 service.ts 导入正确的函数
import { getPendingDemands } from '@/api/service'

const { Sunny, Bell, Document, Goods, ChatDotRound } = Icons

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)

// 数据
const notices = ref<any[]>([])
const affairs = ref<any[]>([])
const products = ref<any[]>([])
const pendingDemands = ref<any[]>([])

// 角色判断
const roleText = computed(() => {
  const map: Record<string, string> = {
    villager: '村民',
    village_official: '村干部',
    merchant: '商户',
    admin: '管理员'
  }
  return map[userStore.role || ''] || ''
})

const isMerchant = computed(() => userStore.role === 'merchant')

const welcomeMessage = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了，注意休息'
  if (hour < 12) return '早上好，开启美好的一天'
  if (hour < 18) return '下午好，忙碌之余别忘了喝杯茶'
  return '晚上好，放松一下'
})

// 日期时间
const currentDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`
})
const currentWeekday = computed(() => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[new Date().getDay()]
})

// 快捷入口（根据角色动态）
const quickActions = computed(() => {
  const actions = [
    { title: '通知公告', icon: 'Bell', path: '/notice', color: '#409eff' },
    { title: '村务公开', icon: 'Document', path: '/affair/list', color: '#67c23a' },
    { title: '农产品', icon: 'Goods', path: '/product/list', color: '#e6a23c' },
  ]
  if (userStore.isLoggedIn) {
    actions.push({ title: '个人中心', icon: 'User', path: '/profile', color: '#909399' })
    if (userStore.role === 'villager') {
      actions.push({ title: '发布需求', icon: 'Edit', path: '/service/demand/publish', color: '#f56c6c' })
    } else if (userStore.role === 'merchant') {
      actions.push({ title: '待抢单', icon: 'ChatDotRound', path: '/service/demand/pending', color: '#f56c6c' })
    }
  } else {
    actions.push({ title: '登录', icon: 'User', path: '/login', color: '#909399' })
  }
  return actions
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const promises = [
      getNoticePage({ page: 1, size: 5 }).then(res => notices.value = res.records || []),
      getAffairPage({ page: 1, size: 5 }).then(res => affairs.value = res.records || []),
      getProductPage({ page: 1, size: 6 }).then(res => products.value = res.records || []),
    ]
    if (isMerchant.value) {
      // 修正：使用 getPendingDemands，无需传递 status 参数
      promises.push(
        getPendingDemands({ page: 1, size: 5 }).then(res => pendingDemands.value = res.records || [])
      )
    }
    await Promise.all(promises)
  } catch (error) {
    console.error('首页数据加载失败', error)
    ElMessage.error('加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 导航
const goToPage = (path: string) => router.push(path)
const goToNotice = (id: number) => router.push(`/notice/detail/${id}`)
const goToAffair = (id: number) => router.push(`/affair/detail/${id}`)
const goToProduct = (id: number) => router.push(`/product/detail/${id}`)
const goToDemand = (id: number) => router.push(`/service/demand/detail/${id}`)

// 格式化日期（仅显示月-日）
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth()+1}-${d.getDate()}`
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
/* 样式保持不变，省略 */
</style>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.loading-wrapper {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.welcome-card {
  margin-bottom: 24px;
  background: linear-gradient(135deg, #f0f9eb 0%, #e2f0da 100%);
  border: none;
}
.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}
.welcome-content h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #1f4a3a;
}
.welcome-desc {
  margin: 0;
  color: #2e5c4b;
  font-size: 16px;
}
.weather-time {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2e5c4b;
  background: rgba(255,255,255,0.5);
  padding: 8px 16px;
  border-radius: 30px;
}
.quick-actions {
  margin-bottom: 24px;
}
.action-card {
  cursor: pointer;
  transition: transform 0.2s;
}
.action-card:hover {
  transform: translateY(-4px);
}
.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}
.action-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
.info-section {
  margin-bottom: 24px;
}
.info-card {
  height: 100%;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1f4a3a;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.info-item:hover {
  background-color: #f9f9f9;
}
.top-badge {
  margin-right: 8px;
}
.info-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2c3e50;
}
.info-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}
.empty-text {
  padding: 40px 0;
  text-align: center;
  color: #999;
}
.product-section {
  margin-bottom: 24px;
}
.product-item {
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;
}
.product-item:hover {
  transform: scale(1.02);
}
.product-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 8px;
}
.image-error {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
  border-radius: 8px;
}
.product-info {
  padding: 0 4px;
}
.product-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2c3e50;
}
.product-price {
  font-size: 16px;
  color: #f56c6c;
  font-weight: 600;
}
.demand-section {
  margin-bottom: 24px;
}
.demand-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.demand-item:hover {
  background-color: #f9f9f9;
}
.demand-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2c3e50;
}
.demand-price {
  color: #f56c6c;
  font-weight: 600;
  white-space: nowrap;
}
.demand-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}
</style>