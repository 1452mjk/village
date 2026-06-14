<template>
  <div class="profile-container">
    <h1 class="page-title">👤 个人中心</h1>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <el-skeleton :rows="5" animated />
    </div>

    <el-row :gutter="20">
      <!-- 左侧头像上传 -->
      <el-col :span="8">
        <el-card class="avatar-card">
          <div class="avatar-wrapper">
            <el-upload
              drag
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :http-request="handleAvatarUpload"
              :loading="uploading"
            >
              <img v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar-img" />
              <el-icon v-else class="avatar-placeholder"><UserFilled /></el-icon>
              <div class="el-upload__text">点击或拖拽上传头像</div>
              <template #tip>
                <div class="el-upload__tip">
                  只能上传 {{ uploadTypes.join('、') }} 文件，且不超过 2MB
                </div>
              </template>
            </el-upload>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧信息表单（保持不变） -->
      <el-col :span="16">
        <el-card class="info-card">
          <template #header>
            <span>基本信息</span>
          </template>
          <el-form
            ref="formRef"
            :model="userInfo"
            :rules="formRules"
            label-width="80px"
            status-icon
          >
            <el-form-item label="昵称" prop="realName">
              <el-input v-model="userInfo.realName" placeholder="请输入昵称" />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="userInfo.phone" placeholder="11位手机号" />
            </el-form-item>
            <el-form-item label="性别">
              <el-radio-group v-model="userInfo.gender">
                <el-radio :value="2">女</el-radio>
                <el-radio :value="1">男</el-radio>
                <el-radio :value="0">保密</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="角色">
              <el-tag :type="getRoleTag(userInfo.role)">{{ getRoleText(userInfo.role) }}</el-tag>
            </el-form-item>
            <el-form-item label="所属村庄" prop="villageId">
              <el-select v-model="userInfo.villageId" placeholder="请选择村庄" clearable filterable>
                <el-option
                  v-for="village in villageOptions"
                  :key="village.id"
                  :label="village.name"
                  :value="village.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="地址" prop="address">
              <el-input v-model="userInfo.address" placeholder="请输入地址" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveInfo" :loading="savingInfo">
                保存修改
              </el-button>
              
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 修改密码卡片（保持不变） -->
        <el-card class="password-card" style="margin-top: 20px">
          <template #header>
            <span>修改密码</span>
          </template>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
          >
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                show-password
                placeholder="请输入当前密码"
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                show-password
                placeholder="6-20位字符"
              />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                show-password
                placeholder="请再次输入新密码"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword" :loading="changingPassword">
                更新密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { getUserInfo, updateUserProfile, changePassword as apiChangePassword, getAvatarUploadToken, updateAvatar } from '@/api/auth'
import { getVillageList } from '@/api/village'
import { useUserStore } from '@/stores/user'
import { useOssUpload } from '@/composables/useOssUpload'  // 新增导入

const userStore = useUserStore()
const { uploading, uploadFile } = useOssUpload()  // 新增

// 状态
const loading = ref(false)
const savingInfo = ref(false)
const changingPassword = ref(false)

// 表单 ref
const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

// 用户信息数据
const userInfo = reactive({
  realName: '',
  phone: '',
  gender: 1,
  role: '',
  address: '',
  avatar: '',
  villageId: null as number | null,
  villageName: ''
})

// 村庄选项列表
const villageOptions = ref<Array<{ id: number; name: string }>>([])

// 表单校验规则
const formRules = reactive<FormRules>({
  realName: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2-20个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  villageId: [{ required: false, message: '请选择村庄', trigger: 'change' }]
})

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirm = (rule: any, value: string, callback: any) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = reactive<FormRules>({
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
})

// 角色映射
const getRoleText = (role: string) => {
  const map: Record<string, string> = {
    villager: '村民',
    village_official: '村干部',
    merchant: '商户',
    admin: '管理员'
  }
  return map[role] || role
}
const getRoleTag = (role: string) => {
  const map: Record<string, string> = {
    villager: 'info',
    village_official: 'warning',
    merchant: 'success',
    admin: 'danger'
  }
  return map[role] || ''
}

// ---------- 头像上传（改造为 OSS 直传） ----------
const uploadTypes = ['jpg', 'jpeg', 'png', 'gif']
const beforeAvatarUpload = (file: File) => {
  const isImage = uploadTypes.includes(file.type.split('/')[1])
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error(`头像只能为 ${uploadTypes.join('、')} 格式!`)
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

const handleAvatarUpload = async (options: any) => {
  const { file, onSuccess, onError } = options
  try {
    // 1. 获取签名并上传 OSS
    const { objectName } = await uploadFile(file, '/api/auth/avatar/token', {
      maxSize: 2 * 1024 * 1024,
      allowedTypes: uploadTypes.map(t => `image/${t}`)
    })

    // 2. 提交 objectName 给后端，更新用户头像
    const avatarUrl = await updateAvatar(objectName)

    // 3. 更新本地头像显示
    userInfo.avatar = avatarUrl
    ElMessage.success('头像上传成功')
    onSuccess({ code: 0 })
  } catch (err: any) {
    ElMessage.error(err.message || '头像上传失败')
    onError(err)
  }
}

// ---------- 获取村庄列表 ----------
const fetchVillages = async () => {
  try {
    const res = await getVillageList()
    villageOptions.value = res
  } catch (err) {
    console.error('获取村庄列表失败', err)
  }
}

// ---------- 获取用户信息 ----------
const fetchUserInfo = async () => {
  loading.value = true
  try {
    const data = await getUserInfo()
    userInfo.realName = data.realName || ''
    userInfo.phone = data.phone || ''
    userInfo.gender = data.gender ?? 1
    userInfo.role = data.role || ''
    userInfo.address = data.address || ''
    userInfo.avatar = data.avatar || ''
    userInfo.villageId = data.villageId || null
    userInfo.villageName = data.villageName || ''
  } catch (err: any) {
    ElMessage.error(err.message || '获取用户信息失败')
  } finally {
    loading.value = false
  }
}

// ---------- 保存个人信息 ----------
const saveInfo = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    savingInfo.value = true
    try {
      await updateUserProfile({
        realName: userInfo.realName,
        phone: userInfo.phone,
        gender: userInfo.gender,
        address: userInfo.address,
        villageId: userInfo.villageId
      })
      ElMessage.success('个人信息更新成功')
      await fetchUserInfo()
    } catch (err: any) {
      ElMessage.error(err.message || '保存失败')
    } finally {
      savingInfo.value = false
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
  fetchUserInfo()
}

// ---------- 修改密码 ----------
const changePassword = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    changingPassword.value = true
    try {
      await apiChangePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
      ElMessage.success('密码修改成功，请重新登录')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } catch (err: any) {
      ElMessage.error(err.message || '密码修改失败')
    } finally {
      changingPassword.value = false
    }
  })
}

onMounted(() => {
  fetchVillages()
  fetchUserInfo()
})
</script>

<style scoped>
/* 样式完全保留，未改动 */
.profile-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
.page-title {
  font-size: 28px;
  margin-bottom: 20px;
  color: #303133;
}
.avatar-card {
  text-align: center;
}
.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar-img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
}
.avatar-placeholder {
  font-size: 60px;
  color: #909399;
  margin-bottom: 10px;
}
.loading-overlay {
  padding: 20px;
}
.info-card,
.password-card {
  margin-bottom: 20px;
}
</style>