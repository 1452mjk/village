<template>
  <div class="product-audit">
    <div class="page-header">
      <h2>农产品审核</h2>
    </div>

    <el-card shadow="never">
      <common-table
        v-model="pagination"
        :data="productList"
        :columns="columns"
        :loading="loading"
        :total="total"
        show-pagination
        @page-change="fetchData"
      >
        <template #images="{ row }">
          <el-image
            :src="row.images?.[0]"
            :preview-src-list="row.images"
            style="width: 50px; height: 50px; border-radius: 4px;"
          />
        </template>
        <template #price="{ row }">
          ¥{{ row.price }}/{{ row.specifications || '斤' }}
        </template>
        <template #status="{ row }">
          <el-tag :type="getStatusTag(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button type="primary" link @click="viewDetail(row.id)">查看</el-button>
          <el-button
            v-if="row.status === 0"
            type="success"
            link
            :loading="auditingIds.includes(row.id)"
            @click="handleAudit(row.id, true)"
          >
            通过
          </el-button>
          <el-button
            v-if="row.status === 0"
            type="danger"
            link
            :loading="auditingIds.includes(row.id)"
            @click="handleAudit(row.id, false)"
          >
            拒绝
          </el-button>
        </template>
      </common-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProductPage, auditProduct } from '@/api/product'
import CommonTable from '@/components/CommonTable.vue'
import type { Product } from '@/types'

const router = useRouter()

// 列定义
const columns = [
  { prop: 'images', label: '图片', width: 70 },
  { prop: 'name', label: '产品名称', width: 120 },
  { prop: 'type', label: '类型', width: 80 },
  { prop: 'origin', label: '产地', width: 120 },
  { prop: 'price', label: '价格', width: 100 },
  { prop: 'farmerName', label: '发布人', width: 100 },
  { prop: 'status', label: '状态', width: 100 },
  { prop: 'createTime', label: '发布时间', width: 160 },
  
]

// 状态映射
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
  return map[status]
}

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
})

// 列表数据
const productList = ref<Product[]>([])
const total = ref(0)
const loading = ref(false)

// 正在审核的ID集合，用于按钮 loading 状态
const auditingIds = ref<number[]>([])

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getProductPage({
      page: pagination.page,
      size: pagination.size,
       status: 0,
    })
    productList.value = res.records
    total.value = res.total
  } catch (error) {
    console.error('获取产品列表失败', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 查看详情
const viewDetail = (id: number) => {
  router.push(`/product/detail/${id}`)
}

// 审核处理
const handleAudit = async (id: number, approved: boolean) => {
  if (approved) {
    // 通过审核：简单确认框
    try {
      await ElMessageBox.confirm('确认通过该产品审核？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success',
      })
    } catch {
      return // 用户取消
    }
  } else {
    // 拒绝审核：需要输入原因
    try {
      const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '原因不能为空',
      })
      // 执行审核拒绝，携带原因
      auditingIds.value.push(id)
      try {
        await auditProduct(id, false, value)
        ElMessage.success('已拒绝')
        await fetchData() // 刷新列表
      } catch (error) {
        console.error('审核失败', error)
        ElMessage.error('操作失败')
      } finally {
        auditingIds.value = auditingIds.value.filter(item => item !== id)
      }
      return
    } catch {
      return // 用户取消
    }
  }

  // 执行审核通过
  auditingIds.value.push(id)
  try {
    await auditProduct(id, true)
    ElMessage.success('审核通过')
    await fetchData()
  } catch (error) {
    console.error('审核失败', error)
    ElMessage.error('操作失败')
  } finally {
    auditingIds.value = auditingIds.value.filter(item => item !== id)
  }
}

onMounted(fetchData)
</script>

<style scoped>
.product-audit {
  padding: 20px;
}
.page-header {
  margin-bottom: 20px;
}
</style>