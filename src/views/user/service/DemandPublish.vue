<template>
  <div class="demand-publish">
    <div class="page-header">
      <h2>发布服务需求</h2>
    </div>

    <el-card shadow="never">
      <common-form
        ref="formRef"
        v-model="formData"
        :form-items="formItems"
        :rules="rules"
        label-width="100px"
      />

      <div class="form-actions">
        <el-button @click="goBack">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">发布</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { publishDemand } from '@/api/service'
import CommonForm from '@/components/CommonForm.vue'
import type { DemandPublishRequest } from '@/types'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)

let formData = reactive<DemandPublishRequest>({
  serviceType: '',
  description: '',
  budget: undefined,
  address: '',
  contactPhone: '',
})

const formItems = [
  { prop: 'serviceType', label: '服务类型', type: 'select', required: true, span: 24, options: [
    { label: '家电维修', value: '家电维修' },
    { label: '农机租赁', value: '农机租赁' },
    { label: '家政服务', value: '家政服务' },
    { label: '农资购买', value: '农资购买' },
    { label: '其他', value: '其他' },
  ]},
  { prop: 'description', label: '需求描述', type: 'textarea', required: true, span: 24, rows: 4 },
  { prop: 'budget', label: '预算（元）', type: 'number', span: 12, min: 0 },
  { prop: 'address', label: '联系地址', type: 'input', required: true, span: 24 },
  { prop: 'contactPhone', label: '联系电话', type: 'input', required: true, span: 12 },
]

const rules = {
  contactPhone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  submitting.value = true
  try {
    await publishDemand(formData)
    ElMessage.success('发布成功')
    router.push('/service/demand/my')
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.demand-publish {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
.page-header {
  margin-bottom: 20px;
}
.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>