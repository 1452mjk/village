<template>
  <div class="product-detail">
    <div class="back">
      <el-button type="primary" link @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
    </div>

    <el-skeleton :loading="loading" animated :rows="10" v-if="loading" />

    <el-card v-else shadow="never">
      <el-row :gutter="20">
        <!-- 图片轮播 -->
        <el-col :span="12">
          <el-carousel height="400px" indicator-position="outside" v-if="detail.images && detail.images.length > 0">
            <el-carousel-item v-for="(url, idx) in detail.images" :key="idx">
              <el-image
                :src="url"
                fit="contain"
                style="width: 100%; height: 100%;"
                @error="handleImageError($event, idx)"
              />
            </el-carousel-item>
          </el-carousel>
          <div v-else class="no-image">暂无图片</div>
        </el-col>

        <!-- 基本信息 -->
        <el-col :span="12">
          <h1>{{ detail.name }}</h1>
          <div class="info-row">
            <span class="label">类型：</span><span>{{ detail.type }}</span>
          </div>
          <div class="info-row">
            <span class="label">产地：</span><span>{{ detail.origin }}</span>
          </div>
          <div class="info-row">
            <span class="label">规格：</span><span>{{ detail.specifications || '无' }}</span>
          </div>
          <div class="info-row">
            <span class="label">价格：</span><span class="price">¥{{ detail.price }} / {{ detail.specifications || '斤' }}</span>
          </div>
          <div class="info-row">
            <span class="label">总产量：</span><span>{{ detail.totalOutput || '未提供' }} 斤</span>
          </div>
          <div class="info-row">
            <span class="label">交易模式：</span><el-tag :type="detail.tradeMode === 'wholesale' ? 'warning' : 'success'">
              {{ detail.tradeMode === 'wholesale' ? '批发' : '零售' }}
            </el-tag>
          </div>
          <div class="info-row">
            <span class="label">发布时间：</span><span>{{ detail.createTime }}</span>
          </div>
          <div class="info-row">
            <span class="label">浏览次数：</span><span>{{ detail.viewCount }}</span>
          </div>

          <!-- 联系方式 -->
          <div class="contact-section">
            <h3>联系方式</h3>
            <div class="contact-phone">
              <el-icon><Phone /></el-icon>
              <span>{{ detail.contactPhone }}</span>
            </div>
          </div>

          <!-- 审核状态（仅发布者或管理员可见） -->
          <div v-if="userStore.isAdmin || (userStore.userInfo?.id === detail.farmerId)" class="audit-status">
            <el-tag :type="getStatusTag(detail.status)" size="large">
              状态：{{ getStatusText(detail.status) }}
            </el-tag>
            <span v-if="detail.auditRemark" class="audit-remark">审核备注：{{ detail.auditRemark }}</span>
          </div>
        </el-col>
      </el-row>

      <!-- 详细描述 -->
      <el-divider />
      <h3>产品描述</h3>
      <div class="description" v-html="detail.description" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Phone } from '@element-plus/icons-vue'
import { getProductDetail } from '@/api/product'
import { useUserStore } from '@/stores/user'
import type { Product } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const productId = Number(route.params.id)

const loading = ref(true)
const detail = ref<Product>({} as Product)

// 默认图片占位
const defaultImage = 'https://via.placeholder.com/400x300?text=暂无图片'

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待审核',
    1: '已上架',
    2: '已下架',
    3: '审核不通过',
  }
  return map[status] || '未知'
}
const getStatusTag = (status: number) => {
  const map: Record<number, string> = {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: 'danger',
  }
  return map[status] || ''
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getProductDetail(productId)
    detail.value = res
  } catch (error) {
    console.error(error)
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const handleImageError = (event: Event, index: number) => {
  const img = event.target as HTMLImageElement
  img.src = defaultImage
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.product-detail {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}
.back {
  margin-bottom: 20px;
}
.no-image {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 16px;
}
.info-row {
  margin: 10px 0;
  display: flex;
  align-items: center;
}
.label {
  width: 80px;
  color: #999;
}
.price {
  color: #f56c6c;
  font-size: 24px;
  font-weight: bold;
}
.contact-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}
.contact-phone {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  margin-top: 10px;
}
.audit-status {
  margin-top: 20px;
}
.audit-remark {
  margin-left: 15px;
  color: #e6a23c;
}
.description {
  line-height: 1.8;
  padding: 20px 0;
}
</style>