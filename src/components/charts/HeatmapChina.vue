<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChartTheme } from './index'

export interface HeatmapItem {
  code: string
  name: string
  value: number
  [key: string]: any
}

interface Props {
  data: HeatmapItem[]
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  clickable: true,
})

const emit = defineEmits<{
  (e: 'province-click', code: string, data: HeatmapItem): void
}>()

const theme = useChartTheme()

function getCenter(d: string): { x: number; y: number } {
  const nums = d.match(/-?\d+\.?\d*/g)?.map(Number) || []
  let sx = 0, sy = 0, count = 0
  for (let i = 0; i < nums.length; i += 2) {
    sx += nums[i]
    sy += nums[i + 1]
    count++
  }
  return { x: sx / count, y: sy / count }
}

const selectedCode = ref<string | null>(null)
const hoverCode = ref<string | null>(null)
const tooltip = ref({ show: false, x: 0, y: 0, name: '', value: 0 })

interface ProvinceShape {
  code: string
  name: string
  d: string
}

const provinceShapes: ProvinceShape[] = [
  { code: 'HLJ', name: '黑龙江', d: 'M720,40 L820,40 L840,100 L810,160 L730,150 L700,100 Z' },
  { code: 'JL', name: '吉林', d: 'M700,100 L730,150 L680,190 L640,170 L650,120 Z' },
  { code: 'LN', name: '辽宁', d: 'M640,170 L680,190 L680,240 L600,240 L590,200 Z' },
  { code: 'NM', name: '内蒙古', d: 'M280,60 L590,200 L560,270 L380,270 L260,180 L200,140 L240,80 Z' },
  { code: 'XJ', name: '新疆', d: 'M20,120 L200,80 L240,80 L260,180 L220,280 L80,280 L20,220 Z' },
  { code: 'XZ', name: '西藏', d: 'M40,320 L220,280 L340,340 L380,420 L280,480 L120,460 L40,400 Z' },
  { code: 'QH', name: '青海', d: 'M220,280 L360,280 L400,350 L340,340 L280,400 L200,360 Z' },
  { code: 'GS', name: '甘肃', d: 'M360,280 L500,270 L540,340 L480,400 L400,350 Z' },
  { code: 'NX', name: '宁夏', d: 'M500,270 L540,270 L560,320 L540,340 L500,310 Z' },
  { code: 'SX', name: '陕西', d: 'M540,270 L590,270 L620,360 L580,420 L540,340 Z' },
  { code: 'BJ', name: '北京', d: 'M590,200 L620,200 L630,230 L600,235 Z' },
  { code: 'TJ', name: '天津', d: 'M620,210 L645,200 L650,235 L625,240 Z' },
  { code: 'HEB', name: '河北', d: 'M540,220 L590,200 L600,235 L640,240 L610,280 L560,270 Z' },
  { code: 'SD', name: '山东', d: 'M600,280 L680,240 L720,280 L700,330 L620,340 Z' },
  { code: 'HN', name: '河南', d: 'M540,340 L620,340 L640,400 L580,430 L520,400 Z' },
  { code: 'JS', name: '江苏', d: 'M640,340 L720,330 L740,390 L680,410 L640,400 Z' },
  { code: 'AH', name: '安徽', d: 'M580,430 L640,400 L680,410 L660,470 L580,470 Z' },
  { code: 'SH', name: '上海', d: 'M720,390 L755,385 L760,415 L725,420 Z' },
  { code: 'ZJ', name: '浙江', d: 'M680,410 L740,390 L760,440 L720,480 L660,470 Z' },
  { code: 'JX', name: '江西', d: 'M580,470 L660,470 L660,540 L600,560 L560,520 Z' },
  { code: 'FJ', name: '福建', d: 'M660,480 L720,480 L740,550 L680,580 L660,540 Z' },
  { code: 'TW', name: '台湾', d: 'M760,500 L790,490 L800,560 L770,580 Z' },
  { code: 'HUB', name: '湖北', d: 'M500,400 L580,430 L580,470 L500,470 L480,430 Z' },
  { code: 'HUN', name: '湖南', d: 'M500,470 L580,470 L560,520 L580,560 L500,580 L460,520 Z' },
  { code: 'GD', name: '广东', d: 'M560,560 L660,540 L680,580 L700,640 L600,660 L540,620 Z' },
  { code: 'GX', name: '广西', d: 'M420,540 L500,580 L540,620 L480,660 L380,630 L360,570 Z' },
  { code: 'HAN', name: '海南', d: 'M520,670 L570,660 L590,695 L530,705 Z' },
  { code: 'HK', name: '香港', d: 'M615,640 L630,635 L632,650 L617,652 Z' },
  { code: 'MO', name: '澳门', d: 'M598,645 L608,643 L610,655 L600,657 Z' },
  { code: 'SC', name: '四川', d: 'M340,340 L480,400 L500,470 L420,500 L340,450 L320,390 Z' },
  { code: 'CQ', name: '重庆', d: 'M480,400 L520,400 L500,470 L460,460 Z' },
  { code: 'GZ', name: '贵州', d: 'M420,500 L500,470 L460,520 L500,580 L420,560 L380,520 Z' },
  { code: 'YN', name: '云南', d: 'M280,480 L380,500 L360,570 L380,630 L280,600 L220,540 Z' },
  { code: 'SX2', name: '山西', d: 'M560,270 L610,280 L590,340 L540,340 L540,300 Z' },
]

