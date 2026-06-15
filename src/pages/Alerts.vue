<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import AlertCard from '@/components/AlertCard.vue'
import { AlertTriangle, Filter, Search, RefreshCw, FileCheck, Bell } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { useAlertsStore } from '@/stores/alerts'
import type { Alert } from '@/mock'
import { mockGetAlerts } from '@/mock'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { PieChart } from '@/components/charts'

const alertsStore = useAlertsStore()

const search = ref('')
const levelFilter = ref<string>('')
const statusFilter = ref<string>('')
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const allAlerts = ref<Alert[]>([])

async function loadData() {
  loading.value = true
  try {
    await alertsStore.fetchAlerts()
    const all = mockGetAlerts()
    allAlerts.value = all
  } finally {
    loading.value = false
  }
}

const filteredAlerts = computed(() => {
  let list = allAlerts.value
  if (levelFilter.value) list = list.filter((a) => a.level === levelFilter.value)
  if (statusFilter.value) list = list.filter((a) => a.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.province.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    )
  }
  return list
})

const alertTypeStats = computed(() => [
  { name: '温度超标', value: allAlerts.value.filter((a) => a.type === 'TEMP_OVER').length, color: '#F5222D' },
  { name: '温度过低', value: allAlerts.value.filter((a) => a.type === 'TEMP_UNDER').length, color: '#63B3FF' },
  { name: '库存不足', value: allAlerts.value.filter((a) => a.type === 'STOCK_LOW').length, color: '#FAAD14' },
  { name: '设备故障', value: allAlerts.value.filter((a) => a.type === 'DEVICE_FAULT').length, color: '#722ED1' },
])

const columns: DataTableColumn<Alert>[] = [
  { key: 'id', title: '预警编号', width: 130 },
  {
    key: 'level',
    title: '级别',
    width: 80,
    align: 'center',
    render: (row) =>
      row.level === 'L2'
        ? '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-danger-500/20 text-danger-400 border border-danger-500/30">二级</span>'
        : '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-warning-500/20 text-warning-400 border border-warning-500/30">一级</span>',
  },
  {
    key: 'type',
    title: '类型',
    width: 110,
    render: (row) => {
      const map: Record<string, string> = {
        TEMP_OVER: '温度超标',
        TEMP_UNDER: '温度过低',
        STOCK_LOW: '库存不足',
        DEVICE_FAULT: '设备故障',
      }
      return map[row.type] || row.type
    },
  },
  { key: 'title', title: '预警内容', width: 240, ellipsis: true },
  { key: 'province', title: '省份', width: 100 },
  { key: 'city', title: '城市', width: 100 },
  {
    key: 'status',
    title: '状态',
    width: 100,
    align: 'center',
    render: (row) => {
      const map: Record<string, string> = {
        PENDING: '<span class="text-warning-400">待处置</span>',
        PROCESSING: '<span class="text-primary-400">处置中</span>',
        ESCALATED: '<span class="text-danger-400">已升级</span>',
        APPROVING: '<span class="text-[#722ED1]">审批中</span>',
        CLOSED: '<span class="text-text-tertiary">已关闭</span>',
      }
      return map[row.status] || row.status
    },
  },
  { key: 'triggerTime', title: '触发时间', width: 160 },
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
              placeholder="搜索预警编号/内容/地点..."
              class="w-full h-10 pl-10 pr-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary"
            />
          </div>
          <select
            v-model="levelFilter"
            class="h-10 px-3 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary cursor-pointer min-w-[120px]"
          >
            <option value="">全部级别</option>
            <option value="L1">一级预警</option>
            <option value="L2">二级预警</option>
          </select>
          <select
            v-model="statusFilter"
            class="h-10 px-3 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary cursor-pointer min-w-[140px]"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待处置</option>
            <option value="PROCESSING">处置中</option>
            <option value="ESCALATED">已升级</option>
            <option value="APPROVING">审批中</option>
            <option value="CLOSED">已关闭</option>
          </select>
          <div class="flex-1"></div>
          <button class="btn-ghost h-10 flex items-center gap-2 text-sm" @click="$router.push('/alerts/approval')">
            <FileCheck class="w-4 h-4" />
            审批工作台
          </button>
          <button class="btn-ghost h-10 flex items-center gap-2 text-sm" @click="loadData">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            刷新
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div
          v-for="(kpi, idx) in [
            { label: '预警总数', value: allAlerts.length, icon: Bell, color: 'primary' },
            { label: '待处置(L1)', value: allAlerts.filter((a) => a.level === 'L1' && a.status === 'PENDING').length, icon: AlertTriangle, color: 'warning' },
            { label: '待审批(L2)', value: allAlerts.filter((a) => a.level === 'L2' && (a.status === 'APPROVING' || a.status === 'ESCALATED')).length, icon: FileCheck, color: 'danger' },
            { label: '今日已关闭', value: allAlerts.filter((a) => a.status === 'CLOSED').length, icon: Filter, color: 'success' },
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

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        <div class="lg:col-span-3 panel p-5 min-h-0 flex flex-col">
          <h3 class="panel-title mb-4 shrink-0">预警列表</h3>
          <div class="flex-1 min-h-0">
            <DataTable
              :columns="columns"
              :data="filteredAlerts"
              :total="filteredAlerts.length"
              :loading="loading"
              v-model:page="page"
              v-model:page-size="pageSize"
            />
          </div>
        </div>
        <div class="panel p-5 min-h-0 flex flex-col">
          <h3 class="panel-title mb-4 shrink-0">预警类型分布</h3>
          <div class="flex-1 min-h-0">
            <PieChart :data="alertTypeStats" donut center-label="预警数" />
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
