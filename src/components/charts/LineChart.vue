<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { useChartTheme } from './index'

export interface LineSeries {
  name: string
  data: number[]
  color?: string
  smooth?: boolean
  area?: boolean
  type?: 'line' | 'bar'
}

interface Props {
  title?: string
  xData: string[]
  series: LineSeries[]
  threshold?: { min: number; max: number }
  yUnit?: string
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 320,
  yUnit: '',
})

const emit = defineEmits<{
  (e: 'point-click', params: any): void
}>()

const theme = useChartTheme()
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const seriesWithColors = computed(() => {
  return props.series.map((s, i) => ({
    ...s,
    color: s.color || theme.palette[i % theme.palette.length],
  }))
})

const getOption = (): echarts.EChartsOption => {
  const markLines: any[] = []
  const markAreas: any[] = []

  if (props.threshold) {
    markLines.push(
      {
        yAxis: props.threshold.min,
        lineStyle: { color: theme.danger500, type: 'dashed', width: 2 },
        label: { show: true, formatter: `下限 ${props.threshold.min}`, color: theme.danger400 },
      },
      {
        yAxis: props.threshold.max,
        lineStyle: { color: theme.warning500, type: 'dashed', width: 2 },
        label: { show: true, formatter: `上限 ${props.threshold.max}`, color: theme.warning400 },
      }
    )
    markAreas.push(
      {
        yAxis: props.threshold.min,
        itemStyle: { color: `${theme.danger500}15` },
      },
      {
        yAxis: props.threshold.max,
        itemStyle: { color: `${theme.warning500}15` },
      }
    )
  }

  return {
    backgroundColor: 'transparent',
    title: props.title
      ? {
          text: props.title,
          textStyle: { color: theme.textPrimary, fontSize: 14, fontWeight: 600 },
          left: 10,
          top: 4,
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: theme.bgCard,
      borderColor: theme.borderDefault,
      borderWidth: 1,
      textStyle: { color: theme.textPrimary },
      extraCssText: `box-shadow: 0 0 20px ${theme.primary}30; backdrop-filter: blur(8px);`,
      axisPointer: {
        type: 'cross',
        lineStyle: { color: `${theme.primary}60` },
        shadowStyle: { color: `${theme.primary}08` },
      },
    },
    legend: props.series.length > 1
      ? {
          top: props.title ? 30 : 4,
          right: 10,
          textStyle: { color: theme.textSecondary, fontSize: 12 },
          itemWidth: 12,
          itemHeight: 8,
          icon: 'roundRect',
        }
      : undefined,
    grid: {
      left: 50,
      right: 30,
      top: props.title ? (props.series.length > 1 ? 70 : 50) : (props.series.length > 1 ? 40 : 20),
      bottom: 40,
    },
    xAxis: {
      type: 'category',
      data: props.xData,
      boundaryGap: false,
      axisLine: { lineStyle: { color: theme.gridLine } },
      axisTick: { show: false },
      axisLabel: { color: theme.textSecondary, fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      name: props.yUnit,
      nameTextStyle: { color: theme.textSecondary, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: theme.textSecondary,
        fontSize: 11,
        formatter: (v: number) => `${v}${props.yUnit ? '' : ''}`,
      },
      splitLine: {
        lineStyle: {
          color: theme.gridLine,
          type: 'dashed',
        },
      },
    },
    series: seriesWithColors.value.map(s => {
      const opt: any = {
        name: s.name,
        type: s.type || 'line',
        data: s.data,
        smooth: s.smooth !== false,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: true,
        lineStyle: {
          color: s.color,
          width: 2.5,
          shadowBlur: 8,
          shadowColor: `${s.color}60`,
        },
        itemStyle: {
          color: s.color,
          borderColor: theme.bgCard,
          borderWidth: 2,
        },
        markLine: markLines.length ? { data: markLines, silent: true, symbol: 'none' } : undefined,
        markArea: markAreas.length ? { data: [markAreas], silent: true } : undefined,
      }
      if (s.area) {
        opt.areaStyle = {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${s.color}60` },
            { offset: 1, color: `${s.color}00` },
          ]),
        }
      }
      return opt
    }),
  }
}

const initChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(getOption())
  chartInstance.on('click', (params: any) => {
    emit('point-click', params)
  })
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(
  () => [props.xData, props.series, props.threshold],
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
