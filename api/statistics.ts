// src/api/statistics.ts
import request from '@/utils/request'

export interface DashboardData {
  userCount: number
  noticeCount: number
  productCount: number
  orderCount: number
  pendingAuditCount: number
  recentActivities: Array<{
    id: number
    type: string
    content: string
    time: string
  }>
}

/**
 * 获取仪表盘统计数据（管理员）
 */
export const getDashboardData = () => {
  return request<DashboardData>({
    url: '/statistics/dashboard',
    method: 'get',
  })
}

/**
 * 获取农产品交易统计
 */
export const getProductStatistics = (params: { startDate?: string; endDate?: string }) => {
  return request({
    url: '/statistics/product',
    method: 'get',
    params,
  })
}

/**
 * 获取村务办理统计
 */
export const getAffairStatistics = (params: { year?: number; month?: number }) => {
  return request({
    url: '/statistics/affair',
    method: 'get',
    params,
  })
}