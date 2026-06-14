<template>
  <div class="notice-manage">
    <el-button type="primary" @click="handleAdd">新增公告</el-button>
    <NoticeList ref="noticeListRef" :query-params="queryParams">
      <template #action="{ row }">
        <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
        <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
      </template>
    </NoticeList>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="60%">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" rows="4" />
        </el-form-item>

        <!-- 附件上传（多文件） -->
        <el-form-item label="附件">
          <el-upload
            v-model:file-list="form.attachmentFiles"
            :http-request="handleAttachmentUpload"
            :before-upload="beforeUpload"
            multiple
            list-type="text"
            :on-remove="handleAttachmentRemove"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">支持多个文件，每个不超过10MB</div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 语音播报生成 -->
        <el-form-item label="语音播报">
          <el-button
            type="success"
            :loading="generatingVoice"
            @click="generateVoice"
            :disabled="!form.content"
          >
            {{ form.voiceUrl ? '重新生成语音' : '生成语音' }}
          </el-button>
          <span v-if="form.voiceUrl" class="voice-info">
            <el-icon><VideoPlay /></el-icon>
            <audio :src="form.voiceUrl" controls style="margin-left: 10px;"></audio>
          </span>
        </el-form-item>

        <!-- 过期时间 -->
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="form.expireTime"
            type="datetime"
            placeholder="选择过期时间（可选）"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NoticeList from '@/views/common/notice/NoticeList.vue'
import { publishNotice, updateNotice, deleteNotice, getNoticeAttachmentToken } from '@/api/notice'
import { generateVoice as apiGenerateVoice } from '@/api/notice'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay } from '@element-plus/icons-vue'
import { useOssUpload } from '@/composables/useOssUpload'  // 导入 OSS 上传组合式函数

const noticeListRef = ref()
const queryParams = ref({})

// OSS 上传
const { uploadFile } = useOssUpload()

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增公告')
const saving = ref(false)
const generatingVoice = ref(false)

// 表单数据结构
const form = ref({
  title: '',
  content: '',
  attachmentFiles: [],           // Element Plus 文件列表（用于展示）
  attachmentObjects: [],         // 存储 OSS objectName 数组（用于提交）
  voiceObjectName: '',  // 新增，存储 OSS objectName
  voiceUrl: '',         // 预览 URL（签名 URL）
  expireTime: ''
})
const editingId = ref(null)

// 文件上传前校验
const beforeUpload = (file) => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('不支持的文件类型')
    return false
  }
  return true
}

// 自定义上传处理
const handleAttachmentUpload = async (options) => {
  const { file, onSuccess, onError } = options
  try {
    // 调用 useOssUpload 的上传方法，传入文件、token 接口和选项
    const { objectName } = await uploadFile(file, '/api/notice/attachment/token', {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    })

    // 将 objectName 存储到表单数据中
    form.value.attachmentObjects.push(objectName)

    // 将 objectName 附加到 file 对象上，便于移除时使用
    file.response = { objectName }

    // 通知 Element Plus 上传成功
    onSuccess({ objectName })
  } catch (error) {
    ElMessage.error(error.message || '上传失败')
    onError(error)
  }
}

// 移除文件时的处理
const handleAttachmentRemove = (file, fileList) => {
  // 从 file.response 中获取 objectName
  const objectName = file.response?.objectName
  if (objectName) {
    const index = form.value.attachmentObjects.indexOf(objectName)
    if (index > -1) form.value.attachmentObjects.splice(index, 1)
  }
  // 可选：调用后端接口删除 OSS 文件（如需要）
  // deleteOSSFile(objectName)
}

// 生成语音
const generateVoice = async () => {
  if (!form.value.content) {
    ElMessage.warning('请先填写公告内容')
    return
  }
  generatingVoice.value = true
  try {
    const res = await apiGenerateVoice(form.value.content)
    form.value.voiceObjectName = res.objectName
    form.value.voiceUrl = res.url
     console.log('语音生成结果:', res)            // 查看返回数据
    ElMessage.success('语音生成成功')
  } catch (error) {
    ElMessage.error('语音生成失败：' + error.message)
  } finally {
    generatingVoice.value = false
  }
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增公告'
  form.value = {
    title: '',
    content: '',
    attachmentFiles: [],
    attachmentObjects: [],
    voiceUrl: '',
    expireTime: ''
  }
  editingId.value = null
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑公告'
  // 将后端返回的 attachments 对象数组转换为 file-list 和 attachmentObjects
  const attachmentFiles = []
  const attachmentObjects = []
  if (row.attachments && Array.isArray(row.attachments)) {
    row.attachments.forEach((att, index) => {
      attachmentFiles.push({
        name: att.fileName || `附件${index + 1}`,
        url: att.url,
        response: { objectName: att.objectName }
      })
      attachmentObjects.push(att.objectName)
    })
  }
  form.value = {
    title: row.title,
    content: row.content,
    attachmentFiles,
    attachmentObjects,
    voiceObjectName: row.voiceObjectName || '',  // 后端返回的 objectName
    voiceUrl: row.voiceUrl || '',                // 后端返回的签名 URL
    expireTime: row.expireTime || ''
  }
  editingId.value = row.id
  dialogVisible.value = true
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该公告吗？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteNotice(row.id)
      ElMessage.success('删除成功')
      if (noticeListRef.value?.fetchData) {
        await noticeListRef.value.fetchData()
      }
    } catch (error) {
      ElMessage.error('删除失败：' + error.message)
    }
  }).catch(() => {})
}

// 保存
const handleSave = async () => {
  if (!form.value.title || !form.value.content) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  saving.value = true
  try {
    const data = {
      title: form.value.title,
      content: form.value.content,
      attachments: form.value.attachmentObjects,
      voiceUrl: form.value.voiceObjectName || null,  // 提交 objectName
      expireTime: form.value.expireTime || null
    }
     console.log('提交的数据:', data) // 检查 voiceUrl 是否有值

    if (editingId.value) {
      await updateNotice(editingId.value, data)
      ElMessage.success('修改成功')
    } else {
      await publishNotice(data)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    if (noticeListRef.value?.fetchData) {
      await noticeListRef.value.fetchData()
    }
  } catch (error) {
    ElMessage.error('操作失败：' + error.message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.voice-info {
  display: inline-flex;
  align-items: center;
  margin-left: 10px;
}
</style>