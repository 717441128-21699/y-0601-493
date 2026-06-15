<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { CountUp } from 'countup.js'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Thermometer,
  Package,
  Syringe,
  AlertTriangle,
  Snowflake,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-vue-next'

echarts.use([LineChart, GridComponent, CanvasRenderer])

type ThemeType = 'primary' | 'success' | 'warning' | 'danger'

const props = withDefaults(
  defineProps<{
    label: string
    value: number
    unit: string
    trend?: number
    healthy?: boolean
    icon?: string
    theme?: ThemeType
  }>(),
  {
    trend: 0,
    healthy: true,
    theme: 'primary',
  }
)

const iconMap: Record<string, LucideIcon> = {
  Activity,
  Thermometer,
  Package,
  Syringe,
  AlertTriangle,
  Snowflake,
  CheckCircle,
  XCircle,
}

const IconComponent = computed(() => {
  if (props.icon && iconMap[props.icon]) {
    return iconMap[props.icon]
  }
  return Activity
})

const themeConfig: Record<ThemeType, { bg: string; border: string; glow: string; text: string; iconBg: string; iconGlow: string }> = {
  primary: {
    bg: 'linear-gradient(135deg, rgba(24, 144, 255, 0.18) 0%, rgba(9, 109, 217, 0.06) 100%)',
    border: 'rgba(24, 144, 255, 0.35)',
    glow: 'rgba(24, 144, 255, 0.3)',
    text: '#1890FF',
    iconBg: 'rgba(24, 144, 255, 0.2)',
    iconGlow: '0 0 16px rgba(24, 144, 255, 0.5)',
  },
  success: {
    bg: 'linear-gradient(135deg, rgba(82, 196, 26, 0.18) 0%, rgba(56, 158, 13, 0.06) 100%)',
    border: 'rgba(82, 196, 26, 0.35)',
    glow: 'rgba(82, 196, 26, 0.3)',
    text: '#52C41A',
    iconBg: 'rgba(82, 196, 26, 0.2)',
    iconGlow: '0 0 16px rgba(82, 196, 26, 0.5)',
  },
  warning: {
    bg: 'linear-gradient(135deg, rgba(250, 173, 20, 0.18) 0%, rgba(212, 136, 6, 0.06) 100%)',
    border: 'rgba(250, 173, 20, 0.35)',
    glow: 'rgba(250, 173, 20, 0.3)',
    text: '#FAAD14',
    iconBg: 'rgba(250, 173, 20, 0.2)',
    iconGlow: '0 0 16px rgba(250, 173, 20, 0.5)',
  },
  danger: {
    bg: 'linear-gradient(135deg, rgba(245, 34, 45, 0.18) 0%, rgba(207, 19, 34, 0.06) 100%)',
    border: 'rgba(245, 34, 45, 0.35)',
    glow: 'rgba(245, 34, 45, 0.3)',
    text: '#F5222D',
    iconBg: 'rgba(245, 34, 45, 0.2)',
    iconGlow: '0 0 16px rgba(245, 34, 45, 0.5)',
  },
}

const config = computed(() => themeConfig[props.theme])

const countUpRef = ref<HTMLElement | null>(null)
let countUpInstance: CountUp | null = null

const sparklineRef = ref<HTMLElement | null>(null)
let sparklineChart: echarts.ECharts | null = null

const sparklineData = computed(() => {
  const seed = props.label.charCodeAt(0) + props.value
  const arr: number[] = []
  let last = props.value * 0.8
  for (let i = 0; i < 12; i++) {
    const variation = (Math.sin(seed + i * 0.7) + Math.cos(i * 1.3)) * props.value * 0.08
    last = Math.max(props.value * 0.5, Math.min(props.value * 1.3, last + variation))
    arr.push(Number(last.toFixed(1)))
  }
  return arr
})

onMounted(() => {
  if (countUpRef.value) {
    countUpInstance = new CountUp(countUpRef.value, props.value, {
      duration: 1.8,
      separator: ',',
      decimalPlaces: Number.isInteger(props.value) ? 0 : 2,
      useEasing: true,
    })
    countUpInstance.start()
  }

  if (sparklineRef.value) {
    sparklineChart = echarts.init(sparklineRef.value)
    const color = config.value.text
    sparklineChart.setOption({
      grid: {
        left: 0,
        right: 0,
        top: 2,
        bottom: 0,
      },
      xAxis: {
        type: 'category',
        show: false,
        data: sparklineData.value.map((_, i) => i),
      },
      yAxis: {
        type: 'value',
        show: false,
        min: (value: { min: number }) => value.min * 0.9,
        max: (value: { max: number }) => value.max * 1.1,
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: sparklineData.value,
          lineStyle: {
            color,
            width: 1.5,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: color + '60' },
                { offset: 1, color: color + '05' },
              ],
            },
          },
        },
      ],
    })
  }
})

watch(
  () => props.value,
  (newVal) => {
    if (countUpInstance) {
      countUpInstance.update(newVal)
    }
  }
)

onBeforeUnmount(() => {
  if (sparklineChart) {
    sparklineChart.dispose()
    sparklineChart = null
  }
})
</script>

<template>
  <div
    class="relative rounded-xl p-4 overflow-hidden transition-all duration-300 cursor-pointer group hover:-translate-y-1"
    :style="{
      background: config.bg,
      border: `1px solid ${config.border}`,
    }"
  >
    <div
      class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      :style="{ boxShadow: `0 8px 32px ${config.glow}, inset 0 1px 0 rgba(255,255,255,0.06)` }"
    />
    <div
      class="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 blur-2xl pointer-events-none group-hover:opacity-50 transition-opacity"
      :style="{ background: config.glow }"
    />

    <div class="relative flex items-start justify-between mb-3">
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center opacity-90 transition-all duration-300 group-hover:scale-110"
        :style="{ background: config.iconBg, boxShadow: config.iconGlow }"
      >
        <component :is="IconComponent" class="w-5 h-5" :style="{ color: config.text }" />
      </div>
      <div
        class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        :class="[
          trend >= 0 ? 'bg-success-500/15 text-success-400' : 'bg-danger-500/15 text-danger-400',
        ]"
      >
        <TrendingUp v-if="trend >= 0" class="w-3 h-3" />
        <TrendingDown v-else class="w-3 h-3" />
        <span>{{ Math.abs(trend).toFixed(1) }}%</span>
      </div>
    </div>

    <div class="relative">
      <div class="text-xs text-text-secondary mb-1.5">{{ label }}</div>
      <div class="flex items-baseline gap-1.5">
        <span
          ref="countUpRef"
          class="font-rajdhani font-bold text-3xl text-text-primary tracking-tight"
        >0</span>
        <span class="text-sm text-text-secondary">{{ unit }}</span>
      </div>
    </div>

    <div class="relative mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
      <div class="flex items-center gap-1.5 text-xs">
        <span v-if="healthy" class="inline-block w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse-slow" />
        <span v-else class="inline-block w-1.5 h-1.5 rounded-full bg-danger-400 animate-pulse-slow" />
        <span class="text-text-tertiary">{{ healthy ? '状态正常' : '需关注' }}</span>
      </div>
      <div ref="sparklineRef" class="w-[80px] h-[24px]" />
    </div>

    <div v-if="$slots.default" class="relative mt-3 pt-3 border-t border-white/5">
      <slot />
    </div>
  </div>
</template>
