<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import KpiCard from '@/components/KpiCard.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import { LineChart } from '@/components/charts'
import {
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Search,
  ChevronDown,
  RefreshCw,
  Clock,
  MapPin,
  Eye,
  Wrench,
  X,
  MapIcon,
  Calendar,
  Plus,
  ArrowRight,
} from 'lucide-vue-next'
import { PROVINCES, CITIES, getVisibleProvinceCodes, getVisibleCityCodes, filterByProvince, filterByCity } from '@/mock'
import {
  mockGetColdStores,
  mockGetTempRecords,
  mockGetVehicles,
  type ColdStore,
  type TempRecord,
  type TransportVehicle,
} from '@/mock'
import { useUserStore } from '@/stores/user'
import { ref, computed, onMounted, h } from 'vue'

const userStore = useUserStore()
const visibleProvinceCodes = computed(() => getVisibleProvinceCodes(userStore.userInfo))
const visibleCityCodes = computed(() => getVisibleCityCodes(userStore.userInfo))

const provinceDropdownOpen = ref(false)
const cityDropdownOpen = ref(false)
const statusDropdownOpen = ref(false)
const timeRangeKey = ref<'7d' | '30d' | 'custom'>('7d')
const provinceSearch = ref('')
const citySearch = ref('')
const selectedProvince = ref('')
const selectedCity = ref('')
const selectedStatus = ref('')
const keyword = ref('')

const coldStores = ref<ColdStore[]>([])
const tempRecords = ref<TempRecord[]>([])
const vehicles = ref<TransportVehicle[]>([])
const page = ref(1)
const pageSize = ref(10)
const vehiclePage = ref(1)
const vehiclePageSize = ref(10)

const activeTab = ref<'stores' | 'vehicles'>('stores')
const selectedStoreIds = ref<string[]>([])
const selectedChartStoreIds = ref<string[]>([])

const tempModalVisible = ref(false)
const tempModalStore = ref<ColdStore | null>(null)
const tempModalRecords = ref<TempRecord[]>([])

const trackModalVisible = ref(false)
const trackModalVehicle = ref<TransportVehicle | null>(null)

const handleModalVisible = ref(false)
const handleModalStore = ref<ColdStore | null>(null)

const selectedProvinceName = computed(() => {
  if (!selectedProvince.value) return '全国'
  const p = PROVINCES.find((x) => x.code === selectedProvince.value)
  return p ? p.name : '全国'
})

const selectedCityName = computed(() => {
  if (!selectedCity.value) return '全部城市'
  const cities = CITIES[selectedProvince.value] || []
  const c = cities.find((x) => x.code === selectedCity.value)
  return c ? c.name : '全部城市'
})

const cityOptions = computed(() => {
  return [{ code: '', name: '全部城市' }, ...(CITIES[selectedProvince.value] || [])]
})

const filteredProvinces = computed(() => {
  const q = provinceSearch.value.trim()
  const user = userStore.userInfo
  let baseList: { code: string; name: string }[]
  if (user && user.level === 1) {
    baseList = [{ code: '', name: '全国' }, ...PROVINCES]
  } else {
    const codes = visibleProvinceCodes.value
    baseList = PROVINCES.filter(p => codes.includes(p.code))
  }
  if (!q) return baseList
  return baseList.filter((p) => p.name.includes(q) || p.code.includes(q))
})

const filteredCities = computed(() => {
  const q = citySearch.value.trim()
  if (!q) return cityOptions.value
  return cityOptions.value.filter((c) => c.name.includes(q) || c.code.includes(q))
})

const statusOptions = [
  { code: '', name: '全部状态' },
  { code: 'NORMAL', name: '正常' },
  { code: 'WARNING', name: '预警' },
  { code: 'ERROR', name: '故障' },
  { code: 'OFFLINE', name: '离线' },
]

const selectedStatusName = computed(() => {
  return statusOptions.find((s) => s.code === selectedStatus.value)?.name || '全部状态'
})

function toggleProvince(code: string) {
  selectedProvince.value = code
  selectedCity.value = ''
  provinceDropdownOpen.value = false
  provinceSearch.value = ''
  loadData()
}

function toggleCity(code: string) {
  selectedCity.value = code
  cityDropdownOpen.value = false
  citySearch.value = ''
  loadData()
}

function toggleStatus(code: string) {
  selectedStatus.value = code
  statusDropdownOpen.value = false
  loadData()
}

function setTimeRange(key: '7d' | '30d' | 'custom') {
  timeRangeKey.value = key
  loadData()
}

