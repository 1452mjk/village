<!-- cadre/NoticeManage.vue -->
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="50%">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NoticeList from '@/views/common/NoticeList.vue'
import { addNotice, updateNotice, deleteNotice } from '@/api/notice'
import { ElMessage, ElMessageBox } from 'element-plus'

const noticeListRef = ref()
const queryParams = ref({}) // 可添加过滤条件

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增公告')
const form = ref({ title: '', content: '' })
const editingId = ref(null)

const handleAdd = () => {
  dialogTitle.value = '新增公告'
  form.value = { title: '', content: '' }
  editingId.value = null
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑公告'
  form.value = { title: row.title, content: row.content }
  editingId.value = row.id
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该公告吗？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteNotice(row.id)
    ElMessage.success('删除成功')
    noticeListRef.value.fetchData()
  })
}

const handleSave = async () => {
  if (editingId.value) {
    await updateNotice(editingId.value, form.value)
    ElMessage.success('修改成功')
  } else {
    await addNotice(form.value)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  noticeListRef.value.fetchData()
}
</script>