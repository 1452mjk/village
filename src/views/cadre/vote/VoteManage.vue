<!-- cadre/VoteManage.vue -->
<template>
  <div class="vote-manage">
    <VoteList ref="voteListRef">
      <template #search-append>
        <el-button type="success" @click="handlePublish">发起投票</el-button>
      </template>
      <template #action-append="{ row }">
        <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
        <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
      </template>
    </VoteList>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import VoteList from '@/views/common/VoteList.vue'
import { deleteVote } from '@/api/vote'
import type { Vote } from '@/types'

const router = useRouter()
const voteListRef = ref<InstanceType<typeof VoteList>>()

const handlePublish = () => {
  router.push('/vote/publish')
}

const handleEdit = (row: Vote) => {
  router.push(`/vote/edit/${row.id}`)
}

const handleDelete = (row: Vote) => {
  ElMessageBox.confirm('确认删除该投票吗？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteVote(row.id)
    ElMessage.success('删除成功')
    voteListRef.value?.fetchData()
  })
}
</script>