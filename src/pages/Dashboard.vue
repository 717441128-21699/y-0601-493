<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useDashboardStore } from '@/stores/dashboard'
import { useAlertsStore } from '@/stores/alerts'
import type { AlertType } from '@/types'
import {
  mockGetKpi,
  mockGetProvinceData,
  mockGetCoverageRank,
  mockGetProvinceDrillData,
  PROVINCES,
  VACCINE_TYPES,
  type KpiData,
  type ProvinceColdData,
  type CoverageRank,
  type ProvinceDrillData,
  type Alert,
} from '@/mock'
import AppLayout from '@/components/layout/AppLayout.vue'
import { HeatmapChina, LineChart, BarRank, PieChart } from '@/components/charts'
import {
  ChevronDown,
  Search,
  X,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Thermometer,
  Package,
  Syringe,
  Settings,
  AlertTriangle,
  ThermometerSun,
  PackageOpen,
  Wrench,
  ArrowUpRight,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-vue-next'

const router = useRouter()
const uiStore = useUiStore()
const dashboardStore = useDashboardStore()
const alertsStore = useAlertsStore()

const PAGE_KEY = 'dashboard'

const provinceDropdownOpen = ref(false)
const provinceSearch = ref('')
const timeRangeKey = ref<'7d' | '30d' | 'custom'>('7d')

const isLoading = computed(() => uiStore.pageLoadings[PAGE_KEY] || false)

const kpiData = ref<KpiData[]>([])
const provinceData = ref<ProvinceColdData[]>([])
const coverageRank = ref<CoverageRank[]>([])
const recentAlerts = ref<Alert[]>([])
const provinceDrill = ref<ProvinceDrillData | null>(null)

const selectedProvinceName = computed(() => {
  if (!dashboardStore.selectedProvince) return '全国'
  const p = PROVINCES.find((x) => x.code === dashboardStore.selectedProvince)
  return p ? p.name : '全国'
})

const filteredProvinces = computed(() => {
  const q = provinceSearch.value.trim()
  const list = [{ code: '', name: '全国' }, ...PROVINCES]
  if (!q) return list
  return list.filter((p) => p.name.includes(q) || p.code.includes(q))
})

function toggleProvince(code: string) {
  dashboardStore.setFilters({ selectedProvince: code || null })
  provinceDropdownOpen.value = false
  provinceSearch.value = ''
}

function toggleVaccineType(code: string) {
  const current = [...dashboardStore.selectedVaccineTypes]
  const idx = current.indexOf(code)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(code)
  }
  dashboardStore.setFilters({ selectedVaccineTypes: current })
}

function setTimeRange(key: '7d' | '30d' | 'custom') {
  timeRangeKey.value = key
  if (key === '7d') {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    dashboardStore.setFilters({ timeRange: [start, end] })
  } else if (key === '30d') {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    dashboardStore.setFilters({ timeRange: [start, end] })
  }
}

const kpiCards = computed(() => {
  const icons = [Thermometer, Package, Syringe, Settings]
  return kpiData.value.map((k, i) => ({
    ...k,
    icon: icons[i],
    colorIdx: i,
  }))
})

function getTrendIcon(status: string) {
  if (status === 'up') return TrendingUp
  if (status === 'down') return TrendingDown
  return Minus
}

function getTrendClass(status: string) {
  if (status === 'up') return 'text-success-400'
  if (status === 'down') return 'text-danger-400'
  return 'text-text-tertiary'
}

const heatmapItems = computed(() => {
  return provinceData.value.map((p) => ({
    code: p.code,
    name: p.name,
    value: p.temperatureRate,
    alertCount: p.alertCount,
    coverageRate: p.coverageRate,
    totalColdStores: p.totalColdStores,
  }))
})

const rankVaccineCode = ref<string>('ALL')

const rankVaccineOptions = computed(() => [
  { code: 'ALL', name: '全部疫苗' },
  ...VACCINE_TYPES,
])

const modalVisible = ref(false)
const modalProvince = ref<{ code: string; name: string } | null>(null)
const modalLoading = ref(false)

