<template>
  <div class="common-table">
    <el-table
      v-loading="loading"
      :data="data"
      :border="border"
      :stripe="stripe"
      :size="size"
      :empty-text="emptyText"
      @selection-change="handleSelectionChange"
      v-bind="$attrs"
    >
      <!-- 多选框列 -->
      <el-table-column v-if="showSelection" type="selection" width="55" />

      <!-- 序号列 -->
      <el-table-column v-if="showIndex" type="index" width="55" label="序号" />

      <!-- 动态列 -->
      <template v-for="col in columns" :key="col.prop">
        <el-table-column
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :align="col.align || 'center'"
          :show-overflow-tooltip="col.showOverflowTooltip !== false"
        >
          <template #default="{ row }">
            <!-- 优先使用具名插槽（列名），否则直接显示数据 -->
            <slot :name="col.prop" :row="row" :column="col">
              {{ row[col.prop] }}
            </slot>
          </template>
        </el-table-column>
      </template>

      <!-- 操作列（插槽名为 actions） -->
      <el-table-column
        v-if="$slots.actions"
        label="操作"
        :width="actionsWidth"
        :fixed="actionsFixed"
        align="center"
      >
        <template #default="{ row }">
          <slot name="actions" :row="row" />
        </template>
      </el-table-column>

      <!-- 完全自定义空状态（若提供插槽则覆盖 empty-text） -->
      <template #empty>
        <slot name="empty">
          <span>{{ emptyText }}</span>
        </slot>
      </template>
    </el-table>

    <!-- 分页 -->
    <div v-if="showPagination" class="table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 列定义接口
export interface TableColumn {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  showOverflowTooltip?: boolean
}

const props = withDefaults(
  defineProps<{
    data: any[]
    columns: TableColumn[]
    loading?: boolean
    border?: boolean
    stripe?: boolean
    size?: 'large' | 'default' | 'small'
    showSelection?: boolean
    showIndex?: boolean
    showPagination?: boolean
    total?: number
    pageSizes?: number[]
    actionsWidth?: string | number
    actionsFixed?: 'left' | 'right'
    modelValue?: {
      page: number
      size: number
    }
    emptyText?: string // 空数据文本
    resetPageOnSizeChange?: boolean // 改变每页条数时是否重置到第一页
  }>(),
  {
    loading: false,
    border: true,
    stripe: false,
    size: 'default',
    showSelection: false,
    showIndex: false,
    showPagination: false,
    total: 0,
    pageSizes: () => [10, 20, 50, 100],
    actionsWidth: 120,
    actionsFixed: 'right',
    modelValue: () => ({ page: 1, size: 10 }),
    emptyText: '暂无数据',
    resetPageOnSizeChange: true,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: { page: number; size: number }): void
  (e: 'selection-change', selection: any[]): void
  (e: 'page-change', page: number, size: number): void
}>()

// 分页双向绑定
const currentPage = computed({
  get: () => props.modelValue.page,
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, page: val })
  },
})
const pageSize = computed({
  get: () => props.modelValue.size,
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, size: val })
  },
})

const handleSizeChange = (size: number) => {
  // 如果需要，重置页码为第一页
  const newPage = props.resetPageOnSizeChange ? 1 : currentPage.value
  // 更新 modelValue
  emit('update:modelValue', { page: newPage, size })
  // 触发 page-change 事件
  emit('page-change', newPage, size)
}

const handleCurrentChange = (page: number) => {
  emit('page-change', page, pageSize.value)
}

const handleSelectionChange = (selection: any[]) => {
  emit('selection-change', selection)
}
</script>

<style scoped>
.common-table {
  width: 100%;
}
.table-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>