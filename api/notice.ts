// src/api/notice.ts
import request from '@/utils/request'
import type {
  Notice,
  NoticePublishRequest,
  NoticeDetail,
  NoticeQueryParams,
  PageResult,
  NoticeComment,
} from '@/types'

/**
 * 获取通知附件上传的签名 URL（前端直传 OSS）
 * @param filename 原始文件名
 * @returns { uploadUrl, objectName, expireTime, domain }
 */
export const getNoticeAttachmentToken = (filename: string,contentType: string) => {
  return request<{
    uploadUrl: string
    objectName: string
    expireTime: number
    domain: string
  }>({
    url: '/notice/attachment/token',
    method: 'get',
    params: { filename,contentType },
  })
}

/**
 * 发布通知（村干部/管理员）
 * 注意：请求体中的 attachments 应为 OSS objectName 数组
 */
export const publishNotice = (data: NoticePublishRequest) => {
  return request<Notice>({
    url: '/notice/publish',
    method: 'post',
    data,
  })
}

/**
 * 分页查询通知列表（村民）
 */
export const getNoticePage = (params: NoticeQueryParams) => {
  return request<PageResult<Notice>>({
    url: '/notice/list',
    method: 'get',
    params,
  })
}
export const getNoticeList = getNoticePage

/**
 * 获取通知详情
 */
export const getNoticeDetail = (noticeId: number) => {
  return request<NoticeDetail>({
    url: `/notice/detail/${noticeId}`,
    method: 'get',
  })
}

/**
 * 评论通知
 */
export const commentNotice = (noticeId: number, content: string, parentId?: number) => {
  return request({
    url: `/notice/comment/${noticeId}`,
    method: 'post',
    params: { content, parentId },
  })
}

/**
 * 删除评论（可选，管理员或本人）
 */
export const deleteComment = (commentId: number) => {
  return request({
    url: `/notice/comment/${commentId}`,
    method: 'delete',
  })
}

/**
 * 删除通知
 */
export const deleteNotice = (noticeId: number) => {
  return request({
    url: `/notice/${noticeId}`,
    method: 'delete',
  })
}

/**
 * 更新通知
 * 注意：请求体中的 attachments 应为 OSS objectName 数组
 */
export const updateNotice = (id: number, data: any) => {
  return request({
    url: `/notice/${id}`,
    method: 'put',
    data,
  })
}

/**
 * 生成语音（将通知文本转为语音）
 * 后端返回的 url 已经是可直接访问的临时签名 URL
 */
export const generateVoice = (text: string) => {
  return request<{ objectName: string; url: string }>({
    url: '/notice/generate-voice',
    method: 'post',
    data: { text },
  })
}

/**
 * 阅读通知（增加阅读量）
 */
export const viewNotice = (noticeId: number) => {
  return request({
    url: `/notice/view/${noticeId}`,
    method: 'post',
  })
}