const getDataByCode = (code: string): HeatmapItem | undefined => {
  return props.data.find(d => d.code === code || d.name === provinceShapes.find(p => p.code === code)?.name)
}

const getColorByValue = (value: number): string => {
  if (value < 70) return theme.danger500
  if (value < 80) return theme.warning500
  if (value < 90) return theme.primary300
  if (value < 95) return theme.primary500
  return theme.success500
}

const getProvinceStyle = (shape: ProvinceShape) => {
  const item = getDataByCode(shape.code)
  const value = item?.value ?? 0
  const fill = value === 0 ? 'rgba(71, 114, 160, 0.2)' : getColorByValue(value)
  const isHover = hoverCode.value === shape.code
  const isSelected = selectedCode.value === shape.code
  return {
    fill,
    stroke: isSelected ? theme.primary500 : isHover ? theme.primary300 : 'rgba(24, 144, 255, 0.4)',
    strokeWidth: isSelected ? 2.5 : isHover ? 2 : 1,
    transform: isHover ? 'scale(1.04)' : 'scale(1)',
    transformOrigin: 'center',
    cursor: props.clickable ? 'pointer' : 'default',
    filter: isHover ? `drop-shadow(0 0 8px ${fill})` : `drop-shadow(0 0 4px ${fill}80)`,
    transition: 'all 0.25s ease',
  }
}

const handleMouseEnter = (e: MouseEvent, shape: ProvinceShape) => {
  hoverCode.value = shape.code
  const item = getDataByCode(shape.code)
  if (item) {
    tooltip.value = {
      show: true,
      x: e.clientX,
      y: e.clientY,
      name: shape.name,
      value: item.value,
    }
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (tooltip.value.show) {
    tooltip.value.x = e.clientX
    tooltip.value.y = e.clientY
  }
}

const handleMouseLeave = () => {
  hoverCode.value = null
  tooltip.value.show = false
}

const handleClick = (shape: ProvinceShape) => {
  if (!props.clickable) return
  const item = getDataByCode(shape.code)
  selectedCode.value = selectedCode.value === shape.code ? null : shape.code
  if (item) {
    emit('province-click', shape.code, item)
  }
}

const legendStops = [
  { color: theme.danger500, label: '<70' },
  { color: theme.warning500, label: '70-80' },
  { color: theme.primary300, label: '80-90' },
  { color: theme.primary500, label: '90-95' },
  { color: theme.success500, label: '≥95' },
]
</script>

<template>
  <div class="heatmap-container relative w-full h-full">
    <svg
      viewBox="0 0 850 720"
      class="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="province-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#province-glow)">
        <path
          v-for="shape in provinceShapes"
          :key="shape.code"
          :d="shape.d"
          :style="getProvinceStyle(shape)"
          @mouseenter="handleMouseEnter($event, shape)"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
          @click="handleClick(shape)"
        />
      </g>
      <g class="province-labels" style="pointer-events: none;">
        <text
          v-for="shape in provinceShapes"
          :key="'label-' + shape.code"
          :x="getCenter(shape.d).x"
          :y="getCenter(shape.d).y"
          text-anchor="middle"
          dominant-baseline="middle"
          :fill="theme.textPrimary"
          font-size="11"
          font-weight="500"
          opacity="0.85"
        >
          {{ shape.name }}
        </text>
      </g>
    </svg>

    <div
      v-if="tooltip.show"
      class="tooltip fixed z-50 pointer-events-none px-3 py-2 rounded-lg text-sm"
      :style="{
        left: tooltip.x + 14 + 'px',
        top: tooltip.y + 14 + 'px',
        background: theme.bgCard,
        border: `1px solid ${theme.borderDefault}`,
        color: theme.textPrimary,
        boxShadow: `0 0 16px ${theme.primary}40`,
        backdropFilter: 'blur(8px)',
      }"
    >
      <div class="font-bold">{{ tooltip.name }}</div>
      <div class="mt-1">
        <span class="opacity-70">覆盖率:</span>
        <span class="ml-1 font-mono font-semibold" :style="{ color: getColorByValue(tooltip.value) }">
          {{ tooltip.value }}%
        </span>
      </div>
    </div>

    <div class="legend absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
      <div
        v-for="(stop, idx) in legendStops"
        :key="idx"
        class="flex items-center gap-1.5"
      >
        <div
          class="w-10 h-3 rounded-sm"
          :style="{
            background: stop.color,
            boxShadow: `0 0 8px ${stop.color}60`,
          }"
        ></div>
        <span class="text-xs" :style="{ color: theme.textSecondary }">{{ stop.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heatmap-container {
  min-height: 360px;
}
path {
  transform-box: fill-box;
}
.tooltip {
  transform: translateZ(0);
}
</style>
