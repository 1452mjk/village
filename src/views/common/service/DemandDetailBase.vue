<!-- common/DemandDetailBase.vue -->
<template>
  <div class="demand-detail">
    <div class="back">
      <el-button type="primary" link @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
    </div>

    <el-skeleton :loading="loading" animated :rows="10" v-if="loading" />

    <el-card v-else shadow="never">
      <template #header>
        <div class="detail-header">
          <h2>需求详情</h2>
          <el-tag :type="statusTag" size="large">
            {{ statusText }}
          </el-tag>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="服务类型">{{ demand?.serviceType }}</el-descriptions-item>
        <el-descriptions-item label="预算">
          {{ demand?.budget ? '¥' + demand.budget : '面议' }}
        </el-descriptions-item>
        <el-descriptions-item label="联系人">{{ demand?.user?.realName || '匿名' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ demand?.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="联系地址" :span="2">{{ demand?.address }}</el-descriptions-item>
        <el-descriptions-item label="发布时间" :span="2">{{ demand?.createTime }}</el-descriptions-item>
      </el-descriptions>

      <div class="description-section">
        <h3>需求描述</h3>
        <p>{{ demand?.description }}</p>
      </div>

      <!-- 订单信息（如果有订单） -->
      <div v-if="order" class="order-section">
        <el-divider />
        <h3>订单信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="接单商户">{{ order.merchant?.realName || '商户' }}</el-descriptions-item>
          <el-descriptions-item label="接单时间">{{ order.createTime }}</el-descriptions-item>
          <el-descriptions-item label="订单状态" :span="2">
            <el-tag :type="orderStatusTag">{{ orderStatusText }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="order.serviceProof?.length" label="服务凭证" :span="2">
            <div v-for="(url, idx) in order.serviceProof" :key="idx" class="proof-item">
              <el-image
                :src="url"
                :preview-src-list="order.serviceProof"
                style="width: 100px; height: 100px"
                @error="handleImageError"
              />
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="order.evaluation" label="评价" :span="2">
            <el-rate v-model="order.evaluationScore" disabled show-score text-color="#ff9900" />
            <p>{{ order.evaluation }}</p>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 插槽：用于父组件放置操作按钮 -->
      <div class="action-buttons">
        <slot name="actions" :demand="demand" :order="order" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getDemandDetail, getOrderByDemandId } from '@/api/service'
import type { ServiceDemand, ServiceOrder } from '@/types'

const props = defineProps<{
  id: number | string
}>()

const router = useRouter()

const loading = ref(true)
const demand = ref<ServiceDemand | null>(null)
const order = ref<ServiceOrder | null>(null)

// 状态映射常量（使用对象代替 if 分支）
const statusMap: Record<number, { text: string; tag: string }> = {
  0: { text: '待抢单', tag: 'info' },
  1: { text: '已接单', tag: 'warning' },
  2: { text: '服务中', tag: 'primary' },
  3: { text: '待评价', tag: 'success' },
  4: { text: '已完成', tag: 'success' },
  5: { text: '已取消', tag: '' },
}

const orderStatusMap: Record<number, { text: string; tag: string }> = {
  1: { text: '已接单', tag: 'warning' },
  2: { text: '服务中', tag: 'primary' },
  3: { text: '待评价', tag: 'success' },
  4: { text: '已完成', tag: 'success' },
  5: { text: '已取消', tag: '' },
}

const statusText = computed(() => {
  const status = demand.value?.status ?? 0
  return statusMap[status]?.text || '未知'
})
const statusTag = computed(() => {
  const status = demand.value?.status ?? 0
  return statusMap[status]?.tag || ''
})
const orderStatusText = computed(() => {
  if (!order.value) return ''
  return orderStatusMap[order.value.status]?.text || '未知'
})
const orderStatusTag = computed(() => {
  if (!order.value) return ''
  return orderStatusMap[order.value.status]?.tag || ''
})

const fetchDetail = async () => {
  const idNum = Number(props.id)
  if (isNaN(idNum) || idNum <= 0) {
    ElMessage.error('无效的需求ID')
    loading.value = false
    return
  }

  loading.value = true
  try {
    // 获取需求详情
    const demandRes = await getDemandDetail(idNum)
    demand.value = demandRes

    // 尝试获取订单信息（可能不存在）
    try {
      const orderRes = await getOrderByDemandId(idNum)
      order.value = orderRes
      // 如果订单存在，将需求状态同步为订单状态
      if (orderRes) {
        demand.value.status = orderRes.status
      }
    } catch {
      order.value = null
    }
  } catch (error) {
    console.error('获取详情失败', error)
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

// 图片加载失败时的处理
const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = 'https://via.placeholder.com/100x100?text=加载失败'
}

defineExpose({ fetchDetail, demand, order })

onMounted(fetchDetail)
</script>

<style scoped>
/* 样式保持不变 */
.demand-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.back {
  margin-bottom: 20px;
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.description-section {
  margin-top: 30px;
}
.order-section {
  margin-top: 30px;
}
.action-buttons {
  margin-top: 30px;
  text-align: center;
}
.proof-item {
  display: inline-block;
  margin-right: 10px;
}
</style>