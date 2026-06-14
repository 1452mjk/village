<template>
  <div class="vote-publish">
    <div class="page-header">
      <h2>发起投票</h2>
    </div>

    <el-card shadow="never">
      <common-form
        ref="formRef"
        v-model="formData"
        :form-items="formItems"
        :rules="rules"
        label-width="120px"
      />

      <!-- 选项动态添加 -->
      <div class="options-section">
        <h3>投票选项</h3>
        <div v-for="(opt, index) in options" :key="index" class="option-row">
          <el-input v-model="opt.optionText" placeholder="请输入选项内容" />
          <el-button
            type="danger"
            :icon="Delete"
            circle
            size="small"
            @click="removeOption(index)"
            v-if="options.length > 2"
          />
        </div>
        <el-button type="primary" link @click="addOption">+ 添加选项</el-button>
      </div>

      <div class="form-actions">
        <el-button @click="goBack">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">提交</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { publishVote } from '@/api/vote'
import CommonForm from '@/components/CommonForm.vue'

const router = useRouter()

const formRef = ref()
const submitting = ref(false)

let formData = reactive({
  title: '',
  description: '',
  isAnonymous: false,
  startTime: '',
  endTime: '',
})

const options = ref([
  { optionText: '', sortOrder: 0 },
  { optionText: '', sortOrder: 1 },
])

const formItems = [
  { prop: 'title', label: '投票标题', type: 'input', required: true, span: 24 },
  { prop: 'description', label: '描述', type: 'textarea', span: 24, rows: 3 },
  { prop: 'isAnonymous', label: '是否匿名', type: 'switch', span: 12, activeText: '匿名', inactiveText: '实名' },
  { prop: 'startTime', label: '开始时间', type: 'date', required: true, span: 12, dateType: 'datetime', valueFormat: 'YYYY-MM-DDTHH:mm:ss' },
  { prop: 'endTime', label: '结束时间', type: 'date', required: true, span: 12, dateType: 'datetime', valueFormat: 'YYYY-MM-DDTHH:mm:ss' },
]

const rules = {
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
}

const addOption = () => {
  options.value.push({ optionText: '', sortOrder: options.value.length })
}

const removeOption = (index: number) => {
  options.value.splice(index, 1)
  // 重新排序
  options.value.forEach((opt, idx) => (opt.sortOrder = idx))
}

const handleSubmit = async () => {
  await formRef.value?.validate()

  // 校验选项
  if (options.value.length < 2) {
    ElMessage.warning('至少需要两个选项')
    return
  }
  for (const opt of options.value) {
    if (!opt.optionText.trim()) {
      ElMessage.warning('选项内容不能为空')
      return
    }
  }

  submitting.value = true
  try {
    await publishVote({
      ...formData,
      options: options.value.map(opt => ({
        optionText: opt.optionText,
        sortOrder: opt.sortOrder,
      })),
    })
    ElMessage.success('发起成功')
    router.push('/admin/vote/list')
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
.vote-publish {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
.page-header {
  margin-bottom: 20px;
}
.options-section {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}
.option-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>