<script setup lang="ts">
import { computed } from 'vue'
import type { Alert } from '@/types'
import dayjs from 'dayjs'
import {
  Thermometer,
  Package,
  Cog,
  Clock,
  Timer,
  ArrowRight,
  FileText,
} from 'lucide-vue-next'

const props = defineProps<{
  alert: Alert
}>()

const emit = defineEmits<{
  (e: 'handle', alert: Alert): void
  (e: 'detail', alert: Alert): void
}>()

const levelConfig = computed(() => {
  if (props.alert.level === 'L1') {
    return {
      border: '#FAAD14',
      badge: 'bg-warning-500/20 border-warning-500/40 text-warning-400',
      label: 'L1 一级预警',
      pulse: true,
      glow: 'rgba(250, 173, 20, 0.4)',
    }
  }
  return {
    border: '#F5222D',
    badge: 'bg-danger-500/20 border-danger-500/40 text-danger-400',
    label: 'L2 二级预警',
    pulse: true,
    glow: 'rgba(245, 34, 45, 0.4)',
  }
})

const typeConfig = computed(() => {
  const map: Record<Alert['type'], { icon: any; label: string; color: string }> = {
    TEMP_OVER: { icon: Thermometer, label: '温度超标', color: '#FF4D4F' },
    TEMP_UNDER: { icon: Thermometer, label: '温度过低', color: '#1890FF' },
    STOCK_LOW: { icon: Package, label: '库存短缺', color: '#FAAD14' },
    DEVICE_FAULT: { icon: Cog, label: '设备故障', color: '#722ED1' },
  }
  return map[props.alert.type]
})

const remainingTime = computed(() => {
  const diff = dayjs(props.alert.expireTime).diff(dayjs(), 'minute')
  if (diff <= 0) return { text: '已超期', urgent: true }
  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  return {
    text: hours > 0 ? `${hours}时${mins}分` : `${mins}分钟`,
    urgent: diff < 30,
  }
})

const approvalStepLabel = computed(() => {
  if (!props.alert.approval) return ''
  const step = props.alert.approval.currentStep
  const map: Record<string, string> = {
    ADMIN_CONFIRM: '冷链管理员确认中',
    CITY_REVIEW: '市级疾控复核中',
    PROVINCE_APPROVE: '省级卫健委批准中',
  }
  return map[step] || '审批中'
})

const isTempOver = computed(() => {
  if (!props.alert.temperature) return false
  return props.alert.temperature.current > props.alert.temperature.max
    || props.alert.temperature.current < props.alert.temperature.min
})
</script>