function handleProvinceClick(code: string, data: any) {
  const p = PROVINCES.find((x) => x.code === code) || { code, name: data.name || code }
  modalProvince.value = p
  modalVisible.value = true
  modalLoading.value = true
  provinceDrill.value = null
  setTimeout(() => {
    provinceDrill.value = mockGetProvinceDrillData(code)
    modalLoading.value = false
  }, 400)
}

function goToColdChain() {
  if (modalProvince.value) {
    router.push({ path: '/coldchain', query: { province: modalProvince.value.code } })
  }
}

const getAlertTypeName = (t: AlertType) => ({ TEMP_OVER: '温度超标', TEMP_UNDER: '低温告警', STOCK_LOW: '库存短缺', DEVICE_FAULT: '设备故障' } as any)[t] || t

const alertTypeStats = computed(() => {
  const all = recentAlerts.value
  return [
    { name: '温度超标(TEMP)', value: all.filter((a) => a.type === 'TEMP_OVER').length, color: '#F5222D' },
    { name: '温度过低', value: all.filter((a) => a.type === 'TEMP_UNDER').length, color: '#63B3FF' },
    { name: '库存不足(STOCK)', value: all.filter((a) => a.type === 'STOCK_LOW').length, color: '#FAAD14' },
    { name: '设备故障(DEVICE)', value: all.filter((a) => a.type === 'DEVICE_FAULT').length, color: '#722ED1' },
    { name: 'L2升级预警', value: all.filter((a) => a.level === 'L2').length, color: '#52C41A' },
  ]
})

const temperatureTrendXData = computed(() => {
  const days: string[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }
  return days
})

const temperatureTrendSeries = computed(() => {
  const avg = provinceData.value.length > 0
    ? provinceData.value.map(() => 90 + Math.round(Math.random() * 90) / 10)
    : [95.2, 94.8, 96.1, 95.5, 96.3, 95.8, 96.7]
  const top3 = provinceData.value.length > 0
    ? provinceData.value.map(() => 93 + Math.round(Math.random() * 65) / 10)
    : [97.1, 96.8, 97.5, 97.2, 97.8, 97.5, 98.1]
  return [
    { name: '全国均值', data: avg, color: '#1890FF', area: true },
    { name: '省份TOP3', data: top3, color: '#52C41A' },
  ]
})

const provinceTempChartData = computed(() => {
  if (!provinceDrill.value?.tempChartData || provinceDrill.value.tempChartData.length === 0) {
    return { xData: [], series: [] }
  }
  const raw = provinceDrill.value.tempChartData
  const timeMap = new Map<string, number[]>()
  raw.forEach((p) => {
    const timeKey = p.time.slice(5, 13)
    if (!timeMap.has(timeKey)) timeMap.set(timeKey, [])
    timeMap.get(timeKey)!.push(p.temp)
  })
  const xData = Array.from(timeMap.keys())
  const avgData = xData.map((timeKey) => {
    const temps = timeMap.get(timeKey) || [5]
    return Number((temps.reduce((a, b) => a + b, 0) / Math.max(temps.length, 1)).toFixed(1))
  })
  return {
    xData: xData.slice(0, 24),
    series: [{
      name: '平均温度',
      data: xData.map(() => 2 + Math.round(Math.random() * 60) / 10),
      color: '#1890FF',
      area: true,
    }],
  }
})

function getAlertIcon(type: string) {
  if (type === 'TEMP_OVER' || type === 'TEMP_UNDER') return ThermometerSun
  if (type === 'STOCK_LOW') return PackageOpen
  return Wrench
}

function getAlertBadgeClass(level: string, status: string) {
  if (status === 'CLOSED') return 'badge-info'
  return level === 'L2' ? 'badge-danger' : 'badge-warning'
}

function getAlertStatusText(status: string) {
  const map: Record<string, string> = {
    PENDING: '待处置',
    PROCESSING: '处置中',
    ESCALATED: '已升级',
    APPROVING: '审批中',
    CLOSED: '已关闭',
  }
  return map[status] || status
}

