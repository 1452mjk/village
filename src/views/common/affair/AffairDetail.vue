<template>
  <div class="affair-detail">
    <div class="back">
      <el-button type="primary" link @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
    </div>

    <el-skeleton :loading="loading" animated :rows="15" v-if="loading" />

    <el-card v-else shadow="never">
      <template #header>
        <div class="detail-header">
          <h2>{{ affair.title }}</h2>
          <div class="meta">
            <el-tag :type="getTypeTagType(affair.type)" size="small">
              {{ getTypeLabel(affair.type) }}
            </el-tag>
            <span>发布时间：{{ affair.createTime }}</span>
            <span>发布人：{{ affair.publisherName || affair.publisherId }}</span>
            <span>公示期限：{{ affair.startDate }} 至 {{ affair.endDate }}</span>
            <span v-if="isExpired" class="expired">已过期</span>
          </div>
        </div>
      </template>

      <!-- 内容 -->
      <div class="content" v-html="affair.content" />

      <!-- 附件 -->
      <div v-if="affair.attachments?.length" class="attachments">
        <h4>附件：</h4>
        <div v-for="(url, index) in affair.attachments" :key="index" class="attachment-item">
          <el-link :href="url" target="_blank" :underline="false">
            <el-icon><Document /></el-icon>
            附件{{ index + 1 }}
          </el-link>
        </div>
      </div>

      <!-- 异议提交区域（通过 prop 控制是否显示，通常村民页面启用） -->
      <div v-if="showFeedbackForm && !isExpired && affair.allowFeedback" class="feedback-section">
        <h3>提出异议</h3>
        <el-input
          v-model="feedbackContent"
          type="textarea"
          :rows="3"
          placeholder="请输入您的异议内容"
          maxlength="500"
          show-word-limit
        />
        <div class="feedback-actions">
          <el-button type="primary" @click="handleSubmitFeedback" :loading="feedbackLoading">
            提交异议
          </el-button>
        </div>
      </div>

      <!-- 异议列表 -->
      <div class="feedback-list">
        <h3>异议反馈 ({{ affair.feedbacks?.length || 0 }})</h3>
        <div v-if="!affair.feedbacks?.length" class="no-data">暂无异议</div>
        <div v-for="fb in affair.feedbacks" :key="fb.id" class="feedback-item">
          <div class="feedback-user">
            <el-avatar :size="32" :src="fb.user?.avatar" />
            <span class="username">{{ fb.user?.realName || '村民' }}</span>
            <span class="time">{{ fb.createTime }}</span>
          </div>
          <div class="feedback-content">{{ fb.content }}</div>
          <div v-if="fb.attachments?.length" class="feedback-attachments">
            <el-link v-for="(url, idx) in fb.attachments" :key="idx" :href="url" target="_blank">
              附件{{ idx + 1 }}
            </el-link>
          </div>

          <!-- 已有回复展示（无论角色） -->
          <div v-if="fb.replyContent" class="reply">
            <div class="reply-header">
              <el-avatar :size="24" :src="fb.replyUser?.avatar" />
              <span class="reply-name">{{ fb.replyUser?.realName || '村干部' }} 回复：</span>
              <span class="reply-time">{{ fb.replyTime }}</span>
            </div>
            <div class="reply-content">{{ fb.replyContent }}</div>
          </div>

          <!-- 插槽：供父组件添加操作（如村干部的回复框） -->
          <slot name="feedback-action" :feedback="fb" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Document } from '@element-plus/icons-vue'
import { getAffairDetail, getFeedbackList, submitFeedback } from '@/api/affair' // 导入获取反馈列表的 API
import type { VillageAffair, AffairFeedback } from '@/types'

const props = defineProps<{
  id: number | string
  showFeedbackForm?: boolean
}>()

const router = useRouter()

const loading = ref(true)
const affair = ref<VillageAffair & { feedbacks?: AffairFeedback[] }>({} as any)

// 异议提交
const feedbackContent = ref('')
const feedbackLoading = ref(false)

// 是否已过期
const isExpired = computed(() => {
  if (!affair.value.endDate) return false
  const today = new Date().toISOString().split('T')[0]
  return today > affair.value.endDate
})

const getTypeTagType = (type: string) => {
  const map: Record<string, string> = {
    financial: 'success',
    meeting: 'warning',
    notice: 'info',
  }
  return map[type] || ''
}

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    financial: '财务报表',
    meeting: '会议纪要',
    notice: '公示公告',
  }
  return map[type] || type
}

// 获取详情和异议列表
const fetchDetail = async () => {
  loading.value = true
  try {
    // 并发获取详情和反馈列表
    const [detailRes, feedbackRes] = await Promise.all([
      getAffairDetail(props.id),
      getFeedbackList({ affairId: props.id, page: 1, size: 100 }) // 获取所有反馈
    ])
    affair.value = detailRes
    // 将反馈列表附加到 affair 对象上
    affair.value.feedbacks = feedbackRes.records || []
  } catch (error) {
    console.error(error)
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

// 提交异议
const handleSubmitFeedback = async () => {
  if (!feedbackContent.value.trim()) {
    ElMessage.warning('请输入异议内容')
    return
  }
  feedbackLoading.value = true
  try {
    await submitFeedback(props.id, { content: feedbackContent.value })
    ElMessage.success('异议提交成功')
    feedbackContent.value = ''
    fetchDetail() // 重新获取详情和反馈列表
  } catch (error) {
    console.error(error)
  } finally {
    feedbackLoading.value = false
  }
}

const goBack = () => {
  router.back()
}

// 监听ID变化重新加载
watch(() => props.id, fetchDetail, { immediate: true })

defineExpose({ fetchDetail })
</script>

<style scoped>
/* 样式保持不变，省略 */
</style>

<style scoped>
/* 样式与原来一致，省略 */
.affair-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.back {
  margin-bottom: 20px;
}
.detail-header {
  margin-bottom: 20px;
}
.meta {
  color: #666;
  font-size: 14px;
  display: flex;
  gap: 20px;
  margin-top: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.expired {
  color: #f56c6c;
  font-weight: bold;
}
.content {
  line-height: 1.8;
  font-size: 16px;
  margin-bottom: 30px;
}
.attachments {
  margin-bottom: 30px;
}
.attachment-item {
  margin-top: 10px;
}
.feedback-section {
  border-top: 1px solid #eee;
  padding: 20px 0;
}
.feedback-actions {
  margin-top: 15px;
  text-align: right;
}
.feedback-list {
  border-top: 1px solid #eee;
  padding-top: 20px;
}
.no-data {
  color: #999;
  text-align: center;
  padding: 20px;
}
.feedback-item {
  border-bottom: 1px solid #f5f5f5;
  padding: 20px 0;
}
.feedback-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.username {
  font-weight: bold;
}
.time {
  font-size: 12px;
  color: #999;
}
.feedback-content {
  margin-bottom: 10px;
  padding-left: 42px;
}
.feedback-attachments {
  margin: 10px 0 10px 42px;
  display: flex;
  gap: 15px;
}
.reply {
  background-color: #f8f8f8;
  padding: 10px;
  margin: 10px 0 10px 42px;
  border-radius: 4px;
}
.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}
.reply-name {
  font-weight: bold;
  font-size: 13px;
}
.reply-time {
  font-size: 12px;
  color: #999;
}
.reply-content {
  padding-left: 32px;
}
</style>