<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, markRaw } from 'vue'
import * as echarts from 'echarts'
import { useChartTheme, BarRank, RadarChart } from '@/components/charts'
import AppLayout from '@/components/layout/AppLayout.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import {
  Calendar,
  MapPin,
  ChevronDown,
  Search,
  CheckCircle2,
  FileText,
  Eye,
  Download,
  Printer,
  Share2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lightbulb,
  Zap,
  ShieldCheck,
  Users,
  Settings,
  Package,
  Plus,
  Loader2,
  X,
  FileCheck,
} from 'lucide-vue-next'
import {
  mockGetWeeklyReports,
  mockGetReportDetail,
  mockGenerateReport,
  mockGetReportList,
  PROVINCES,
  type WeeklyReport,
  type WeeklyReportSummary,
  type TempOverRateData,
  type LossRateRank,
  type ProgressCompare,
} from '@/mock'

const theme = useChartTheme()

const scopeOptions = [
  { value: '', label: '全部范围' },
  { value: 'NATIONAL', label: '国家级' },
  { value: 'PROVINCE', label: '省级' },
  { value: 'CITY', label: '市级' },
]

const weekOptions = Array.from({ length: 12 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - i * 7)
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
  const year = d.getFullYear()
  const pad = (n: number) => String(n).padStart(2, '0')
  return { value: `${year}-W${pad(weekNum)}`, label: `${year}年第${weekNum}周` }
})

const filters = reactive({
  week: weekOptions[0].value,
  province: '',
  scope: '' as '' | 'NATIONAL' | 'PROVINCE' | 'CITY',
})

const provinceDropdownOpen = ref(false)
const provinceSearch = ref('')
const generating = ref(false)

const reportList = ref<WeeklyReport[]>([])
const selectedReport = ref<WeeklyReport | null>(null)
const selectedSummary = ref<WeeklyReportSummary | null>(null)
const listPage = ref(1)
const listPageSize = ref(8)
const listLoading = ref(false)
const detailLoading = ref(false)
const listTotal = ref(0)

const tempChartRef = ref<HTMLDivElement | null>(null)
let tempChartInstance: echarts.ECharts | null = null

const filteredProvinces = computed(() => {
  const q = provinceSearch.value.trim()
  const list = [{ code: '', name: '全部省份' }, ...PROVINCES]
  if (!q) return list
  return list.filter((p) => p.name.includes(q) || p.code.includes(q))
})

const selectedProvinceName = computed(() => {
  if (!filters.province) return '全部省份'
  const p = PROVINCES.find((x) => x.code === filters.province)
  return p ? p.name : '全部省份'
})

function toggleProvince(code: string) {
  filters.province = code
  provinceDropdownOpen.value = false
  provinceSearch.value = ''
}

async function loadReportList() {
  listLoading.value = true
  try {
    const reportScope = (filters.scope && filters.scope !== 'CITY')
      ? (filters.scope as 'NATIONAL' | 'PROVINCE')
      : undefined;
    const result = mockGetReportList({
      page: listPage.value,
      pageSize: listPageSize.value,
      province: filters.province || undefined,
      scope: reportScope,
    })
    reportList.value = result.list
    listTotal.value = result.total
    if (result.list.length > 0 && !selectedReport.value) {
      selectReport(result.list[0])
    }
  } finally {
    listLoading.value = false
  }
}

async function selectReport(report: WeeklyReport) {
  selectedReport.value = report
  detailLoading.value = true
  selectedSummary.value = null
  try {
    await new Promise((r) => setTimeout(r, 300))
    const detail = mockGetReportDetail(report.id)
    if (detail && detail.summary) {
      selectedSummary.value = detail.summary
      setTimeout(() => {
        initTempChart()
      }, 50)
    }
  } finally {
    detailLoading.value = false
  }
}

async function handleGenerateReport() {
  generating.value = true
  try {
    await new Promise((r) => setTimeout(r, 800))
    const newReport = mockGenerateReport(filters.province || undefined)
    await loadReportList()
    selectReport(newReport)
  } finally {
    generating.value = false
  }
}

function switchWeek(direction: -1 | 1) {
  const currentIdx = weekOptions.findIndex((w) => w.value === filters.week)
  if (currentIdx < 0) return
  const nextIdx = currentIdx + direction
  if (nextIdx >= 0 && nextIdx < weekOptions.length) {
    filters.week = weekOptions[nextIdx].value
  }
}

