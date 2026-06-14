// src/types/service.ts

import type { PageParams } from './common'
import type { User } from './user'

/**
 * 需求状态枚举
 */
export type DemandStatus = 0 | 1 | 2 | 3 | 4 | 5  // 待抢单,已接单,服务中,待评价,已完成,已取消

/**
 * 订单状态枚举
 */
export type OrderStatus = 1 | 2 | 3 | 4 | 5  // 已接单,服务中,待评价,已完成,已取消

/**
 * 服务需求实体
 */
export interface ServiceDemand {
  id: number
  userId: number
  serviceType: string
  description: string
  budget?: number
  address: string
  contactPhone: string
  status: DemandStatus
  createTime: string
  updateTime: string
  user?: User  // 发布人
}

/**
 * 服务订单实体
 */
export interface ServiceOrder {
  id: number
  demandId: number
  merchantId: number
  status: OrderStatus
  serviceProof?: string[]
  evaluation?: string
  evaluationScore?: number  // 1-5星
  evaluationTime?: string
  createTime: string
  updateTime: string
  demand?: ServiceDemand  // 关联的需求
  merchant?: User         // 接单商户
}

/**
 * 服务需求发布请求
 */
export interface DemandPublishRequest {
  serviceType: string
  description: string
  budget?: number
  address: string
  contactPhone: string
}

/**
 * 订单评价请求
 */
export interface EvaluateRequest {
  score: number
  comment?: string
}

/**
 * 需求查询参数
 */
export interface DemandQueryParams extends PageParams {
  serviceType?: string
  status?: DemandStatus
}

/**
 * 订单查询参数
 */
export interface OrderQueryParams extends PageParams {
  status?: OrderStatus
}

/**
 * 更新订单状态请求（商户）
 */
export interface UpdateOrderStatusRequest {
  orderId: number
  status: OrderStatus
  proof?: string[] // 服务完成凭证
}
