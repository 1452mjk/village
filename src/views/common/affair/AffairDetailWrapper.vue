<template>
  <component :is="currentComponent" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const currentComponent = computed(() => {
  if (userStore.isVillager) {
    return defineAsyncComponent(() => import('@/views/common/affair/AffairDetail.vue'))
  } else if (userStore.isVillageOfficial) {
    return defineAsyncComponent(() => import('@/views/cadre/affair/AffairDetail.vue'))
  } else if (userStore.isAdmin) {
    // 管理员可能复用村民的详情页或单独创建，这里暂时使用村民版
    return defineAsyncComponent(() => import('@/views/common/affair/AffairDetail.vue'))
  } else {
    // 默认村民版
    return defineAsyncComponent(() => import('@/views/common/affair/AffairDetail.vue'))
  }
})
</script>