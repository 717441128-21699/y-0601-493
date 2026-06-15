<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'
import NotificationToast, { type ToastItem } from '@/components/NotificationToast.vue'
import { useAlertsStore } from '@/stores/alerts'
import { useUserStore } from '@/stores/user'
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const uiStore = useUiStore()
const alertsStore = useAlertsStore()
const userStore = useUserStore()
const router = useRouter()

const toastRef = ref<InstanceType<typeof NotificationToast> | null>(null)
let lastNotifiedCount = 0

watch(
  () => alertsStore.escalatedNotifyCount,
  (newCount) => {
    if (newCount > lastNotifiedCount && toastRef.value) {
      const diff = newCount - lastNotifiedCount
      toastRef.value.add({
        type: 'warning',
        title: '预警升级提醒',
        message: `您有 ${diff} 条预警因处置超时已升级为二级，请前往审批工作台处理。`,
        duration: 8000,
        action: {
          label: '立即前往',
          onClick: () => router.push('/alerts/approval'),
        },
      })
      lastNotifiedCount = newCount
    }
  }
)

watch(
  () => userStore.isLoggedIn,
  (logged) => {
    if (logged) {
      alertsStore.startPolling(30000)
    } else {
      alertsStore.stopPolling()
    }
  }
)

onMounted(() => {
  lastNotifiedCount = alertsStore.escalatedNotifyCount
  if (userStore.isLoggedIn) {
    alertsStore.startPolling(30000)
  }
})

onUnmounted(() => {
  alertsStore.stopPolling()
})
</script>

<template>
  <div class="flex h-full w-full bg-bg-primary tech-grid">
    <Sidebar />
    <div
      class="flex flex-col flex-1 overflow-hidden transition-all duration-300"
      :class="uiStore.sidebarCollapsed ? 'ml-16' : 'ml-60'"
    >
      <Topbar />
      <main class="flex-1 p-4 overflow-auto" style="height: calc(100vh - 64px - 28px)">
        <Transition name="fade-stagger" mode="out-in">
          <slot />
        </Transition>
      </main>
      <footer class="h-7 flex items-center justify-center text-xs text-text-tertiary border-t border-default bg-bg-secondary/50">
        <span>© 2026 疫苗冷链监测平台 · 国家疾控局</span>
      </footer>
    </div>
    <NotificationToast ref="toastRef" />
  </div>
</template>

<style scoped>
.fade-stagger-enter-active {
  animation: fadeInUp 0.5s ease-out forwards;
}
.fade-stagger-leave-active {
  animation: fadeOutDown 0.3s ease-in forwards;
}
@keyframes fadeOutDown {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(16px);
  }
}
</style>
