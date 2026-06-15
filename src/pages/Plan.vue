<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import { Calendar, FileSpreadsheet, Target, Search, Plus, Upload, RefreshCw, Download, Edit3, Save, TrendingUp } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { mockGetTargets, mockParsePlanExcel, type MonthlyTarget } from '@/mock'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { LineChart } from '@/components/charts'

const targets = ref<MonthlyTarget[]>([])
const search = ref('')
const page = ref(1)
const pageSize = ref(12)
const loading = ref(false)
const editing = ref(false)
const uploading = ref(false)

function loadData() {
  loading.value = true
  try {
    targets.value = mockGetTargets()
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return targets.value
  return targets.value.filter(
    (t) => t.vaccineName.toLowerCase().includes(q) || t.month.toLowerCase().includes(q)
  )
})

async function handleUpload() {
  uploading.value = true
  try {
    await new Promise((r) => setTimeout(r, 800))
    const result = mockParsePlanExcel()
    if (result && result.validRows > 0) {
      targets.value = result.targets
    }
  } finally {
    uploading.value = false
  }
}

function saveTargets() {
  editing.value = false
}

const columns: DataTableColumn<MonthlyTarget>[] = [
  { key: 'month', title: '月份', width: 120 },
  { key: 'vaccineName', title: '疫苗名称', width: 140 },
  { key: 'targetCount', title: '目标人群(人)', width: 140, align: 'right', render: (r) => `<span class="font-rajdhani">${r.targetCount.toLocaleString()}</span>` },
  { key: 'targetCount', title: '计划剂次', width: 120, align: 'right', render: (r) => `<span class="font-rajdhani">${r.targetCount.toLocaleString()}</span>` },
  {
    key: 'actualCount',
    title: '实际接种',
    width: 120,
    align: 'right',
    render: (r) => {
      const actual = r.actualCount ?? 0
      return `<span class="font-rajdhani ${actual >= r.targetCount * 0.9 ? 'text-success-400' : 'text-warning-400'}">${actual.toLocaleString()}</span>`
    },
  },
  {
    key: 'completionRate',
    title: '覆盖率',
    width: 120,
    align: 'right',
    render: (r) => {
      const rate = r.completionRate ?? 0
      return `<span class="font-bold font-rajdhani ${rate >= 95 ? 'text-success-400' : rate >= 85 ? 'text-warning-400' : 'text-danger-400'}">${rate.toFixed(1)}%</span>`
    },
  },
  { key: 'responsible', title: '责任人', width: 100 },
]

onMounted(loadData)

const planTrendXData = computed(() => {
  return targets.value
    .filter((_, i) => i % 10 === 0)
    .slice(0, 12)
    .map((t) => t.month.slice(5))
})

const planTrendSeries = computed(() => {
  const months = [...new Set(targets.value.map((t) => t.month))].slice(0, 12)
  const plannedByMonth = new Map<string, number>()
  const actualByMonth = new Map<string, number>()
  targets.value.forEach((t) => {
    plannedByMonth.set(t.month, (plannedByMonth.get(t.month) || 0) + t.targetCount)
    actualByMonth.set(t.month, (actualByMonth.get(t.month) || 0) + (t.actualCount || 0))
  })
  const sortedMonths = months.sort()
  return [
    { name: '计划接种', data: sortedMonths.map((m) => Math.round((plannedByMonth.get(m) || 0) / 10000)), color: '#1890FF', area: true },
    { name: '实际接种', data: sortedMonths.map((m) => Math.round((actualByMonth.get(m) || 0) / 10000)), color: '#52C41A' },
  ]
})
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
              placeholder="搜索疫苗名称/月份..."
              class="w-full h-10 pl-10 pr-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary"
            />
          </div>
          <div class="flex-1"></div>
          <button class="btn-ghost h-10 flex items-center gap-2 text-sm" @click="$router.push('/plan/forecast')">
            <TrendingUp class="w-4 h-4" />
            缺口预测
          </button>
          <button class="btn-ghost h-10 flex items-center gap-2 text-sm" @click="loadData">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            刷新
          </button>
          <button class="btn-ghost h-10 flex items-center gap-2 text-sm" :disabled="uploading" @click="handleUpload">
            <Upload class="w-4 h-4" />
            {{ uploading ? '导入中...' : 'Excel导入' }}
          </button>
          <button
            class="h-10 flex items-center gap-2 text-sm px-4 rounded font-medium transition-all"
            :class="editing ? 'text-white' : 'text-text-secondary border border-default hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300'"
            :style="editing ? { background: 'linear-gradient(135deg, #52C41A, #389E0D)' } : {}"
            @click="editing ? saveTargets() : editing = true"
          >
            <component :is="editing ? Save : Edit3" class="w-4 h-4" />
            {{ editing ? '保存修改' : '编辑目标' }}
          </button>
          <button class="btn-primary h-10 flex items-center gap-2 text-sm">
            <Plus class="w-4 h-4" />
            新增计划
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div
          v-for="(kpi, idx) in [
            { label: '计划总剂次', value: targets.reduce((s, t) => s + t.targetCount, 0).toLocaleString(), icon: Target, color: 'primary' },
            { label: '已接种剂次', value: targets.reduce((s, t) => s + (t.actualCount ?? 0), 0).toLocaleString(), icon: Calendar, color: 'success' },
            { label: '平均覆盖率', value: (targets.reduce((s, t) => s + (t.completionRate ?? 0), 0) / Math.max(targets.length, 1)).toFixed(1) + '%', icon: FileSpreadsheet, color: 'primary' },
            { label: '待完成', value: Math.max(targets.reduce((s, t) => s + t.targetCount - (t.actualCount ?? 0), 0), 0).toLocaleString(), icon: Target, color: 'warning' },
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

      <div class="panel p-5 shrink-0 h-72">
        <h3 class="panel-title mb-4">全年接种计划完成趋势</h3>
        <LineChart
          v-if="targets.length > 0"
          :x-data="planTrendXData"
          :series="planTrendSeries"
          y-unit="万剂"
        />
      </div>

      <div class="panel p-5 flex-1 min-h-0">
        <h3 class="panel-title mb-4">月度接种目标</h3>
        <DataTable
          :columns="columns"
          :data="filtered"
          :total="filtered.length"
          :loading="loading"
          v-model:page="page"
          v-model:page-size="pageSize"
        />
      </div>
    </div>
  </AppLayout>
</template>
