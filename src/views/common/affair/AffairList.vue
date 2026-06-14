<template>
  <div class="affair-list">
    <!-- 状态筛选（仅保留已发布和已过期） -->
    <el-select
      v-model="status"
      placeholder="事务状态"
      clearable
       @change="handleStatusChange"
      style="width: 200px; margin-bottom: 20px"
    >
      <el-option label="已发布" :value="1" />
      <el-option label="已过期" :value="2" />
    </el-select>

    <el-table v-loading="loading" :data="affairList" stripe style="width: 100%">
      <!-- 标题（可点击查看详情） -->
      <el-table-column label="事务标题" min-width="200">
        <template #default="{ row }">
          <el-button type="primary" link @click="viewDetail(row)">{{ row.title }}</el-button>
        </template>
      </el-table-column>

      <!-- 发布人 -->
      <el-table-column label="发布人" width="120">
        <template #default="{ row }">
          {{ row.publisherName || row.publisherId || '未知' }}
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="100" :formatter="statusFormatter" />
      <el-table-column prop="startDate" label="公示开始" width="110" />
      <el-table-column prop="endDate" label="公示结束" width="110" />
      <el-table-column prop="createTime" label="发布时间" width="180" />

      <!-- 操作列（删除按钮，仅管理员/村干部可见） -->
      <el-table-column label="操作" width="150" fixed="right" v-if="canDelete">
        <template #default="{ row }">
          <el-button
            type="danger"
            size="small"
            @click="handleDelete(row)"
            :loading="row.deleting"
          >
            删除
          </el-button>
        </template>
      </el-table-column>

      <!-- 空状态提示 -->
      <template #empty>
        <el-empty :description="emptyText" />
        <p v-if="debugInfo" class="debug-info">{{ debugInfo }}</p>
      </template>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pageNum"
      v-model:page-size="pageSize"
      :total="total"
      @current-change="fetchData"
      @size-change="fetchData"
      layout="total, prev, pager, next, sizes"
      style="margin-top: 20px; justify-content: flex-end"
    />

    <!-- 村务详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="currentAffair?.title"
      width="60%"
      destroy-on-close
      @closed="handleDetailClosed"
    >
      <div v-if="currentAffair" class="affair-detail">
        <!-- 基本信息 -->
        <el-descriptions :column="1" border>
          <el-descriptions-item label="发布人">
            {{ currentAffair.publisherName || currentAffair.publisherId }}
          </el-descriptions-item>
          <el-descriptions-item label="类型">{{ typeFormatter(currentAffair.type) }}</el-descriptions-item>
          <el-descriptions-item label="公示期限">
            {{ currentAffair.startDate }} 至 {{ currentAffair.endDate }}
          </el-descriptions-item>
          <el-descriptions-item label="允许异议">
            {{ currentAffair.allowFeedback ? '是' : '否' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 内容 -->
        <div class="detail-content">
          <h4>内容</h4>
          <div v-html="currentAffair.content"></div>
        </div>

        <!-- 附件 -->
        <div v-if="currentAffair.attachments?.length" class="detail-attachments">
          <h4>附件</h4>
          <ul>
            <li v-for="(url, idx) in currentAffair.attachments" :key="idx">
              <el-link :href="url" target="_blank">{{ getFileName(url) }}</el-link>
            </li>
          </ul>
        </div>

        <!-- 异议列表（包含回复内容） -->
  <div v-if="feedbackList.length" class="feedback-list">
    <h4>异议反馈</h4>
    <div v-for="fb in feedbackList" :key="fb.id" class="feedback-item">
      <div class="fb-header">
        <span>村民：{{ fb.userName || fb.userId }}</span>
        <span>{{ fb.createTime }}</span>
      </div>
      <div class="fb-content">{{ fb.content }}</div>
      <!-- 显示回复内容（如果有） -->
      <div v-if="fb.replyContent" class="fb-reply">
        <span>回复：</span>{{ fb.replyContent }}
      </div>
    </div>
  </div>

        <!-- 异议提交表单（仅村民且允许异议时显示） -->
        <div v-if="canSubmitFeedback" class="feedback-form">
          <el-divider />
          <h4>提交异议</h4>
          <el-input
            v-model="feedbackContent"
            type="textarea"
            :rows="3"
            placeholder="请输入异议内容"
            maxlength="500"
            show-word-limit
          />
          <!-- 附件上传（如需支持异议附件） -->
          <el-upload
            v-model:file-list="feedbackAttachments"
            action="#"
            :auto-upload="false"
            :on-change="handleFeedbackAttachmentChange"
            :on-remove="handleFeedbackAttachmentRemove"
            multiple
            list-type="text"
            style="margin-top: 10px"
          >
            <el-button type="primary" size="small">上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持多个文件，每个不超过10MB</div>
            </template>
          </el-upload>
          <el-button type="primary" @click="handleSubmitFeedback" :loading="submittingFeedback">
            提交异议
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAffairList,
  getAffairDetail,
  submitFeedback,
  deleteAffair,
  getFeedbackList   // 新增导入
} from '@/api/affair'
import { useUserStore } from '@/stores/user'

// 类型定义（增加 replyContent 字段）
interface FeedbackItem {
  id: number
  affairId: number
  affairTitle: string
  villagerId: number
  villagerName: string
  content: string
  replyContent?: string   // 统一为 replyContent
  status: 0 | 1
  createTime: string
  updateTime: string
}

const userStore = useUserStore()

// 列表数据
const affairList = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const status = ref<number | undefined>(undefined)  // 初始为 undefined
const loading = ref(false)
const debugInfo = ref('')

// 详情弹窗数据
const detailVisible = ref(false)
const currentAffair = ref(null)
const feedbackList = ref([])
const feedbackContent = ref('')
const feedbackAttachments = ref([])
const submittingFeedback = ref(false)

// 计算属性：是否可删除（管理员或村干部）
const canDelete = computed(() => {
  return userStore.isAdmin || userStore.isVillageOfficial
})

const emptyText = computed(() => {
  return status.value !== '' ? '暂无符合条件的村务' : '暂无村务数据'
})

// 判断当前用户能否提交异议（村民且允许异议）
const canSubmitFeedback = computed(() => {
  return userStore.isLoggedIn &&
         userStore.role === 'villager' &&
         currentAffair.value?.allowFeedback
})

// 获取列表
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pageNum.value,
      size: pageSize.value,
      status: status.value, // 直接传递，axios 会自动忽略 undefined
    }
    console.log('请求参数:', params) // 调试用
    const res = await getAffairList(params)
    console.log('返回数据:', res) // 调试用
    affairList.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取村务列表失败', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 处理状态变更：重置页码并重新获取
