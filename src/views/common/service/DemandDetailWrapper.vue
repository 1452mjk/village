<template>
  <component :is="currentComponent" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 验证 id 参数
const id = Number(route.params.id)
if (isNaN(id)) {
  ElMessage.error('无效的需求ID')
  // 延迟跳转以避免路由冲突
  onMounted(() => {
    router.push('/service/demand/my')
  })
}

const currentComponent = computed(() => {
  if (userStore.isVillager) {
    return defineAsyncComponent(() => import('@/views/user/service/DemandDetail.vue'))
  } else if (userStore.isMerchant) {
    return defineAsyncComponent(() => import('@/views/merchant/service/DemandDetail.vue'))
  } else {
    // 管理员或未登录默认使用村民版（可根据需求调整）
    return defineAsyncComponent(() => import('@/views/user/service/DemandDetail.vue'))
  }
})
</script>