const tempOverRateColumns: DataTableColumn<TempOverRateData>[] = [
  { key: 'week', title: '周次', width: 120 },
  { key: 'current', title: '本周超标率(%)', align: 'right', width: 140 },
  {
    key: 'yoy',
    title: '同比',
    align: 'right',
    width: 100,
    render: (row) =>
      row.yoy > 0
        ? `<span class="text-danger-400">↑ ${row.yoy.toFixed(1)}%</span>`
        : row.yoy < 0
          ? `<span class="text-success-400">↓ ${Math.abs(row.yoy).toFixed(1)}%</span>`
          : `<span class="text-text-tertiary">-</span>`,
  },
  {
    key: 'mom',
    title: '环比',
    align: 'right',
    width: 100,
    render: (row) =>
      row.mom > 0
        ? `<span class="text-danger-400">↑ ${row.mom.toFixed(1)}%</span>`
        : row.mom < 0
          ? `<span class="text-success-400">↓ ${Math.abs(row.mom).toFixed(1)}%</span>`
          : `<span class="text-text-tertiary">-</span>`,
  },
]

const lossRateColumns: DataTableColumn<any>[] = [
  { key: 'rank', title: '排名', width: 70, align: 'center' },
  { key: 'name', title: '疫苗名称', width: 140 },
  { key: 'lossQuantity', title: '损耗数量', align: 'right', width: 120 },
  { key: 'rate', title: '损耗率(%)', align: 'right', width: 120 },
  { key: 'mainReason', title: '主要原因', width: 160 },
]

const lossTableData = computed(() => {
  if (!selectedSummary.value) return []
  const reasons = ['冷链断链', '过期报废', '运输破损', '包装破损', '其他原因']
  return selectedSummary.value.vaccineLossRank.map((v, i) => ({
    ...v,
    rank: i + 1,
    mainReason: reasons[i % reasons.length],
  }))
})

const progressColumns: DataTableColumn<ProgressCompare>[] = [
  { key: 'name', title: '省市', width: 120 },
  { key: 'plan', title: '计划接种数', align: 'right', width: 130 },
  { key: 'actual', title: '实际接种数', align: 'right', width: 130 },
  {
    key: 'completionRate',
    title: '完成率(%)',
    align: 'right',
    width: 130,
    render: (row) => {
      const rate = row.completionRate
      const color = rate >= 90 ? 'text-success-400' : rate >= 75 ? 'text-warning-400' : 'text-danger-400'
      return `<span class="${color} font-medium">${rate.toFixed(1)}%</span>`
    },
  },
]

const radarIndicators = computed(() => {
  if (!selectedSummary.value) return []
  return selectedSummary.value.radarData.map((r) => ({ name: r.dimension, max: 100 }))
})

const radarSeries = computed(() => {
  if (!selectedSummary.value) return []
  return [
    {
      name: '计划目标',
      data: selectedSummary.value.radarData.map((r) => r.plan),
      color: '#63B3FF',
    },
    {
      name: '实际达成',
      data: selectedSummary.value.radarData.map((r) => r.actual),
      color: '#52C41A',
    },
  ]
})

const keyFindings = computed(() => {
  if (!selectedSummary.value) return []
  const types = [
    { icon: markRaw(AlertCircle), color: 'primary', label: '整体情况' },
    { icon: markRaw(CheckCircle), color: 'success', label: '积极进展' },
    { icon: markRaw(AlertTriangle), color: 'warning', label: '需要关注' },
    { icon: markRaw(XCircle), color: 'danger', label: '紧急问题' },
  ]
  return selectedSummary.value.keyFindings.map((f, i) => ({
    text: f,
    ...types[i % types.length],
  }))
})

const strategyCategories = ['运营优化', '人员调整', '设备更换', '资源调配']
const strategyPriorities = [
  { label: '高', class: 'bg-danger-500/20 text-danger-400 border-danger-500/40' },
  { label: '中', class: 'bg-warning-500/20 text-warning-400 border-warning-500/40' },
  { label: '低', class: 'bg-success-500/20 text-success-400 border-success-500/40' },
]

