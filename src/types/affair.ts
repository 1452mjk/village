// src/types/affair.ts

import type { PageParams } from './common'
import type { User } from './user'

/**
 * 村务类型
 */
export type AffairType = 'financial' | 'meeting' | 'notice'

/**
 * 村务实体
 */
export interface VillageAffair {
  id: number
  title: string
  type: AffairType
  content: string
  villageId: number
  publisherId: number
  attachments?: string[]
  startDate: string
  endDate: string
  allowFeedback: boolean
  status: 0 | 1 | 2 | 3  // 0-草稿,1-已发布,2-已过期,3-已删除
  createTime: string
  updateTime: string
  publisherName?: string   // 发布人姓名
  feedbacks?: AffairFeedback[] // 异议列表（详情用）
}

/**
 * 异议反馈实体
 */
export interface AffairFeedback {
  id: number
  affairId: number
  userId: number
  content: string
  attachments?: string[]
  replyContent?: string
  replyTime?: string
  replyUserId?: number
  status: 0 | 1 | 2  // 0-待回复,1-已回复,2-已关闭
  createTime: string
  updateTime: string
  user?: User          // 提异议的村民
  replyUser?: User     // 回复的村干部
}

/**
 * 异议提交请求
 */
export interface FeedbackRequest {
  content: string
  attachments?: string[]
}

/**
 * 村务查询参数
 */
export interface AffairQueryParams extends PageParams {
  villageId?: number
  type?: AffairType
}
/**
 * 提交异议请求
 */
export interface SubmitFeedbackRequest {
  affairId: number
  content: string
  attachments?: string[]
}

/**
 * 回复异议请求
 */
export interface ReplyFeedbackRequest {
  feedbackId: number
  replyContent: string
}