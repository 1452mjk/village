<template>
  <div class="product-list">
    <div class="page-header">
      <h2>农产品展示</h2>
      <el-button v-if="userStore.isVillager" type="success" @click="handlePublish">发布农产品</el-button>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.keyword" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable>
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="交易模式">
          <el-select v-model="searchForm.tradeMode" placeholder="全部" clearable>
            <el-option
              v-for="item in tradeModeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 加载状态和空数据 -->
    <div v-loading="loading" class="product-grid">
      <el-row :gutter="20" v-if="productList.length > 0">
        <el-col
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          v-for="item in productList"
          :key="item.id"
          class="product-col"
        >
          <el-card :body-style="{ padding: '0px' }" shadow="hover" @click="viewDetail(item.id)">
            <el-image
              :src="item.images?.[0]"
              fit="cover"
              class="product-image"
              @error="handleImageError"
            >
              <template #error>
                <div class="image-error">图片加载失败</div>
              </template>
            </el-image>
            <div class="product-info">
            <div style="display: none;">farmerId: {{ item.farmerId }}, userId: {{ userStore.userId }}</div>
              <h3 class="product-name">{{ item.name }}</h3>
              <p class="product-price">¥{{ item.price }} / {{ item.specifications || '斤' }}</p>
              <p class="product-origin">{{ item.origin }}</p>
              <div class="product-footer">
                <span class="product-type">{{ getTypeLabel(item.type) }}</span>
                <span class="product-mode">{{ getTradeModeLabel(item.tradeMode) }}</span>
              </div>
              <!-- 删除按钮：仅管理员或发布人可见 -->
<el-button
  v-if="userStore.isAdmin || item.farmerId === userStore.userId"
  type="danger"
  size="small"
  circle
  class="delete-btn"
  :icon="Delete"
  @click.stop="handleDelete(item.id, item.name)"
/>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-else-if="!loading" description="暂无农产品" />
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="total"
        :page-sizes="[12, 24, 36, 48]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { getProductPage, deleteProduct } from '@/api/product' // 假设有删除接口
import { useUserStore } from '@/stores/user'
import type { Product } from '@/types'

const router = useRouter()
const userStore = useUserStore()

// 常量定义
const typeOptions = [
  { label: '蔬菜', value: '蔬菜' },
  { label: '水果', value: '水果' },
  { label: '手工艺品', value: '手工艺品' },
  { label: '其他', value: '其他' },
]

const tradeModeOptions = [
  { label: '批发', value: 'wholesale' },
  { label: '零售', value: 'retail' },
]

const getTypeLabel = (value: string) => {
  const item = typeOptions.find(opt => opt.value === value)
  return item?.label || value
}

const getTradeModeLabel = (value: string) => {
  const item = tradeModeOptions.find(opt => opt.value === value)
  return item?.label || (value === 'wholesale' ? '批发' : '零售')
}

const searchForm = reactive({
  keyword: '',
  type: '',
  tradeMode: '',
})

const pagination = reactive({
  page: 1,
  size: 12,
})

const productList = ref<Product[]>([])
const total = ref(0)
const loading = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getProductPage({
      page: pagination.page,
      size: pagination.size,
      keyword: searchForm.keyword || undefined,
      type: searchForm.type || undefined,
      tradeMode: searchForm.tradeMode || undefined,
    })
    productList.value = res.records
    total.value = res.total

    // 调试代码：打印产品列表和用户ID信息
    console.log('产品列表数据:', productList.value)
    console.log('当前用户ID:', userStore.userId)
    console.log('当前用户ID类型:', typeof userStore.userId)
    if (productList.value.length > 0) {
      console.log('第一个产品 farmerId:', productList.value[0].farmerId)
      console.log('第一个产品 farmerId 类型:', typeof productList.value[0].farmerId)
    }
  } catch (error) {
    console.error('获取农产品列表失败', error)
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.type = ''
  searchForm.tradeMode = ''
  pagination.page = 1
  fetchData()
}

const viewDetail = (id: number) => {
  router.push(`/product/detail/${id}`)
}

const handlePublish = () => {
  router.push('/product/publish')
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = '/images/default-product.png' // 确保该图片存在于 public/images 目录下
  img.onerror = null // 防止死循环
}

// 删除产品
const handleDelete = async (id: number, name: string) => {
  try {
    await ElMessageBox.confirm(`确定删除农产品“${name}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteProduct(id) // 调用删除API
    ElMessage.success('删除成功')
    // 刷新列表
    fetchData()
  } catch (error) {
    // 用户取消或删除失败时不处理
    if (error !== 'cancel') {
      console.error('删除失败', error)
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.product-list {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.search-card {
  margin-bottom: 20px;
}
.product-grid {
  min-height: 400px;
}
.product-col {
  margin-bottom: 20px;
  cursor: pointer;
}
.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.image-error {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #999;
}
.product-info {
  padding: 12px;
  position: relative;
}
.product-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
  margin: 5px 0;
}
.product-origin {
  color: #909399;
  font-size: 13px;
  margin: 5px 0;
}
.product-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}
.delete-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 1;
}
.pagination-container {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}
</style>