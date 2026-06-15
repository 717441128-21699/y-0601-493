<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import { TrendingUp, AlertTriangle, Package, ArrowRightLeft, Search, Download, RefreshCw, FileSpreadsheet, Calendar } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { mockGetForecast90, mockGetForecastSummary, mockGetTransferSuggestions, type ForecastDay, type TransferSuggestion } from '@/mock'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { LineChart, BarRank } from '@/components/charts'

const forecastData = ref<ForecastDay[]>([])
const summary = ref<any>(null)
const suggestions = ref<TransferSuggestion[]>([])
const search = ref('')
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)

function loadData() {
  loading.value = true
  try {
    forecastData.value = mockGetForecast90()
    summary.value = mockGetForecastSummary()
    suggestions.value = mockGetTransferSuggestions()
  } finally {
    loading.value = false
  }
}

const filteredSuggestions = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return suggestions.value
  return suggestions.value.filter(
    (s) => s.vaccineName.toLowerCase().includes(q) || s.fromProvince.toLowerCase().includes(q) || s.toProvince.toLowerCase().includes(q)
  )
})

const shortageRankData = computed(() => {
  if (summary.value?.byVaccine) {
    return summary.value.byVaccine
      .map((v: any) => ({ name: v.name, value: Math.round(v.totalGap / 10000) }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 7)
  }
  return [
    { name: 'HPV疫苗', value: 35 },
    { name: '麻腮风疫苗', value: 28 },
    { name: '脊灰疫苗', value: 22 },
    { name: '百白破疫苗', value: 18 },
    { name: '流感疫苗', value: 15 },
    { name: '乙肝疫苗', value: 12 },
    { name: '卡介苗', value: 8 },
  ]
})

const forecastXData = computed(() => {
  if (forecastData.value.length === 0) return []
  const dates = [...new Set(forecastData.value.map((f) => f.date.slice(5)))].slice(0, 30)
  return dates
})

const forecastSeries = computed(() => {
  if (forecastData.value.length === 0) return []
  const demandByDate = new Map<string, number>()
  const supplyByDate = new Map<string, number>()
  forecastData.value.forEach((f) => {
    const key = f.date.slice(5)
    demandByDate.set(key, (demandByDate.get(key) || 0) + f.demand)
    supplyByDate.set(key, (supplyByDate.get(key) || 0) + f.supply)
  })
  const dates = forecastXData.value
  return [
    { name: '预测需求', data: dates.map((d) => Math.round((demandByDate.get(d) || 0) / 1000)), color: '#1890FF', area: true },
    { name: '当前库存', data: dates.map((d) => Math.round((supplyByDate.get(d) || 0) / 1000)), color: '#52C41A' },
  ]
})

const forecastColumns: DataTableColumn<ForecastDay>[] = [
  { key: 'date', title: '日期', width: 120 },
  { key: 'vaccineName', title: '疫苗名称', width: 140 },
  { key: 'supply', title: '当前库存', width: 120, align: 'right', render: (r) => `<span class="font-rajdhani">${r.supply.toLocaleString()}</span>` },
  { key: 'demand', title: '预测需求', width: 120, align: 'right', render: (r) => `<span class="font-rajdhani text-primary-400">${r.demand.toLocaleString()}</span>` },
  {
    key: 'gap',
    title: '预计缺口',
    width: 120,
    align: 'right',
    render: (r) => {
      const gap = r.gap
      return gap > 0
        ? `<span class="font-rajdhani font-bold text-danger-400">-${gap.toLocaleString()}</span>`
        : `<span class="font-rajdhani font-bold text-success-400">${Math.abs(gap).toLocaleString()}</span>`
    },
  },
  {
    key: 'riskLevel',
    title: '风险等级',
    width: 100,
    align: 'center',
    render: (r) => {
      const risk = r.gap > 0.5 * r.demand ? 'HIGH' : r.gap > 0 ? 'MEDIUM' : 'LOW'
      const map: Record<string, string> = {
        HIGH: '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-danger-500/20 text-danger-400 border border-danger-500/30">高风险</span>',
        MEDIUM: '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-warning-500/20 text-warning-400 border border-warning-500/30">中风险</span>',
        LOW: '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-success-500/20 text-success-400 border border-success-500/30">低风险</span>',
      }
      return map[risk] || risk
    },
  },
]

const suggestionColumns: DataTableColumn<TransferSuggestion>[] = [
  { key: 'vaccineName', title: '疫苗名称', width: 140 },
  {
    key: 'from',
    title: '调出方',
    width: 160,
    render: (r) => `<span class="text-warning-400">${r.fromProvince}</span>`,
  },
  {
    key: 'arrow',
    title: '',
    width: 80,
    align: 'center',
    render: () => '<span class="text-primary-400">→</span>',
  },
  {
    key: 'to',
    title: '调入方',
    width: 160,
    render: (r) => `<span class="text-success-400">${r.toProvince}</span>`,
  },
  { key: 'quantity', title: '调拨数量', width: 120, align: 'right', render: (r) => `<span class="font-rajdhani font-bold">${r.quantity.toLocaleString()}</span>` },
  {
    key: 'priority',
    title: '优先级',
    width: 100,
    align: 'center',
    render: (r) => {
      const map: Record<string, string> = {
        '1': '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-danger-500/20 text-danger-400 border border-danger-500/30">紧急</span>',
        '2': '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-warning-500/20 text-warning-400 border border-warning-500/30">常规</span>',
        '3': '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30">建议</span>',
      }
      return map[String(r.priority)] || String(r.priority)
    },
  },
]

onMounted(loadData)
</script>

<template>
  <AppLayout>
    <div class="h-full flex flex-col gap-4">
      <div class="panel p-4 animate-fade-in-up shrink-0">
        <div class="flex flex-wrap items-center gap-4">
          <div class="relative flex-1 max-w-md min-w-[240px]">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              v-model="search"
              type="text"
              placeholder="搜索调拨建议中的疫苗/省份..."
              class="w-full h-10 pl-10 pr-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary"
            />
          </div>
          <div class="flex-1"></div>
          <button class="btn-ghost h-10 flex items-center gap-2 text-sm">
            <Download class="w-4 h-4" />
            导出预测报告
          </button>
          <button class="btn-ghost h-10 flex items-center gap-2 text-sm" @click="loadData">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            刷新
          </button>
          <button class="btn-primary h-10 flex items-center gap-2 text-sm">
            <FileSpreadsheet class="w-4 h-4" />
            生成调拨单
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div
          v-for="(kpi, idx) in [
            { label: '未来90天预测需求(万剂)', value: summary?.totalForecast || 285, icon: Calendar, color: 'primary' },
            { label: '预计库存缺口(万剂)', value: summary?.totalGap || 32, icon: AlertTriangle, color: 'danger' },
            { label: '高风险疫苗种类', value: summary?.highRiskCount || 4, icon: TrendingUp, color: 'warning' },
            { label: '待执行调拨建议', value: suggestions.filter((s) => s.priority === 1).length, icon: ArrowRightLeft, color: 'success' },
          ]"
          :key="kpi.label"
          class="panel p-5 animate-fade-in-up"
          :style="{ animationDelay: `${idx * 0.05}s` }"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-text-secondary mb-2">{{ kpi.label }}</div>
              <div class="font-rajdhani font-bold text-3xl text-text-primary">{{ kpi.value }}</div>
            </div>
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :class="
                kpi.color === 'primary' ? 'bg-primary-500/15 text-primary-400' :
                kpi.color === 'success' ? 'bg-success-500/15 text-success-400' :
                kpi.color === 'danger' ? 'bg-danger-500/15 text-danger-400' : 'bg-warning-500/15 text-warning-400'
              "
            >
              <component :is="kpi.icon" class="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
        <div class="lg:col-span-2 panel p-5 h-80">
          <h3 class="panel-title mb-4">未来90天库存 vs 需求预测趋势</h3>
          <LineChart
            v-if="forecastData.length > 0"
            :x-data="forecastXData"
            :series="forecastSeries"
            y-unit="千剂"
          />
        </div>
        <div class="panel p-5 h-80">
          <h3 class="panel-title mb-4">疫苗缺口排名 TOP</h3>
          <BarRank
            :data="shortageRankData"
            unit="万剂"
            color-start="#FF7875"
            color-end="#CF1322"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <div class="panel p-5 min-h-0 flex flex-col">
          <h3 class="panel-title mb-4 shrink-0">缺口预测明细（90天）</h3>
          <div class="flex-1 min-h-0">
            <DataTable
              :columns="forecastColumns"
              :data="forecastData"
              :total="forecastData.length"
              :loading="loading"
              v-model:page="page"
              v-model:page-size="pageSize"
            />
          </div>
        </div>
        <div class="panel p-5 min-h-0 flex flex-col">
          <h3 class="panel-title mb-4 shrink-0">智能调拨建议</h3>
          <div class="flex-1 min-h-0">
            <DataTable
              :columns="suggestionColumns"
              :data="filteredSuggestions"
              :total="filteredSuggestions.length"
              v-model:page="page"
              :page-size="8"
            >
              <template #cell-actions="{ row }">
                <button
                  class="px-3 py-1.5 rounded-md text-xs font-medium bg-primary-500/15 text-primary-400 hover:bg-primary-500/25 transition-all flex items-center gap-1"
                >
                  <Package class="w-3.5 h-3.5" />
                  执行
                </button>
              </template>
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
