import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    level: 1 | 2 | 3
    icon: string
    public?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { title: '登录', level: 1, icon: 'LogIn', public: true },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue'),
    meta: { title: '核心看板', level: 3, icon: 'LayoutDashboard' },
  },
  {
    path: '/coldchain',
    name: 'ColdChain',
    component: () => import('@/pages/ColdChain.vue'),
    meta: { title: '冷链监测', level: 3, icon: 'Thermometer' },
  },
  {
    path: '/coldchain/equipment',
    name: 'Equipment',
    component: () => import('@/pages/Equipment.vue'),
    meta: { title: '冷链设备', level: 2, icon: 'Settings2' },
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('@/pages/Inventory.vue'),
    meta: { title: '库存管理', level: 3, icon: 'Package' },
  },
  {
    path: '/vaccination',
    name: 'Vaccination',
    component: () => import('@/pages/Vaccination.vue'),
    meta: { title: '接种管理', level: 3, icon: 'Syringe' },
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('@/pages/Alerts.vue'),
    meta: { title: '预警中心', level: 3, icon: 'AlertTriangle' },
  },
  {
    path: '/alerts/approval',
    name: 'Approval',
    component: () => import('@/pages/Approval.vue'),
    meta: { title: '审批工作台', level: 3, icon: 'FileCheck' },
  },
  {
    path: '/plan',
    name: 'Plan',
    component: () => import('@/pages/Plan.vue'),
    meta: { title: '免疫规划', level: 2, icon: 'CalendarCheck' },
  },
  {
    path: '/plan/forecast',
    name: 'Forecast',
    component: () => import('@/pages/Forecast.vue'),
    meta: { title: '缺口预测', level: 2, icon: 'TrendingUp' },
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/pages/Reports.vue'),
    meta: { title: '统计报表', level: 3, icon: 'BarChart3' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/Settings.vue'),
    meta: { title: '系统设置', level: 2, icon: 'Settings' },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/pages/Forbidden.vue'),
    meta: { title: '无权限', level: 1, icon: 'ShieldX', public: true },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/pages/NotFound.vue'),
    meta: { title: '页面不存在', level: 1, icon: 'HelpCircle', public: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (to.meta.public && to.path === '/login') {
    if (token) {
      next('/dashboard')
      return
    }
    next()
    return
  }

  if (!token) {
    next('/login')
    return
  }

  if (to.meta.level && to.meta.level < userStore.userLevel) {
    next('/403')
    return
  }

  next()
})

export default router
