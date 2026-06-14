<template>
  <DemandDetailBase ref="baseRef" :id="id">
    <template #actions="{ demand, order }">
      <!-- 商户操作按钮 -->
      <el-button v-if="demand.status === 0" type="primary" @click="handleGrab" :loading="grabLoading">抢单</el-button>
      <el-button v-if="demand.status === 1" type="warning" @click="handleUpdateStatus('IN_PROGRESS')">开始服务</el-button>
      <el-button v-if="demand.status === 2" type="success" @click="openCompleteDialog">完成服务</el-button>
    </template>
  </DemandDetailBase>

  <!-- 完成服务弹窗（上传凭证） -->
  <common-dialog
    v-model="completeDialogVisible"
    title="完成服务"
    width="500px"
    @confirm="submitComplete"
    :confirm-loading="completeLoading"
  >
    <el-upload
      v-model:file-list="proofFileList"
      action="#"
      list-type="picture-card"
      :auto-upload="false"
      :on-preview="handlePreview"
      :on-change="handleProofChange"
      :before-upload="() => false"
      multiple
    >
      <el-icon><Plus /></el-icon>
    </el-upload>
    <div class="upload-tip">可上传服务完成凭证图片（最多5张）</div>
  </common-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import DemandDetailBase from '@/views/common/service/DemandDetailBase.vue'
import CommonDialog from '@/components/CommonDialog.vue'
import { grabDemand, updateOrderStatus, getOrderProofToken } from '@/api/service'
import { useOssUpload } from '@/composables/useOssUpload'

const route = useRoute()
const id = Number(route.params.id)

const baseRef = ref<InstanceType<typeof DemandDetailBase>>()

// 抢单
const grabLoading = ref(false)
const handleGrab = async () => {
  grabLoading.value = true
  try {
    await grabDemand(id)
    ElMessage.success('抢单成功')
    baseRef.value?.fetchDetail()
  } catch (error) {
    console.error(error)
  } finally {
    grabLoading.value = false
  }
}

// 更新订单状态（开始服务或完成服务）
const handleUpdateStatus = async (status: string, proof?: string[]) => {
  const order = baseRef.value?.order
  if (!order) {
    ElMessage.warning('订单不存在')
    return
  }
  try {
    await updateOrderStatus(order.id, status, proof)
    ElMessage.success('操作成功')
    baseRef.value?.fetchDetail()
  } catch (error) {
    console.error(error)
  }
}

// ---------- 完成服务（OSS 凭证上传） ----------
const { uploading, uploadFile } = useOssUpload()
const completeDialogVisible = ref(false)
const completeLoading = ref(false)
const proofFileList = ref<any[]>([])
// 存储上传后的 objectName 列表
const uploadedProofObjects = ref<string[]>([])

const openCompleteDialog = () => {
  const order = baseRef.value?.order
  if (!order) {
    ElMessage.warning('订单不存在')
    return
  }
  completeDialogVisible.value = true
  proofFileList.value = []
  uploadedProofObjects.value = []
}

// 文件变化时立即上传到 OSS
const handleProofChange = async (file: any, fileList: any[]) => {
  // 如果是已上传的文件（有 objectName），不再重复上传
  if (file.status === 'success') return

  try {
    // 显示上传中状态
    file.status = 'uploading'
    file.percentage = 0

    // 上传到 OSS
    const { objectName } = await uploadFile(file.raw, '/api/order/proof/token', {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
      onProgress: (percent) => {
        file.percentage = percent
      }
    })

    // 保存 objectName 到列表
    uploadedProofObjects.value.push(objectName)

    // 更新文件列表项，使其显示为上传成功
    file.status = 'success'
    file.url = '' // 不需要预览 URL，因为订单详情页会通过签名 URL 展示
    file.response = { objectName }
  } catch (error: any) {
    file.status = 'fail'
    file.response = { error: error.message }
    ElMessage.error(`上传失败：${error.message}`)
  } finally {
    // 更新文件列表引用
    proofFileList.value = fileList
  }
}

const submitComplete = async () => {
  const order = baseRef.value?.order
  if (!order) return

  if (uploadedProofObjects.value.length === 0) {
    ElMessage.warning('请至少上传一张凭证图片')
    return
  }

  completeLoading.value = true
  try {
    await handleUpdateStatus('COMPLETED', uploadedProofObjects.value)
    ElMessage.success('服务完成，等待村民评价')
    completeDialogVisible.value = false
    baseRef.value?.fetchDetail()
  } catch (error) {
    console.error(error)
  } finally {
    completeLoading.value = false
  }
}

const handlePreview = (file: any) => {
  // 预览逻辑（可选）
}
</script>

<style scoped>
.upload-tip {
  margin-top: 10px;
  color: #999;
  font-size: 12px;
}
</style>