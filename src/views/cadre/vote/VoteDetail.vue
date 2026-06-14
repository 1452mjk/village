<!-- cadre/VoteDetail.vue -->
<template>
  <VoteDetail :id="id">
    <!-- 村干部无需投票功能，但可以添加管理操作，例如结束投票、查看详情等 -->
    <template #action>
      <div class="cadre-actions">
        <el-button type="primary" @click="endVote" v-if="detail.status === 1">结束投票</el-button>
        <el-button @click="exportResult">导出结果</el-button>
      </div>
    </template>
  </VoteDetail>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import VoteDetail from '@/views/common/VoteDetail.vue'
import { endVote, exportVoteResult } from '@/api/vote'

const route = useRoute()
const id = Number(route.params.id)

const voteDetailRef = ref<InstanceType<typeof VoteDetail>>()
const detail = computed(() => voteDetailRef.value?.detail || {})

const endVote = async () => {
  try {
    await endVote(id)
    ElMessage.success('投票已结束')
    voteDetailRef.value?.fetchDetail()
  } catch (error) {
    console.error(error)
  }
}

const exportResult = () => {
  exportVoteResult(id)
}
</script>

<style scoped>
.cadre-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>