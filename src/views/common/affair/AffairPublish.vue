<template>
  <div class="affair-publish">
    <div class="back">
      <el-button type="primary" link @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
    </div>

    <el-card>
      <template #header>
        <h2>发布村务</h2>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        v-loading="submitting"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio value="financial">财务报表</el-radio>
            <el-radio value="meeting">会议纪要</el-radio>
            <el-radio value="notice">公示公告</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="8"
            placeholder="请输入内容"
            maxlength="3000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="附件">
          <el-upload
  v-model:file-list="fileList"
  :http-request="handleUpload"
  :on-remove="handleFileRemove"
  multiple
  list-type="text"
>
  <el-button type="primary">选择文件</el-button>
</el-upload>
          <div class="upload-tip">支持上传图片、PDF、Excel等，单个文件不超过10MB</div>
        </el-form-item>

        <el-form-item label="公示期限" prop="dateRange" required>
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="允许异议" prop="allowFeedback">
          <el-switch v-model="form.allowFeedback" :active-value="true" :inactive-value="false" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">发布</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules, UploadFile, UploadFiles } from 'element-plus'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { publishAffair } from '@/api/affair'
import type { VillageAffair } from '@/types'
import { useOssUpload } from '@/composables/useOssUpload'

const router = useRouter()
const { uploadFile } = useOssUpload()

const formRef = ref<FormInstance>()
const submitting = ref(false)

// 将日期范围合并到 form 对象中
const form = reactive<Partial<VillageAffair> & { dateRange: [string, string] }>({
  title: '',
  type: undefined,
  content: '',
  allowFeedback: true,
  attachments: [],
  dateRange: ['', ''], // 新增字段，与验证规则 prop 对应
})

// 文件列表（用于展示）
const fileList = ref<UploadFile[]>([])

// 验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { max: 50, message: '标题不能超过50字', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { max: 3000, message: '内容不能超过3000字', trigger: 'blur' },
  ],
  dateRange: [
    { 
      required: true, 
      message: '请选择公示期限', 
      trigger: 'change',
      validator: (rule: any, value: [string, string], callback: any) => {
        if (!value || !value[0] || !value[1]) {
          callback(new Error('请选择公示期限'))
        } else {
          callback()
        }
      }
    },
  ],
}

// 自定义上传
const handleUpload = async (options: any) => {
  const { file, onSuccess, onError } = options

  // 确保 attachments 是数组
  if (!Array.isArray(form.attachments)) {
    form.attachments = []
  }

  try {
    const { objectName } = await uploadFile(file, '/api/affair/attachment/token', {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    })

    form.attachments.push(objectName)
    ;(file as any).objectName = objectName

    onSuccess({ objectName })
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败')
    onError(error)
  }
}

// 移除文件时同步从 form.attachments 中删除 objectName
const handleFileRemove = (uploadFile: any, uploadFiles: any[]) => {
  const objectName = uploadFile.objectName || uploadFile.response?.objectName
  if (objectName && Array.isArray(form.attachments)) {
    const index = form.attachments.indexOf(objectName)
    if (index > -1) form.attachments.splice(index, 1)
  }
}

// 提交
const submitForm = async () => {
  await formRef.value?.validate()
  submitting.value = true
  try {
    const submitData = {
      ...form,
      startDate: form.dateRange[0],
      endDate: form.dateRange[1],
      attachments: (form.attachments || []).filter(Boolean), // 确保过滤空值
    }
    delete (submitData as any).dateRange
    await publishAffair(submitData)
    ElMessage.success('发布成功')
    router.push('/admin/affair/list')
  } catch (error: any) {
    console.error('发布失败', error)
    ElMessage.error(error.response?.data?.message || error.message || '发布失败')
  } finally {
    submitting.value = false
  }
}
const goBack = () => {
  router.back()
}
</script>

<style scoped>
.affair-publish {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.back {
  margin-bottom: 20px;
}
.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}
</style>