<template>
  <div class="notice-detail">
    <!-- 返回按钮 -->
    <div class="back">
      <el-button type="primary" link @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
    </div>

    <!-- 加载中 -->
    <el-skeleton :loading="loading" animated :rows="10" v-if="loading" />

    <!-- 内容 -->
    <el-card v-else shadow="never">
      <template #header>
        <div class="detail-header">
          <h2>{{ detail.title }}</h2>
          <div class="meta">
            <span>发布时间：{{ detail.publishTime }}</span>
            <span>阅读量：{{ detail.readCount }}</span>
            <span>点赞数：{{ detail.likeCount }}</span>
            <span>评论数：{{ detail.commentCount }}</span>
          </div>
        </div>
      </template>

      <!-- 语音播报按钮 -->
      <div v-if="detail.voiceUrl" class="voice-section">
        <el-button type="success" :icon="Voice" @click="playVoice" :loading="voicePlaying">
          {{ voicePlaying ? '播放中...' : '语音播报' }}
        </el-button>
        <audio ref="audioRef" :src="detail.voiceUrl" @ended="voicePlaying = false" />
      </div>

      <!-- 通知内容 -->
      <div class="content" v-html="detail.content" />

      <!-- 附件列表 -->
      <div v-if="detail.attachments?.length" class="attachments">
        <h4>附件：</h4>
        <div v-for="(url, index) in detail.attachments" :key="index" class="attachment-item">
          <el-link :href="url" target="_blank" :underline="false">
            <el-icon><Document /></el-icon>
            附件{{ index + 1 }}
          </el-link>
        </div>
      </div>

      

      <!-- 评论区域 -->
      <div class="comments">
        <h3>评论 ({{ detail.comments?.length || 0 }})</h3>
        <div class="comment-input">
          <el-input
            v-model="newComment"
            type="textarea"
            :rows="2"
            placeholder="写下你的评论..."
          />
          <el-button type="primary" @click="submitComment" :loading="commentLoading">
            发表评论
          </el-button>
        </div>

        <div class="comment-list">
          <div v-for="comment in detail.comments" :key="comment.id" class="comment-item">
            <div class="comment-user">
              <el-avatar :size="32" :src="comment.user?.avatar" />
              <span class="username">{{ comment.user?.realName || '匿名' }}</span>
              <span class="time">{{ comment.createTime }}</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
            <!-- 回复按钮可扩展 -->
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Voice, Document, Star } from '@element-plus/icons-vue'
import { getNoticeDetail, likeNotice, commentNotice } from '@/api/notice'
import type { NoticeDetail } from '@/types'

const route = useRoute()
const router = useRouter()
const noticeId = Number(route.params.id)

const loading = ref(true)
const detail = ref<NoticeDetail>({} as NoticeDetail)

// 语音相关
const audioRef = ref<HTMLAudioElement>()
const voicePlaying = ref(false)

// 点赞
const liked = ref(false) // 如果后端有接口可查询用户是否已点赞，此处简化
const likeLoading = ref(false)

// 评论
const newComment = ref('')
const commentLoading = ref(false)

// 获取详情
const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getNoticeDetail(noticeId)
    detail.value = res
  } catch (error) {
    console.error(error)
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

// 语音播放
const playVoice = () => {
  if (audioRef.value) {
    audioRef.value.play()
    voicePlaying.value = true
  }
}

// 点赞
const handleLike = async () => {
  likeLoading.value = true
  try {
    await likeNotice(noticeId)
    // 更新点赞数（前端临时增加，也可重新获取详情）
    detail.value.likeCount++
    liked.value = true
    ElMessage.success('点赞成功')
  } catch (error) {
    console.error(error)
  } finally {
    likeLoading.value = false
  }
}

// 提交评论
const submitComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  commentLoading.value = true
  try {
    await commentNotice(noticeId, newComment.value)
    ElMessage.success('评论成功')
    newComment.value = ''
    // 重新获取详情以更新评论列表
    fetchDetail()
  } catch (error) {
    console.error(error)
  } finally {
    commentLoading.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.notice-detail {
  max-width: 800px;
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
  color: #999;
  font-size: 14px;
  display: flex;
  gap: 20px;
  margin-top: 10px;
}
.voice-section {
  margin-bottom: 20px;
  text-align: center;
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
.like-section {
  text-align: center;
  margin-bottom: 30px;
}
.comments {
  border-top: 1px solid #eee;
  padding-top: 20px;
}
.comment-input {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}
.comment-list {
  margin-top: 20px;
}
.comment-item {
  border-bottom: 1px solid #f5f5f5;
  padding: 15px 0;
}
.comment-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.username {
  font-weight: bold;
}
.time {
  font-size: 12px;
  color: #999;
}
.comment-content {
  padding-left: 42px;
}
</style>