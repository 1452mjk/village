import request from '@/utils/request'

export const getVillageList = () => {
  return request<Array<{ id: number; name: string }>>({
    url: '/village/list',
    method: 'get'
  })
}