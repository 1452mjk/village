<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>{{ appTitle }}</h2>
      </template>
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="80px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="loginForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="loginForm.password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading">登录</el-button>
          <el-button @click="$router.push('/register')">注册</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const appTitle = import.meta.env.VITE_APP_TITLE
const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  phone: '',
  password: '',
})

const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ]
}

// Login.vue - handleLogin 方法
const handleLogin = async () => {
  try {
    // 表单验证
    await loginFormRef.value?.validate()
    
    loading.value = true
    await userStore.login({ 
      phone: loginForm.phone, 
      password: loginForm.password 
    })
    
    ElMessage.success('登录成功')
    // 跳转
    const role = userStore.role
    if (role === 'admin' || role === 'village_official') {
      await router.push('/admin/dashboard')
    } else {
      await router.push('/')
    }
  } catch (error: any) {
    // 处理验证错误或登录错误
    const msg = error.response?.data?.message || error.message || '登录失败'
    ElMessage.error(msg)
    console.error('登录异常:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: url('/1.jpg'); /* 背景图片，请确保图片存在 */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login-card {
  width: 400px;
  background-color: rgba(255, 255, 255, 0.9); /* 半透明白色背景，提高可读性 */
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>