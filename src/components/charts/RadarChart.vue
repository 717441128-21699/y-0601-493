<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { useChartTheme } from './index'

export interface RadarIndicator {
  name: string
  max: number
}

export interface RadarSeries {
  name: string
  data: number[]
  color?: string
}

interface Props {
  indicators: RadarIndicator[]
  series: RadarSeries[]
  title?: string
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 340,
})

const theme = useChartTheme()
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const seriesWithColors = computed(() =>
  props.series.map((s, i) => ({
    ...s,
    color: s.color || theme.palette[i % theme.palette.length],
  }))
)

const getOption = (): echarts.EChartsOption => {
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
      backgroundColor: theme.bgCard,
      borderColor: theme.borderDefault,
      textStyle: { color: theme.textPrimary },
      extraCssText: `box-shadow: 0 0 20px ${theme.primary}30; backdrop-filter: blur(8px);`,
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
    radar: {
      center: ['50%', props.series.length > 1 ? '56%' : '52%'],
      radius: '62%',
      indicator: props.indicators,
      axisName: {
        color: theme.textSecondary,
        fontSize: 12,
      },
      splitNumber: 4,
      shape: 'polygon',
      splitArea: {
        areaStyle: {
          color: [
            `${theme.primary500}06`,
            `${theme.primary500}0C`,
            `${theme.primary500}06`,
            `${theme.primary500}0C`,
          ],
        },
      },
      axisLine: {
        lineStyle: { color: `${theme.primary500}30` },
      },
      splitLine: {
        lineStyle: { color: `${theme.primary500}28`, type: 'dashed' },
      },
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 5,
        data: seriesWithColors.value.map(s => ({
          name: s.name,
          value: s.data,
          lineStyle: {
            color: s.color,
            width: 2,
          },
          itemStyle: {
            color: s.color,
            borderColor: theme.bgCard,
            borderWidth: 1.5,
          },
          areaStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
              { offset: 0, color: `${s.color}40` },
              { offset: 1, color: `${s.color}15` },
            ]),
          },
          emphasis: {
            lineStyle: { width: 3 },
            areaStyle: {
              color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                { offset: 0, color: `${s.color}55` },
                { offset: 1, color: `${s.color}25` },
              ]),
            },
          },
        })),
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
  () => [props.indicators, props.series, props.title],
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
