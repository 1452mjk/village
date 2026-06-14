import type { PageParams } from './common'
/**
 * 用户角色枚举（与后端一致）
 */
export type UserRole = 'villager' | 'village_official' | 'merchant' | 'admin'

/**
 * 用户状态
 */
export type UserStatus = 0 | 1 | 2  // 0-待审核, 1-正常, 2-禁用

/**
 * 用户实体（与后端 User 实体对应）
 */
export interface User {
  id: number
  phone: string
  password?: string // 前端通常不展示
  role: UserRole
  status: UserStatus
  realName?: string
  avatar?: string
  villageId?: number
  address?: string
  gender?: 0 | 1 | 2 // 2-未知 1-男 0-女
  auditRemark?: string
  createTime: string
  updateTime: string
  lastLoginTime?: string
   villageName?: string;        // 村庄名称（列表展示用）
  qualificationUrls?: string[]; // 资质材料URL数组（详情用）
}

/**
 * 登录请求
 */
export interface LoginRequest {
  phone: string
  password: string
}

/**
 * 登录响应
 */
export interface LoginResponse {
  token: string
  role: UserRole
  realName: string
}

/**
 * 注册请求（基础字段，可根据需要补充）
 */
export interface RegisterRequest {
  phone: string
  password: string
  role: UserRole
  realName?: string
  villageId?: number
  // 村干部/商户额外字段
  // 如资质材料等，可放在 attachments 中，或由后端决定
    qualification?: string  // 资质文件URL
}

/**
 * 用户审核参数（管理员使用）
 */
export interface AuditUserParams {
  userId: number
  status: UserStatus
  remark?: string
}

/**
 * 用户查询参数（管理员用）
 */
export interface UserQueryParams extends PageParams {
  phone?: string
  role?: UserRole
  status?: UserStatus
  villageId?: number
}