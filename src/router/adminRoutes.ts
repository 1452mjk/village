import type { RouteRecordRaw } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

export const adminRoutes: RouteRecordRaw = {
  path: '/admin',
  name: 'Admin',
  component: AdminLayout,
  meta: { requiresAuth: true, roles: ['admin', 'village_official'] },
  children: [
    {
      path: 'dashboard',
      name: 'Dashboard',
      component: () => import('@/views/admin/Dashboard.vue'),
      meta: { title: '数据概览' }
    },
    // 用户管理（仅管理员）
    {
      path: 'user/list',
      name: 'UserList',
      component: () => import('@/views/admin/user/UserList.vue'),
      meta: { title: '用户列表', roles: ['admin'] }
    },
    {
      path: 'user/audit',
      name: 'UserAudit',
      component: () => import('@/views/admin/user/UserAudit.vue'),
      meta: { title: '用户审核', roles: ['admin'] }
    },
    {
  path: 'user/detail/:id',
  name: 'UserDetail',
  component: () => import('@/views/admin/user/UserDetail.vue'),
  meta: { title: '用户详情', roles: ['admin'] }
},
    // 政策通知管理
    {
      path: 'notice/list',
      name: 'AdminNoticeList',
      component: () => import('@/views/common/notice/NoticeList.vue'),
      meta: { title: '通知列表' }
    },
    {
      path: 'notice/publish',
      name: 'AdminNoticePublish',
      component: () => import('@/views/common/notice/NoticePublish.vue'),
      meta: { title: '发布通知' }
    },
    // 村务公开管理
    {
      path: 'affair/list',
      name: 'AdminAffairList',
      component: () => import('@/views/common/affair/AffairList.vue'),
      meta: { title: '村务列表' }
    },
    {
      path: 'affair/publish',
      name: 'AdminAffairPublish',
      component: () => import('@/views/common/affair/AffairPublish.vue'),
      meta: { title: '发布村务' }
    },
    {
      path: 'affair/feedback',
      name: 'AdminAffairFeedback',
      component: () => import('@/views/common/affair/AffairFeedback.vue'),
      meta: { title: '异议处理' }
    },
    // 投票管理
    {
      path: 'vote/list',
      name: 'AdminVoteList',
      component: () => import('@/views/common/vote/VoteList.vue'),
      meta: { title: '投票列表' }
    },
    {
      path: 'vote/publish',
      name: 'AdminVotePublish',
      component: () => import('@/views/common/vote/VotePublish.vue'),
      meta: { title: '发起投票' }
    },
    // 农产品管理
    {
      path: 'product/list',
      name: 'AdminProductList',
      component: () => import('@/views/common/product/ProductList.vue'),
      meta: { title: '产品列表' }
    },
    {
      path: 'product/audit',
      name: 'AdminProductAudit',
      component: () => import('@/views/admin/product/ProductAudit.vue'),
      meta: { title: '产品审核' }
    },
    // 生活服务管理
    {
      path: 'service/demand/list',
      name: 'AdminDemandList',
      component: () => import('@/views/admin/service/DemandList.vue'),
      meta: { title: '需求列表' }
    },
    // {
    //   path: 'service/demand/audit',
    //   name: 'AdminDemandAudit',
    //   component: () => import('@/views/admin/service/DemandAudit.vue'),
    //   meta: { title: '需求审核' }
    // },
    // 反馈管理
    {
      path: 'feedback/list',
      name: 'AdminFeedbackList',
      component: () => import('@/views/admin/feedback/FeedbackList.vue'),
      meta: { title: '反馈列表' }
    },

    // 系统设置（仅管理员）
    // {
    //   path: 'settings',
    //   name: 'AdminSettings',
    //   component: () => import('@/views/admin/settings/Settings.vue'),
    //   meta: { title: '系统设置', roles: ['admin'] }
    // },

    // 个人中心/修改密码（所有人可见）
    {
      path: 'profile',
      name: 'AdminProfile',
      component: () => import('@/views/common/Profile.vue'),
      meta: { title: '个人中心' }
    },

    // {
    //   path: 'change-password',
    //   name: 'AdminChangePassword',
    //   component: () => import('@/views/common/ChangePassword.vue'),
    //   meta: { title: '修改密码' }
    // }
  ]
}