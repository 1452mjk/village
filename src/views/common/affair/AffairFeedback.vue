<template>
  <div class="affair-feedback">
    <div class="header-actions">
      <!-- 暂时移除搜索框（因后端暂不支持关键字），可后续扩展 -->
      <el-select
        v-model="statusFilter"
        placeholder="全部状态"
        clearable
        @change="handleFilter"
        style="width: 150px"
      >
        <el-option label="待处理" :value="0" />
        <el-option label="已处理" :value="1" />
      </el-select>
    </div>

    <el-table :data="feedbackList" stripe v-loading="loading">
      <el-table-column prop="affairTitle" label="村务标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="userName" label="村民" width="120" />
      <el-table-column prop="content" label="异议内容" min-width="200" show-overflow-tooltip />
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
    <el-form-item label="村务标题">
      <span>{{ currentFeedback.affairTitle }}</span>
    </el-form-item>
    <el-form-item label="村民">
      <span>{{ currentFeedback.userName }}</span>
    </el-form-item>
    <el-form-item label="异议内容">
      <el-input
        type="textarea"
        :rows="3"
        v-model="currentFeedback.content"
        readonly
      />
    </el-form-item>
    <el-form-item label="提交时间">
      <span>{{ formatDateTime(currentFeedback.createTime) }}</span>
    </el-form-item>

    <!-- 处理模式下显示回复输入框和状态切换 -->
    <template v-if="dialogTitle === '处理异议'">
      <el-form-item label="处理结果" prop="replyContent">
        <el-input
          type="textarea"
          :rows="4"
          v-model="form.replyContent"
          placeholder="请输入处理结果"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">已处理</el-radio>
          <el-radio :value="0">待处理</el-radio>
        </el-radio-group>
      </el-form-item>
    </template>

   <!-- 查看模式下显示已有回复（使用 replyContent） -->
      <template v-else>
        <el-form-item label="处理结果" v-if="currentFeedback.replyContent">
          <el-input type="textarea" :rows="2" v-model="currentFeedback.replyContent" readonly />
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
    <span class="dialog-footer">
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button
        v-if="dialogTitle === '处理异议'"
        type="primary"
        @click="submitProcess"
        :loading="submitting"
      >
        确定
      </el-button>
    </span>
  </template>
</el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'   // 添加 reactive
import { ElMessage } from 'element-plus'
import { getFeedbackList, updateFeedback } from '@/api/affair'
import { useUserStore } from '@/stores/user'

// 类型定义
// 类型定义统一为 replyContent
interface FeedbackItem {
  id: number
  affairId: number
  affairTitle: string
   userId: number
  userName: string
  content: string
  replyContent?: string   // 使用 replyContent
  status: 0 | 1
  createTime: string
  updateTime: string
}

const userStore = useUserStore()

// 数据列表
const loading = ref(false)
const feedbackList = ref<FeedbackItem[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const statusFilter = ref<number | undefined>()

// 对话框相关（代码保持不变，略）
const dialogVisible = ref(false)
const dialogTitle = ref('异议详情')
const currentFeedback = ref<FeedbackItem | null>(null)
const submitting = ref(false)
const formRef = ref()
const form = reactive({ replyContent: '', status: 1 as 0 | 1 })
const formRules = { replyContent: [{ required: true, message: '请输入处理结果', trigger: 'blur' }] }

// 获取列表数据（关键修改）
const fetchData = async () => {
  loading.value = true
  try {
    // 参数名必须与后端一致：page, size, status（可选）
    const params = {
      page: pageNum.value,
      size: pageSize.value,
      status: statusFilter.value, // 如果 statusFilter 为 undefined，后端不会接收该参数
    }
    console.log('请求参数:', params) // 调试输出
    const res = await getFeedbackList(params)
    console.log('接口返回:', res) // 调试输出

    // 兼容多种返回格式（根据您的后端调整）
    feedbackList.value = res.records || res.data || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取异议列表失败', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  pageNum.value = 1
  fetchData()
}

// 查看详情
const viewDetail = (row: FeedbackItem) => {
  currentFeedback.value = row
  form.reply = row.replyContent || ''   // 将 replyContent 赋给表单的 reply
  form.status = row.status
  dialogTitle.value = '异议详情'
  dialogVisible.value = true
}

// 打开处理对话框
const openProcessDialog = (row: FeedbackItem) => {
  currentFeedback.value = row
  form.reply = row.replyContent || ''   // 同样赋值
  form.status = row.status
  dialogTitle.value = '处理异议'
  dialogVisible.value = true
}

// 提交处理（发送时仍用 reply 字段，与后端约定保持一致）
const submitProcess = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  if (!currentFeedback.value) return

  submitting.value = true
  try {
    await updateFeedback(currentFeedback.value.id, {
      replyContent: form.replyContent,   // ✅ 发送 replyContent
      status: form.status,
    })
    ElMessage.success('处理成功')
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('处理失败', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 日期格式化
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
/* 样式保持不变 */
.affair-feedback {
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}
.header-actions {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>