async function loadAllData(showLoading = true) {
  if (showLoading) uiStore.beginLoading(PAGE_KEY)
  try {
    const province = dashboardStore.selectedProvince
      ? PROVINCES.find((p) => p.code === dashboardStore.selectedProvince)?.name
      : undefined

    kpiData.value = mockGetKpi(province)
    provinceData.value = mockGetProvinceData()
    coverageRank.value = mockGetCoverageRank(
      rankVaccineCode.value === 'ALL' ? undefined : rankVaccineCode.value
    )
    recentAlerts.value = (alertsStore.pendingL1.length
      ? [...alertsStore.pendingL1, ...alertsStore.pendingL2]
      : (await alertsStore.fetchAlerts()).pendingL1.concat((await alertsStore.fetchAlerts()).pendingL2)
    ).map((a: any) => ({
      ...a,
      typeName: getAlertTypeName(a.type),
      provinceCode: PROVINCES.find(p => p.name === a.province)?.code ?? '',
      cityCode: '',
    })).slice(0, 4)
  } finally {
    if (showLoading) uiStore.endLoading(PAGE_KEY)
  }
}

function refreshAll() {
  loadAllData(true)
}

watch(rankVaccineCode, () => {
  coverageRank.value = mockGetCoverageRank(rankVaccineCode.value === 'ALL' ? undefined : rankVaccineCode.value)
})

watch(
  () => [dashboardStore.selectedProvince, dashboardStore.selectedVaccineTypes, dashboardStore.timeRange],
  () => {
    loadAllData(true)
  }
)

onMounted(() => {
  alertsStore.fetchAlerts()
  setTimeRange('7d')
  loadAllData(true)
})

onBeforeUnmount(() => {
  uiStore.endLoading(PAGE_KEY)
})
</script>

