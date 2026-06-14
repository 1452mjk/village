// src/api/auth.ts
import request from '@/utils/request'
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '@/types'

// ========== 文件上传签名接口 ==========

/**
 * 获取头像上传的签名URL
 * @param filename 原始文件名
 */
export const getAvatarUploadToken = (filename: string) => {
  return request<{ uploadUrl: string; objectName: string; expireTime: number }>({
    url: '/auth/avatar/token',
    method: 'get',
    params: { filename },
  })
}

// ========== 业务接口 ==========

/**
 * 用户登录
 */
export const login = (data: LoginRequest) => {
  return request<LoginResponse>({
    url: '/auth/login',
    method: 'post',
    data: {
      ...data,
      phone: String(data.phone)
    },
      _isLoginRequest: true   // 👈 添加标记

  })
}

/**
 * 用户注册
 */
export const register = (data: RegisterRequest) => {
  return request({
    url: '/auth/register',
    method: 'post',
    data,
  })
}

/**
 * 退出登录
 */
export const logout = () => {
  return request({
    url: '/auth/logout',
    method: 'post',
  })
}

// 获取当前用户信息
export const getUserInfo = () => {
  return request<User>({
    url: '/auth/info',
    method: 'get'
  })
}

// 更新个人信息
export const updateUserProfile = (data: Partial<User>) => {
  return request<User>({
    url: '/auth/profile',
    method: 'put',
    data
  })
}

// 修改密码
export const changePassword = (data: { oldPassword: string; newPassword: string }) => {
  return request({
    url: '/auth/change-password',
    method: 'post',
    data
  })
}

// 注意：原来的 uploadAvatar 已废弃，由组件直接调用 getAvatarUploadToken + OSS直传，然后调用更新头像接口（/auth/avatar）提交 objectName
// 更新头像接口已在 AuthController 中实现，但前端需要调用它
// 因此，我们新增一个更新头像的API：

/**
 * 更新用户头像（提交 objectName）
 * @param objectName OSS对象路径
 */
export const updateAvatar = (objectName: string) => {
  return request<string>({
    url: '/auth/avatar',
    method: 'post',
    data: { objectName }
  })
}