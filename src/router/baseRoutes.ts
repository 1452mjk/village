import type { RouteRecordRaw } from 'vue-router'

export const baseRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/common/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/common/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/common/error/403.vue'),
    meta: { title: '无权限' }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/common/error/404.vue'),
    meta: { title: '页面不存在' }
  },

  // {
  //   path: '/:pathMatch(.*)*',
  //   redirect: '/404'
  // }

{
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('@/views/common/error/404.vue')
}
]