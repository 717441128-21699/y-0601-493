<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { useChartTheme } from './index'

interface Props {
  value: number
  min?: number
  max?: number
  title?: string
  unit?: string
  thresholds?: { l1: number; l2: number }
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  unit: '',
  height: 240,
  thresholds: () => ({ l1: 60, l2: 85 }),
})

const theme = useChartTheme()
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const clampedValue = computed(() =>
  Math.min(Math.max(props.value, props.min), props.max)
)

const getColorByValue = (v: number): string => {
  if (v < props.thresholds.l1) return theme.danger500
  if (v < props.thresholds.l2) return theme.warning500
  return theme.success500
}

const getOption = (): echarts.EChartsOption => {
  const range = props.max - props.min
  const l1Pct = (props.thresholds.l1 - props.min) / range
  const l2Pct = (props.thresholds.l2 - props.min) / range
  const valueColor = getColorByValue(clampedValue.value)

  return {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: props.min,
        max: props.max,
        center: ['50%', '58%'],
        radius: '90%',
        progress: { show: false },
        pointer: {
          icon: 'path://M2.9,0.7L2.9,0.7c1.4,0,2.6,1.2,2.6,2.6v115c0,1.4-1.2,2.6-2.6,2.6l0,0c-1.4,0-2.6-1.2-2.6-2.6V3.3C0.3,1.9,1.5,0.7,2.9,0.7z',
          length: '62%',
          width: 4,
          offsetCenter: [0, '-4%'],
          itemStyle: {
            color: valueColor,
            shadowColor: valueColor,
            shadowBlur: 10,
          },
        },
        axisLine: {
          lineStyle: {
            width: 14,
            color: [
              [l1Pct, theme.danger500],
              [l2Pct, theme.warning500],
              [1, theme.success500],
            ],
          },
          roundCap: true,
        },
        splitLine: {
          distance: -18,
          length: 8,
          lineStyle: {
            color: theme.bgCard,
            width: 2,
          },
        },
        axisTick: {
          distance: -18,
          length: 4,
          lineStyle: {
            color: theme.bgCard,
            width: 1,
          },
        },
        axisLabel: {
          color: theme.textSecondary,
          distance: -32,
          fontSize: 11,
        },
        anchor: {
          show: true,
          size: 14,
          itemStyle: {
            color: valueColor,
            borderColor: theme.bgCard,
            borderWidth: 3,
            shadowColor: valueColor,
            shadowBlur: 8,
          },
        },
        title: {
          show: true,
          offsetCenter: [0, '85%'],
          fontSize: 13,
          color: theme.textSecondary,
        },
        detail: {
          valueAnimation: true,
          fontSize: 42,
          fontWeight: 700,
          fontFamily: 'Rajdhani, system-ui, sans-serif',
          color: valueColor,
          offsetCenter: [0, '25%'],
          formatter: (v: number) => {
            const u = props.unit ? props.unit : '%'
            return `${v}${u}`
          },
        },
        data: [
          {
            value: clampedValue.value,
            name: props.title || '',
          },
        ],
      },
    ],
  }
}

const initChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(getOption())
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(
  () => [props.value, props.min, props.max, props.title, props.unit, props.thresholds],
  () => {
    chartInstance?.setOption(getOption(), true)
  },
  { deep: true }
)

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <div ref="chartRef" :style="{ height: height + 'px', width: '100%' }"></div>
</template>
