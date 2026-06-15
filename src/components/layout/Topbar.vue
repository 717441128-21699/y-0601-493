<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronRight,
  SlidersHorizontal,
  Search,
  Filter,
  Bell,
  Maximize2,
  Minimize2,
  User,
  Shield,
  MapPin,
  LogOut,
  Clock,
} from 'lucide-vue-next'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { useAlertsStore } from '@/stores/alerts'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const alertsStore = useAlertsStore()

const searchText = ref('')
const userMenuOpen = ref(false)
const isFullscreen = ref(false)
const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
const showTooltip = ref(false)

let timeTimer: number | null = null

onMounted(() => {
  timeTimer = window.setInterval(() => {
    currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }, 1000)
})

onUnmounted(() => {
  if (timeTimer) window.clearInterval(timeTimer)
})

const breadcrumbs = computed(() => {
  const crumbs: { title: string; path: string }[] = []
  route.matched.forEach((r) => {
    if (r.meta?.title) {
      crumbs.push({ title: r.meta.title, path: r.path })
    }
  })
  return crumbs
})

const pendingCount = computed(() => {
  return alertsStore.pendingL1.length + alertsStore.pendingL2.length
})

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

const getInitial = (name: string) => {
  return name ? name.charAt(0).toUpperCase() : 'U'
}
</script>

<template>
  <header class="h-16 flex items-center border-b border-default bg-bg-secondary/80 backdrop-blur-md px-4 gap-6 relative z-30">
    <div class="flex items-center gap-2 min-w-0">
      <div class="flex items-center gap-1.5 text-sm text-text-secondary">
        <span class="text-primary-400 cursor-pointer" @click="router.push('/dashboard')">首页</span>
        <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
          <ChevronRight class="w-4 h-4 text-text-tertiary" />
          <span
            v-if="idx === breadcrumbs.length - 1"
            class="text-text-primary font-medium truncate max-w-[160px]"
          >
            {{ crumb.title }}
          </span>
          <span v-else class="text-text-secondary cursor-pointer hover:text-primary-400 truncate max-w-[120px]" @click="router.push(crumb.path)">
            {{ crumb.title }}
          </span>
        </template>
      </div>
      <button class="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-text-secondary hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-200 border border-transparent hover:border-primary-500/30 ml-2">
        <SlidersHorizontal class="w-4 h-4" />
        <span>筛选</span>
      </button>
    </div>

    <div class="flex-1 max-w-md mx-auto">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          v-model="searchText"
          type="text"
          placeholder="搜索冷库、批次、接种记录..."
          class="w-full h-10 pl-10 pr-24 bg-bg-tertiary/60 border border-default rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary-500/60 focus:shadow-[0_0_0_3px_rgba(24,144,255,0.1)] transition-all duration-200"
        />
        <button class="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-text-secondary hover:bg-primary-500/20 hover:text-primary-300 transition-all">
          <Filter class="w-3.5 h-3.5" />
          <span>高级</span>
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm text-text-secondary mr-4 pr-4 border-r border-default py-1">
        <Clock class="w-4 h-4 text-primary-400" />
        <span class="font-mono tracking-wide text-text-primary">{{ currentTime }}</span>
      </div>

      <div
        class="relative p-2 rounded-lg cursor-pointer hover:bg-primary-500/10 transition-all duration-200 group"
        @mouseenter="showTooltip = true"
        @mouseleave="showTooltip = false"
        @click="router.push('/alerts')"
      >
        <Bell
          class="w-5 h-5 text-text-secondary group-hover:text-primary-300 transition-all"
          :class="pendingCount > 0 ? 'animate-pulse-slow' : ''"
        />
        <span
          v-if="pendingCount > 0"
          class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
          style="background: linear-gradient(135deg, #F5222D 0%, #CF1322 100%); box-shadow: 0 0 8px rgba(245,34,45,0.6)"
        >
          {{ pendingCount > 99 ? '99+' : pendingCount }}
        </span>
        <div
          v-if="showTooltip && pendingCount > 0"
          class="absolute right-0 top-full mt-2 px-3 py-2 rounded-lg bg-bg-tertiary border border-default text-xs text-text-secondary whitespace-nowrap z-50 shadow-glow-blue"
        >
          待处理预警：<span class="text-warning-400 font-medium">L1 {{ alertsStore.pendingL1.length }}</span>
          <span class="mx-1 text-text-tertiary">+</span>
          <span class="text-danger-400 font-medium">L2 {{ alertsStore.pendingL2.length }}</span>
        </div>
      </div>

      <button
        class="p-2 rounded-lg text-text-secondary hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-200"
        @click="toggleFullscreen"
      >
        <Minimize2 v-if="isFullscreen" class="w-5 h-5" />
        <Maximize2 v-else class="w-5 h-5" />
      </button>

      <div class="relative ml-2">
        <button
          class="flex items-center gap-2 p-1 pr-3 rounded-lg hover:bg-primary-500/10 transition-all duration-200 border border-transparent hover:border-primary-500/30"
          @click="userMenuOpen = !userMenuOpen"
        >
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style="background: linear-gradient(135deg, #1890FF 0%, #722ED1 100%); box-shadow: 0 0 12px rgba(24,144,255,0.4)"
          >
            {{ getInitial(userStore.userInfo?.realName || 'U') }}
          </div>
          <div class="hidden md:flex flex-col items-start text-left leading-tight">
            <span class="text-sm font-medium text-text-primary">{{ userStore.userInfo?.realName || '用户' }}</span>
            <span class="text-[11px] text-text-tertiary">{{ userStore.roleLabel }}</span>
          </div>
        </button>

        <Transition name="dropdown">
          <div
            v-if="userMenuOpen"
            class="absolute right-0 top-full mt-2 w-64 rounded-xl border border-default bg-bg-secondary/95 backdrop-blur-xl shadow-glow-blue overflow-hidden z-50"
          >
            <div class="p-4 border-b border-default">
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style="background: linear-gradient(135deg, #1890FF 0%, #722ED1 100%)"
                >
                  {{ getInitial(userStore.userInfo?.realName || 'U') }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-text-primary truncate">{{ userStore.userInfo?.realName }}</div>
                  <div class="text-xs text-text-tertiary truncate">@{{ userStore.userInfo?.username }}</div>
                </div>
              </div>
            </div>
            <div class="py-2">
              <div class="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Shield class="w-4 h-4 text-primary-400 shrink-0" />
                <span class="text-text-secondary">{{ userStore.roleLabel }}</span>
              </div>
              <div class="flex items-center gap-3 px-4 py-2.5 text-sm">
                <MapPin class="w-4 h-4 text-success-400 shrink-0" />
                <span class="text-text-secondary">{{ userStore.areaScope }}</span>
              </div>
              <div class="flex items-center gap-3 px-4 py-2.5 text-sm">
                <User class="w-4 h-4 text-warning-400 shrink-0" />
                <span class="text-text-secondary">个人资料</span>
              </div>
            </div>
            <div class="border-t border-default py-1.5">
              <button
                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-400 hover:bg-danger-500/10 transition-all"
                @click="handleLogout"
              >
                <LogOut class="w-4 h-4" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
