<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { useChartTheme } from './index'

export interface BarRankItem {
  name: string
  value: number
  extra?: string
}

interface Props {
  data: BarRankItem[]
  colorStart?: string
  colorEnd?: string
  unit?: string
  topN?: number
  labelAlign?: 'outside' | 'inside'
  valueFormat?: (v: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  topN: 10,
  labelAlign: 'outside',
})

const theme = useChartTheme()
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const startColor = computed(() => props.colorStart || theme.primary400)
const endColor = computed(() => props.colorEnd || theme.primary700)

const displayData = computed(() => {
  const sorted = [...props.data].sort((a, b) => b.value - a.value)
  return sorted.slice(0, props.topN).reverse()
})

const medals = ['🥉', '🥈', '🥇']

const getOption = (): echarts.EChartsOption => {
  const names = displayData.value.map(d => d.name)
  const values = displayData.value.map(d => d.value)
  const maxVal = Math.max(...values, 1)
  const itemHeight = 18
  const padTopBottom = 16
  const barCount = displayData.value.length
  const totalHeight = barCount * (itemHeight + 10) + padTopBottom * 2

  return {
    backgroundColor: 'transparent',
    grid: {
      left: 80,
      right: props.labelAlign === 'outside' ? 80 : 30,
      top: padTopBottom,
      bottom: padTopBottom,
      height: totalHeight - padTopBottom * 2,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: theme.bgCard,
      borderColor: theme.borderDefault,
      textStyle: { color: theme.textPrimary },
      extraCssText: `box-shadow: 0 0 20px ${theme.primary}30; backdrop-filter: blur(8px);`,
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        const item = displayData.value[p.dataIndex]
        const val = props.valueFormat ? props.valueFormat(p.value) : p.value
        const extra = item.extra ? `<br/>${item.extra}` : ''
        return `<b>${item.name}</b><br/>数值: <b>${val}</b>${props.unit}${extra}`
      },
    },
    xAxis: {
      type: 'value',
      max: maxVal * 1.15,
      show: false,
    },
    yAxis: {
      type: 'category',
      data: names,
      inverse: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: theme.textSecondary,
        fontSize: 12,
        fontWeight: 500,
        margin: 12,
        formatter: (val: string, idx: number) => {
          const realIdx = displayData.value.length - 1 - idx
          const medal = medals[realIdx] || ''
          return `${medal ? medal + '  ' : ''}${val}`
        },
      },
    },
    series: [
      {
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: startColor.value },
              { offset: 1, color: endColor.value },
            ]),
            shadowColor: `${endColor.value}60`,
            shadowBlur: 6,
          },
        })),
        barWidth: itemHeight,
        label: {
          show: true,
          position: props.labelAlign === 'inside' ? 'insideRight' : 'right',
          color: props.labelAlign === 'inside' ? '#fff' : theme.textPrimary,
          fontSize: 12,
          fontWeight: 600,
          formatter: (p: any) => {
            const val = props.valueFormat ? props.valueFormat(p.value) : p.value
            return `${val}${props.unit}`
          },
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowColor: endColor.value,
            shadowBlur: 16,
          },
          label: {
            fontWeight: 700,
            fontSize: 13,
          },
        },
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
  () => [props.data, props.colorStart, props.colorEnd, props.topN, props.labelAlign],
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

const containerHeight = computed(() => {
  const barCount = Math.min(props.data.length, props.topN)
  return Math.max(barCount * 28 + 32, 200)
})
</script>

<template>
  <div
    ref="chartRef"
    :style="{ height: containerHeight + 'px', width: '100%' }"
  ></div>
</template>