function loadData() {
  const params: any = {
    page: 1,
    pageSize: 200,
  }
  if (selectedProvince.value) params.province = selectedProvince.value
  if (selectedStatus.value) params.status = selectedStatus.value
  if (keyword.value) params.keyword = keyword.value

  const provCodes = visibleProvinceCodes.value
  const cityCodes = visibleCityCodes.value

  const result = mockGetColdStores(params)
  let stores = filterByProvince(result.list, provCodes)
  stores = filterByCity(stores, cityCodes)
  coldStores.value = stores.filter(
    (s) => !selectedCity.value || s.cityCode === selectedCity.value || s.city === selectedCityName.value
  )

  const days = timeRangeKey.value === '7d' ? 7 : timeRangeKey.value === '30d' ? 30 : 14
  const chartIds = selectedChartStoreIds.value.length
    ? selectedChartStoreIds.value
    : coldStores.value.slice(0, 4).map((s) => s.id)
  tempRecords.value = mockGetTempRecords(chartIds, days)

  let vehicleList = mockGetVehicles(selectedProvince.value || undefined)
  vehicleList = filterByProvince(vehicleList, provCodes)
  vehicleList = filterByCity(vehicleList, cityCodes)
  vehicles.value = vehicleList

  if (selectedChartStoreIds.value.length === 0 && coldStores.value.length > 0) {
    selectedChartStoreIds.value = coldStores.value.slice(0, 4).map((s) => s.id)
  }
}

function refreshData() {
  loadData()
}

const totalStores = computed(() => coldStores.value.length)
const normalStores = computed(() => coldStores.value.filter((s) => s.status === 'NORMAL').length)
const overTempStores = computed(() =>
  coldStores.value.filter((s) => s.status === 'WARNING' || s.status === 'ERROR').length
)
const avgTempRate = computed(() => {
  if (coldStores.value.length === 0) return 0
  const normal = coldStores.value.filter((s) => s.status === 'NORMAL' || s.status === 'WARNING').length
  return Math.round((normal / coldStores.value.length) * 1000) / 10
})

function formatRunningHours(hours: number): string {
  const days = Math.floor(hours / 24)
  const h = hours % 24
  return days > 0 ? `${days}天${h}小时` : `${h}小时`
}

function getTempClass(store: ColdStore): string {
  if (store.status === 'OFFLINE') return 'text-text-tertiary'
  if (store.currentTemp > store.targetTempMax || store.currentTemp < store.targetTempMin)
    return 'text-danger-400 font-bold'
  return 'text-success-400 font-bold'
}

function getStatusBadge(status: string): string {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    NORMAL: { bg: 'bg-success-500/15 border-success-500/30', text: 'text-success-400', label: '正常' },
    WARNING: { bg: 'bg-warning-500/15 border-warning-500/30', text: 'text-warning-400', label: '预警' },
    ERROR: { bg: 'bg-danger-500/15 border-danger-500/30', text: 'text-danger-400', label: '故障' },
    OFFLINE: { bg: 'bg-text-tertiary/15 border-text-tertiary/30', text: 'text-text-tertiary', label: '离线' },
  }
  return map[status]?.label || status
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    NORMAL: 'bg-success-500/15 border-success-500/30 text-success-400',
    WARNING: 'bg-warning-500/15 border-warning-500/30 text-warning-400',
    ERROR: 'bg-danger-500/15 border-danger-500/30 text-danger-400',
    OFFLINE: 'bg-text-tertiary/15 border-text-tertiary/30 text-text-tertiary',
  }
  return map[status] || ''
}

function getVehicleStatusBadge(status: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    TRANSIT: { label: '运输中', cls: 'bg-primary-500/15 border-primary-500/30 text-primary-400' },
    ARRIVED: { label: '已到达', cls: 'bg-success-500/15 border-success-500/30 text-success-400' },
    DELAYED: { label: '已延误', cls: 'bg-warning-500/15 border-warning-500/30 text-warning-400' },
  }
  return map[status] || { label: status, cls: '' }
}

function getStatusDotClass(status: string): string {
  const map: Record<string, string> = {
    NORMAL: 'bg-success-400',
    WARNING: 'bg-warning-400',
    ERROR: 'bg-danger-400',
    OFFLINE: 'bg-text-tertiary',
  }
  return map[status] || 'bg-text-tertiary'
}

const storeColumns: DataTableColumn<ColdStore>[] = [
  {
    key: 'select',
    title: '',
    width: 50,
    align: 'center',
    render: (row) => {
      const checked = selectedStoreIds.value.includes(row.id)
      return h('div', {
        innerHTML: `<input type="checkbox" ${checked ? 'checked' : ''} class="w-4 h-4 accent-primary-500 cursor-pointer" />`,
      })
    },
  },
  { key: 'name', title: '冷库名称', width: 200 },
  { key: 'province', title: '省/市', width: 140 },
  { key: 'currentTemp', title: '当前温度', width: 110, align: 'center' },
  { key: 'threshold', title: '温度阈值', width: 110, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'runningHours', title: '连续运行', width: 110, align: 'center' },
  { key: 'actions', title: '操作', width: 180, align: 'center', fixed: 'right' },
]

