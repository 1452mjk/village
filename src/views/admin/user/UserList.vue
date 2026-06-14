<template>
  <div class="user-list">
    <div class="page-header">
      <h2>用户管理</h2>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="全部" clearable>
            <el-option label="村民" value="villager" />
            <el-option label="村干部" value="village_official" />
            <el-option label="商户" value="merchant" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="待审核" :value="0" />
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

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
        <template #role="{ row }">
          <el-tag :type="getRoleTag(row.role)" size="small">
            {{ getRoleText(row.role) }}
          </el-tag>
        </template>

        <template #status="{ row }">
          <el-tag :type="getStatusTag(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>

        <template #actions="{ row }">
          <!-- 审核按钮（仅针对待审核的村干部/商户） -->
          <el-button
            v-if="(row.role === 'village_official' || row.role === 'merchant') && row.status === 0"
            type="primary"
            link
            @click="openAuditDialog(row)"
          >
            审核
          </el-button>
          <!-- 禁用按钮（正常状态） -->
          <el-button
            v-if="row.status === 1"
            type="danger"
            link
            @click="changeStatus(row.id, 'DISABLED')"
          >
            禁用
          </el-button>
          <!-- 启用按钮（禁用状态） -->
          <el-button
            v-if="row.status === 2"
            type="success"
            link
            @click="changeStatus(row.id, 'NORMAL')"
          >
            启用
          </el-button>
          <!-- 详情按钮（始终显示） -->
          <el-button type="info" link @click="viewDetail(row.id)">详情</el-button>
        </template>
      </common-table>
    </el-card>

    <!-- 审核弹窗 -->
    <common-dialog
      v-model="auditDialogVisible"
      title="用户审核"
      width="500px"
      @confirm="handleAudit"
      :confirm-loading="auditLoading"
    >
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="用户">
          <span>{{ currentUser?.realName }} ({{ currentUser?.phone }})</span>
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.approved">
            <el-radio :value="true">通过</el-radio>
            <el-radio :value="false">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!auditForm.approved" label="拒绝原因">
          <el-input v-model="auditForm.remark" type="textarea" rows="3" placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
    </common-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserPage, auditUser, changeUserStatus } from '@/api/user'
import CommonTable from '@/components/CommonTable.vue'
import CommonDialog from '@/components/CommonDialog.vue'
import type { User } from '@/types'

const router = useRouter()

// 表格列定义
const columns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'phone', label: '手机号', width: 120 },
  { prop: 'realName', label: '姓名', width: 100 },
  { prop: 'role', label: '角色', width: 100 },
  { prop: 'status', label: '状态', width: 90 },
  { prop: 'createTime', label: '注册时间', width: 160 },
  { prop: 'villageName', label: '所属村庄', minWidth: 120 }, // 可能需要关联村庄表
  { prop: 'auditRemark', label: '审核备注', minWidth: 150, showOverflowTooltip: true },
  
]

// 角色映射
const getRoleText = (role: string) => {
  const map: Record<string, string> = {
    villager: '村民',
    village_official: '村干部',
    merchant: '商户',
    admin: '管理员',
  }
  return map[role] || role
}
const getRoleTag = (role: string) => {
  const map: Record<string, string> = {
    villager: '',
    village_official: 'warning',
    merchant: 'success',
    admin: 'danger',
  }
return map[role] ?? '' // 使用空值合并，确保不会返回 undefined
}

// 状态映射
const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待审核',
    1: '正常',
    2: '禁用',
  }
  return map[status] || '未知'
}
const getStatusTag = (status: number) => {
  const map: Record<number, string> = {
    0: 'info',
    1: 'success',
    2: 'danger',
  }
  return map[status] ?? 'info' // 默认返回 'info'
}

// 搜索表单
const searchForm = reactive({
  phone: '',
  role: '',
  status: undefined as number | undefined,
})

// 分页参数
const pagination = reactive({
  page: 1,
  size: 10,
})

// 数据
const userList = ref<User[]>([])
const total = ref(0)
const loading = ref(false)

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getUserPage({
      page: pagination.page,
      size: pagination.size,
      phone: searchForm.phone || undefined,
      role: searchForm.role || undefined,
      status: searchForm.status,
    })
    userList.value = res.records
    total.value = res.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 搜索重置
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}
const resetSearch = () => {
  searchForm.phone = ''
  searchForm.role = ''
  searchForm.status = undefined
  pagination.page = 1
  fetchData()
}

// 审核相关
const auditDialogVisible = ref(false)
const auditLoading = ref(false)
const currentUser = ref<User | null>(null)
const auditForm = reactive({
  approved: true,
  remark: '',
})

const openAuditDialog = (user: User) => {
  currentUser.value = user
  auditForm.approved = true
  auditForm.remark = ''
  auditDialogVisible.value = true
}

const handleAudit = async () => {
  if (!currentUser.value) return
  auditLoading.value = true
  try {
    await auditUser(
      currentUser.value.id,
      auditForm.approved ? 1 : 2, // 通过设为正常(1)，拒绝设为禁用(2)？根据业务确定
      auditForm.remark
    )
    ElMessage.success('审核完成')
    auditDialogVisible.value = false
    fetchData() // 刷新列表
  } catch (error) {
    console.error(error)
  } finally {
    auditLoading.value = false
  }
}

// 启用/禁用
const changeStatus = async (userId: number, status: 'NORMAL' | 'DISABLED') => {
  const action = status === 'NORMAL' ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确认${action}该用户？`, '提示', { type: 'warning' })
    await changeUserStatus(userId, status)
    ElMessage.success(`${action}成功`)
    fetchData()
  } catch (error) {
    // 取消或失败
  }
}

// 查看详情（带ID参数）
const viewDetail = (id: number) => {
  router.push(`/admin/user/detail/${id}`)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.user-list {
  padding: 20px;
}
.page-header {
  margin-bottom: 20px;
}
.search-card {
  margin-bottom: 20px;
}
</style>