const handleStatusChange = () => {
  pageNum.value = 1
  fetchData()
}

// 查看详情（同时获取详情和反馈列表）
const viewDetail = async (row) => {
  try {
    // 并发获取村务详情和反馈列表（获取前100条，可按需调整）
    const [detail, feedbackRes] = await Promise.all([
      getAffairDetail(row.id),
      getFeedbackList({ affairId: row.id, page: 1, size: 100 })
    ])
    currentAffair.value = detail
    feedbackList.value = feedbackRes.records || []
    detailVisible.value = true
  } catch (error) {
    ElMessage.error('获取详情失败')
    console.error(error)
  }
}

// 关闭弹窗清理
const handleDetailClosed = () => {
  currentAffair.value = null
  feedbackList.value = []
  feedbackContent.value = ''
  feedbackAttachments.value = []
}

// 删除村务
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除村务"${row.title}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    row.deleting = true
    try {
      await deleteAffair(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      ElMessage.error('删除失败')
    } finally {
      row.deleting = false
    }
  }).catch(() => {})
}

// 异议附件变化（如需上传可在此处理）
const handleFeedbackAttachmentChange = (file, fileList) => {
  console.log('附件变化', file, fileList)
}

const handleFeedbackAttachmentRemove = (file, fileList) => {
  // 移除附件
}

// 提交异议
const handleSubmitFeedback = async () => {
  if (!feedbackContent.value.trim()) {
    ElMessage.warning('请输入异议内容')
    return
  }
  if (!currentAffair.value) return

  submittingFeedback.value = true
  try {
    await submitFeedback(currentAffair.value.id, {
      content: feedbackContent.value,
      attachments: [], // 如有附件需处理
    })
    ElMessage.success('异议提交成功')
    // 重新获取反馈列表，更新显示
    const updatedRes = await getFeedbackList({ affairId: currentAffair.value.id, page: 1, size: 100 })
    feedbackList.value = updatedRes.records || []
    feedbackContent.value = ''
    feedbackAttachments.value = []
  } catch (error) {
    ElMessage.error('提交失败')
  } finally {
    submittingFeedback.value = false
  }
}

// 类型格式化
const typeFormatter = (type) => {
  const map = { financial: '财务报表', meeting: '会议纪要', notice: '公示公告' }
  return map[type] || type
}

// 状态格式化
const statusFormatter = (row) => {
  const map = { 1: '已发布', 2: '已过期' }
  return map[row.status] || '未知'
}

// 获取文件名
const getFileName = (url) => {
  if (!url) return ''
  const parts = url.split('/')
  return parts[parts.length - 1]
}

defineExpose({ fetchData })
onMounted(fetchData)
</script>

<style scoped>
.affair-detail {
  padding: 10px;
}
.detail-content {
  margin: 20px 0;
}
.feedback-item {
  border: 1px solid #eee;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
}
.fb-header {
  display: flex;
  justify-content: space-between;
  color: #999;
  font-size: 12px;
  margin-bottom: 5px;
}
.fb-reply {
  background-color: #f5f7fa;
  padding: 8px;
  margin-top: 8px;
  border-radius: 4px;
}
.feedback-form {
  margin-top: 20px;
}
.debug-info {
  color: #f56c6c;
  font-size: 14px;
  margin-top: 10px;
}
</style>