const strategies = computed(() => {
  if (!selectedSummary.value) return []
  return selectedSummary.value.strategies.map((s, i) => {
    const analysisSteps = [
      '对现有数据进行深度分析，识别核心瓶颈与高风险环节。',
      '对比行业标准与历史数据，量化差距并确定改进优先级。',
      '制定可落地的执行方案，明确责任主体与时间节点。',
      '建立效果跟踪机制，定期评估优化进展并动态调整。',
    ]
    const benefits = [
      `预计降低温度超标率 ${(1 + Math.random() * 3).toFixed(1)}%`,
      `预计节省运营成本 ￥${(5 + Math.random() * 20).toFixed(1)}万/季度`,
      `预计提升接种完成率 ${(1 + Math.random() * 4).toFixed(1)}%`,
      `预计减少疫苗损耗率 ${(0.3 + Math.random() * 1.2).toFixed(2)}%`,
    ]
    return {
      title: `${['冷链维护策略', '接种活动安排', '库存调配方案', '设备更新计划', '培训考核体系'][i % 5]} #${i + 1}`,
      category: strategyCategories[i % strategyCategories.length],
      problem: s,
      analysis: analysisSteps.slice(0, 3),
      benefits: [benefits[i % benefits.length], benefits[(i + 2) % benefits.length]],
      priority: strategyPriorities[i % 3],
    }
  })
})

function initTempChart() {
  if (!tempChartRef.value || !selectedSummary.value) return
  if (tempChartInstance) {
    tempChartInstance.dispose()
    tempChartInstance = null
  }
  tempChartInstance = echarts.init(tempChartRef.value)

  const data = selectedSummary.value.tempOverRateData
  const weeks = data.map((d) => d.week)
  const current = data.map((d) => d.current)
  const yoy = data.map((d) => d.yoy)
  const mom = data.map((d) => d.mom)

  tempChartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: theme.bgCard,
      borderColor: theme.borderDefault,
      textStyle: { color: theme.textPrimary },
      extraCssText: `box-shadow: 0 0 20px ${theme.primary}30; backdrop-filter: blur(8px);`,
    },
    legend: {
      top: 0,
      right: 10,
      textStyle: { color: theme.textSecondary, fontSize: 12 },
      itemWidth: 12,
      itemHeight: 8,
      icon: 'roundRect',
    },
    grid: {
      left: 50,
      right: 60,
      top: 40,
      bottom: 40,
    },
    xAxis: {
      type: 'category',
      data: weeks,
      axisLine: { lineStyle: { color: theme.gridLine } },
      axisLabel: { color: theme.textSecondary, fontSize: 11, rotate: 30 },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: '超标率(%)',
        nameTextStyle: { color: theme.textSecondary, fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: theme.gridLine, type: 'dashed' } },
        axisLabel: { color: theme.textSecondary, fontSize: 11 },
      },
      {
        type: 'value',
        name: '同比/环比(%)',
        nameTextStyle: { color: theme.textSecondary, fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: theme.textSecondary, fontSize: 11 },
      },
    ],
    series: [
      {
        name: '本周',
        type: 'bar',
        data: current,
        barWidth: 18,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: theme.primary400 },
            { offset: 1, color: theme.primary700 },
          ]),
        },
      },
      {
        name: '上周',
        type: 'bar',
        data: current.map((v) => +(v * (1 + (Math.random() - 0.3) * 0.1)).toFixed(2)),
        barWidth: 18,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#73D13D' },
            { offset: 1, color: '#389E0D' },
          ]),
        },
      },
      {
        name: '去年同期',
        type: 'bar',
        data: current.map((v) => +(v * (1 + (Math.random() - 0.1) * 0.2)).toFixed(2)),
        barWidth: 18,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#FFC53D' },
            { offset: 1, color: '#D48806' },
          ]),
        },
      },
      {
        name: '同比',
        type: 'line',
        yAxisIndex: 1,
        data: yoy,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#F5222D', width: 2 },
        itemStyle: { color: '#F5222D', borderWidth: 2, borderColor: theme.bgCard },
      },
      {
        name: '环比',
        type: 'line',
        yAxisIndex: 1,
        data: mom,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#722ED1', width: 2 },
        itemStyle: { color: '#722ED1', borderWidth: 2, borderColor: theme.bgCard },
      },
    ],
  })
}

