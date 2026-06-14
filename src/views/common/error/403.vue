<!-- 403.vue -->
<template>
  <div class="error-page">
    <h1>403</h1>
    <p>抱歉，您没有权限访问该页面</p>
    <el-button @click="$router.push('/')">返回首页</el-button>
  </div>
</template>

<style scoped>
.error-page { text-align: center; padding-top: 100px; }
</style>