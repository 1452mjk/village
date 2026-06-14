<!-- cadre/AffairDetail.vue -->
<template>
  <div class="cadre-affair-detail">
    <AffairDetail
      ref="affairDetailRef"
      :id="id"
      :show-feedback-form="false"
    >
      <!-- 在每条异议后插入村干部的回复框 -->
      <template #feedback-action="{ feedback }">
        <div v-if="feedback.status === 0" class="reply-input">
          <el-input
            v-model="replyMap[feedback.id]"
            placeholder="输入回复内容"
            size="small"
          />
          <el-button
            size="small"
            type="primary"
            @click="submitReply(feedback.id)"
            :loading="replyLoading[feedback.id]"
          >
            回复
          </el-button>
        </div>
      </template>
    </AffairDetail>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import AffairDetail from '@/views/common/AffairDetail.vue'
import { replyFeedback } from '@/api/affair'

const route = useRoute()
const id = Number(route.params.id)

const affairDetailRef = ref<InstanceType<typeof AffairDetail>>()

const replyMap = ref<Record<number, string>>({})
const replyLoading = ref<Record<number, boolean>>({})

const submitReply = async (feedbackId: number) => {
  const replyContent = replyMap.value[feedbackId]
  if (!replyContent?.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  replyLoading.value[feedbackId] = true
  try {
    await replyFeedback(feedbackId, replyContent)
    ElMessage.success('回复成功')
    replyMap.value[feedbackId] = ''
    // 刷新公共组件的详情
    affairDetailRef.value?.fetchDetail()
  } catch (error) {
    console.error(error)
  } finally {
    replyLoading.value[feedbackId] = false
  }
}
</script>

<style scoped>
.reply-input {
  margin: 10px 0 0 42px;
  display: flex;
  gap: 10px;
}
</style>