// src/types/vote.ts

import type { PageParams } from './common'

/**
 * 投票实体
 */
export interface Vote {
  id: number
  title: string
  description?: string
  villageId: number
  initiatorId: number
  isAnonymous: boolean
  startTime: string
  endTime: string
  status: 0 | 1 | 2 | 3  // 0-草稿,1-进行中,2-已结束,3-已删除
  createTime: string
  updateTime: string
  initiatorName?: string   // 发起人姓名
}

/**
 * 投票选项实体
 */
export interface VoteOption {
  id: number
  voteId: number
  option_text: string
  vote_count: number
  sortOrder: number
}

/**
 * 投票记录实体
 */
export interface VoteRecord {
  id: number
  voteId: number
  userId: number
  optionId: number
  voteTime: string
}

/**
 * 发起投票请求 DTO
 */
export interface VotePublishRequest {
  title: string
  description?: string
  isAnonymous: boolean
  startTime: string
  endTime: string
  options: {
    optionText: string
    sortOrder: number
  }[]
}

/**
 * 投票选项视图（带百分比）
 */
export interface VoteOptionVO extends VoteOption {
  percentage: number  // 得票百分比
}

/**
 * 投票详情视图
 */
export interface VoteDetail {
  voteId: number
  title: string
  description?: string
  status: number
  startTime: string
  endTime: string
  totalVoters?: number
  hasVoted?: boolean
  initiatorName?: string
  options: VoteOption[]
}

/**
 * 投票查询参数
 */
export interface VoteQueryParams extends PageParams {
  status?: number  // 1-进行中,2-已结束
}