const vehicleColumns: DataTableColumn<TransportVehicle>[] = [
  { key: 'plateNo', title: '车牌号', width: 120 },
  { key: 'driver', title: '司机', width: 100 },
  { key: 'route', title: '起点 → 终点', width: 220 },
  { key: 'currentTemp', title: '当前温度', width: 100, align: 'center' },
  { key: 'vaccineBatch', title: '疫苗批次', width: 180 },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'actions', title: '操作', width: 120, align: 'center', fixed: 'right' },
]

const pagedStores = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return coldStores.value.slice(start, start + pageSize.value)
})

const pagedVehicles = computed(() => {
  const start = (vehiclePage.value - 1) * vehiclePageSize.value
  return vehicles.value.slice(start, start + vehiclePageSize.value)
})

function toggleStoreSelection(id: string) {
  const idx = selectedStoreIds.value.indexOf(id)
  if (idx >= 0) selectedStoreIds.value.splice(idx, 1)
  else selectedStoreIds.value.push(id)
}

function toggleChartStore(id: string) {
  const idx = selectedChartStoreIds.value.indexOf(id)
  if (idx >= 0) {
    if (selectedChartStoreIds.value.length > 1) {
      selectedChartStoreIds.value.splice(idx, 1)
    }
  } else {
    if (selectedChartStoreIds.value.length < 6) {
      selectedChartStoreIds.value.push(id)
    }
  }
  loadData()
}

function viewTempCurve(store: ColdStore) {
  tempModalStore.value = store
  tempModalRecords.value = mockGetTempRecords([store.id], 7)
  tempModalVisible.value = true
}

function handleStore(store: ColdStore) {
  handleModalStore.value = store
  handleModalVisible.value = true
}

function viewTrack(vehicle: TransportVehicle) {
  trackModalVehicle.value = vehicle
  trackModalVisible.value = true
}

const chartXData = computed(() => {
  const uniqueTimes = Array.from(new Set(tempRecords.value.map((r) => r.time.slice(5, 16))))
  return uniqueTimes
})

const chartSeries = computed(() => {
  const storeMap = new Map<string, { name: string; data: (number | null)[]; color: string }>()
  const colors = ['#1890FF', '#52C41A', '#FAAD14', '#F5222D', '#722ED1', '#13C2C2']

  selectedChartStoreIds.value.forEach((id, idx) => {
    const store = coldStores.value.find((s) => s.id === id)
    if (store) {
      storeMap.set(id, {
        name: store.name,
        data: [],
        color: colors[idx % colors.length],
      })
    }
  })

  const timeMap = new Map<string, number>()
  chartXData.value.forEach((t, i) => timeMap.set(t, i))

  storeMap.forEach((info) => {
    info.data = new Array(chartXData.value.length).fill(null)
  })

  tempRecords.value.forEach((r) => {
    const tKey = r.time.slice(5, 16)
    const idx = timeMap.get(tKey)
    const info = storeMap.get(r.coldStoreId)
    if (idx !== undefined && info) {
      info.data[idx] = r.temp
    }
  })

  return Array.from(storeMap.values()).map((s) => ({
    name: s.name,
    data: s.data,
    color: s.color,
    smooth: true,
    area: false,
  }))
})

const chartThreshold = computed(() => {
  const stores = selectedChartStoreIds.value
    .map((id) => coldStores.value.find((s) => s.id === id))
    .filter(Boolean) as ColdStore[]
  if (stores.length === 0) return { min: 2, max: 8 }
  return {
    min: Math.min(...stores.map((s) => s.targetTempMin)),
    max: Math.max(...stores.map((s) => s.targetTempMax)),
  }
})

const overviewStores = computed(() => {
  return selectedChartStoreIds.value
    .map((id) => coldStores.value.find((s) => s.id === id))
    .filter(Boolean)
    .slice(0, 4) as ColdStore[]
})

function get24hStats(storeId: string) {
  const now = new Date()
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const records = tempRecords.value.filter(
    (r) => r.coldStoreId === storeId && new Date(r.time) >= cutoff
  )
  if (records.length === 0) return { high: '-', low: '-' }
  const temps = records.map((r) => r.temp)
  return { high: Math.max(...temps).toFixed(1), low: Math.min(...temps).toFixed(1) }
}

const modalChartXData = computed(() => {
  return Array.from(new Set(tempModalRecords.value.map((r) => r.time.slice(5, 16))))
})

const modalChartSeries = computed(() => {
  const data: (number | null)[] = new Array(modalChartXData.value.length).fill(null)
  const timeMap = new Map<string, number>()
  modalChartXData.value.forEach((t, i) => timeMap.set(t, i))
  tempModalRecords.value.forEach((r) => {
    const tKey = r.time.slice(5, 16)
    const idx = timeMap.get(tKey)
    if (idx !== undefined) data[idx] = r.temp
  })
  return [
    {
      name: tempModalStore.value?.name || '温度',
      data,
      color: '#1890FF',
      smooth: true,
      area: true,
    },
  ]
})

const abnormalTimestamps = computed(() => {
  return tempModalRecords.value
    .filter((r) => r.isAbnormal)
    .map((r) => r.time.slice(5, 16))
})