const lossRankData = computed(() => {
  if (!selectedSummary.value) return []
  return selectedSummary.value.vaccineLossRank.map((v) => ({
    name: v.name,
    value: v.rate,
    extra: `损耗: ${v.lossQuantity.toLocaleString()} 支`,
  }))
})

const handleResize = () => {
  tempChartInstance?.resize()
}

watch(
  () => [filters.week, filters.province, filters.scope],
  () => {
    listPage.value = 1
    loadReportList()
  }
)

watch(listPage, () => loadReportList())
watch(listPageSize, () => {
  listPage.value = 1
  loadReportList()
})

onMounted(() => {
  loadReportList()
  window.addEventListener('resize', handleResize)
})
</script>

<template>
  <AppLayout>
    <div class="h-full flex flex-col gap-4">
      <!-- 顶部筛选 -->
      <div class="panel p-4 animate-fade-in-up shrink-0">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-primary-400 shrink-0" />
            <select
              v-model="filters.week"
              class="h-10 px-3 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary-500 cursor-pointer min-w-[160px]"
            >
              <option v-for="w in weekOptions" :key="w.value" :value="w.value">{{ w.label }}</option>
            </select>
          </div>

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
                    filters.province === (p.code || '')
                      ? 'bg-primary-500/20 text-primary-300'
                      : 'text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary',
                  ]"
                  @click="toggleProvince(p.code)"
                >
                  <span>{{ p.name }}</span>
                  <CheckCircle2
                    v-if="filters.province === (p.code || '')"
                    class="w-4 h-4 text-primary-400"
                  />
                </button>
              </div>
            </div>
          </div>

          <select
            v-model="filters.scope"
            class="h-10 px-3 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary-500 cursor-pointer min-w-[140px]"
          >
            <option v-for="s in scopeOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>

          <div class="flex-1"></div>

          <button
            class="btn-primary h-10 flex items-center gap-2"
            :disabled="generating"
            @click="handleGenerateReport"
          >
            <Loader2 v-if="generating" class="w-4 h-4 animate-spin" />
            <Plus v-else class="w-4 h-4" />
            <span>{{ generating ? '生成中...' : '生成报告' }}</span>
          </button>
        </div>
      </div>

      <!-- 主体：左侧列表 + 右侧详情 -->
      <div class="flex-1 flex gap-4 min-h-0">
        <!-- 左 1/4：周报列表 -->
        <div class="w-80 shrink-0 flex flex-col gap-2 overflow-hidden">
          <div class="flex items-center justify-between px-1">
            <h3 class="panel-title !text-sm">周报列表</h3>
            <span class="text-xs text-text-tertiary">共 {{ listTotal }} 份</span>
          </div>
          <div class="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
            <template v-if="listLoading && reportList.length === 0">
              <div v-for="i in 5" :key="i" class="panel p-3 animate-pulse">
                <div class="h-4 w-24 bg-bg-tertiary/60 rounded mb-2"></div>
                <div class="h-3 w-full bg-bg-tertiary/40 rounded mb-1.5"></div>
                <div class="h-3 w-3/4 bg-bg-tertiary/40 rounded mb-3"></div>
                <div class="flex gap-2">
                  <div class="h-5 w-14 bg-bg-tertiary/40 rounded-full"></div>
                  <div class="h-5 w-14 bg-bg-tertiary/40 rounded-full"></div>
                  <div class="h-5 w-14 bg-bg-tertiary/40 rounded-full"></div>
                </div>
              </div>
            </template>
            <template v-else>
              <div
                v-for="report in reportList"
                :key="report.id"
                class="panel p-3 cursor-pointer transition-all duration-200 animate-fade-in-up"
                :class="[
                  selectedReport?.id === report.id
                    ? 'border-primary-500 shadow-glow-blue bg-primary-500/10'
                    : 'hover:border-primary-500/40',
                ]"
                @click="selectReport(report)"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-rajdhani font-bold text-primary-300 text-base">{{ report.week }}</span>
                  <span
                    class="text-[10px] px-1.5 py-0.5 rounded"
                    :class="[
                      report.status === 'PUBLISHED' ? 'bg-success-500/20 text-success-400 border border-success-500/30' :
                      report.status === 'DRAFT' ? 'bg-warning-500/20 text-warning-400 border border-warning-500/30' :
                      'bg-bg-tertiary/60 text-text-tertiary border border-default',
                    ]"
                  >
                    {{ report.status === 'PUBLISHED' ? '已发布' : report.status === 'DRAFT' ? '草稿' : '已归档' }}
                  </span>
                </div>
                <div class="text-xs text-text-primary mb-1 font-medium truncate">{{ report.title }}</div>
                <div class="flex items-center gap-1 text-[11px] text-text-tertiary mb-3">
                  <span>{{ report.province }}</span>
                  <span>·</span>
                  <span>{{ report.generateTime.slice(5, 16) }}</span>
                </div>
                <div v-if="report.summary" class="grid grid-cols-3 gap-1 mb-3">
                  <div class="text-center px-1.5 py-1 rounded bg-bg-tertiary/40">
                    <div class="text-[9px] text-text-tertiary mb-0.5">温度超标</div>
                    <div
                      class="font-rajdhani font-bold text-xs"
                      :class="report.summary.weeklyStats.avgTempRate < 95 ? 'text-danger-400' : 'text-success-400'"
                    >
                      {{ report.summary.weeklyStats.avgTempRate }}%
                    </div>
                  </div>
                  <div class="text-center px-1.5 py-1 rounded bg-bg-tertiary/40">
                    <div class="text-[9px] text-text-tertiary mb-0.5">损耗率</div>
                    <div
                      class="font-rajdhani font-bold text-xs"
                      :class="report.summary.weeklyStats.totalLossRate > 2 ? 'text-warning-400' : 'text-text-primary'"
                    >
                      {{ report.summary.weeklyStats.totalLossRate }}%
                    </div>
                  </div>
                  <div class="text-center px-1.5 py-1 rounded bg-bg-tertiary/40">
                    <div class="text-[9px] text-text-tertiary mb-0.5">完成率</div>
                    <div
                      class="font-rajdhani font-bold text-xs"
                      :class="report.summary.weeklyStats.avgCoverageRate < 80 ? 'text-danger-400' : 'text-success-400'"
                    >
                      {{ report.summary.weeklyStats.avgCoverageRate }}%
                    </div>
                  </div>
                </div>
                <button
                  class="w-full h-7 rounded-md text-[11px] flex items-center justify-center gap-1 bg-bg-tertiary/50 text-text-secondary hover:bg-primary-500/20 hover:text-primary-300 border border-default hover:border-primary-500/40 transition-all"
                  @click.stop="selectReport(report)"
                >
                  <Eye class="w-3 h-3" />
                  查看报告
                </button>
              </div>
            </template>
          </div>
          <div v-if="listTotal > listPageSize" class="shrink-0 pt-2">
            <div class="flex items-center justify-center gap-2">
              <button
                class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary border border-default hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300 transition-all disabled:opacity-40"
                :disabled="listPage <= 1"
                @click="listPage--"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              <span class="text-xs text-text-tertiary">{{ listPage }} / {{ Math.ceil(listTotal / listPageSize) }}</span>
              <button
                class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary border border-default hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300 transition-all disabled:opacity-40"
                :disabled="listPage >= Math.ceil(listTotal / listPageSize)"
                @click="listPage++"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- 右 3/4：报告详情 -->
        <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div class="flex-1 overflow-y-auto pr-1">
            <div
              class="panel p-8 min-h-full relative overflow-hidden"
              style="background: linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(230,244,255,0.95) 100%); border: 1px solid rgba(24,144,255,0.2); backdrop-filter: blur(20px);"
            >
              <div class="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary-500/5 blur-3xl"></div>
              <div class="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-success-500/5 blur-3xl"></div>

              <div v-if="detailLoading" class="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-sm">
                <div class="flex flex-col items-center gap-3">
                  <Loader2 class="w-10 h-10 text-primary-500 animate-spin" />
                  <span class="text-sm text-primary-700">正在加载报告数据...</span>
                </div>
              </div>

              <template v-if="selectedReport && selectedSummary">
                <!-- 报告标题 -->
                <div class="text-center mb-8 relative">
                  <div class="flex items-center justify-center gap-3 mb-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center shadow-glow-blue">
                      <FileText class="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <h1
                    class="font-rajdhani font-bold text-4xl mb-2"
                    style="background: linear-gradient(135deg, #002766 0%, #1890FF 50%, #096DD9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"
                  >
                    {{ selectedReport.week }} 冷链健康诊断报告
                  </h1>
                  <p class="text-sm" style="color: #5C7799;">Vaccine Cold Chain Health Diagnostic Report</p>
                </div>

                <!-- 元信息 -->
                <div
                  class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-5 rounded-xl"
                  style="background: rgba(24,144,255,0.04); border: 1px solid rgba(24,144,255,0.12);"
                >
                  <div>
                    <div class="text-xs mb-1" style="color: #8FA3BF;">报告范围</div>
                    <div class="font-semibold text-sm flex items-center gap-1.5" style="color: #0A1628;">
                      <MapPin class="w-3.5 h-3.5 text-primary-500" />
                      {{ selectedReport.province }}
                      <span class="text-[10px] px-1.5 py-0.5 rounded-full ml-1" style="background: rgba(24,144,255,0.1); color: #096DD9;">
                        {{ selectedReport.scope === 'NATIONAL' ? '国家级' : selectedReport.scope === 'PROVINCE' ? '省级' : '市级' }}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div class="text-xs mb-1" style="color: #8FA3BF;">生成时间</div>
                    <div class="font-semibold text-sm flex items-center gap-1.5" style="color: #0A1628;">
                      <Calendar class="w-3.5 h-3.5 text-primary-500" />
                      {{ selectedReport.generateTime }}
                    </div>
                  </div>
                  <div>
                    <div class="text-xs mb-1" style="color: #8FA3BF;">编制单位</div>
                    <div class="font-semibold text-sm flex items-center gap-1.5" style="color: #0A1628;">
                      <ShieldCheck class="w-3.5 h-3.5 text-success-500" />
                      {{ selectedReport.author }}
                    </div>
                  </div>
                  <div>
                    <div class="text-xs mb-1" style="color: #8FA3BF;">版本号</div>
                    <div class="font-semibold text-sm flex items-center gap-1.5" style="color: #0A1628;">
                      <FileCheck class="w-3.5 h-3.5 text-warning-500" />
                      v2.5.{{ (selectedReport.id.charCodeAt(0) + selectedReport.id.charCodeAt(selectedReport.id.length - 1)) % 10 }}
                    </div>
                  </div>
                </div>

                <!-- 关键发现 -->
                <div class="mb-10">
                  <h2 class="text-lg font-bold mb-4 flex items-center gap-2" style="color: #0A1628;">
                    <span class="w-1 h-6 rounded-full" style="background: linear-gradient(180deg, #1890FF, #096DD9);"></span>
                    关键发现
                  </h2>
                  <div class="space-y-3">
                    <div
                      v-for="(f, i) in keyFindings"
                      :key="i"
                      class="flex items-start gap-3 p-4 rounded-xl transition-all duration-200 hover:shadow-md"
                      :style="{
                        background: f.color === 'primary' ? 'rgba(24,144,255,0.05)' :
                          f.color === 'success' ? 'rgba(82,196,26,0.05)' :
                          f.color === 'warning' ? 'rgba(250,173,20,0.05)' : 'rgba(245,34,45,0.05)',
                        border: `1px solid ${
                          f.color === 'primary' ? 'rgba(24,144,255,0.15)' :
                          f.color === 'success' ? 'rgba(82,196,26,0.15)' :
                          f.color === 'warning' ? 'rgba(250,173,20,0.15)' : 'rgba(245,34,45,0.15)'
                        }`,
                      }"
                    >
                      <div
                        class="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                        :style="{
                          background: f.color === 'primary' ? 'rgba(24,144,255,0.15)' :
                            f.color === 'success' ? 'rgba(82,196,26,0.15)' :
                            f.color === 'warning' ? 'rgba(250,173,20,0.15)' : 'rgba(245,34,45,0.15)',
                          color: f.color === 'primary' ? '#1890FF' :
                            f.color === 'success' ? '#52C41A' :
                            f.color === 'warning' ? '#FAAD14' : '#F5222D',
                        }"
                      >
                        <component :is="f.icon" class="w-5 h-5" />
                      </div>
                      <div class="flex-1 pt-0.5">
                        <div class="text-xs font-semibold mb-1" :style="{
                          color: f.color === 'primary' ? '#096DD9' :
                            f.color === 'success' ? '#389E0D' :
                            f.color === 'warning' ? '#D48806' : '#CF1322',
                        }">{{ f.label }}</div>
                        <div class="text-sm leading-relaxed" style="color: #0A1628;">{{ f.text }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Section 1: 温度超标率同环比 -->
                <div class="mb-10">
                  <h2 class="text-lg font-bold mb-4 flex items-center gap-2" style="color: #0A1628;">
                    <span class="w-1 h-6 rounded-full" style="background: linear-gradient(180deg, #1890FF, #096DD9);"></span>
                    Section 1 · 温度超标率同环比分析
                  </h2>
                  <div class="p-5 rounded-xl" style="background: rgba(24,144,255,0.03); border: 1px solid rgba(24,144,255,0.1);">
                    <div ref="tempChartRef" class="h-[340px] mb-6"></div>
                    <div class="text-xs mb-3 font-semibold" style="color: #0A1628;">各省市温度超标率同环比明细</div>
                    <DataTable
                      :columns="tempOverRateColumns"
                      :data="selectedSummary.tempOverRateData"
                      :total="selectedSummary.tempOverRateData.length"
                      :page="1"
                      :page-size="8"
                      bordered
                    />
                  </div>
                </div>

                <!-- Section 2: 疫苗损耗率排名 -->
                <div class="mb-10">
                  <h2 class="text-lg font-bold mb-4 flex items-center gap-2" style="color: #0A1628;">
                    <span class="w-1 h-6 rounded-full" style="background: linear-gradient(180deg, #F5222D, #CF1322);"></span>
                    Section 2 · 疫苗损耗率排名 TOP 10
                  </h2>
                  <div class="p-5 rounded-xl" style="background: rgba(245,34,45,0.03); border: 1px solid rgba(245,34,45,0.08);">
                    <div class="h-[360px] mb-6 bg-white/50 rounded-lg p-4">
                      <BarRank
                        :data="lossRankData"
                        color-start="#FF7875"
                        color-end="#CF1322"
                        unit="%"
                        :value-format="(v: number) => v.toFixed(2)"
                      />
                    </div>
                    <div class="text-xs mb-3 font-semibold" style="color: #0A1628;">疫苗损耗明细</div>
                    <DataTable
                      :columns="lossRateColumns"
                      :data="lossTableData"
                      :total="lossTableData.length"
                      :page="1"
                      :page-size="10"
                      bordered
                    />
                  </div>
                </div>

                <!-- Section 3: 接种进度对比雷达图 -->
                <div class="mb-10">
                  <h2 class="text-lg font-bold mb-4 flex items-center gap-2" style="color: #0A1628;">
                    <span class="w-1 h-6 rounded-full" style="background: linear-gradient(180deg, #52C41A, #389E0D);"></span>
                    Section 3 · 接种进度对比分析
                  </h2>
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div class="p-5 rounded-xl" style="background: rgba(82,196,26,0.03); border: 1px solid rgba(82,196,26,0.1);">
                      <div class="h-[360px] bg-white/50 rounded-lg">
                        <RadarChart
                          :indicators="radarIndicators"
                          :series="radarSeries"
                          title="各维度计划 vs 实际达成"
                          :height="340"
                        />
                      </div>
                    </div>
                    <div class="p-5 rounded-xl" style="background: rgba(82,196,26,0.03); border: 1px solid rgba(82,196,26,0.1);">
                      <div class="text-xs mb-3 font-semibold" style="color: #0A1628;">各省市接种进度完成汇总</div>
                      <DataTable
                        :columns="progressColumns"
                        :data="selectedSummary.progressCompare"
                        :total="selectedSummary.progressCompare.length"
                        :page="1"
                        :page-size="10"
                        bordered
                      />
                    </div>
                  </div>
                </div>

                <!-- Section 4: 策略推荐 -->
                <div class="mb-8">
                  <h2 class="text-lg font-bold mb-4 flex items-center gap-2" style="color: #0A1628;">
                    <span class="w-1 h-6 rounded-full" style="background: linear-gradient(180deg, #722ED1, #531DAB);"></span>
                    Section 4 · 优化策略推荐
                  </h2>
                  <div class="space-y-4">
                    <div
                      v-for="(s, i) in strategies"
                      :key="i"
                      class="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                      style="background: rgba(114,46,209,0.03); border: 1px solid rgba(114,46,209,0.1);"
                    >
                      <div class="flex items-start justify-between gap-4 mb-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            style="background: rgba(114,46,209,0.15);"
                          >
                            <component
                              :is="[Lightbulb, Zap, Settings, Package][i % 4]"
                              class="w-5 h-5"
                              style="color: #722ED1;"
                            />
                          </div>
                          <div>
                            <h3 class="font-bold text-base mb-1 flex items-center gap-2" style="color: #0A1628;">
                              {{ s.title }}
                              <span
                                class="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                                style="background: rgba(24,144,255,0.1); color: #096DD9; border-color: rgba(24,144,255,0.2);"
                              >
                                {{ s.category }}
                              </span>
                            </h3>
                            <div class="text-xs flex items-center gap-2" style="color: #8FA3BF;">
                              <Users class="w-3 h-3" />
                              责任部门：疾控中心运营处
                            </div>
                          </div>
                        </div>
                        <span
                          class="text-xs px-3 py-1 rounded-full font-semibold shrink-0 border"
                          :class="s.priority.class"
                        >
                          优先级：{{ s.priority.label }}
                        </span>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                        <div>
                          <div class="text-xs font-semibold mb-2 flex items-center gap-1.5" style="color: #722ED1;">
                            <AlertCircle class="w-3.5 h-3.5" />
                            问题 → 分析 → 建议
                          </div>
                          <div class="space-y-2 text-sm leading-relaxed" style="color: #0A1628;">
                            <div class="p-3 rounded-lg" style="background: rgba(245,34,45,0.05);">
                              <span class="text-xs font-semibold text-danger-500">问题：</span>{{ s.problem }}
                            </div>
                            <div v-for="(a, ai) in s.analysis" :key="ai" class="p-3 rounded-lg" style="background: rgba(255,255,255,0.6);">
                              <span class="text-xs font-semibold" style="color: #096DD9;">步骤{{ ai + 1 }}：</span>{{ a }}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div class="text-xs font-semibold mb-2 flex items-center gap-1.5" style="color: #389E0D;">
                            <TrendingUp class="w-3.5 h-3.5" />
                            预期收益
                          </div>
                          <div class="space-y-2">
                            <div
                              v-for="(b, bi) in s.benefits"
                              :key="bi"
                              class="flex items-center gap-2 p-3 rounded-lg"
                              style="background: rgba(82,196,26,0.06);"
                            >
                              <CheckCircle2 class="w-4 h-4 shrink-0" style="color: #52C41A;" />
                              <span class="text-sm font-medium" style="color: #389E0D;">{{ b }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else-if="!detailLoading">
                <div class="flex flex-col items-center justify-center py-24 text-center">
                  <div class="w-20 h-20 rounded-2xl mb-6 flex items-center justify-center" style="background: rgba(24,144,255,0.1);">
                    <FileText class="w-10 h-10" style="color: #1890FF; opacity: 0.5;" />
                  </div>
                  <h3 class="text-xl font-bold mb-2" style="color: #0A1628;">请选择一份报告</h3>
                  <p class="text-sm" style="color: #8FA3BF;">从左侧列表选择周报，或点击「生成报告」创建新报告</p>
                </div>
              </template>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="shrink-0 panel p-4 mt-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button
                class="btn-ghost h-9 flex items-center gap-1.5 text-sm"
                :disabled="!selectedReport"
                @click="switchWeek(-1)"
              >
                <ChevronLeft class="w-4 h-4" />
                上一周
              </button>
              <button
                class="btn-ghost h-9 flex items-center gap-1.5 text-sm"
                :disabled="!selectedReport"
                @click="switchWeek(1)"
              >
                下一周
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn-ghost h-9 flex items-center gap-1.5 text-sm" :disabled="!selectedReport">
                <Share2 class="w-4 h-4" />
                分享
              </button>
              <button class="btn-ghost h-9 flex items-center gap-1.5 text-sm" :disabled="!selectedReport">
                <Printer class="w-4 h-4" />
                打印
              </button>
              <button class="btn-primary h-9 flex items-center gap-1.5 text-sm" :disabled="!selectedReport">
                <Download class="w-4 h-4" />
                下载 PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
