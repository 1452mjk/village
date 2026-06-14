<!-- user/VoteDetail.vue -->
<template>
  <VoteDetail ref="voteDetailRef" :id="id">
    <!-- 在每个选项前插入单选按钮 -->
    <template #option-prefix="{ option }">
      <el-radio
        v-if="!detail.hasVoted && detail.status === 1"
        v-model="selectedOption"
        :label="option.optionId"
        @change="handleOptionChange"
        class="option-radio"
      >
        <!-- 注意：el-radio 的默认插槽会显示 label，但我们不希望重复显示文本，所以留空，文本由公共组件显示 -->
        <span></span>
      </el-radio>
    </template>

    <!-- 投票按钮（村民未投票且进行中） -->
    <template #action>
      <div v-if="userStore.isVillager && detail.status === 1 && !detail.hasVoted" class="vote-action">
        <el-button type="primary" size="large" @click="submitVote" :loading="voteLoading">
          提交投票
        </el-button>
      </div>
    </template>
  </VoteDetail>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import VoteDetail from '@/views/common/VoteDetail.vue'
import { castVote } from '@/api/vote'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()
const id = Number(route.params.id)

const voteDetailRef = ref<InstanceType<typeof VoteDetail>>()
// 通过 ref 获取公共组件内部的 detail 数据（也可以使用事件，但简单通过 ref 读取）
const detail = computed(() => voteDetailRef.value?.detail || {})

const selectedOption = ref<number | null>(null)
const voteLoading = ref(false)

const handleOptionChange = (val: number) => {
  selectedOption.value = val
}

const submitVote = async () => {
  if (!selectedOption.value) {
    ElMessage.warning('请选择一个选项')
    return
  }
  voteLoading.value = true
  try {
    await castVote(id, selectedOption.value)
    ElMessage.success('投票成功')
    voteDetailRef.value?.fetchDetail() // 刷新详情
  } catch (error) {
    console.error(error)
  } finally {
    voteLoading.value = false
  }
}
</script>

<style scoped>
.option-radio {
  margin-right: 8px;
}
.vote-action {
  text-align: center;
  margin: 30px 0;
}
</style>