// src/types/product.ts

import type { PageParams } from './common'

/**
 * 交易模式
 */
export type TradeMode = 'wholesale' | 'retail'

/**
 * 农产品实体
 */
export interface Product {
  id: number
  farmerId: number
  name: string
  type: string
  origin: string
  specifications?: string
  price: number
  totalOutput?: number
  description?: string
  images: string[]
  tradeMode: TradeMode
  contactPhone: string
  status: 0 | 1 | 2 | 3  // 0-待审核,1-已上架,2-已下架,3-审核不通过
  auditRemark?: string
  viewCount: number
  createTime: string
  updateTime: string
  farmerName?: string  // 发布人姓名
}

/**
 * 农产品发布请求
 */
export interface ProductPublishRequest {
  name: string
  type: string
  origin: string
  specifications?: string
  price: number
  totalOutput?: number
  description?: string
  images: string[]
  tradeMode: TradeMode
  contactPhone: string
}

/**
 * 农产品查询参数
 */
export interface ProductQueryParams extends PageParams {
  keyword?: string
  type?: string
  tradeMode?: TradeMode
   status?: number;  
}