<template>
  <AppLayout>
    <div class="space-y-4">
      <!-- 顶部筛选栏 -->
      <div class="panel p-4 animate-fade-in-up">
        <div class="flex flex-wrap items-center gap-4">
          <!-- 省份选择 -->
          <div class="relative">
            <button
              class="flex items-center gap-2 px-4 h-10 bg-bg-secondary border border-default rounded-lg hover:border-primary-500/50 transition-colors min-w-[180px]"
              @click="provinceDropdownOpen = !provinceDropdownOpen"
            >
              <MapPin class="w-4 h-4 text-primary-400 shrink-0" />
              <span class="flex-1 text-left text-sm text-text-primary truncate">{{ selectedProvinceName }}</span>
              <ChevronDown
                class="w-4 h-4 text-text-tertiary shrink-0 transition-transform"
                :class="{ 'rotate-180': provinceDropdownOpen }"
              />
            </button>

            <div
              v-if="provinceDropdownOpen"
              class="absolute left-0 top-full mt-2 w-[280px] panel p-2 z-50 shadow-glow-blue animate-fade-in-up"
              style="animation-duration: 0.2s"
            >
              <div class="relative mb-2">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  v-model="provinceSearch"
                  type="text"
                  placeholder="搜索省份..."
                  class="w-full h-9 pl-9 pr-3 bg-bg-primary border border-default rounded-md text-sm text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div class="max-h-[280px] overflow-y-auto space-y-0.5">
                <button
                  v-for="p in filteredProvinces"
                  :key="p.code || 'all'"
                  class="w-full flex items-center justify-between px-3 h-9 rounded-md text-sm transition-colors"
                  :class="[
                    dashboardStore.selectedProvince === (p.code || null)
                      ? 'bg-primary-500/20 text-primary-300'
                      : 'text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary',
                  ]"
                  @click="toggleProvince(p.code)"
                >
                  <span>{{ p.name }}</span>
                  <CheckCircle2
                    v-if="dashboardStore.selectedProvince === (p.code || null)"
                    class="w-4 h-4 text-primary-400"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- 疫苗类型多选标签 -->
          <div class="flex-1 flex items-center gap-2 flex-wrap min-w-0">
            <button
              v-for="vt in VACCINE_TYPES"
              :key="vt.code"
              class="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border"
              :class="[
                dashboardStore.selectedVaccineTypes.includes(vt.code)
                  ? 'bg-primary-500/20 border-primary-500/60 text-primary-300 shadow-[0_0_10px_rgba(24,144,255,0.2)]'
                  : 'bg-bg-secondary border-default text-text-secondary hover:border-primary-500/40 hover:text-text-primary',
              ]"
              @click="toggleVaccineType(vt.code)"
            >
              {{ vt.name }}
            </button>
          </div>

          <!-- 时间范围 -->
          <div class="flex items-center gap-1 p-0.5 bg-bg-secondary rounded-lg border border-default">
            <button
              v-for="opt in [
                { key: '7d' as const, label: '近7天' },
                { key: '30d' as const, label: '近30天' },
                { key: 'custom' as const, label: '自定义' },
              ]"
              :key="opt.key"
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
              :class="[
                timeRangeKey === opt.key
                  ? 'bg-primary-500 text-white shadow-glow-blue'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50',
              ]"
              @click="setTimeRange(opt.key)"
            >
              <Calendar v-if="opt.key === 'custom'" class="w-3.5 h-3.5 inline mr-1" />
              {{ opt.label }}
            </button>
          </div>

          <!-- 刷新按钮 -->
          <button
            class="btn-ghost h-10 flex items-center gap-2 group"
            :disabled="isLoading"
            @click="refreshAll"
          >
            <RefreshCw class="w-4 h-4 transition-transform" :class="{ 'animate-spin': isLoading }" />
            <span>刷新</span>
          </button>
        </div>
      </div>

      <!-- KPI 卡片行 -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <template v-if="isLoading">
          <div v-for="i in 4" :key="i" class="panel p-5 animate-pulse">
            <div class="h-4 w-24 bg-bg-tertiary/60 rounded mb-4"></div>
            <div class="h-10 w-32 bg-bg-tertiary/60 rounded mb-3"></div>
            <div class="h-3 w-20 bg-bg-tertiary/40 rounded"></div>
          </div>
        </template>
        <template v-else>
          <div
            v-for="(kpi, idx) in kpiCards"
            :key="kpi.label"
            class="panel p-5 animate-fade-in-up relative overflow-hidden"
            :style="{ animationDelay: `${idx * 0.08}s` }"
          >
            <div
              class="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-10 blur-2xl"
              :class="[
                idx === 0 ? 'bg-primary-500' : '',
                idx === 1 ? 'bg-warning-500' : '',
                idx === 2 ? 'bg-success-500' : '',
                idx === 3 ? 'bg-danger-500' : '',
              ]"
            ></div>
            <div class="relative">
              <div class="flex items-center justify-between mb-4">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="[
                    idx === 0 ? 'bg-primary-500/15 text-primary-400' : '',
                    idx === 1 ? 'bg-warning-500/15 text-warning-400' : '',
                    idx === 2 ? 'bg-success-500/15 text-success-400' : '',
                    idx === 3 ? 'bg-danger-500/15 text-danger-400' : '',
                  ]"
                >
                  <component :is="kpi.icon" class="w-5 h-5" />
                </div>
                <div class="flex items-center gap-1 text-xs" :class="getTrendClass(kpi.status)">
                  <component :is="getTrendIcon(kpi.status)" class="w-3.5 h-3.5" />
                  <span>{{ kpi.trend > 0 ? '+' : '' }}{{ kpi.trend }}%</span>
                </div>
              </div>
              <div class="font-rajdhani font-bold text-3xl mb-1" :class="kpi.healthy ? 'text-text-primary' : 'text-danger-400'">
                {{ kpi.value }}
                <span class="text-lg text-text-secondary ml-0.5">{{ kpi.unit }}</span>
              </div>
              <div class="text-sm text-text-secondary flex items-center gap-2">
                <span>{{ kpi.label }}</span>
                <span
                  v-if="!kpi.healthy"
                  class="text-[10px] px-1.5 py-0.5 rounded bg-danger-500/20 text-danger-400 border border-danger-500/30"
                >
                  需关注
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 第二行：热力图 + 排名 -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div class="xl:col-span-2 panel p-5 animate-fade-in-up" style="animation-delay: 0.1s">
          <div class="flex items-center justify-between mb-4">
            <h3 class="panel-title">全国冷链运行热力图</h3>
            <div class="flex items-center gap-4 text-xs text-text-tertiary">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-primary-500"></span>
                温度合格率
              </span>
              <span>共 {{ provinceData.length }} 个省级节点</span>
            </div>
          </div>
          <div v-if="isLoading" class="h-[380px] flex items-center justify-center">
            <Loader2 class="w-8 h-8 text-primary-400 animate-spin" />
          </div>
          <div v-else class="h-[380px]">
            <HeatmapChina :data="heatmapItems" @province-click="handleProvinceClick" />
          </div>
        </div>

        <div class="panel p-5 animate-fade-in-up" style="animation-delay: 0.15s">
          <div class="flex items-center justify-between mb-4">
            <h3 class="panel-title">接种覆盖率排名 TOP10</h3>
            <div class="relative">
              <select
                v-model="rankVaccineCode"
                class="appearance-none pl-3 pr-8 h-8 bg-bg-secondary border border-default rounded-md text-xs text-text-primary focus:outline-none focus:border-primary-500 cursor-pointer"
              >
                <option v-for="opt in rankVaccineOptions" :key="opt.code" :value="opt.code">
                  {{ opt.name }}
                </option>
              </select>
              <ChevronDown class="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary pointer-events-none" />
            </div>
          </div>
          <div v-if="isLoading" class="h-[340px] space-y-3">
            <div v-for="i in 10" :key="i" class="h-8 bg-bg-tertiary/40 rounded animate-pulse"></div>
          </div>
          <div v-else class="h-[340px]">
            <BarRank :data="coverageRank.map((r, i) => ({ ...r, value: r.rate, rank: i + 1 }))" />
          </div>
        </div>
      </div>

      <!-- 第三行：趋势图 + 预警分布 -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="panel p-5 animate-fade-in-up" style="animation-delay: 0.2s">
          <div class="flex items-center justify-between mb-4">
            <h3 class="panel-title">近7天全国温度合格率趋势</h3>
            <div class="flex items-center gap-3 text-xs">
              <span class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 rounded bg-primary-500"></span>
                全国均值
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 rounded bg-success-500"></span>
                省份TOP3
              </span>
            </div>
          </div>
          <div v-if="isLoading" class="h-[300px] flex items-center justify-center">
            <div class="w-full h-full bg-bg-tertiary/30 rounded animate-pulse"></div>
          </div>
          <div v-else class="h-[300px]">
            <LineChart
              v-if="provinceData.length > 0"
              :x-data="temperatureTrendXData"
              :series="temperatureTrendSeries"
              y-unit="%"
            />
          </div>
        </div>

        <div class="panel p-5 animate-fade-in-up" style="animation-delay: 0.25s">
          <div class="flex items-center justify-between mb-4">
            <h3 class="panel-title">近7天预警类型分布</h3>
            <div class="flex items-center gap-1 text-xs text-text-tertiary">
              <Clock class="w-3.5 h-3.5" />
              <span>实时更新</span>
            </div>
          </div>
          <div class="grid grid-cols-5 gap-3 h-[300px]">
            <div class="col-span-2">
              <div v-if="isLoading" class="h-full flex items-center justify-center">
                <Loader2 class="w-6 h-6 text-primary-400 animate-spin" />
              </div>
              <PieChart v-else :data="alertTypeStats" donut center-label="预警数" />
            </div>
            <div class="col-span-3 flex flex-col min-h-0">
              <div class="flex-1 overflow-y-auto space-y-2 pr-1">
                <template v-if="isLoading">
                  <div v-for="i in 4" :key="i" class="h-16 bg-bg-tertiary/40 rounded animate-pulse"></div>
                </template>
                <template v-else>
                  <div
                    v-for="alert in recentAlerts"
                    :key="alert.id"
                    class="panel p-3 !shadow-none hover:!border-primary-500/60 cursor-pointer transition-all group"
                  >
                    <div class="flex items-start gap-3">
                      <div
                        class="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
                        :class="[
                          alert.type.startsWith('TEMP') ? 'bg-danger-500/15 text-danger-400' : '',
                          alert.type === 'STOCK_LOW' ? 'bg-warning-500/15 text-warning-400' : '',
                          alert.type === 'DEVICE_FAULT' ? 'bg-primary-500/15 text-primary-400' : '',
                        ]"
                      >
                        <component :is="getAlertIcon(alert.type)" class="w-4 h-4" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <span
                            class="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            :class="getAlertBadgeClass(alert.level, alert.status)"
                          >
                            {{ alert.level === 'L2' ? '二级' : '一级' }}
                          </span>
                          <span class="text-xs text-text-primary font-medium truncate flex-1">{{ alert.title }}</span>
                        </div>
                        <div class="flex items-center gap-2 text-[11px] text-text-tertiary">
                          <span>{{ alert.province }} · {{ alert.city }}</span>
                          <span>·</span>
                          <span class="flex items-center gap-1">
                            <Clock class="w-3 h-3" />
                            {{ alert.triggerTime.slice(5, 16) }}
                          </span>
                        </div>
                      </div>
                      <ArrowUpRight class="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:text-primary-400 shrink-0 transition-all" />
                    </div>
                  </div>
                </template>
              </div>
              <button
                class="mt-3 w-full h-9 rounded-lg border border-dashed border-default text-xs text-text-secondary hover:border-primary-500/50 hover:text-primary-400 hover:bg-primary-500/5 transition-all flex items-center justify-center gap-1.5"
                @click="$router.push('/alerts')"
              >
                <Eye class="w-3.5 h-3.5" />
                查看全部预警
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 省份下钻 Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="modalVisible"
          class="fixed inset-0 z-[100] flex items-center justify-center p-6"
        >
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="modalVisible = false"></div>

          <div class="relative panel w-full max-w-5xl shadow-glow-blue animate-fade-in-up overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-success-500 to-warning-500"></div>

            <div class="p-6 border-b border-default">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-xl font-bold text-text-primary flex items-center gap-2">
                    <span class="w-1.5 h-6 bg-primary-500 rounded-full"></span>
                    {{ modalProvince?.name }} · 详情下钻
                  </h3>
                  <p class="text-xs text-text-tertiary mt-1 ml-3.5">近7天冷链运行数据与接种情况分析</p>
                </div>
                <button
                  class="w-9 h-9 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary/50 transition-colors"
                  @click="modalVisible = false"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>
            </div>

            <div class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div class="bg-bg-secondary/50 rounded-lg p-4 border border-default">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Thermometer class="w-4 h-4 text-primary-400" />
                    近7天冷库温度曲线
                  </h4>
                  <div class="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-primary-500/10 text-primary-400 border border-primary-500/30">
                    <AlertTriangle class="w-3 h-3" />
                    阈值线预警
                  </div>
                </div>
                <div v-if="modalLoading" class="h-[280px] flex items-center justify-center">
                  <Loader2 class="w-7 h-7 text-primary-400 animate-spin" />
                </div>
                <div v-else class="h-[280px]">
                  <LineChart
                    v-if="provinceDrill?.tempChartData && provinceDrill.tempChartData.length > 0"
                    :x-data="provinceTempChartData.xData"
                    :series="provinceTempChartData.series"
                    y-unit="℃"
                  />
                </div>
              </div>

              <div class="bg-bg-secondary/50 rounded-lg p-4 border border-default">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Syringe class="w-4 h-4 text-success-400" />
                    接种人群年龄分布
                  </h4>
                  <div class="text-[11px] text-text-tertiary">
                    总计:
                    <span class="text-success-400 font-rajdhani font-bold text-base ml-1">
                      {{ provinceDrill?.ageDistribution.reduce((s, a) => s + a.value, 0) || 0 }}%
                    </span>
                  </div>
                </div>
                <div v-if="modalLoading" class="h-[280px] flex items-center justify-center">
                  <Loader2 class="w-7 h-7 text-primary-400 animate-spin" />
                </div>
                <div v-else class="h-[280px]">
                  <PieChart
                    donut
                    :data="
                      provinceDrill?.ageDistribution.map((a) => ({
                        name: a.group + '岁',
                        value: a.value,
                        color: ['#1890FF', '#52C41A', '#FAAD14', '#F5222D'][['0-6', '7-17', '18-59', '60+'].indexOf(a.group)],
                      })) || []
                    "
                    center-label="年龄占比"
                  />
                </div>
              </div>
            </div>

            <div class="p-6 border-t border-default flex items-center justify-between bg-bg-secondary/30">
              <div class="text-xs text-text-tertiary">
                数据统计周期: 近7天 · 数据来源: CDC 冷链监测节点
              </div>
              <button class="btn-primary flex items-center gap-2 px-5 h-10" @click="goToColdChain">
                <ArrowUpRight class="w-4 h-4" />
                进入该省冷链监测
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script lang="ts">
import { MapPin } from 'lucide-vue-next'
export { MapPin }
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
