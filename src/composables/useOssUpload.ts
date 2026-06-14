import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

interface UploadResult {
  objectName: string
  url: string
}

interface UploadOptions {
  maxSize?: number          // 文件大小限制（字节）
  allowedTypes?: string[]   // 允许的 MIME 类型
  onProgress?: (percent: number) => void
}

export function useOssUpload() {
  const uploading = ref(false)
  const progress = ref(0)

  const uploadFile = async (
    file: File,
    tokenUrl: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    // 前端校验
    if (options.maxSize && file.size > options.maxSize) {
      throw new Error(`文件大小不能超过 ${options.maxSize / 1024 / 1024}MB`)
    }
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      throw new Error('不支持的文件类型')
    }

    uploading.value = true
    progress.value = 0

    // 保存原始的 Authorization 头（用于恢复）
    const originalAuthHeader = axios.defaults.headers.common['Authorization']

    try {
      // 1. 获取签名（传递 filename 和 contentType）
      const { data: response } = await axios.get(tokenUrl, {
        params: {
          filename: file.name,
          contentType: file.type  // 传递文件 MIME 类型
        }
      })

      // 处理签名响应
      if (!response || (response.code !== 200 && response.code !== 0)) {
        throw new Error(response?.message || '获取上传签名失败')
      }

      const { uploadUrl, objectName } = response.data
      if (!uploadUrl || !objectName) {
        throw new Error('签名响应缺少必要字段')
      }

      // 2. 使用 XMLHttpRequest 直传 OSS
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl, true)

      // 设置 Content-Type（与签名时一致）
      xhr.setRequestHeader('Content-Type', file.type)

      // 进度监听
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded * 100) / e.total)
          progress.value = percent
          options.onProgress?.(percent)
        }
      })

      // 包装为 Promise
      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ objectName, url: '' }) // url 暂时为空，后面由后端返回
          } else {
            reject(new Error(`上传失败 (HTTP ${xhr.status})`))
          }
        }
        xhr.onerror = () => reject(new Error('网络错误'))
        xhr.ontimeout = () => reject(new Error('上传超时'))
        xhr.send(file)
      })

      await uploadPromise
      return { objectName, url: '' }
    } catch (error: any) {
      console.error('上传失败', error)
      ElMessage.error(error.message || '上传失败')
      return Promise.reject(error)
    } finally {
      // 恢复全局 Authorization 头
      if (originalAuthHeader) {
        axios.defaults.headers.common['Authorization'] = originalAuthHeader
      } else {
        delete axios.defaults.headers.common['Authorization']
      }
      uploading.value = false
      progress.value = 0
    }
  }

  // uploadFiles 保持不变
  const uploadFiles = async (
    files: File[],
    tokenUrl: string,
    options: UploadOptions = {}
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = []
    for (const file of files) {
      const result = await uploadFile(file, tokenUrl, options)
      results.push(result)
    }
    return results
  }

  return {
    uploading,
    progress,
    uploadFile,
    uploadFiles
  }
}