<template>
  <div class="notice-list">
    <!-- 搜索框 -->
    <!--
    <el-input
      v-model="searchKeyword"
      placeholder="搜索公告"
      clearable
      @clear="fetchData"
      @keyup.enter="fetchData"
      style="width: 300px; margin-bottom: 20px"
    />
    -->

    <el-table :data="noticeList" stripe style="width: 100%" v-loading="loading">
      <!-- 标题 -->
      <el-table-column prop="title" label="标题" min-width="180">
        <template #default="{ row }">
          <el-button type="primary" link @click="viewDetail(row)">{{ row.title }}</el-button>
        </template>
      </el-table-column>

      <!-- 发布人 -->
      <el-table-column label="发布人" width="120">
        <template #default="{ row }">
          {{ row.publisherName || row.publisher?.realName || '未知' }}
        </template>
      </el-table-column>

      <!-- 发布时间 -->
      <el-table-column prop="publishTime" label="发布时间" width="180" />

      <!-- 附件 -->
      <el-table-column label="附件" width="80" align="center">
  <template #default="{ row }">
    <el-popover
      v-if="row.attachments?.length"
      placement="right"
      :width="200"
      trigger="hover"
    >
      <template #reference>
        <el-icon><Paperclip /></el-icon>
      </template>
      <div v-for="(item, index) in row.attachments" :key="index" class="attachment-item">
        <el-link :href="item.url" target="_blank">{{ item.fileName || getFileName(item.url) }}</el-link>
      </div>
    </el-popover>
    <span v-else>-</span>
  </template>
</el-table-column>

      <!-- 语音 -->
      <el-table-column label="语音" width="60" align="center">
  <template #default="{ row }">
    <el-button
      v-if="row.voiceUrl"
      type="primary"
      :icon="VideoPlay"
      circle
      size="small"
      @click="playVoice(row.voiceUrl)"
    />
    <span v-else>-</span>
  </template>
</el-table-column>

      <!-- 阅读量 -->
      <el-table-column prop="readCount" label="阅读" width="70" align="center" />

      <!-- 评论数 + 评论按钮 -->
      <el-table-column label="评论" width="100" align="center">
        <template #default="{ row }">
          <el-button
            type="primary"
            :icon="ChatDotRound"
            size="small"
            @click="openComment(row)"
          >
            {{ row.commentCount }}
          </el-button>
        </template>
      </el-table-column>

      <!-- 过期时间 -->
      <el-table-column label="过期时间" width="180">
        <template #default="{ row }">
          <span :style="{ color: isExpired(row.expireTime) ? '#f56c6c' : 'inherit' }">
            {{ row.expireTime || '永不过期' }}
          </span>
        </template>
      </el-table-column>

      <!-- 操作（删除） -->
      <el-table-column label="操作" width="100" fixed="right" v-if="hasDeletePermission">
        <template #default="{ row }">
          <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
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

    <!-- 详情弹窗（展示评论） -->
    <el-dialog v-model="detailVisible" title="公告详情" width="60%" destroy-on-close>
      <div v-if="currentDetail">
        <h2>{{ currentDetail.title }}</h2>
        <div class="detail-meta">
          <span>发布人：{{ currentDetail.publisherName || currentDetail.publisher?.realName }}</span>
          <span>发布时间：{{ currentDetail.publishTime }}</span>
          <span>阅读 {{ currentDetail.readCount }} · 评论 {{ currentDetail.commentCount }}</span>
        </div>
        <el-divider />
        <div class="detail-content" v-html="currentDetail.content"></div>

        <!-- 附件区域 -->
        <div v-if="currentDetail.attachments?.length" class="detail-attachments">
          <h4>附件：</h4>
          <ul>
            <li v-for="(url, idx) in currentDetail.attachments" :key="idx">
              <el-link :href="url" target="_blank">{{ getFileName(url) }}</el-link>
            </li>
          </ul>
        </div>

        <!-- 语音 -->
        <div v-if="currentDetail.voiceUrl" class="detail-voice">
          <h4>语音播报：</h4>
          <audio :src="currentDetail.voiceUrl" controls style="width: 100%"></audio>
        </div>

        <!-- 评论列表 -->
        <div class="comment-section" v-if="currentDetail.comments?.length">
          <h4>评论（{{ currentDetail.comments.length }}）</h4>
          <div v-for="comment in currentDetail.comments" :key="comment.id" class="comment-item">
            <div class="comment-user">{{ comment.userName }}</div>
            <div class="comment-content">{{ comment.content }}</div>
            <div class="comment-time">{{ formatDate(comment.createTime) }}</div>
          </div>
        </div>

        <!-- 发表评论输入框 -->
        <div class="comment-input" v-if="userStore.isLoggedIn">
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="2"
            placeholder="写下你的评论..."
            :disabled="submitting"
          />
          <el-button
            type="primary"
            @click="submitComment"
            :loading="submitting"
            style="margin-top: 10px; float: right"
          >
            发表评论
          </el-button>
        </div>
        <div v-else class="login-tip">
          <el-button type="text" @click="$router.push('/login')">登录后参与评论</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 语音播放弹窗 -->
    <el-dialog v-model="voiceVisible" title="语音播放" width="400px">
      <audio :src="currentVoiceUrl" controls autoplay style="width: 100%"></audio>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import {
  getNoticeList,
  deleteNotice,
  viewNotice,
  getNoticeDetail,
  commentNotice,
} from '@/api/notice'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Paperclip, VideoPlay, ChatDotRound } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

