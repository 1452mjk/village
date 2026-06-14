<template>
  <div class="product-publish">
    <div class="page-header">
      <h2>发布农产品</h2>
    </div>

    <el-card shadow="never">
      <common-form
        ref="formRef"
        v-model="formData"
        :form-items="formItems"
        :rules="rules"
        label-width="100px"
      />

      <!-- 图片上传（至少3张，最多5张） -->
      <div class="upload-section">
        <h3>产品图片（至少3张，最多5张）</h3>
        <el-upload
          v-model:file-list="imageList"
          action="#"
          list-type="picture-card"
          :http-request="handleUpload"
          :on-preview="handlePicturePreview"
          :on-remove="handleRemove"
          :before-upload="beforeUpload"
          :limit="5"
          multiple
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
        <el-dialog v-model="previewVisible">
          <img :src="previewUrl" alt="预览" style="width: 100%" />
        </el-dialog>
      </div>

      <div class="form-actions">
        <el-button @click="goBack">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">提交发布</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { publishProduct, getProductImageToken } from '@/api/product'
import CommonForm from '@/components/CommonForm.vue'
import { useOssUpload } from '@/composables/useOssUpload'
import type { UploadFile, UploadUserFile } from 'element-plus'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)

// OSS 上传工具
const { uploading, uploadFile } = useOssUpload()

const formData = ref({
  name: '',
  type: '',
  origin: '',
  specifications: '',
  price: undefined,
  totalOutput: undefined,
  description: '',
  tradeMode: 'retail',
  contactPhone: '',
})

const formItems = [
  { prop: 'name', label: '产品名称', type: 'input', required: true, span: 12 },
  { prop: 'type', label: '类型', type: 'select', required: true, span: 12, options: [
    { label: '蔬菜', value: '蔬菜' },
    { label: '水果', value: '水果' },
    { label: '手工艺品', value: '手工艺品' },
    { label: '其他', value: '其他' },
  ]},
  { prop: 'origin', label: '产地', type: 'input', required: true, span: 12 },
  { prop: 'specifications', label: '规格', type: 'input', placeholder: '例如：5斤/箱', span: 12 },
  { prop: 'price', label: '价格', type: 'number', required: true, span: 12, min: 0, step: 0.01 },
  { prop: 'totalOutput', label: '总产量', type: 'number', span: 12, min: 0 },
  { prop: 'tradeMode', label: '交易模式', type: 'radio', required: true, span: 24, options: [
    { label: '零售', value: 'retail' },
    { label: '批发', value: 'wholesale' },
  ]},
  { prop: 'contactPhone', label: '联系电话', type: 'input', required: true, span: 12 },
  { prop: 'description', label: '详细描述', type: 'textarea', span: 24, rows: 4 },
]

const rules = {
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
}

// 图片上传
const imageList = ref<UploadUserFile[]>([])
const previewVisible = ref(false)
const previewUrl = ref('')
// 存储上传成功的 OSS objectName 列表
const uploadedObjectNames = ref<string[]>([])

// 上传前校验
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB')
    return false
  }
  return true
}

// 自定义上传处理（OSS 直传）
const handleUpload = async (options: any) => {
  const { file, onSuccess, onError } = options

  try {
    // 使用本地 URL 临时预览
    const localUrl = URL.createObjectURL(file)
    const tempFile = {
      uid: file.uid,
      name: file.name,
      status: 'uploading',
      percentage: 0,
      url: localUrl,
    }
    // 更新到列表（为了显示进度，需要手动维护 fileList）
    // 但 el-upload 的 v-model 会自动添加文件，我们只需在上传过程中更新它的状态
    const targetFile = imageList.value.find(f => f.uid === file.uid)
    if (targetFile) {
      targetFile.status = 'uploading'
      targetFile.percentage = 0
    }

    // 上传到 OSS
    const { objectName } = await uploadFile(file, '/api/product/image/token', {
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
      onProgress: (percent) => {
        if (targetFile) targetFile.percentage = percent
      },
    })

    // 保存 objectName
    uploadedObjectNames.value.push(objectName)

    // 更新文件状态为成功，保留本地预览 URL
    if (targetFile) {
      targetFile.status = 'success'
      targetFile.percentage = 100
      targetFile.response = { objectName } // 可选
    }

    onSuccess({ objectName })
  } catch (err: any) {
    const targetFile = imageList.value.find(f => f.uid === file.uid)
    if (targetFile) {
      targetFile.status = 'fail'
      targetFile.response = { error: err.message }
    }
    onError(err)
    ElMessage.error(err.message || '上传失败')
  }
}

const handleRemove = (file: UploadFile) => {
  // 从 uploadedObjectNames 中移除对应的 objectName（可选）
  const index = uploadedObjectNames.value.findIndex((_, i) => i === imageList.value.findIndex(f => f.uid === file.uid))
  if (index !== -1) uploadedObjectNames.value.splice(index, 1)
}

const handlePicturePreview = (file: UploadFile) => {
  previewUrl.value = file.url!
  previewVisible.value = true
}

// 提交发布
const handleSubmit = async () => {
  await formRef.value?.validate()

  if (uploadedObjectNames.value.length < 3) {
    ElMessage.warning('请至少上传3张产品图片')
    return
  }

  submitting.value = true
  try {
    await publishProduct({
      ...formData.value,
      images: uploadedObjectNames.value, // 提交 objectName 数组
    })
    ElMessage.success('发布成功，请等待管理员审核')
    router.push('/product/list')
  } catch (error) {
    console.error(error)
    ElMessage.error('发布失败')
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.product-publish {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.page-header {
  margin-bottom: 20px;
}
.upload-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>