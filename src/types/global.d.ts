// 全局通用类型定义

/**
 * 后端统一返回格式
 */
export interface Result<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 分页请求参数
 */
export interface PageQuery {
  page?: number
  size?: number
}

/**
 * 分页结果（后端返回的分页数据结构）
 * 根据 MyBatis-Plus 默认的 IPage 格式，通常包含：
 * records: T[], total: number, size: number, current: number, pages: number
 */
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

/**
 * 通用状态枚举（可根据需要扩展）
 */
export enum Status {
  DISABLED = 0,
  ENABLED = 1,
}

/**
 * 通用删除状态（逻辑删除）
 */
export enum Deleted {
  NORMAL = 0,
  DELETED = 1,
}