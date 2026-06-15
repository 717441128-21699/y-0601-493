export interface ChartThemeColors {
  primary: string
  primary300: string
  primary400: string
  primary500: string
  primary600: string
  primary700: string
  success: string
  success400: string
  success500: string
  warning: string
  warning300: string
  warning400: string
  warning500: string
  danger: string
  danger400: string
  danger500: string
  palette: string[]
  textPrimary: string
  textSecondary: string
  gridLine: string
  bgCard: string
  borderDefault: string
}

export const defaultChartColors: ChartThemeColors = {
  primary: '#1890FF',
  primary300: '#63B3FF',
  primary400: '#3399FF',
  primary500: '#1890FF',
  primary600: '#096DD9',
  primary700: '#0050B3',
  success: '#52C41A',
  success400: '#73D13D',
  success500: '#52C41A',
  warning: '#FAAD14',
  warning300: '#FFC53D',
  warning400: '#FFC53D',
  warning500: '#FAAD14',
  danger: '#F5222D',
  danger400: '#FF4D4F',
  danger500: '#F5222D',
  palette: [
    '#1890FF',
    '#52C41A',
    '#FAAD14',
    '#F5222D',
    '#63B3FF',
    '#73D13D',
    '#FFC53D',
    '#FF4D4F',
    '#096DD9',
    '#389E0D',
  ],
  textPrimary: '#E6F0FF',
  textSecondary: '#8FA3BF',
  gridLine: 'rgba(24, 144, 255, 0.15)',
  bgCard: 'rgba(21, 42, 71, 0.6)',
  borderDefault: 'rgba(71, 114, 160, 0.2)',
}

import type { InjectionKey } from 'vue'
import { provide, inject, reactive } from 'vue'

export const chartThemeKey: InjectionKey<ChartThemeColors> = Symbol('chartTheme')

export function provideChartTheme(colors?: Partial<ChartThemeColors>) {
  const theme = reactive<ChartThemeColors>({ ...defaultChartColors, ...colors })
  provide(chartThemeKey, theme)
  return theme
}

export function useChartTheme(): ChartThemeColors {
  const theme = inject(chartThemeKey, defaultChartColors)
  return theme
}

export { default as HeatmapChina } from './HeatmapChina.vue'
export { default as LineChart } from './LineChart.vue'
export { default as BarRank } from './BarRank.vue'
export { default as PieChart } from './PieChart.vue'
export { default as RadarChart } from './RadarChart.vue'
export { default as GaugeChart } from './GaugeChart.vue'
