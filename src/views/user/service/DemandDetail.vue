<template>
  <DemandDetailBase ref="baseRef" :id="id">
    <template #actions="{ demand, order }">
      <el-button v-if="demand?.status === 3" type="success" @click="openEvaluateDialog">评价</el-button>
    </template>
  </DemandDetailBase>

  <!-- 评价弹窗 -->
  <common-dialog
    v-model="evaluateDialogVisible"
    title="评价服务"
    width="500px"
    @confirm="submitEvaluate"
    :confirm-loading="evaluateLoading"
  >
    <el-form :model="evaluateForm" label-width="80px">
      <el-form-item label="评分">
        <el-rate v-model="evaluateForm.score" :texts="['很差', '较差', '一般', '满意', '非常满意']" show-text />
      </el-form-item>
      <el-form-item label="评价内容">
        <el-input v-model="evaluateForm.comment" type="textarea" :rows="3" placeholder="请输入评价内容" />
      </el-form-item>
    </el-form>
  </common-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import DemandDetailBase from '@/views/common/service/DemandDetailBase.vue'
import CommonDialog from '@/components/CommonDialog.vue'
import { evaluateOrder } from '@/api/service'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

// 如果 ID 无效，跳转回列表页
if (isNaN(id)) {
  ElMessage.error('无效的需求ID')
  router.replace('/service/demand/my')
}

const baseRef = ref<InstanceType<typeof DemandDetailBase>>()

// 评价弹窗
const evaluateDialogVisible = ref(false)
const evaluateLoading = ref(false)

// 评价表单（定义类型）
interface EvaluateForm {
  score: number
  comment: string
}
const evaluateForm = ref<EvaluateForm>({ score: 5, comment: '' })

const openEvaluateDialog = () => {
  const order = baseRef.value?.order
  if (!order) {
    ElMessage.warning('订单不存在，无法评价')
    return
  }
  evaluateForm.value = { score: 5, comment: '' }
  evaluateDialogVisible.value = true
}

const submitEvaluate = async () => {
  const order = baseRef.value?.order
  if (!order) {
    ElMessage.error('订单不存在')
    return
  }
  if (!evaluateForm.value.score) {
    ElMessage.warning('请先评分')
    return
  }
  evaluateLoading.value = true
  try {
    await evaluateOrder(order.id, evaluateForm.value)
    ElMessage.success('评价成功')
    evaluateDialogVisible.value = false
    await baseRef.value?.fetchDetail() // 刷新详情
  } catch (error) {
    console.error('评价失败', error)
    ElMessage.error('评价失败，请稍后重试')
  } finally {
    evaluateLoading.value = false
  }
}
</script>