// src/api/vote.ts
import request from '@/utils/request'
import type {
  Vote,
  VotePublishRequest,
  VoteDetail,
  VoteQueryParams,
  PageResult,
} from '@/types'

/**
 * 发起投票（村干部）
 */
export const publishVote = (data: VotePublishRequest) => {
  return request<Vote>({
    url: '/vote/publish',
    method: 'post',
    data,
  })
}

/**
 * 投票
 */
export const castVote = (voteId: number, optionId: number) => {
  return request({
    url: `/vote/cast/${voteId}`,
    method: 'post',
    params: { optionId },
  })
}

/**
 * 获取投票详情
 */
export const getVoteDetail = (voteId: number) => {
  return request<VoteDetail>({
    url: `/vote/detail/${voteId}`,
    method: 'get',
  })
}

/**
 * 分页查询投票列表
 */
export const getVotePage = (params: VoteQueryParams) => {
  return request<PageResult<Vote>>({
    url: '/vote/list',
    method: 'get',
    params,
  })
}

/**
 * 结束投票（村干部/管理员）
 * @param voteId 投票ID
 */
export const endVote = (voteId: number) => {
  return request({
    url: `/vote/end/${voteId}`,
    method: 'post',
  })
}