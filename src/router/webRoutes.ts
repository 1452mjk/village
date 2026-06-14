import type { RouteRecordRaw } from 'vue-router'
import WebLayout from '@/layouts/WebLayout.vue'

export const webRoutes: RouteRecordRaw = {
  path: '/',
  name: 'Web',
  component: WebLayout,
  meta: { requiresAuth: false }, // 整体无需登录，子路由单独控制
  children: [
    {
      path: '',
      name: 'Home',
      component: () => import('@/views/common/Home.vue'),
      meta: { title: '首页' }
    },
    // 通知公告
    {
      path: 'notice',
      name: 'NoticeList',
      component: () => import('@/views/common/notice/NoticeList.vue'),
      meta: { title: '通知公告' }
    },
    {
      path: 'notice/detail/:id',
      name: 'NoticeDetail',
      component: () => import('@/views/common/notice/NoticeDetail.vue'),
      meta: { title: '通知详情' }
    },
    // 村务公开
    {
      path: 'affair/list',
      name: 'AffairList',
      component: () => import('@/views/common/affair/AffairList.vue'),
      meta: { title: '村务列表' }
    },
    {
      path: 'affair/detail/:id',
      name: 'AffairDetail',
      component: () => import('@/views/common/affair/AffairDetailWrapper.vue'),
      meta: { title: '村务详情' }
    },
    // 投票
    {
      path: 'vote/list',
      name: 'VoteList',
      component: () => import('@/views/common/vote/VoteList.vue'),
      meta: { title: '投票列表' }
    },
    {
      path: 'vote/detail/:id',
      name: 'VoteDetail',
      component: () => import('@/views/common/vote/VoteDetail.vue'),
      props: true, // 这会将路由参数作为 props 传递给组件
      meta: { title: '投票详情' }
    },
    // 农产品
    {
      path: 'product/list',
      name: 'ProductList',
      component: () => import('@/views/common/product/ProductList.vue'),
      meta: { title: '农产品列表' }
    },
    {
      path: 'product/detail/:id',
      name: 'ProductDetail',
      component: () => import('@/views/common/product/ProductDetail.vue'),
      meta: { title: '农产品详情' }
    },
    {
      path: 'product/publish',
      name: 'ProductPublish',
      component: () => import('@/views/user/product/ProductPublish.vue'),
      meta: { title: '发布产品', requiresAuth: true, roles: ['villager'] }
    },
    // 生活服务需求
    // 新增：生活便民父路由，重定向到发布需求页
    {
      path: 'service',
      redirect: '/service/demand/publish',
      meta: { title: '生活便民' }
    },
    {
      path: 'service/demand/publish',
      name: 'DemandPublish',
      component: () => import('@/views/user/service/DemandPublish.vue'),
      meta: { title: '发布需求',requiresAuth: true, roles: ['villager'] }
    },
    {
      path: 'service/demand/my',
      name: 'DemandMy',
      component: () => import('@/views/user/service/DemandMy.vue'),
      meta: { title: '我的需求',requiresAuth: true, roles: ['villager'] }
    },

    {
      path: 'service/demand/pending',
      name: 'DemandPending',
      component: () => import('@/views/merchant/service/DemandPending.vue'),
      meta: { title: '待抢单需求', requiresAuth: true, roles: ['merchant'] }
    },

  //   {
  //     path: 'service/demand/detail/:id',
  //     name: 'DemandDetail',
  //     component: () => import('@/views/merchant/service/DemandDetail.vue'),
  //     meta: { title: '需求详情', requiresAuth: true, roles: ['merchant'] }
  //  },
  {
  path: 'service/demand/detail/:id',
  name: 'DemandDetail',
  component: () => import('@/views/common/service/DemandDetailWrapper.vue'),
  meta: { title: '需求详情' }
},
    // 个人资料（登录后可见）
    {
      path: 'profile',
      name: 'Profile',
      component: () => import('@/views/common/Profile.vue'),
      meta: { title: '个人中心', requiresAuth: true }
    },

   

  ]
}