<template>
  <div class="vote-detail">
    <div class="back">
      <el-button type="primary" link @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
    </div>

    <el-skeleton :loading="loading" animated :rows="10" v-if="loading" />

    <el-card v-else shadow="never">
      <template #header>
        <div class="detail-header">
          <h2>{{ detail.title }}</h2>
          <div class="meta">
            <el-tag :type="getStatusTag(detail.status)" size="small">
              {{ getStatusText(detail.status) }}
            </el-tag>
            <span>发起人：{{ detail.initiatorName || '村干部' }}</span>
            <span>投票时间：{{ formatDate(detail.startTime) }} ~ {{ formatDate(detail.endTime) }}</span>
            <span>总参与：{{ detail.totalVoters || 0 }} 人</span>
          </div>
        </div>
      </template>

      <p v-if="detail.description" class="description">{{ detail.description }}</p>

      <!-- 投票选项 -->
      <div v-if="detail.options && detail.options.length" class="options">
        <div
          v-for="option in detail.options"
          :key="option.optionId"
          class="option-item"
          :class="{ 'selected': selectedOptionId === option.optionId }"
        >
          <div class="option-header">
            <!-- 单选框：仅当未投票且投票进行中时显示 -->
            <el-radio
              v-if="!detail.hasVoted && detail.status === 1 && !isEnded"
              v-model="selectedOptionId"
              :label="option.optionId"
              size="large"
              
            />
            <span class="option-text">{{ option.optionText }}</span>
            <span class="vote-count">{{ option.voteCount }} 票</span>
          </div>
          <!-- 进度条：已投票或投票结束后显示 -->
          <el-progress
            v-if="detail.hasVoted || detail.status === 2"
            :percentage="getOptionPercentage(option)"
            :format="() => getOptionPercentage(option).toFixed(1) + '%'"
          />
        </div>
      </div>
      <el-empty v-else description="暂无选项" />

      <!-- 投票操作区域 -->
      <div v-if="!detail.hasVoted && detail.status === 1 && !isEnded" class="vote-action">
        <el-button type="primary" @click="handleCastVote" :loading="voting" :disabled="!selectedOptionId">
          提交投票
        </el-button>
      </div>

      <!-- 已投票提示 -->
      <div v-if="detail.hasVoted" class="voted-tip">
        <el-alert type="success" :closable="false">
          您已参与过该投票
        </el-alert>
      </div>

      <!-- 投票已结束提示 -->
      <div v-if="detail.status === 2" class="ended-tip">
        <el-alert type="info" :closable="false">
          该投票已结束
        </el-alert>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getVoteDetail, castVote } from '@/api/vote'
import type { VoteDetail, VoteOption } from '@/types'

const props = defineProps<{
  id: number | string
}>()

const router = useRouter()

const loading = ref(true)
// 使用灵活的类型（可替换为具体的接口定义）
const detail = ref<any>({})
const selectedOptionId = ref<number | null>(null)
const voting = ref(false)

// 判断投票是否已结束（根据时间）
const isEnded = computed(() => {
  if (!detail.value.endTime) return false
  return new Date() > new Date(detail.value.endTime)
})

// 安全格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  return dateStr.slice(0, 16).replace('T', ' ')
}

const getStatusText = (status?: number) => (status === 1 ? '进行中' : '已结束')
const getStatusTag = (status?: number) => (status === 1 ? 'success' : 'info')

// 计算单个选项的百分比
const getOptionPercentage = (option: any) => {
  const total = detail.value.totalVoters || 0
  if (total === 0) return 0
  return ((option.voteCount || 0) / total) * 100
}

// 获取详情，并将后端字段映射为前端统一字段
const fetchDetail = async () => {
  if (!props.id || props.id === 'undefined') {
    console.warn('无效的投票ID', props.id)
    loading.value = false
    return
  }
  loading.value = true
  try {
    const res = await getVoteDetail(props.id)
    console.log('后端返回详情:', res)
    // 直接赋值，不修改选项字段
    detail.value = res
    // 如果需要额外的 id 字段（例如用于 handleCastVote），可以添加
    // 但后端已经返回 voteId，建议直接用 detail.value.voteId
    // 为了兼容之前的代码，可以添加 id: res.voteId
    detail.value.id = res.voteId

    if (res.hasVoted) {
      selectedOptionId.value = null
    }
  } catch (error) {
    console.error('获取投票详情失败', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 提交投票
const handleCastVote = async () => {
  if (!detail.value || !detail.value.voteId) {
    ElMessage.error('投票信息未加载完成，请稍后重试')
    return
  }
  const voteId = Number(detail.value.voteId)
  const optionId = selectedOptionId.value ? Number(selectedOptionId.value) : null
  if (!optionId) {
    ElMessage.warning('请选择一个选项')
    return
  }
  
  voting.value = true
  try {
    await castVote(voteId, optionId)
    ElMessage.success('投票成功')
    await fetchDetail() // 重新获取详情，更新投票数和状态
  } catch (error: any) {
    console.error('投票失败', error)
    ElMessage.error(error.response?.data?.message || '投票失败')
  } finally {
    voting.value = false
  }
}

const handleOptionChange = (value: number) => {
  // 可选处理
}

const goBack = () => {
  router.back()
}

// 监听 id 变化，重新获取详情
watch(() => props.id, fetchDetail, { immediate: true })
</script>

<style scoped>
.vote-detail {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
.back {
  margin-bottom: 20px;
}
.meta {
  color: #999;
  font-size: 14px;
  display: flex;
  gap: 20px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.description {
  margin-bottom: 30px;
}
.options {
  margin: 30px 0;
}
.option-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  transition: all 0.3s;
}
.option-item.selected {
  border-color: #409EFF;
  background-color: #ecf5ff;
}
.option-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.option-text {
  flex: 1;
  font-weight: bold;
}
.vote-count {
  color: #999;
}
.vote-action {
  text-align: center;
  margin: 30px 0;
}
.voted-tip,
.ended-tip {
  margin-top: 20px;
}
</style>