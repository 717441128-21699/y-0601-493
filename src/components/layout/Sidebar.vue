<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Snowflake,
  LayoutDashboard,
  Thermometer,
  Settings2,
  Package,
  Syringe,
  AlertTriangle,
  FileCheck,
  CalendarCheck,
  TrendingUp,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Lock,
} from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import { useAlertsStore } from '@/stores/alerts'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()
const userStore = useUserStore()
const alertsStore = useAlertsStore()

const menuGroups = [
  {
    title: '监测中心',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, title: '核心看板', level: 3 },
      { path: '/coldchain', icon: Thermometer, title: '冷链监测', level: 3 },
      { path: '/coldchain/equipment', icon: Settings2, title: '冷链设备', level: 2 },
    ],
  },
  {
    title: '业务管理',
    items: [
      { path: '/inventory', icon: Package, title: '库存管理', level: 3 },
      { path: '/vaccination', icon: Syringe, title: '接种管理', level: 3 },
    ],
  },
  {
    title: '预警与规划',
    items: [
      { path: '/alerts', icon: AlertTriangle, title: '预警中心', level: 3, badge: 'alerts' },
      { path: '/alerts/approval', icon: FileCheck, title: '审批工作台', level: 3, badge: 'approval' },
      { path: '/plan', icon: CalendarCheck, title: '免疫规划', level: 2 },
      { path: '/plan/forecast', icon: TrendingUp, title: '缺口预测', level: 2 },
    ],
  },
  {
    title: '报表与设置',
    items: [
      { path: '/reports', icon: BarChart3, title: '统计报表', level: 3 },
      { path: '/settings', icon: Settings, title: '系统设置', level: 2 },
    ],
  },
]

const currentPath = computed(() => route.path)
const userLevel = computed(() => userStore.userLevel)

const alertsBadgeCount = computed(() => {
  return alertsStore.pendingL1.length + alertsStore.pendingL2.length
})

const approvalBadgeCount = computed(() => {
  const user = userStore.userInfo
  if (!user) return 0
  let count = 0
  const approvals = alertsStore.myApprovals
  for (const flow of approvals) {
    if (user.role === 'COLD_CHAIN' && flow.currentStep === 'ADMIN_CONFIRM') count++
    else if ((user.level === 3 || user.role === 'CITY') && flow.currentStep === 'CITY_REVIEW') count++
    else if ((user.level === 2 || user.role === 'PROVINCE') && flow.currentStep === 'PROVINCE_APPROVE') count++
    else if (user.level === 1) count++
  }
  return count
})

function getBadgeCount(badgeType?: string): number {
  if (badgeType === 'alerts') return alertsBadgeCount.value
  if (badgeType === 'approval') return approvalBadgeCount.value
  return 0
}

const isDisabled = (level: number) => level < userLevel.value
const isActive = (path: string) => currentPath.value === path || currentPath.value.startsWith(path + '/')

const handleNavClick = (item: { path: string; level: number }) => {
  if (isDisabled(item.level)) return
  router.push(item.path)
}
</script>

<template>
  <aside
    class="fixed left-0 top-0 h-full flex flex-col border-r border-default bg-bg-secondary/90 backdrop-blur-md z-40 transition-all duration-300"
    :class="uiStore.sidebarCollapsed ? 'w-16' : 'w-60'"
  >
    <div
      class="h-16 flex items-center border-b border-default cursor-pointer transition-all duration-300"
      :class="uiStore.sidebarCollapsed ? 'justify-center px-2' : 'px-4 gap-3'"
      @click="$router.push('/dashboard')"
    >
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style="background: linear-gradient(135deg, #1890FF 0%, #096DD9 100%); box-shadow: 0 0 16px rgba(24, 144, 255, 0.5)"
      >
        <Snowflake class="w-6 h-6 text-white" />
      </div>
      <Transition name="slide-fade">
        <div v-if="!uiStore.sidebarCollapsed" class="flex flex-col">
          <span class="text-sm font-bold text-text-primary leading-tight">疫苗冷链监测</span>
          <span class="text-[10px] text-text-tertiary leading-tight">Vaccine Cold Chain</span>
        </div>
      </Transition>
    </div>

    <nav class="flex-1 overflow-y-auto py-3 px-2">
      <div v-for="group in menuGroups" :key="group.title" class="mb-4">
        <Transition name="slide-fade">
          <div
            v-if="!uiStore.sidebarCollapsed"
            class="px-3 mb-2 text-[11px] font-medium text-text-tertiary tracking-wider uppercase"
          >
            {{ group.title }}
          </div>
        </Transition>
        <ul class="space-y-1">
          <li v-for="item in group.items" :key="item.path">
            <button
              class="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200 relative group"
              :class="[
                isActive(item.path)
                  ? 'bg-primary-500/20 text-primary-300'
                  : isDisabled(item.level)
                  ? 'text-text-tertiary/50 cursor-not-allowed'
                  : 'text-text-secondary hover:bg-primary-500/10 hover:text-primary-300',
                uiStore.sidebarCollapsed ? 'justify-center px-2' : '',
              ]"
              :disabled="isDisabled(item.level)"
              @click="handleNavClick(item)"
            >
              <span
                v-if="isActive(item.path)"
                class="absolute left-0 top-1 bottom-1 w-[3px] bg-primary-500 rounded-r"
              />
              <component
                :is="item.icon"
                class="w-5 h-5 shrink-0 transition-all duration-200"
                :class="[
                  isActive(item.path)
                    ? 'drop-shadow-[0_0_6px_rgba(24,144,255,0.6)]'
                    : '',
                ]"
              />
              <Transition name="slide-fade">
                <span v-if="!uiStore.sidebarCollapsed" class="flex-1 text-left truncate">
                  {{ item.title }}
                </span>
              </Transition>
              <Transition name="slide-fade">
                <template v-if="!uiStore.sidebarCollapsed">
                  <span
                    v-if="getBadgeCount((item as any).badge) > 0"
                    class="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                    style="background: linear-gradient(135deg, #F5222D 0%, #CF1322 100%); box-shadow: 0 0 6px rgba(245,34,45,0.5)"
                  >
                    {{ getBadgeCount((item as any).badge) > 99 ? '99+' : getBadgeCount((item as any).badge) }}
                  </span>
                  <Lock
                    v-if="isDisabled(item.level)"
                    class="w-3.5 h-3.5 text-text-tertiary"
                  />
                </template>
              </Transition>
              <span
                v-if="uiStore.sidebarCollapsed && getBadgeCount((item as any).badge) > 0"
                class="absolute top-1.5 right-1.5 min-w-[8px] h-[8px] rounded-full"
                style="background: #F5222D; box-shadow: 0 0 4px rgba(245,34,45,0.6)"
              />
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <div class="border-t border-default p-2">
      <button
        class="w-full flex items-center justify-center gap-2 h-10 rounded-md text-text-secondary hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-200"
        :class="uiStore.sidebarCollapsed ? '' : 'px-3'"
        @click="uiStore.toggleSidebar()"
      >
        <ChevronsLeft v-if="!uiStore.sidebarCollapsed" class="w-5 h-5" />
        <ChevronsRight v-else class="w-5 h-5" />
        <Transition name="slide-fade">
          <span v-if="!uiStore.sidebarCollapsed" class="text-sm">收起菜单</span>
        </Transition>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
