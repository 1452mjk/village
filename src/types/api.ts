import type { Result } from './global'

declare module '@/utils/request' {
  export interface RequestOptions {
    // 扩展选项（如果需要）
  }
}

// 由于 request 返回的是 Promise<T>，其中 T 是 Result.data 的类型
// 我们已经通过拦截器直接返回 data，所以不需要额外声明