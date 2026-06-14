<template>
  <div class="demand-list">
    <div class="header-actions">
    <!--
      <el-input
        v-model="searchKeyword"
        placeholder="搜索需求描述"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
        style="width: 300px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      -->
      <el-select
        v-model="statusFilter"
        placeholder="全部状态"
        clearable
        @change="handleFilter"
        style="width: 150px; margin-left: 16px"
      >
        <el-option label="待抢单" value="PENDING" />
        <el-option label="已接单" value="ACCEPTED" />
        <el-option label="服务中" value="IN_PROGRESS" />
        <el-option label="待评价" value="WAITING_EVALUATION" />
        <el-option label="已完成" value="COMPLETED" />
        <el-option label="已取消" value="CANCELLED" />
      </el-select>
    </div>

    <el-table :data="demandList" v-loading="loading" stripe>
      <el-table-column prop="serviceType" label="服务类型" width="120" />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="budget" label="预算" width="120">
        <template #default="{ row }">
          ￥{{ row.budget?.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="address" label="地址" min-width="150" show-overflow-tooltip />
      <el-table-column prop="contactPhone" label="联系电话" width="130" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="提交时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="viewDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pageNum"
      v-model:page-size="pageSize"
      :total="total"
      @current-change="fetchData"
      @size-change="fetchData"
      layout="total, prev, pager, next, sizes"
      class="pagination"
    />

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detailVisible" title="需求详情" width="600px" destroy-on-close>
      <el-descriptions :column="1" border v-if="currentDemand">
        <el-descriptions-item label="服务类型">{{ currentDemand.serviceType }}</el-descriptions-item>
        <el-descriptions-item label="需求描述">{{ currentDemand.description }}</el-descriptions-item>
        <el-descriptions-item label="预算">￥{{ currentDemand.budget?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ currentDemand.address }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentDemand.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(currentDemand.status)">
            {{ getStatusLabel(currentDemand.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ formatDateTime(currentDemand.createTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getDemandList } from '@/api/service'

// 根据后端枚举定义
type DemandStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'WAITING_EVALUATION' | 'COMPLETED' | 'CANCELLED'

interface DemandItem {
  id: number
  userId: number
  serviceType: string
  description: string
  budget?: number
  address?: string
  contactPhone: string
  status: DemandStatus
  createTime: string
  updateTime: string
}

const userStore = useUserStore()

// 权限校验：仅管理员和村干部可访问
const hasAccess = computed(() => userStore.isAdmin || userStore.isVillageOfficial)
if (!hasAccess.value) {
  ElMessage.error('您没有权限访问此页面')
  // 可跳转 403
}

// 列表数据
const loading = ref(false)
const demandList = ref<DemandItem[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const statusFilter = ref<DemandStatus | undefined>()

// 详情弹窗
const detailVisible = ref(false)
const currentDemand = ref<DemandItem | null>(null)

// 状态映射（与 DemandMy 颜色对齐）
const statusLabels: Record<DemandStatus, string> = {
  PENDING: '待抢单',
  ACCEPTED: '已接单',
  IN_PROGRESS: '服务中',
  WAITING_EVALUATION: '待评价',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}

const statusTagTypes: Record<DemandStatus, string> = {
  PENDING: 'info',        // 原 warning → info
  ACCEPTED: 'warning',     // 原 info → warning
  IN_PROGRESS: 'primary',
  WAITING_EVALUATION: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger'
}

const getStatusLabel = (status: DemandStatus) => {
  if (!status) return '未知'
  return statusLabels[status] || status
}

const getStatusTagType = (status: DemandStatus) => {
  if (!status) return 'info'
  return statusTagTypes[status] || 'info'
}

// 获取列表数据
const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      status: statusFilter.value
    }
    // 村干部只能看到本村需求（假设需求有关联 villageId）
    if (userStore.isVillageOfficial && userStore.userInfo?.villageId) {
      params.villageId = userStore.userInfo.villageId
    }
    const res = await getDemandList(params)
    // 根据实际后端结构调整
    demandList.value = res.records || res.data || res
    total.value = res.total || res.totalCount || 0
  } catch (error) {
    console.error('获取需求列表失败', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchData()
}
const handleFilter = () => {
  pageNum.value = 1
  fetchData()
}

const viewDetail = (row: DemandItem) => {
  currentDemand.value = row
  detailVisible.value = true
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.demand-list {
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.header-actions {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>