// 如果项目中定义了 NoticeDetail 类型，可以导入；否则使用 any 或定义局部类型
// import type { NoticeDetail, NoticeComment } from '@/types'

const router = useRouter()
const props = defineProps({
  queryParams: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:queryParams', 'delete-success'])

const userStore = useUserStore()
const hasDeletePermission = computed(() => {
  return userStore.isAdmin || userStore.isVillageOfficial
})

const noticeList = ref<any[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const loading = ref(false)

const detailVisible = ref(false)
const currentDetail = ref<any>(null)

const voiceVisible = ref(false)
const currentVoiceUrl = ref('')

// 评论相关
const commentContent = ref('')
const submitting = ref(false)

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      ...props.queryParams,
    }
    const res = await getNoticeList(params)
    // 根据后端实际返回结构调整
    noticeList.value = res.records || res.data || res
    total.value = res.total || res.totalCount || 0
  } catch (error) {
    ElMessage.error('获取列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 删除
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定删除公告"${row.title}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteNotice(row.id)
        ElMessage.success('删除成功')
        emit('delete-success', row.id)
        fetchData()
      } catch (error) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

// 查看详情（增加阅读量）
const viewDetail = async (row: any) => {
  try {
    // 调用阅读接口增加阅读量
    await viewNotice(row.id)
    row.readCount += 1

    // 获取完整详情（含评论列表）
    const detail = await getNoticeDetail(row.id)
    console.log('详情语音URL:', detail.voiceUrl);  // 添加这行
    currentDetail.value = detail
    detailVisible.value = true
  } catch (error) {
    ElMessage.error('获取详情失败')
    console.error(error)
  }
}

// 播放语音
const playVoice = (url: string) => {
  currentVoiceUrl.value = url
  voiceVisible.value = true
}

// 打开评论（直接显示详情弹窗，评论输入框已在弹窗内）
const openComment = (row: any) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  // 如果当前详情弹窗未打开，先打开并显示该公告详情
  if (!detailVisible.value || currentDetail.value?.id !== row.id) {
    viewDetail(row)
  } else {
    // 如果已经打开，则滚动到评论区域（可选）
    // 这里简单将焦点设置到输入框
    setTimeout(() => {
      const input = document.querySelector('.comment-input .el-textarea__inner') as HTMLElement
      input?.focus()
    }, 100)
  }
}

// 提交评论
const submitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  if (!currentDetail.value) return

  submitting.value = true
  try {
    await commentNotice(currentDetail.value.id, commentContent.value)
    ElMessage.success('评论成功')
    commentContent.value = ''
    // 刷新评论列表
    const updated = await getNoticeDetail(currentDetail.value.id)
    currentDetail.value = updated
  } catch (error) {
    ElMessage.error('评论失败')
  } finally {
    submitting.value = false
  }
}

// 辅助函数：获取文件名
const getFileName = (url: string) => {
  if (!url) return ''
  const parts = url.split('/')
  return parts[parts.length - 1]
}

// 判断是否过期
const isExpired = (expireTime: string) => {
  if (!expireTime) return false
  return new Date(expireTime) < new Date()
}

// 格式化日期（可选）
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
}

// 监听查询参数变化
watch(
  () => props.queryParams,
  () => {
    pageNum.value = 1 // 重置到第一页
    fetchData()
  },
  { deep: true }
)

onMounted(fetchData)

defineExpose({ fetchData })
</script>

<style scoped>
.notice-list {
  padding: 20px;
}
.detail-meta {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 14px;
  margin: 10px 0;
}
.detail-content {
  min-height: 200px;
  padding: 20px 0;
}
.detail-attachments ul {
  padding-left: 20px;
}
.detail-attachments li {
  margin: 5px 0;
}
.comment-item {
  border-bottom: 1px solid #eee;
  padding: 10px 0;
}
.comment-user {
  font-weight: bold;
  margin-bottom: 4px;
}
.comment-time {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}
.comment-input {
  margin-top: 20px;
  clear: both;
}
.login-tip {
  text-align: center;
  margin-top: 20px;
  color: #909399;
}
</style>