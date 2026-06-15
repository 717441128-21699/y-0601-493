<script setup lang="ts">
import { Inbox, SearchX, ShieldAlert, FileX, RefreshCw } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    text?: string
    description?: string
    icon?: 'inbox' | 'search' | 'shield' | 'file'
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    text: '暂无数据',
    description: '',
    icon: 'inbox',
    size: 'md',
  }
)

const iconMap = {
  inbox: Inbox,
  search: SearchX,
  shield: ShieldAlert,
  file: FileX,
}

const sizeClass = {
  sm: { icon: 'w-10 h-10', title: 'text-sm', gap: 'gap-2', py: 'py-6' },
  md: { icon: 'w-16 h-16', title: 'text-base', gap: 'gap-3', py: 'py-10' },
  lg: { icon: 'w-20 h-20', title: 'text-lg', gap: 'gap-4', py: 'py-16' },
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center w-full"
    :class="sizeClass[size].py"
  >
    <div
      class="relative flex items-center justify-center rounded-full mb-2 transition-all duration-300"
      :class="sizeClass[size].icon"
      :style="{
        background: 'linear-gradient(135deg, rgba(24,144,255,0.15) 0%, rgba(24,144,255,0.03) 100%)',
        border: '1px dashed rgba(24,144,255,0.3)',
      }"
    >
      <div
        class="absolute inset-0 rounded-full opacity-50 animate-pulse-slow"
        style="box-shadow: 0 0 32px rgba(24,144,255,0.2) inset"
      />
      <component
        :is="iconMap[icon]"
        class="relative transition-all duration-300 animate-float"
        style="color: #3399FF; opacity: 0.8"
        :class="[size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10']"
      />
    </div>

    <div class="flex flex-col items-center" :class="sizeClass[size].gap">
      <span
        class="font-medium"
        :class="[sizeClass[size].title, 'text-text-secondary']"
      >
        {{ text }}
      </span>
      <span
        v-if="description"
        class="text-xs text-text-tertiary text-center max-w-[280px] leading-relaxed"
      >
        {{ description }}
      </span>
    </div>

    <div v-if="$slots.default" class="mt-5">
      <slot />
    </div>
  </div>
</template>
