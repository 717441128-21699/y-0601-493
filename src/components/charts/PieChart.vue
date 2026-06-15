<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { useChartTheme } from './index'

export interface PieItem {
  name: string
  value: number
}

interface Props {
  data: PieItem[]
  radius?: [number, number]
  title?: string
  centerText?: { main: string; sub: string }
  legend?: 'bottom' | 'right' | 'none'
  donut?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  donut: true,
  legend: 'bottom',
  radius: () => [45, 75],
})

const theme = useChartTheme()
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const pieColors = computed(() => {
  return [
    theme.primary500,
    theme.success500,
    theme.warning500,
    theme.danger500,
    theme.primary300,
    theme.warning300,
    theme.primary600,
    theme.success400,
    theme.warning400,
    theme.danger400,
  ]
})

const totalValue = computed(() => props.data.reduce((s, d) => s + d.value, 0))

const getOption = (): echarts.EChartsOption => {
  const legendOpt: echarts.LegendComponentOption | undefined =
    props.legend === 'none'
      ? undefined
      : {
          orient: (props.legend === 'right' ? 'vertical' : 'horizontal') as echarts.LegendComponentOption['orient'],
          bottom: props.legend === 'bottom' ? 0 : 'center',
          right: props.legend === 'right' ? 10 : 'center',
          top: props.legend === 'right' ? 'center' : undefined,
          textStyle: { color: theme.textSecondary, fontSize: 12 },
          itemWidth: 12,
          itemHeight: 12,
          itemGap: 14,
          icon: 'circle',
          formatter: (name: string) => {
            const item = props.data.find(d => d.name === name)
            const pct = item && totalValue.value > 0 ? ((item.value / totalValue.value) * 100).toFixed(1) : '0'
            return `${name}  ${pct}%`
          },
        }

  const actualRadius: [string, string] = props.donut
    ? [`${props.radius[0]}%`, `${props.radius[1]}%`]
    : ['0%', `${props.radius[1]}%`]

  const hasCenter = props.centerText && props.donut

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
      trigger: 'item',
      backgroundColor: theme.bgCard,
      borderColor: theme.borderDefault,
      textStyle: { color: theme.textPrimary },
      extraCssText: `box-shadow: 0 0 20px ${theme.primary}30; backdrop-filter: blur(8px);`,
      formatter: (p: any) => {
        const pct = p.percent != null ? p.percent.toFixed(1) : '0'
        return `<b>${p.name}</b><br/>数值: <b>${p.value}</b><br/>占比: <b>${pct}%</b>`
      },
    },
    legend: legendOpt,
    color: pieColors.value,
    graphic: hasCenter
      ? [
          {
            type: 'group',
            left: 'center',
            top: 'center',
            children: [
              {
                type: 'text',
                style: {
                  text: props.centerText!.main,
                  fill: theme.textPrimary,
                  fontSize: 24,
                  fontWeight: 700,
                  align: 'center',
                  fontFamily: 'Rajdhani, system-ui, sans-serif',
                },
              },
              {
                type: 'text',
                style: {
                  text: props.centerText!.sub,
                  fill: theme.textSecondary,
                  fontSize: 12,
                  align: 'center',
                },
                top: 28,
              },
            ],
          },
        ]
      : undefined,
    series: [
      {
        type: 'pie',
        radius: actualRadius,
        center: ['50%', props.legend === 'bottom' ? '45%' : '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: theme.bgCard,
          borderWidth: 2,
        },
        label: {
          show: !hasCenter,
          color: theme.textSecondary,
          fontSize: 11,
          formatter: '{b}: {d}%',
        },
        labelLine: { show: !hasCenter, length: 6, length2: 8 },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(0,0,0,0.3)',
          },
          label: {
            show: true,
            fontWeight: 600,
            color: theme.textPrimary,
          },
        },
        data: props.data.map((d, i) => ({
          value: d.value,
          name: d.name,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
              { offset: 0, color: pieColors.value[i % pieColors.value.length] },
              {
                offset: 1,
                color: `${pieColors.value[i % pieColors.value.length]}CC`,
              },
            ]),
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
  () => [props.data, props.radius, props.centerText, props.legend, props.donut, props.title],
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
  <div ref="chartRef" style="width: 100%; height: 100%; min-height: 280px;"></div>
</template>
