// src/api/service.ts
import request from '@/utils/request'
import type {
  ServiceDemand,
  DemandPublishRequest,
  DemandQueryParams,
  ServiceOrder,
  OrderQueryParams,
  EvaluateRequest,
  PageResult,
} from '@/types'

/**
 * 获取需求附件上传的签名 URL（村民发布需求时使用）
 * @param filename 原始文件名
 * @param contentType 文件 MIME 类型（如 'image/jpeg'）
 * @returns { uploadUrl, objectName, expireTime, domain }
 */
export const getDemandAttachmentToken = (filename: string, contentType: string) => {
  return request<{
    uploadUrl: string
    objectName: string
    expireTime: number
    domain: string
  }>({
    url: '/demand/attachment/token',
    method: 'get',
    params: { filename, contentType },  // 增加 contentType
  })
}

/**
 * 获取订单凭证上传的签名 URL（商户更新订单状态时上传凭证）
 * @param filename 原始文件名
 * @param contentType 文件 MIME 类型
 * @returns { uploadUrl, objectName, expireTime, domain }
 */
export const getOrderProofToken = (filename: string, contentType: string) => {
  return request<{
    uploadUrl: string
    objectName: string
    expireTime: number
    domain: string
  }>({
    url: '/order/proof/token',
    method: 'get',
    params: { filename, contentType },
  })
}

/**
 * 村民发布服务需求
 * 注意：请求体中的 attachments 字段应为 OSS objectName 数组
 */
export const publishDemand = (data: DemandPublishRequest) => {
  return request<ServiceDemand>({
    url: '/demand/publish',
    method: 'post',
    data,
  })
}

/**
 * 商户抢单
 */
export const grabDemand = (demandId: number) => {
  return request({
    url: `/demand/grab/${demandId}`,
    method: 'post',
  })
}

/**
 * 商户查看待抢单需求列表
 */
export const getPendingDemands = (params: DemandQueryParams) => {
  return request<PageResult<ServiceDemand>>({
    url: '/demand/pending',
    method: 'get',
    params,
  })
}

/**
 * 村民查看自己的需求列表
 */
export const getMyDemands = (params: DemandQueryParams) => {
  return request<PageResult<ServiceDemand>>({
    url: '/demand/my',
    method: 'get',
    params,
  })
}

/**
 * 商户更新订单状态
 * @param proof 凭证文件 OSS objectName 数组
 */
export const updateOrderStatus = (orderId: number, status: number, proof?: string[]) => {
  return request({
    url: `/order/status/${orderId}`,
    method: 'put',
    params: { status },
    data: proof,
  })
}

/**
 * 村民评价订单
 */
export const evaluateOrder = (orderId: number, data: { score: number; comment: string }) => {
  return request({
    url: `/order/evaluate/${orderId}`,
    method: 'post',
    params: {
      score: data.score,
      comment: data.comment,
    },
  })
}

/**
 * 商户查看自己的订单列表
 */
export const getMerchantOrders = (params: OrderQueryParams) => {
  return request<PageResult<ServiceOrder>>({
    url: '/order/merchant',
    method: 'get',
    params,
  })
}

/**
 * 村民查看自己的订单列表
 */
export const getVillagerOrders = (params: OrderQueryParams) => {
  return request<PageResult<ServiceOrder>>({
    url: '/order/villager',
    method: 'get',
    params,
  })
}

/**
 * 获取需求详情（包含订单）
 */
export const getDemandDetail = (demandId: number) => {
  return request<{ demand: ServiceDemand; order?: ServiceOrder }>({
    url: `/demand/detail/${demandId}`,
    method: 'get',
  })
}

/**
 * 分页获取需求列表（后台管理用）
 */
export const getDemandList = (params: DemandQueryParams) => {
  return request<PageResult<ServiceDemand>>({
    url: '/demand/list',
    method: 'get',
    params,
  })
}

/**
 * 删除需求（村民本人、管理员、村干部可操作）
 */
export const deleteDemand = (demandId: number) => {
  return request({
    url: `/demand/${demandId}`,
    method: 'delete',
  })
}

/**
 * 根据需求ID获取订单信息
 */
export const getOrderByDemandId = (demandId: number) => {
  return request<ServiceOrder>({
    url: `/order/demand/${demandId}`,
    method: 'get',
  })
}