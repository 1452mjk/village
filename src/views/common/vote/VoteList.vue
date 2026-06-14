<template>
  <div class="vote-list">
    <div class="page-header">
      <h2>村民投票</h2>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="进行中" :value="1" />
            <el-option label="已结束" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
        <!-- 插槽：用于父组件添加额外按钮（如发起投票） -->
        <slot name="search-append" />
      </el-form>
    </el-card>

    <el-card shadow="never">
      <common-table
        v-model="pagination"
        :data="voteList"
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
        <template #dateRange="{ row }">
          {{ formatDate(row.startTime) }} ~ {{ formatDate(row.endTime) }}
        </template>
        <template #anonymous="{ row }">
          <el-tag :type="row.isAnonymous ? 'info' : 'success'" size="small">
            {{ row.isAnonymous ? '匿名' : '实名' }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <el-button type="primary" link @click="viewDetail(row)">查看</el-button>
          <!-- 结束按钮，仅管理员或村干部可见 -->
          <el-button
            v-if="canEnd"
            type="danger"
            link
            @click="handleEnd(row)"
          >
            结束
          </el-button>
          <!-- 插槽：用于父组件在操作列追加其他按钮 -->
          <slot name="action-append" :row="row" />
        </template>
      </common-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getVotePage, endVote } from '@/api/vote'
import { useUserStore } from '@/stores/user'
import CommonTable from '@/components/CommonTable.vue'
import type { Vote } from '@/types'

const router = useRouter()
const userStore = useUserStore()

// 判断是否可结束投票（村干部或管理员）
const canEnd = computed(() => {
  return userStore.isAdmin || userStore.isVillageOfficial
})

const columns = [
  { prop: 'title', label: '标题', minWidth: 200 },
  { prop: 'status', label: '状态', width: 80 },
  { prop: 'dateRange', label: '投票时间', width: 240 },
  { prop: 'anonymous', label: '匿名', width: 70 },
  { prop: 'createTime', label: '发起时间', width: 160 },

]

const getStatusText = (status: number) => (status === 1 ? '进行中' : '已结束')
const getStatusTag = (status: number) => (status === 1 ? 'success' : 'info')

// 日期格式化，增加空值保护
const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  return dateStr.slice(0, 16).replace('T', ' ')
}

const searchForm = reactive({
  status: undefined as number | undefined,
})

const pagination = ref({
  page: 1,
  size: 10,
})

const voteList = ref<Vote[]>([])
const total = ref(0)
const loading = ref(false)

// 获取列表数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getVotePage({
      page: pagination.value.page,
      size: pagination.value.size,
      status: searchForm.status,
    })
    voteList.value = res.records
    total.value = res.total
  } catch (error) {
    console.error('获取投票列表失败', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 查询（重置页码并请求）
const handleSearch = () => {
  pagination.value.page = 1
  fetchData()
}

// 重置筛选条件
const resetSearch = () => {
  searchForm.status = undefined
  pagination.value.page = 1
  fetchData()
}

// 查看详情
const viewDetail = (row: any) => {
  console.log('点击的行数据:', row) // 调试输出，确认 row 对象结构
  const id = row?.id
  if (!id) {
    ElMessage.error('无效的投票ID')
    return
  }
  router.push(`/vote/detail/${id}`)
}

// 结束投票
const handleEnd = (row: Vote) => {
  ElMessageBox.confirm(`确定结束投票“${row.title}”吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await endVote(row.id)
      ElMessage.success('投票已结束')
      fetchData()
    } catch (error) {
      console.error('结束投票失败', error)
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

defineExpose({ fetchData })

onMounted(fetchData)
</script>

<style scoped>
.vote-list {
  padding: 20px;
}
.page-header {
  margin-bottom: 20px;
}
.search-card {
  margin-bottom: 20px;
}
</style>