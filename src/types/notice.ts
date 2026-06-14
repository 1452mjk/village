import type { PageParams } from './common'
import type { User } from './user'

/**
 * 通知类型
 */
export type NoticeType = 'policy' | 'emergency'

/**
 * 通知实体（与后端 Notice 对应）
 */
export interface Notice {
  id: number
  title: string
  content: string
  type: NoticeType
  publisherId: number
  villageId?: number | null // null 表示全乡镇
  voiceUrl?: string
  attachments?: string[] // 附件 URL 列表
  isVoice: boolean
  readCount: number
  likeCount: number
  commentCount: number
  status: 0 | 1 | 2 // 0-草稿 1-已发布 2-已删除
  publishTime: string
  expireTime?: string
  createTime: string
  updateTime: string
}

/**
 * 通知发布请求
 */
export interface NoticePublishRequest {
  title: string
  content: string
  type: NoticeType
  villageId?: number | null
  isVoice?: boolean
  attachments?: string[]
  expireTime?: string
}

/**
 * 通知详情视图（含评论）
 */
export interface NoticeDetail extends Notice {
  comments: NoticeComment[]
  publisherName?: string  // 发布人姓名
   likedByCurrent?: boolean  // 新增
}

/**
 * 通知评论
 */
export interface NoticeComment {
  id: number
  noticeId: number
  userId: number
  content: string
  likeCount: number
  parentId?: number
  status: 0 | 1  // 0-删除,1-正常
  createTime: string
  // 可扩展用户信息（如评论者姓名、头像）
  user?: {
    realName: string
    avatar?: string
  }
}

/**
 * 通知查询参数
 */
export interface NoticeQueryParams extends PageParams {
  villageId?: number
  type?: NoticeType
}