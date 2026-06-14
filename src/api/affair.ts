// src/api/affair.ts
import request from '@/utils/request'
import type {
  VillageAffair,
  AffairQueryParams,
  PageResult,
  AffairFeedback,
  FeedbackRequest,
} from '@/types'

// ========== 文件上传签名接口 ==========

/**
 * 获取村务附件上传的签名URL
 * @param filename 原始文件名
 * @param contentType 文件MIME类型（如 image/jpeg）
 */
export const getAffairAttachmentToken = (filename: string, contentType: string) => {
  return request<{ uploadUrl: string; objectName: string; expireTime: number; domain: string }>({
    url: '/affair/attachment/token',
    method: 'get',
    params: { filename, contentType },
  })
}

/**
 * 获取异议反馈附件上传的签名URL
 * @param filename 原始文件名
 * @param contentType 文件MIME类型（如 image/jpeg）
 */
export const getFeedbackAttachmentToken = (filename: string, contentType: string) => {
  return request<{ uploadUrl: string; objectName: string; expireTime: number; domain: string }>({
    url: '/affair/feedback/attachment/token',
    method: 'get',
    params: { filename, contentType },
  })
}

// ========== 业务接口 ==========

/**
 * 发布村务（村干部）
 * @param data 村务信息，attachments 应为 objectName 数组
 */
export const publishAffair = (data: Partial<VillageAffair>) => {
  return request<VillageAffair>({
    url: '/affair/publish',
    method: 'post',
    data,
  })
}

/**
 * 分页查询本村村务
 */
export const getAffairPage = (params: AffairQueryParams) => {
  return request<PageResult<VillageAffair>>({
    url: '/affair/list',
    method: 'get',
    params,
  })
}
export const getAffairList = getAffairPage;

/**
 * 获取村务详情（含异议列表）
 */
export const getAffairDetail = (affairId: number) => {
  return request<VillageAffair>({
    url: `/affair/detail/${affairId}`,
    method: 'get',
  })
}

/**
 * 提交异议（村民）
 * @param affairId 村务ID
 * @param data 包含 content 和 attachments（objectName 数组）
 */
export const submitFeedback = (affairId: number, data: FeedbackRequest) => {
  return request({
    url: `/affair/feedback/${affairId}`,
    method: 'post',
    data,
  })
}

/**
 * 回复异议（村干部）
 */
export const replyFeedback = (feedbackId: number, replyContent: string) => {
  return request({
    url: `/affair/feedback/reply/${feedbackId}`,
    method: 'post',
    params: { replyContent },
  })
}

/**
 * 获取异议反馈列表
 */
export const getFeedbackList = (params: any) => {
  return request<PageResult<AffairFeedback>>({
    url: '/affair/feedback/list',
    method: 'get',
    params,
  })
}

/**
 * 更新异议反馈
 * @param feedbackId 反馈ID
 * @param data 更新的数据（如 status, replyContent, attachments 等）
 */
export const updateFeedback = (feedbackId: number, data: Partial<AffairFeedback>) => {
  return request({
    url: `/affair/feedback/${feedbackId}`,
    method: 'put',
    data,
  })
}

/**
 * 删除村务（管理员/村干部）
 */
export const deleteAffair = (affairId: number) => {
  return request({
    url: `/affair/${affairId}`,
    method: 'delete',
  })
}