<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { AlertTriangle, X, FileCheck } from 'lucide-vue-next'

export interface ToastItem {
  id: number
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  action?: { label: string; onClick: () => void }
}

const toasts = ref<ToastItem[]>([])
let idCounter = 0
const timers = new Map<number, number>()

function add(toast: Omit<ToastItem, 'id'>) {
  const id = ++idCounter
  toasts.value.push({ id, ...toast })

  const duration = toast.duration ?? 5000
  if (duration > 0) {
    const timer = window.setTimeout(() => {
      remove(id)
    }, duration)
    timers.set(id, timer)
  }
  return id
}

function remove(id: number) {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx >= 0) {
    toasts.value.splice(idx, 1)
  }
  const timer = timers.get(id)
  if (timer) {
    window.clearTimeout(timer)
    timers.delete(id)
  }
}

function handleActionClick(toast: ToastItem) {
  if (toast.action?.onClick) {
    toast.action.onClick()
  }
  remove(toast.id)
}

onUnmounted(() => {
  timers.forEach((t) => window.clearTimeout(t))
  timers.clear()
})

defineExpose({ add, remove })
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[380px] w-[calc(100vw-32px)]">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto relative rounded-xl shadow-2xl overflow-hidden animate-fade-in-up"
          :class="[
            toast.type === 'error'
              ? 'bg-gradient-to-r from-danger-900/95 to-danger-800/90 border border-danger-500/40'
              : toast.type === 'warning'
              ? 'bg-gradient-to-r from-warning-900/95 to-warning-800/90 border border-warning-500/40'
              : toast.type === 'success'
              ? 'bg-gradient-to-r from-success-900/95 to-success-800/90 border border-success-500/40'
              : 'bg-gradient-to-r from-primary-900/95 to-primary-800/90 border border-primary-500/40',
          ]"
          style="backdrop-filter: blur(12px)"
        >
          <div
            class="absolute left-0 top-0 bottom-0 w-1"
            :class="[
              toast.type === 'error'
                ? 'bg-danger-400'
                : toast.type === 'warning'
                ? 'bg-warning-400'
                : toast.type === 'success'
                ? 'bg-success-400'
                : 'bg-primary-400',
            ]"
          />
          <div class="p-4 pl-5 pr-10 flex gap-3">
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              :class="[
                toast.type === 'error'
                  ? 'bg-danger-500/25 text-danger-300'
                  : toast.type === 'warning'
                  ? 'bg-warning-500/25 text-warning-300'
                  : toast.type === 'success'
                  ? 'bg-success-500/25 text-success-300'
                  : 'bg-primary-500/25 text-primary-300',
              ]"
            >
              <AlertTriangle v-if="toast.type === 'warning' || toast.type === 'error'" class="w-5 h-5" />
              <FileCheck v-else class="w-5 h-5" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-text-primary text-sm mb-1">{{ toast.title }}</div>
              <div class="text-xs text-text-secondary leading-relaxed">{{ toast.message }}</div>
              <button
                v-if="toast.action"
                class="mt-2 text-xs font-medium px-3 py-1 rounded-md transition-all"
                :class="[
                  toast.type === 'error'
                    ? 'bg-danger-500/25 text-danger-300 hover:bg-danger-500/40'
                    : toast.type === 'warning'
                    ? 'bg-warning-500/25 text-warning-300 hover:bg-warning-500/40'
                    : 'bg-primary-500/25 text-primary-300 hover:bg-primary-500/40',
                ]"
                @click="handleActionClick(toast)"
              >
                {{ toast.action.label }}
              </button>
            </div>
            <button
              class="absolute top-2.5 right-2.5 w-7 h-7 rounded-md flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-white/10 transition-all"
              @click="remove(toast.id)"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(24px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(0.96);
}
.toast-move {
  transition: transform 0.25s ease;
}
</style>
