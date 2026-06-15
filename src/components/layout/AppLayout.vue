<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'

const uiStore = useUiStore()
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
