<template>
  <div class="user-detail">
    <div class="back">
      <el-button type="primary" link @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
    </div>

    <el-skeleton :loading="loading" animated :rows="10" v-if="loading" />

    <el-card v-else shadow="never">
      <template #header>
        <h2>用户详情</h2>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="ID">{{ user.id }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ user.phone }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ user.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ getRoleText(user.role) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTag(user.status)">{{ getStatusText(user.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="性别">{{ user.gender === 1 ? '男' : user.gender === 2 ? '女' : '未知' }}</el-descriptions-item>
        <el-descriptions-item label="所属村庄">{{ user.villageName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="详细地址">{{ user.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ user.createTime }}</el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ user.lastLoginTime || '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="user.auditRemark" label="审核备注" :span="2">{{ user.auditRemark }}</el-descriptions-item>
      </el-descriptions>

      <!-- 资质材料（村干部/商户） -->
      <div v-if="user.role === 'village_official' || user.role === 'merchant'" class="qualification">
        <el-divider />
        <h3>资质材料</h3>
        <!-- 假设资质材料是图片或文件URL -->
        <div v-if="user.qualificationUrls?.length">
          <el-image
            v-for="(url, idx) in user.qualificationUrls"
            :key="idx"
            :src="url"
            :preview-src-list="user.qualificationUrls"
            style="width: 150px; height: 150px; margin-right: 10px;"
          />
        </div>
        <div v-else>暂无资质材料</div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getUserDetail } from '@/api/user' // 需补充
import type { User } from '@/types'

const route = useRoute()
const router = useRouter()
const userId = Number(route.params.id)

const loading = ref(true)
const user = ref<User>({})

const getRoleText = (role: string) => {
  const map: Record<string, string> = {
    villager: '村民',
    village_official: '村干部',
    merchant: '商户',
    admin: '管理员',
  }
  return map[role] || role
}
const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待审核',
    1: '正常',
    2: '禁用',
  }
  return map[status] || '未知'
}
const getStatusTag = (status: number) => {
  if (status === 0) return 'info'
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return ''
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getUserDetail(userId)
    user.value = res
  } catch (error) {
    console.error(error)
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.user-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.back {
  margin-bottom: 20px;
}
.qualification {
  margin-top: 30px;
}
</style>