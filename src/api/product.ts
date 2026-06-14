// src/api/product.ts
import request from '@/utils/request'
import type {
  Product,
  ProductPublishRequest,
  ProductQueryParams,
  PageResult,
} from '@/types'

/**
 * 获取产品图片上传的签名 URL（前端直传 OSS）
 * @param filename 原始文件名
 * @returns { uploadUrl, objectName, expireTime, domain }
 */
export const getProductImageToken = (filename: string,contentType: string) => {
  return request<{
    uploadUrl: string
    objectName: string
    expireTime: number
    domain: string
  }>({
    url: '/product/image/token',
    method: 'get',
    params: { filename,contentType },
  })
}

/**
 * 发布农产品（农户）
 * 注意：请求体中的 images 应为 OSS objectName 数组
 */
export const publishProduct = (data: ProductPublishRequest) => {
  return request<Product>({
    url: '/product/publish',
    method: 'post',
    data,
  })
}

/**
 * 审核农产品（管理员）
 */
export const auditProduct = (productId: number, approved: boolean, remark?: string) => {
  return request({
    url: `/product/audit/${productId}`,
    method: 'post',
    params: { approved, remark },
  })
}

/**
 * 分页查询农产品（已上架）
 */
export const getProductPage = (params: ProductQueryParams) => {
  return request<PageResult<Product>>({
    url: '/product/list',
    method: 'get',
    params,
  })
}

/**
 * 获取农产品详情
 */
export const getProductDetail = (productId: number) => {
  return request<Product>({
    url: `/product/detail/${productId}`,
    method: 'get',
  })
}

/**
 * 删除农产品（管理员或发布人可删除）
 * @param productId 产品ID
 */
export const deleteProduct = (productId: number) => {
  return request({
    url: `/product/${productId}`,
    method: 'delete',
  })
}