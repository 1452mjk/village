// src/api/user.ts
import request from '@/utils/request'
import type { User, UserQueryParams, PageResult } from '@/types'

/**
 * 分页查询用户（管理员）
 */
export const getUserPage = (params: UserQueryParams) => {
  return request<PageResult<User>>({
    url: '/user/page',
    method: 'get',
    params,
  })
}

/**
 * 审核用户（管理员）
 */
export const auditUser = (userId: number, status: 0 | 1 | 2, remark?: string) => {
  return request({
    url: `/user/audit/${userId}`,
    method: 'post',
    params: { status, remark },
  })
}

/**
 * 启用/禁用用户
 * @param userId 用户ID
 * @param status 状态：'NORMAL' 启用, 'DISABLED' 禁用
 */
export const changeUserStatus = (userId: number, status: 'NORMAL' | 'DISABLED') => {
  return request({
    url: `/user/status/${userId}`,
    method: 'put',
    params: { status },  // 传递字符串枚举值
  })
}

/**
 * 获取用户详情
 */
export const getUserDetail = (userId: number) => {
  return request<User>({
    url: `/user/detail/${userId}`,
    method: 'get',
  })
}