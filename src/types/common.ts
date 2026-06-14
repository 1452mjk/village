// src/types/common.ts

/**
 * 统一 API 响应格式（与后端 Result 一致）
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 分页请求参数
 */
export interface PageParams {
  page: number  // 当前页码，默认1
  size: number  // 每页条数，默认10
}

/**
 * 分页结果（与后端 IPage 结构对应）
 */
export interface PageResult<T> {
  records: T[]          // 数据列表
  total: number         // 总记录数
  size: number          // 每页条数
  current: number       // 当前页码
  pages: number         // 总页数
}

/**
 * 通用下拉选项类型
 */
export interface Option {
  label: string
  value: string | number
}