function closeAllDropdowns(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.dropdown-trigger')) {
    provinceDropdownOpen.value = false
    cityDropdownOpen.value = false
    statusDropdownOpen.value = false
  }
}

onMounted(() => {
  loadData()
  document.addEventListener('click', closeAllDropdowns)
})
</script>

<template>
  <AppLayout>
    <div class="h-full flex flex-col gap-4 tech-grid">
      <div class="panel p-4 animate-fade-in-up shrink-0">
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative dropdown-trigger">
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all"
              @click.stop="provinceDropdownOpen = !provinceDropdownOpen"
            >
              <MapPin class="w-4 h-4 text-primary-400" />
              <span class="text-text-primary">{{ selectedProvinceName }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-text-tertiary" :class="provinceDropdownOpen ? 'rotate-180' : ''" />
            </button>
            <Transition name="dropdown">
              <div
                v-if="provinceDropdownOpen"
                class="absolute top-full left-0 mt-2 w-64 rounded-xl bg-bg-secondary border border-default shadow-glow-blue z-50 overflow-hidden"
              >
                <div class="p-2 border-b border-default">
                  <div class="relative">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
                    <input
                      v-model="provinceSearch"
                      type="text"
                      placeholder="搜索省份..."
                      class="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-bg-primary/50 border border-default text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-500/50"
                    />
                  </div>
                </div>
                <div class="max-h-64 overflow-y-auto py-1">
                  <button
                    v-for="p in filteredProvinces"
                    :key="p.code"
                    class="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-500/10"
                    :class="selectedProvince === p.code ? 'bg-primary-500/15 text-primary-400' : 'text-text-secondary hover:text-text-primary'"
                    @click="toggleProvince(p.code)"
                  >
                    {{ p.name }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <div class="relative dropdown-trigger">
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all disabled:opacity-40"
              :disabled="!selectedProvince"
              @click.stop="cityDropdownOpen = !cityDropdownOpen"
            >
              <MapPin class="w-4 h-4 text-primary-400" />
              <span class="text-text-primary">{{ selectedCityName }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-text-tertiary" :class="cityDropdownOpen ? 'rotate-180' : ''" />
            </button>
            <Transition name="dropdown">
              <div
                v-if="cityDropdownOpen && selectedProvince"
                class="absolute top-full left-0 mt-2 w-64 rounded-xl bg-bg-secondary border border-default shadow-glow-blue z-50 overflow-hidden"
              >
                <div class="p-2 border-b border-default">
                  <div class="relative">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
                    <input
                      v-model="citySearch"
                      type="text"
                      placeholder="搜索城市..."
                      class="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-bg-primary/50 border border-default text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-500/50"
                    />
                  </div>
                </div>
                <div class="max-h-64 overflow-y-auto py-1">
                  <button
                    v-for="c in filteredCities"
                    :key="c.code"
                    class="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-500/10"
                    :class="selectedCity === c.code ? 'bg-primary-500/15 text-primary-400' : 'text-text-secondary hover:text-text-primary'"
                    @click="toggleCity(c.code)"
                  >
                    {{ c.name }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <div class="relative dropdown-trigger">
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all"
              @click.stop="statusDropdownOpen = !statusDropdownOpen"
            >
              <AlertTriangle class="w-4 h-4 text-warning-400" />
              <span class="text-text-primary">{{ selectedStatusName }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-text-tertiary" :class="statusDropdownOpen ? 'rotate-180' : ''" />
            </button>
            <Transition name="dropdown">
              <div
                v-if="statusDropdownOpen"
                class="absolute top-full left-0 mt-2 w-40 rounded-xl bg-bg-secondary border border-default shadow-glow-blue z-50 overflow-hidden py-1"
              >
                <button
                  v-for="s in statusOptions"
                  :key="s.code"
                  class="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-500/10"
                  :class="selectedStatus === s.code ? 'bg-primary-500/15 text-primary-400' : 'text-text-secondary hover:text-text-primary'"
                  @click="toggleStatus(s.code)"
                >
                  {{ s.name }}
                </button>
              </div>
            </Transition>
          </div>

          <div class="relative flex-1 max-w-md min-w-[200px]">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              v-model="keyword"
              type="text"
              placeholder="搜索冷库名称/地址/设备型号..."
              class="w-full pl-10 pr-4 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-500/50 transition-all"
              @keyup.enter="loadData"
            />
          </div>

          <div class="flex items-center gap-1 p-1 rounded-lg border border-default bg-bg-secondary/30">
            <button
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="timeRangeKey === '7d' ? 'bg-primary-500/20 text-primary-400' : 'text-text-secondary hover:text-text-primary'"
              @click="setTimeRange('7d')"
            >
              近7天
            </button>
            <button
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="timeRangeKey === '30d' ? 'bg-primary-500/20 text-primary-400' : 'text-text-secondary hover:text-text-primary'"
              @click="setTimeRange('30d')"
            >
              近30天
            </button>
            <button
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1"
              :class="timeRangeKey === 'custom' ? 'bg-primary-500/20 text-primary-400' : 'text-text-secondary hover:text-text-primary'"
              @click="setTimeRange('custom')"
            >
              <Calendar class="w-3 h-3" />
              自定义
            </button>
          </div>

          <div class="flex-1" />

          <button
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300 transition-all group"
            @click="refreshData"
          >
            <RefreshCw class="w-4 h-4 text-text-secondary group-hover:text-primary-400 group-hover:animate-spin" />
            <span class="text-text-secondary group-hover:text-text-primary">刷新</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up shrink-0">
        <KpiCard
          label="冷库总数（正常）"
          :value="normalStores"
          unit="座"
          :trend="5.2"
          :healthy="true"
          icon="Snowflake"
          theme="primary"
        />
        <KpiCard
          label="当前超温数"
          :value="overTempStores"
          unit="座"
          :trend="-8.3"
          :healthy="overTempStores === 0"
          icon="AlertTriangle"
          theme="warning"
        />
        <KpiCard
          label="平均温度合格率"
          :value="avgTempRate"
          unit="%"
          :trend="2.1"
          :healthy="avgTempRate >= 90"
          icon="CheckCircle2"
          theme="success"
        />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-5 gap-4 flex-1 min-h-0 animate-fade-in-up">
        <div class="xl:col-span-3 panel p-4 flex flex-col min-h-0">
          <div class="flex items-center justify-between mb-4 shrink-0">
            <div class="flex items-center gap-1 p-1 rounded-xl bg-bg-secondary/40 border border-default">
              <button
                class="px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                :class="activeTab === 'stores' ? 'bg-primary-500/20 text-primary-400 shadow-glow-blue-sm' : 'text-text-secondary hover:text-text-primary'"
                @click="activeTab = 'stores'"
              >
                <Thermometer class="w-4 h-4" />
                冷库列表
                <span
                  class="px-1.5 py-0.5 rounded text-xs"
                  :class="activeTab === 'stores' ? 'bg-primary-500/30' : 'bg-bg-tertiary/50 text-text-tertiary'"
                >{{ totalStores }}</span>
              </button>
              <button
                class="px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                :class="activeTab === 'vehicles' ? 'bg-primary-500/20 text-primary-400 shadow-glow-blue-sm' : 'text-text-secondary hover:text-text-primary'"
                @click="activeTab = 'vehicles'"
              >
                <MapIcon class="w-4 h-4" />
                运输车辆
                <span
                  class="px-1.5 py-0.5 rounded text-xs"
                  :class="activeTab === 'vehicles' ? 'bg-primary-500/30' : 'bg-bg-tertiary/50 text-text-tertiary'"
                >{{ vehicles.length }}</span>
              </button>
            </div>
          </div>

          <div v-if="activeTab === 'stores'" class="flex-1 min-h-0">
            <DataTable
              :columns="storeColumns"
              :data="pagedStores"
              :total="coldStores.length"
              v-model:page="page"
              v-model:page-size="pageSize"
              bordered
            >
              <template #cell-select="{ row }">
                <input
                  type="checkbox"
                  :checked="selectedStoreIds.includes(row.id)"
                  class="w-4 h-4 accent-primary-500 cursor-pointer"
                  @change="toggleStoreSelection(row.id)"
                />
              </template>
              <template #cell-name="{ row }">
                <div class="flex items-center gap-2">
                  <div
                    class="w-2 h-2 rounded-full"
                    :class="getStatusDotClass(row.status)"
                  />
                  <span class="text-primary-400 hover:text-primary-300 cursor-pointer font-medium">
                    {{ row.name }}
                  </span>
                </div>
              </template>
              <template #cell-province="{ row }">
                <span class="text-text-secondary">{{ row.province }} / {{ row.city }}</span>
              </template>
              <template #cell-currentTemp="{ row }">
                <span :class="getTempClass(row)">
                  {{ row.status === 'OFFLINE' ? '--' : row.currentTemp.toFixed(1) + '℃' }}
                </span>
              </template>
              <template #cell-threshold="{ row }">
                <span class="text-text-secondary font-mono text-xs">
                  {{ row.targetTempMin }} ~ {{ row.targetTempMax }}℃
                </span>
              </template>
              <template #cell-status="{ row }">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                  :class="getStatusBadgeClass(row.status)"
                >
                  {{ getStatusBadge(row.status) }}
                </span>
              </template>
              <template #cell-runningHours="{ row }">
                <span class="text-text-secondary text-xs flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  {{ formatRunningHours(row.runningHours) }}
                </span>
              </template>
              <template #cell-actions="{ row }">
                <div class="flex items-center justify-center gap-2">
                  <button
                    class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-primary-500/30 text-primary-400 hover:bg-primary-500/10 transition-all"
                    @click="viewTempCurve(row)"
                  >
                    <Eye class="w-3 h-3" />
                    温度曲线
                  </button>
                  <button
                    v-if="row.status === 'ERROR' || row.status === 'WARNING'"
                    class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-warning-500/30 text-warning-400 hover:bg-warning-500/10 transition-all"
                    @click="handleStore(row)"
                  >
                    <Wrench class="w-3 h-3" />
                    处置
                  </button>
                </div>
              </template>
            </DataTable>
          </div>

          <div v-else class="flex-1 min-h-0">
            <DataTable
              :columns="vehicleColumns"
              :data="pagedVehicles"
              :total="vehicles.length"
              v-model:page="vehiclePage"
              v-model:page-size="vehiclePageSize"
              bordered
            >
              <template #cell-plateNo="{ row }">
                <span class="font-mono font-bold text-primary-400">{{ row.plateNo }}</span>
              </template>
              <template #cell-driver="{ row }">
                <div class="flex flex-col">
                  <span class="text-text-primary">{{ row.driver }}</span>
                  <span class="text-xs text-text-tertiary">{{ row.driverPhone }}</span>
                </div>
              </template>
              <template #cell-route="{ row }">
                <div class="flex items-center gap-2 text-xs">
                  <span class="text-text-secondary">{{ row.origin }}</span>
                  <ArrowRight class="w-3 h-3 text-primary-400 shrink-0" />
                  <span class="text-text-primary">{{ row.destination }}</span>
                </div>
              </template>
              <template #cell-currentTemp="{ row }">
                <span
                  class="font-bold"
                  :class="
                    row.currentTemp > row.targetTempMax || row.currentTemp < row.targetTempMin
                      ? 'text-danger-400'
                      : 'text-success-400'
                  "
                >
                  {{ row.currentTemp.toFixed(1) }}℃
                </span>
              </template>
              <template #cell-vaccineBatch="{ row }">
                <div class="flex flex-col">
                  <span class="font-mono text-xs text-text-primary">{{ row.vaccineBatch }}</span>
                  <span class="text-xs text-text-tertiary">{{ row.vaccineName }}</span>
                </div>
              </template>
              <template #cell-status="{ row }">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                  :class="getVehicleStatusBadge(row.status).cls"
                >
                  {{ getVehicleStatusBadge(row.status).label }}
                </span>
              </template>
              <template #cell-actions="{ row }">
                <button
                  class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-primary-500/30 text-primary-400 hover:bg-primary-500/10 transition-all"
                  @click="viewTrack(row)"
                >
                  <MapIcon class="w-3 h-3" />
                  轨迹查看
                </button>
              </template>
            </DataTable>
          </div>
        </div>

        <div class="xl:col-span-2 panel p-4 flex flex-col min-h-0">
          <div class="flex items-center justify-between mb-4 shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-1 h-5 rounded-full bg-gradient-to-b from-primary-400 to-primary-600" />
              <h3 class="text-base font-semibold text-text-primary">温度实时监测曲线</h3>
            </div>
          </div>

          <div class="mb-4 shrink-0">
            <div class="flex flex-wrap gap-2 items-center">
              <div
                v-for="store in coldStores.slice(0, 8)"
                :key="store.id"
                class="group relative"
              >
                <button
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all"
                  :class="
                    selectedChartStoreIds.includes(store.id)
                      ? 'border-primary-500/50 bg-primary-500/15 text-primary-400'
                      : 'border-default bg-bg-secondary/30 text-text-secondary hover:text-text-primary hover:border-primary-500/30'
                  "
                  @click="toggleChartStore(store.id)"
                >
                  <div
                    class="w-1.5 h-1.5 rounded-full"
                    :class="getStatusDotClass(store.status)"
                  />
                  <span class="max-w-[100px] truncate">{{ store.name.replace(/疾控中心.*冷库/, '') }}</span>
                  <X
                    v-if="selectedChartStoreIds.includes(store.id)"
                    class="w-3 h-3 hover:text-danger-400 transition-colors"
                  />
                </button>
              </div>
              <div class="relative">
                <button
                  v-if="coldStores.length > 8"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-dashed border-default text-text-tertiary hover:text-primary-400 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all"
                >
                  <Plus class="w-3 h-3" />
                  更多
                </button>
              </div>
            </div>
          </div>

          <div class="flex-1 min-h-0 mb-4 rounded-xl border border-default/60 bg-bg-secondary/20 p-2 overflow-hidden">
            <LineChart
              v-if="chartSeries.length > 0 && chartXData.length > 0"
              :x-data="chartXData"
              :series="chartSeries"
              :threshold="chartThreshold"
              y-unit="℃"
              :height="260"
            />
            <div v-else class="h-full flex items-center justify-center">
              <EmptyState text="请选择冷库查看温度曲线" size="sm" />
            </div>
          </div>

          <div class="shrink-0">
            <div class="text-xs text-text-secondary mb-3 flex items-center gap-2">
              <div class="w-0.5 h-3 rounded-full bg-primary-500" />
              状态速览
            </div>
            <div v-if="overviewStores.length > 0" class="grid grid-cols-2 gap-3">
              <div
                v-for="store in overviewStores"
                :key="store.id"
                class="p-3 rounded-xl border transition-all hover:border-primary-500/40 cursor-pointer group"
                :style="{
                  background: 'linear-gradient(135deg, rgba(24,144,255,0.06) 0%, rgba(24,144,255,0.02) 100%)',
                  borderColor: 'rgba(24,144,255,0.18)',
                }"
                @click="viewTempCurve(store)"
              >
                <div class="flex items-start justify-between mb-2">
                  <span
                    class="text-xs font-medium text-text-primary line-clamp-1 pr-2"
                    :title="store.name"
                  >{{ store.name }}</span>
                  <div
                    class="w-2 h-2 rounded-full shrink-0 mt-1"
                    :class="getStatusDotClass(store.status)"
                  />
                </div>
                <div class="flex items-baseline gap-1 mb-2">
                  <span
                    class="font-rajdhani font-bold text-2xl"
                    :class="getTempClass(store)"
                  >
                    {{ store.status === 'OFFLINE' ? '--' : store.currentTemp.toFixed(1) }}
                  </span>
                  <span class="text-xs text-text-tertiary">℃</span>
                </div>
                <div class="flex items-center justify-between text-[10px] text-text-tertiary">
                  <span>24h高: <span class="text-danger-400 font-medium">{{ get24hStats(store.id).high }}</span></span>
                  <span>低: <span class="text-primary-400 font-medium">{{ get24hStats(store.id).low }}</span></span>
                </div>
              </div>
            </div>
            <div v-else class="h-24 flex items-center justify-center">
              <EmptyState text="暂无数据" size="sm" />
            </div>
          </div>
        </div>
      </div>

      <Modal
        v-model:visible="tempModalVisible"
        :title="tempModalStore ? `温度曲线详情 - ${tempModalStore.name}` : '温度曲线详情'"
        width="900px"
        :footer="false"
      >
        <div v-if="tempModalStore" class="space-y-4">
          <div class="grid grid-cols-4 gap-4">
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">温度范围</div>
              <div class="font-rajdhani font-bold text-lg text-text-primary">
                {{ tempModalStore.targetTempMin }} ~ {{ tempModalStore.targetTempMax }}℃
              </div>
            </div>
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">当前温度</div>
              <div class="font-rajdhani font-bold text-lg" :class="getTempClass(tempModalStore)">
                {{ tempModalStore.status === 'OFFLINE' ? '--' : tempModalStore.currentTemp.toFixed(1) + '℃' }}
              </div>
            </div>
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">超标次数</div>
              <div class="font-rajdhani font-bold text-lg text-danger-400">
                {{ abnormalTimestamps.length }}
              </div>
            </div>
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">运行状态</div>
              <div>
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                  :class="getStatusBadgeClass(tempModalStore.status)"
                >
                  {{ getStatusBadge(tempModalStore.status) }}
                </span>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-xl border border-default/60 bg-bg-secondary/20">
            <LineChart
              v-if="modalChartSeries.length > 0 && modalChartXData.length > 0"
              :x-data="modalChartXData"
              :series="modalChartSeries"
              :threshold="{ min: tempModalStore.targetTempMin, max: tempModalStore.targetTempMax }"
              y-unit="℃"
              :height="320"
            />
          </div>

          <div v-if="abnormalTimestamps.length > 0" class="space-y-2">
            <div class="text-xs text-text-secondary flex items-center gap-2">
              <AlertTriangle class="w-3.5 h-3.5 text-danger-400" />
              超标时间戳标记 (共 {{ abnormalTimestamps.length }} 处)
            </div>
            <div class="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 rounded-lg bg-bg-secondary/30 border border-default/50">
              <span
                v-for="(ts, i) in abnormalTimestamps.slice(0, 20)"
                :key="i"
                class="inline-flex items-center px-2 py-1 rounded text-xs bg-danger-500/10 text-danger-400 border border-danger-500/20 font-mono"
              >
                <Clock class="w-3 h-3 mr-1" />
                {{ ts }}
              </span>
              <span
                v-if="abnormalTimestamps.length > 20"
                class="inline-flex items-center px-2 py-1 rounded text-xs text-text-tertiary"
              >
                等 {{ abnormalTimestamps.length }} 处
              </span>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        v-model:visible="trackModalVisible"
        :title="trackModalVehicle ? `运输轨迹 - ${trackModalVehicle.plateNo}` : '运输轨迹'"
        width="720px"
        :footer="false"
      >
        <div v-if="trackModalVehicle" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">司机信息</div>
              <div class="text-sm text-text-primary">
                {{ trackModalVehicle.driver }}
                <span class="text-text-tertiary ml-2">{{ trackModalVehicle.driverPhone }}</span>
              </div>
            </div>
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">运输疫苗</div>
              <div class="text-sm text-text-primary">
                {{ trackModalVehicle.vaccineName }}
                <span class="font-mono text-text-tertiary ml-2 text-xs">{{ trackModalVehicle.vaccineBatch }}</span>
              </div>
            </div>
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">发车时间</div>
              <div class="text-sm font-mono text-text-primary">{{ trackModalVehicle.departTime }}</div>
            </div>
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">预计到达</div>
              <div class="text-sm font-mono text-text-primary">{{ trackModalVehicle.estimatedArrival }}</div>
            </div>
          </div>

          <div class="p-6 rounded-xl border border-default/60 bg-bg-secondary/10 relative">
            <div class="text-xs text-text-secondary mb-4 flex items-center gap-2">
              <MapIcon class="w-3.5 h-3.5 text-primary-400" />
              运输路线模拟图
            </div>
            <div class="relative py-8 px-4">
              <div class="absolute inset-0 opacity-20 pointer-events-none"
                style="background-image: linear-gradient(rgba(24,144,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(24,144,255,0.1) 1px, transparent 1px); background-size: 24px 24px;"
              />
              <div class="relative flex items-center justify-between">
                <template v-for="(point, idx) in trackModalVehicle.track" :key="idx">
                  <div class="relative flex flex-col items-center z-10">
                    <div
                      class="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                      :class="[
                        idx === 0
                          ? 'bg-success-500/20 border-2 border-success-500/50 shadow-[0_0_20px_rgba(82,196,26,0.3)]'
                          : idx === trackModalVehicle.track.length - 1
                          ? 'bg-primary-500/20 border-2 border-primary-500/50 shadow-[0_0_20px_rgba(24,144,255,0.3)]'
                          : 'bg-bg-secondary/60 border border-default'
                      ]"
                    >
                      <MapPin
                        v-if="idx === 0"
                        class="w-5 h-5 text-success-400"
                      />
                      <MapPin
                        v-else-if="idx === trackModalVehicle.track.length - 1"
                        class="w-5 h-5 text-primary-400"
                      />
                      <div v-else class="w-2.5 h-2.5 rounded-full bg-primary-400/60" />
                    </div>
                    <div class="mt-2 text-center">
                      <div class="text-[10px] text-text-tertiary whitespace-nowrap">
                        {{ point.time.split(' ')[1] }}
                      </div>
                      <div class="text-[9px] font-mono text-text-tertiary/70">
                        {{ point.lng }}, {{ point.lat }}
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="idx < trackModalVehicle.track.length - 1"
                    class="flex-1 mx-1 relative h-0.5"
                  >
                    <div class="absolute inset-0 bg-gradient-to-r from-primary-500/40 via-primary-500/30 to-primary-500/40 rounded-full" />
                    <div
                      class="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 border-t-2 border-r-2 border-primary-400 rotate-45"
                    />
                  </div>
                </template>
              </div>

              <div class="flex justify-between mt-6 pt-4 border-t border-default/50">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-success-400 shadow-[0_0_8px_rgba(82,196,26,0.6)]" />
                  <div>
                    <div class="text-xs text-success-400 font-medium">起点</div>
                    <div class="text-xs text-text-secondary">{{ trackModalVehicle.origin }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div>
                    <div class="text-xs text-primary-400 font-medium text-right">终点</div>
                    <div class="text-xs text-text-secondary text-right">{{ trackModalVehicle.destination }}</div>
                  </div>
                  <div class="w-3 h-3 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(24,144,255,0.6)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        v-model:visible="handleModalVisible"
        :title="handleModalStore ? `故障处置 - ${handleModalStore.name}` : '故障处置'"
        width="520px"
      >
        <div v-if="handleModalStore" class="space-y-4">
          <div class="p-4 rounded-xl bg-warning-500/10 border border-warning-500/20">
            <div class="flex items-start gap-3">
              <AlertTriangle class="w-5 h-5 text-warning-400 shrink-0 mt-0.5" />
              <div>
                <div class="text-sm font-medium text-warning-400 mb-1">处置提醒</div>
                <div class="text-xs text-text-secondary leading-relaxed">
                  冷库 <span class="text-warning-400 font-medium">{{ handleModalStore.name }}</span>
                  当前状态：<span
                    class="inline-flex px-2 py-0.5 rounded text-xs border"
                    :class="getStatusBadgeClass(handleModalStore.status)"
                  >{{ getStatusBadge(handleModalStore.status) }}</span>
                  ，温度异常，请及时处置。
                </div>
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-text-secondary mb-1.5">处置方式</label>
              <select class="w-full px-3 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 text-text-primary focus:outline-none focus:border-primary-500/50">
                <option>现场检修</option>
                <option>远程重启设备</option>
                <option>转移疫苗至备用冷库</option>
                <option>联系厂家售后</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1.5">处置备注</label>
              <textarea
                rows="3"
                placeholder="请输入处置备注..."
                class="w-full px-3 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-500/50 resize-none"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  </AppLayout>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
