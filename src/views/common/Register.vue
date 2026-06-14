<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header><h2>用户注册</h2></template>
      <common-form ref="formRef" v-model="formData" :form-items="formItems" :rules="rules" label-width="100px" />
      <div class="form-actions">
        <el-button @click="$router.push('/login')">返回登录</el-button>
        <el-button type="primary" @click="handleRegister" :loading="loading">注册</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '@/api/auth'
import CommonForm from '@/components/CommonForm.vue'

const router = useRouter()
const loading = ref(false)
const formRef = ref()

let formData = reactive({
  phone: '',
  password: '',
  realName: '',
  role: 'villager',
  villageId: undefined,
})

const formItems = [
  { prop: 'phone', label: '手机号', type: 'input', required: true, span: 24 },
  { prop: 'password', label: '密码', type: 'input', inputType: 'password', required: true, span: 24 },
  { prop: 'realName', label: '真实姓名', type: 'input', span: 24 },
  { prop: 'role', label: '角色', type: 'select', options: [
    { label: '村民', value: 'villager' },
    { label: '村干部', value: 'village_official' },
    { label: '商户', value: 'merchant' }
  ], span: 24 },
]

const rules = {
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码长度至少6位' }
  ]
}

const handleRegister = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    await register(formData)
    ElMessage.success('注册成功，请等待审核')
    router.push('/login')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: url('/1.jpg'); /* 图片放在 public 根目录下，使用绝对路径 */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.register-card {
  width: 450px;
  background-color: rgba(255, 255, 255, 0.9); /* 半透明白色背景，提升可读性 */
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>