import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types'
import router from '@/router'

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 是否正在刷新token
let isRefreshing = false
// 等待重试的请求队列
let pendingRequests: Array<() => void> = []

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data as ApiResponse

    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')

      // 业务码 401 未授权，清理并跳转
      if (res.code === 401) {
        import('@/stores/user').then(({ useUserStore }) => {
          const userStore = useUserStore()
          userStore.clearAuth()
        })
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res.data
  },
  async (error) => {
    const originalRequest = error.config
    
  // 👇 新增：如果是登录请求且状态码 401/403，直接拒绝，不刷新 token
  if (originalRequest?._isLoginRequest && 
      (error.response?.status === 401 || error.response?.status === 403)) {
    return Promise.reject(error)
  }
    // 如果错误是401/403，且没有重试标记，则尝试刷新token
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      if (isRefreshing) {
        // 正在刷新，将请求加入队列等待
        return new Promise((resolve) => {
          pendingRequests.push(() => {
            originalRequest.headers.Authorization = `Bearer ${sessionStorage.getItem('token')}`
            resolve(service(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // 调用刷新token接口
        const response = await service({
          url: '/auth/refresh',
          method: 'post',
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`
          }
        }) as string // 假设返回的是token字符串

        const newToken = response // 实际返回格式可能为 { data: token }，取决于响应拦截器
        // 更新存储
        sessionStorage.setItem('token', newToken)

        // 更新当前请求的Authorization头
        originalRequest.headers.Authorization = `Bearer ${newToken}`

        // 重试所有等待的请求
        pendingRequests.forEach(callback => callback())
        pendingRequests = []

        // 重试当前请求
        return service(originalRequest)
      } catch (refreshError) {
        console.error('刷新token失败', refreshError)
        // 刷新失败，清理并跳转登录
        import('@/stores/user').then(({ useUserStore }) => {
          const userStore = useUserStore()
          userStore.clearAuth()
        })
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // 其他错误处理
    let message = error.message || '网络异常，请稍后重试'
    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 400:
          message = '请求参数错误'
          break
        case 404:
          message = '请求资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `请求错误 (${status})`
      }
    }
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  return service(config)
}

export default request