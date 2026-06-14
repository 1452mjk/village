<!-- src/components/CommonForm.vue -->
<template>
  <el-form
    ref="formRef"
    :model="formModel"
    :rules="formRules"
    :label-width="labelWidth"
    :size="size"
    v-bind="$attrs"
  >
    <el-row :gutter="gutter">
      <el-col v-for="item in formItems" :key="item.prop" :span="item.span || 24">
        <el-form-item
          :prop="item.prop"
          :label="item.label"
          :required="item.required"
          :rules="item.rules"
        >
          <!-- 输入框 -->
          <el-input
            v-if="item.type === 'input'"
            v-model="formModel[item.prop]"
            :placeholder="item.placeholder"
            :type="item.inputType"
            :maxlength="item.maxlength"
            :show-word-limit="item.showWordLimit"
            :disabled="item.disabled"
            v-bind="item.props"
          />

          <!-- 文本域 -->
          <el-input
            v-else-if="item.type === 'textarea'"
            v-model="formModel[item.prop]"
            type="textarea"
            :placeholder="item.placeholder"
            :rows="item.rows || 3"
            v-bind="item.props"
          />

          <!-- 数字输入框 -->
          <el-input-number
            v-else-if="item.type === 'number'"
            v-model="formModel[item.prop]"
            :min="item.min"
            :max="item.max"
            :step="item.step"
            :placeholder="item.placeholder"
            v-bind="item.props"
          />

          <!-- 选择器 -->
          <el-select
            v-else-if="item.type === 'select'"
            v-model="formModel[item.prop]"
            :placeholder="item.placeholder"
            :clearable="item.clearable"
            :multiple="item.multiple"
            :filterable="item.filterable"
            :loading="item.loading"
            v-bind="item.props"
          >
            <el-option
              v-for="opt in item.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <!-- 单选框组 -->
          <el-radio-group
            v-else-if="item.type === 'radio'"
            v-model="formModel[item.prop]"
            v-bind="item.props"
          >
            <el-radio
              v-for="opt in item.options"
              :key="opt.value"
              :value="opt.value"
              :border="item.border"
            >
              {{ opt.label }}
            </el-radio>
          </el-radio-group>

          <!-- 复选框组 -->
          <el-checkbox-group
            v-else-if="item.type === 'checkbox'"
            v-model="formModel[item.prop]"
            v-bind="item.props"
          >
            <el-checkbox
              v-for="opt in item.options"
              :key="opt.value"
              :label="opt.value"
              :border="item.border"
            >
              {{ opt.label }}
            </el-checkbox>
          </el-checkbox-group>

          <!-- 日期选择器 -->
          <el-date-picker
            v-else-if="item.type === 'date'"
            v-model="formModel[item.prop]"
            :type="item.dateType || 'date'"
            :placeholder="item.placeholder"
            :format="item.format"
            :value-format="item.valueFormat"
            :range-separator="item.rangeSeparator"
            :start-placeholder="item.startPlaceholder"
            :end-placeholder="item.endPlaceholder"
            v-bind="item.props"
          />

          <!-- 时间选择器 -->
          <el-time-picker
            v-else-if="item.type === 'time'"
            v-model="formModel[item.prop]"
            :placeholder="item.placeholder"
            :format="item.format"
            :value-format="item.valueFormat"
            v-bind="item.props"
          />

          <!-- 开关 -->
          <el-switch
            v-else-if="item.type === 'switch'"
            v-model="formModel[item.prop]"
            :active-text="item.activeText"
            :inactive-text="item.inactiveText"
            v-bind="item.props"
          />

          <!-- 插槽支持自定义内容 -->
          <slot v-else :name="item.prop" :model="formModel" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

export type FormItemType =
  | 'input'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'switch'

export interface FormItem {
  prop: string
  label: string
  type: FormItemType
  placeholder?: string
  required?: boolean
  rules?: any[]
  span?: number // 栅格占位，默认24
  options?: { label: string; value: any }[] // 用于 select/radio/checkbox
  // 以下为各类型特有属性
  inputType?: string // input 的 type
  maxlength?: number
  showWordLimit?: boolean
  rows?: number // textarea
  min?: number
  max?: number
  step?: number
  clearable?: boolean
  multiple?: boolean
  filterable?: boolean
  loading?: boolean
  border?: boolean // radio/checkbox 边框
  dateType?: string // year/month/date/dates/datetime/week/datetimerange/daterange
  format?: string
  valueFormat?: string
  rangeSeparator?: string
  startPlaceholder?: string
  endPlaceholder?: string
  activeText?: string
  inactiveText?: string
  disabled?: boolean
  props?: any // 其他透传属性
}

const props = withDefaults(
  defineProps<{
    modelValue: Record<string, any>
    formItems: FormItem[]
    rules?: FormRules
    labelWidth?: string | number
    size?: 'large' | 'default' | 'small'
    gutter?: number
  }>(),
  {
    labelWidth: '100px',
    size: 'default',
    gutter: 0,
    rules: () => ({}),
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
}>()

const formRef = ref<FormInstance>()

// 内部表单数据，响应式
const formModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 生成校验规则
const formRules = computed<FormRules>(() => {
  const rules: FormRules = { ...props.rules }
  props.formItems.forEach((item) => {
    if (item.required && !rules[item.prop]) {
      rules[item.prop] = [{ required: true, message: `${item.label}不能为空`, trigger: 'blur' }]
    }
    if (item.rules) {
      rules[item.prop] = rules[item.prop] ? [...rules[item.prop], ...item.rules] : item.rules
    }
  })
  return rules
})

// 暴露表单验证方法
const validate = () => formRef.value?.validate()
const validateField = (props: string[]) => formRef.value?.validateField(props)
const resetFields = () => formRef.value?.resetFields()
const clearValidate = () => formRef.value?.clearValidate()

defineExpose({
  validate,
  validateField,
  resetFields,
  clearValidate,
})
</script>