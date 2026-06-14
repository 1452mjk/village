<!-- cadre/AffairManage.vue -->
<template>
  <div class="affair-manage">
    <AffairList ref="affairListRef">
      <template #action="{ row }">
        <el-button type="primary" link @click="handleProcess(row)">处理</el-button>
        <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
      </template>
    </AffairList>

    <!-- 处理事务弹窗 -->
    <el-dialog v-model="dialogVisible" title="处理事务" width="50%">
      <el-form :model="processForm" label-width="80px">
        <el-form-item label="处理意见">
          <el-input v-model="processForm.comment" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="processForm.status">
            <el-option label="进行中" value="processing" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcess">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AffairList from '@/views/common/AffairList.vue'
import { deleteAffair, processAffair } from '@/api/affair'
import { ElMessage, ElMessageBox } from 'element-plus'

const affairListRef = ref()
const dialogVisible = ref(false)
const processForm = ref({ comment: '', status: 'processing' })
const currentAffairId = ref(null)

const handleProcess = (row) => {
  currentAffairId.value = row.id
  processForm.value = { comment: '', status: 'processing' }
  dialogVisible.value = true
}

const submitProcess = async () => {
  await processAffair(currentAffairId.value, processForm.value)
  ElMessage.success('处理成功')
  dialogVisible.value = false
  affairListRef.value.fetchData()
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该事务吗？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteAffair(row.id)
    ElMessage.success('删除成功')
    affairListRef.value.fetchData()
  })
}
</script>