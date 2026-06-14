<template>
  <div class="demand-pending">
    <div class="page-header">
      <h2>待抢单需求</h2>
    </div>

    <el-card shadow="never">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="服务类型">
          <el-select v-model="searchForm.serviceType" placeholder="全部" clearable>
            <el-option label="家电维修" value="家电维修" />
            <el-option label="农机租赁" value="农机租赁" />
            <el-option label="家政服务" value="家政服务" />
            <el-option label="农资购买" value="农资购买" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <common-table
        v-model="pagination"
        :data="demandList"
        :columns="columns"
        :loading="loading"
        :total="total"
        show-pagination
        @page-change="fetchData"
      >
        <template #budget="{ row }">
          {{ row.budget ? '¥' + row.budget : '面议' }}
        </template>
        <template #actions="{ row }">
          <el-button type="primary" size="small" @click="viewDetail(row.id)">查看详情</el-button>
        </template>
      </common-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPendingDemands } from '@/api/service'
import CommonTable from '@/components/CommonTable.vue'
import type { ServiceDemand } from '@/types'

const router = useRouter()
const searchForm = reactive({ serviceType: '' })

const columns = [
  { prop: 'serviceType', label: '服务类型', width: 120 },
  { prop: 'description', label: '需求描述', minWidth: 200, showOverflowTooltip: true },
  { prop: 'budget', label: '预算', width: 100 },
  { prop: 'address', label: '地址', minWidth: 150 },
  { prop: 'createTime', label: '发布时间', width: 160 },
]

const pagination = reactive({ page: 1, size: 10 })
const demandList = ref<ServiceDemand[]>([])
const total = ref(0)
const loading = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPendingDemands({
      page: pagination.page,
      size: pagination.size,
      serviceType: searchForm.serviceType || undefined,
    })
    demandList.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}
const resetSearch = () => {
  searchForm.serviceType = ''
  pagination.page = 1
  fetchData()
}

const viewDetail = (id: number) => {
  router.push({ name: 'DemandDetail', params: { id } })
}

onMounted(fetchData)
</script>

<style scoped>
.demand-pending {
  padding: 20px;
}
.page-header {
  margin-bottom: 20px;
}
</style>