<!-- src/components/CommonDialog.vue -->
<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :top="top"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :before-close="beforeClose"
    v-bind="$attrs"
    @closed="handleClosed"
  >
    <!-- 内容插槽 -->
    <slot :close="close" :confirm="confirm" />

    <!-- 底部按钮插槽，默认有确定和取消 -->
    <template #footer v-if="$slots.footer || showFooter">
      <slot name="footer" :close="close" :confirm="confirm">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :loading="confirmLoading" @click="confirm">
          确定
        </el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    width?: string | number
    top?: string
    closeOnClickModal?: boolean
    closeOnPressEscape?: boolean
    showClose?: boolean
    showFooter?: boolean
    confirmLoading?: boolean
    beforeClose?: (done: () => void) => void
  }>(),
  {
    title: '提示',
    width: '50%',
    top: '15vh',
    closeOnClickModal: false,
    closeOnPressEscape: true,
    showClose: true,
    showFooter: true,
    confirmLoading: false,
    beforeClose: (done) => done(),
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'close'): void
  (e: 'confirm'): void
}>()

const visible = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      emit('open')
    }
  }
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const close = () => {
  visible.value = false
  emit('close')
}

const confirm = () => {
  emit('confirm')
}

const handleClosed = () => {
  emit('close')
}
</script>