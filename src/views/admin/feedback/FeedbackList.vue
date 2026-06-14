<!-- views/admin/feedback/FeedbackList.vue -->
<template>
  <div class="feedback-list">
    <div class="header-actions">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索反馈内容或用户"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
        style="width: 300px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select
        v-model="typeFilter"
        placeholder="全部类型"
        clearable
        @change="handleFilter"
        style="width: 150px; margin-left: 16px"
      >
        <el-option label="评论" value="comment" />
        <el-option label="留言" value="message" />
        <el-option label="反馈" value="feedback" />
      </el-select>
      <el-select
        v-model="statusFilter"
        placeholder="全部状态"
        clearable
        @change="handleFilter"
        style="width: 150px; margin-left: 16px"
      >
        <el-option label="待处理" :value="0" />
        <el-option label="已处理" :value="1" />
      </el-select>
    </div>

    <el-table :data="feedbackList" v-loading="loading" stripe>
      <el-table-column prop="content" label="反馈内容" min-width="200" show-overflow-tooltip />
      <el-table-column prop="userName" label="用户" width="120" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTypeTagType(row.type)" size="small">
            {{ getTypeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="提交时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'warning' : 'success'">
            {{ row.status === 0 ? '待处理' : '已处理' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="viewDetail(row)">查看</el-button>
          <el-button
            v-if="row.status === 0"
            type="success"
            size="small"
            @click="openProcessDialog(row)"
          >
            处理
          </el-button>
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

    <!-- 详情/处理对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <el-form
        v-if="currentFeedback"
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="用户">
          <span>{{ currentFeedback.userName }}</span>
        </el-form-item>
        <el-form-item label="类型">
          <span>{{ getTypeLabel(currentFeedback.type) }}</span>
        </el-form-item>
        <el-form-item label="反馈内容">
          <el-input
            type="textarea"
            :rows="4"
            v-model="currentFeedback.content"
            readonly
          />
        </el-form-item>
        <el-form-item label="提交时间">
          <span>{{ formatDateTime(currentFeedback.createTime) }}</span>
        </el-form-item>
        <el-form-item label="回复内容" prop="reply">
          <el-input
            type="textarea"
            :rows="4"
            v-model="form.reply"
            placeholder="请输入回复内容"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">已处理</el-radio>
            <el-radio :value="0">待处理</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProcess" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getFeedbackList, updateFeedback } from '@/api/affair'

// 类型定义
type FeedbackType = 'comment' | 'message' | 'feedback'
type FeedbackStatus = 0 | 1 // 0-待处理, 1-已处理

interface FeedbackItem {
  id: number
  userId: number
  userName: string
  type: FeedbackType
  content: string
  reply?: string
  status: FeedbackStatus
  createTime: string
  updateTime: string
}

// 权限校验
const userStore = useUserStore()
const hasAccess = computed(() => userStore.isAdmin || userStore.isVillageOfficial)
if (!hasAccess.value) {
  ElMessage.error('您没有权限访问此页面')
  // 可跳转到 403，此处简化
}

// 数据列表
const loading = ref(false)
const feedbackList = ref<FeedbackItem[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const typeFilter = ref<FeedbackType | undefined>()
const statusFilter = ref<FeedbackStatus | undefined>()

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('反馈详情')
const currentFeedback = ref<FeedbackItem | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  reply: '',
  status: 1 as FeedbackStatus
})
const formRules: FormRules = {
  reply: [{ required: true, message: '请输入回复内容', trigger: 'blur' }]
}

// 类型标签映射
const typeLabels: Record<FeedbackType, string> = {
  comment: '评论',
  message: '留言',
  feedback: '反馈'
}
const typeTagTypes: Record<FeedbackType, string> = {
  comment: 'info',
  message: 'warning',
  feedback: 'danger'
}

const getTypeLabel = (type: FeedbackType) => typeLabels[type] || type
const getTypeTagType = (type: FeedbackType) => typeTagTypes[type] || ''

// 获取列表数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      type: typeFilter.value,
      status: statusFilter.value
    }
    const res = await getFeedbackList(params)
    // 根据实际后端结构调整
    feedbackList.value = res.records || res.data || res
    total.value = res.total || res.totalCount || 0
  } catch (error) {
    console.error('获取反馈列表失败', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 搜索和筛选
const handleSearch = () => {
  pageNum.value = 1
  fetchData()
}
const handleFilter = () => {
  pageNum.value = 1
  fetchData()
}

// 查看详情（只读模式）
const viewDetail = (row: FeedbackItem) => {
  currentFeedback.value = row
  form.reply = row.reply || ''
  form.status = row.status
  dialogTitle.value = '反馈详情'
  dialogVisible.value = true
}

// 打开处理对话框（可编辑）
const openProcessDialog = (row: FeedbackItem) => {
  currentFeedback.value = row
  form.reply = row.reply || ''
  form.status = row.status
  dialogTitle.value = '处理反馈'
  dialogVisible.value = true
}

// 提交处理
const submitProcess = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  if (!currentFeedback.value) return

  submitting.value = true
  try {
    const data = {
      id: currentFeedback.value.id,
      reply: form.reply,
      status: form.status
    }
    await updateFeedback(data)
    ElMessage.success('处理成功')
    dialogVisible.value = false
    fetchData() // 刷新列表
  } catch (error) {
    console.error('处理失败', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 日期格式化辅助函数
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
.feedback-list {
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