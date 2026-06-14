<template>
  <div class="demand-my">
    <div class="page-header">
      <h2>我的需求</h2>
      <el-button type="primary" @click="goPublish">发布新需求</el-button>
    </div>

   <el-card shadow="never">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="待抢单" name="PENDING" />
        <el-tab-pane label="已接单" name="ACCEPTED" />
        <el-tab-pane label="服务中" name="IN_PROGRESS" />
        <el-tab-pane label="待评价" name="WAITING_EVALUATION" />
        <el-tab-pane label="已完成" name="COMPLETED" />
        <!-- 如果后端有已取消状态，可取消注释 -->
        <!-- <el-tab-pane label="已取消" name="CANCELLED" /> -->
      </el-tabs>

      <common-table
        v-model="pagination"
        :data="demandList"
        :columns="columns"
        :loading="loading"
        :total="total"
        show-pagination
        @page-change="fetchData"
      >
        <template #status="{ row }">
          <el-tag :type="getStatusTag(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <el-button type="primary" link @click="viewDetail(row.id)">查看</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </common-table>
    </el-card>

    <!-- 需求详情弹窗 -->
     <!--
    <el-dialog v-model="detailVisible" title="需求详情" width="600px" destroy-on-close>
      <el-descriptions :column="1" border v-if="currentDemand">
        <el-descriptions-item label="服务类型">{{ currentDemand.serviceType }}</el-descriptions-item>
        <el-descriptions-item label="需求描述">{{ currentDemand.description }}</el-descriptions-item>
        <el-descriptions-item label="预算">￥{{ currentDemand.budget?.toFixed(2) || '面议' }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ currentDemand.address || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentDemand.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTag(currentDemand.status)">
            {{ getStatusText(currentDemand.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ formatDateTime(currentDemand.createTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
     -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyDemands, deleteDemand } from '@/api/service'
import CommonTable from '@/components/CommonTable.vue'
import type { ServiceDemand } from '@/types'

const router = useRouter()
const activeTab = ref('all')

const columns = [
  { prop: 'serviceType', label: '服务类型', width: 120 },
  { prop: 'description', label: '需求描述', minWidth: 200, showOverflowTooltip: true },
  { prop: 'budget', label: '预算(元)', width: 100 },
  { prop: 'createTime', label: '发布时间', width: 160 },
  { prop: 'status', label: '状态', width: 100 },
  
]

// 状态映射
const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待抢单', 1: '已接单', 2: '服务中', 3: '待评价', 4: '已完成', 5: '已取消'
  }
  return map[status] || '未知'
}
const getStatusTag = (status: number) => {
  const map: Record<number, string> = {
    0: 'info', 1: 'warning', 2: 'primary', 3: 'success', 4: 'success', 5: 'danger'
  }
  return map[status] || 'info'
}

// 分页
const pagination = ref({ page: 1, size: 10 })

const demandList = ref<ServiceDemand[]>([])
const total = ref(0)
const loading = ref(false)

// 详情弹窗
const detailVisible = ref(false)
const currentDemand = ref<ServiceDemand | null>(null)

// 日期格式化
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 获取列表
const fetchData = async () => {
  loading.value = true
  try {
    const status = activeTab.value === 'all' ? undefined : activeTab.value
    const res = await getMyDemands({
      page: pagination.value.page,
      size: pagination.value.size,
      status,   // 直接传递枚举字符串，如 "COMPLETED"
    })
    demandList.value = res.records
    total.value = res.total
  } catch (error) {
    console.error('获取我的需求失败', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 标签切换
const handleTabChange = () => {
  pagination.value.page = 1
  fetchData()
}



// 删除
const handleDelete = (row: ServiceDemand) => {
  ElMessageBox.confirm(`确定删除需求“${row.description}”吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteDemand(row.id)
      ElMessage.success('删除成功')
      fetchData() // 刷新列表
    } catch (error) {
      console.error('删除失败', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const viewDetail = (id: number) => {
  router.push(`/service/demand/detail/${id}`)
}

onMounted(fetchData)
</script>

<style scoped>
.demand-my {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>