<template>
  <div
    class="relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer group hover:bg-white/[0.03]"
    :class="[levelConfig.pulse ? 'pulse-border' : '']"
    :style="{
      borderLeft: `4px solid ${levelConfig.border}`,
      background: 'linear-gradient(135deg, rgba(21,42,71,0.6) 0%, rgba(15,31,56,0.4) 100%)',
      border: `1px solid rgba(71,114,160,0.18)`,
      borderLeftColor: levelConfig.border,
    }"
    @mouseenter="($event.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${levelConfig.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`"
    @mouseleave="($event.currentTarget as HTMLElement).style.boxShadow = ''"
  >
    <div class="p-4">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="badge" :class="levelConfig.badge">
            {{ levelConfig.label }}
          </span>
          <span
            class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
            :style="{
              background: `${typeConfig.color}15`,
              borderColor: `${typeConfig.color}40`,
              color: typeConfig.color,
            }"
          >
            <component :is="typeConfig.icon" class="w-3 h-3" />
            {{ typeConfig.label }}
          </span>
          <span v-if="remainingTime.urgent && alert.level === 'L1'" class="badge bg-danger-500/15 border-danger-500/40 text-danger-400 animate-pulse">
            即将超期
          </span>
        </div>
        <div class="flex items-center gap-1 text-xs text-text-tertiary shrink-0">
          <Clock class="w-3 h-3" />
          <span>{{ dayjs(alert.triggerTime).format('MM-DD HH:mm') }}</span>
        </div>
      </div>

      <h4 class="text-sm font-semibold text-text-primary mb-2 line-clamp-1 group-hover:text-primary-300 transition-colors">
        {{ alert.title }}
      </h4>

      <div class="flex items-center gap-2 text-xs text-text-secondary mb-3">
        <span class="px-2 py-0.5 rounded bg-bg-tertiary/60">{{ alert.province }}</span>
        <span class="px-2 py-0.5 rounded bg-bg-tertiary/60">{{ alert.city }}</span>
        <span v-if="alert.stock" class="px-2 py-0.5 rounded bg-bg-tertiary/60 truncate max-w-[120px]">
          批次: {{ alert.stock.batchNo }}
        </span>
      </div>

      <div
        v-if="alert.temperature"
        class="rounded-lg px-3 py-2.5 mb-3 text-xs flex items-center gap-4"
        style="background: rgba(24,144,255,0.06); border: 1px solid rgba(24,144,255,0.15)"
      >
        <div class="flex items-center gap-1.5">
          <Thermometer class="w-3.5 h-3.5 text-primary-400" />
          <span class="text-text-secondary">当前温度:</span>
          <span
            class="font-mono font-bold text-sm"
            :class="isTempOver ? 'text-danger-400' : 'text-success-400'"
          >
            {{ alert.temperature.current }}°C
          </span>
        </div>
        <div class="w-px h-4 bg-white/10" />
        <div class="text-text-secondary">
          阈值:
          <span class="font-mono text-primary-300">{{ alert.temperature.min }}°C</span>
          <span class="text-text-tertiary mx-1">~</span>
          <span class="font-mono text-primary-300">{{ alert.temperature.max }}°C</span>
        </div>
        <div v-if="alert.temperature.duration" class="ml-auto text-text-tertiary">
          持续 {{ alert.temperature.duration }}min
        </div>
      </div>

      <div
        v-if="alert.stock"
        class="rounded-lg px-3 py-2.5 mb-3 text-xs flex items-center gap-4"
        style="background: rgba(250,173,20,0.06); border: 1px solid rgba(250,173,20,0.15)"
      >
        <div class="flex items-center gap-1.5">
          <Package class="w-3.5 h-3.5 text-warning-400" />
          <span class="text-text-secondary">当前库存:</span>
          <span class="font-mono font-bold text-sm text-warning-400">{{ alert.stock.current }}剂</span>
        </div>
        <div class="w-px h-4 bg-white/10" />
        <div class="text-text-secondary">
          警戒线: <span class="font-mono text-danger-300">{{ alert.stock.threshold }}剂</span>
        </div>
      </div>

      <div class="flex items-center justify-between pt-3 border-t border-white/5">
        <div class="flex items-center gap-2 text-xs">
          <template v-if="alert.level === 'L1'">
            <Timer class="w-3.5 h-3.5" :class="remainingTime.urgent ? 'text-danger-400' : 'text-warning-400'" />
            <span class="text-text-secondary">处置倒计时:</span>
            <span
              class="font-mono font-semibold"
              :class="remainingTime.urgent ? 'text-danger-400 animate-pulse' : 'text-warning-400'"
            >
              {{ remainingTime.text }}
            </span>
          </template>
          <template v-else>
            <FileText class="w-3.5 h-3.5 text-primary-400" />
            <span class="text-text-secondary">当前节点:</span>
            <span class="text-primary-300 font-medium">{{ approvalStepLabel }}</span>
            <span
              v-if="alert.approval?.result"
              class="badge ml-1"
              :class="alert.approval.result === 'TRANSFER' ? 'badge-success' : 'badge-danger'"
            >
              {{ alert.approval.result === 'TRANSFER' ? '紧急调拨' : '报废处理' }}
            </span>
          </template>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="alert.level === 'L1' && alert.status !== 'CLOSED'"
            class="px-3 py-1.5 rounded-md text-xs font-medium text-white transition-all duration-200 hover:-translate-y-0.5"
            :style="{
              background: 'linear-gradient(135deg, #1890FF 0%, #096DD9 100%)',
              boxShadow: '0 2px 8px rgba(24,144,255,0.3)',
            }"
            @click.stop="emit('handle', alert)"
          >
            立即处置
          </button>
          <button
            class="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs text-text-secondary border border-default hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-200"
            @click.stop="emit('detail', alert)"
          >
            查看详情
            <ArrowRight class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pulse-border {
  position: relative;
}
.pulse-border::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 2px;
  animation: pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
