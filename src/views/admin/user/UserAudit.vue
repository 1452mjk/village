<template>
  <div class="user-audit">
    <div class="page-header">
      <h2>用户审核</h2>
    </div>
    <el-card shadow="never">
      <common-table
        v-model="pagination"
        :data="userList"
        :columns="columns"
        :loading="loading"
        :total="total"
        show-pagination
        @page-change="fetchData"
      >
        <!-- 状态列（自定义显示标签） -->
        <template #status="{ row }">
          <el-tag type="warning" size="small">待审核</el-tag>
        </template>
        <!-- 操作列 -->
        <template #actions="{ row }">
          <el-button type="success" size="small" @click="handleAudit(row.id, 1)">通过</el-button>
          <el-button type="danger" size="small" @click="handleAudit(row.id, 2)">拒绝</el-button>
        </template>
      </common-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserPage, auditUser } from '@/api/user'
import CommonTable from '@/components/CommonTable.vue'

// 列定义（增加状态列）
const columns = [
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'realName', label: '姓名', width: 100 },
  { prop: 'phone', label: '手机号', width: 120 },
  { prop: 'role', label: '角色', width: 100 },
  { prop: 'villageName', label: '所属村', width: 120 },
  { prop: 'createTime', label: '注册时间', width: 160 },
  { prop: 'status', label: '状态', width: 80 },  // 自定义模板显示
  { label: '操作', width: 140, fixed: 'right' },
]

// 分页参数
const pagination = reactive({
  page: 1,
  size: 10,
})

// 列表数据
const userList = ref([])
const total = ref(0)
const loading = ref(false)

// 获取待审核用户列表（status=0 且角色为村干部或商户）
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getUserPage({
      page: pagination.page,
      size: pagination.size,
      status: 0,                      // 待审核状态
      role: 'village_official,merchant', // 只查询需要审核的角色（假设后端支持逗号分隔）
    })
    userList.value = res.records || res.data || res
    total.value = res.total || res.totalCount || 0
  } catch (error) {
    console.error('获取待审核用户失败', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 处理审核
const handleAudit = (userId, status) => {
  const actionText = status === 1 ? '通过' : '拒绝'
  ElMessageBox.prompt(
    `请输入${actionText}备注（选填）`,
    `确认${actionText}`,
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: status === 2 ? /.+/ : undefined, // 拒绝时要求输入原因
      inputErrorMessage: '拒绝原因不能为空',
    }
  ).then(async ({ value }) => {
    try {
      await auditUser(userId, status, value || '')
      ElMessage.success(`${actionText}成功`)
      fetchData() // 刷新列表
    } catch (error) {
      console.error('审核失败', error)
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.user-audit {
  padding: 20px;
}
.page-header {
  margin-bottom: 20px;
}
</style>