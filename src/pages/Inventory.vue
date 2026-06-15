<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import KpiCard from '@/components/KpiCard.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Search,
  RefreshCw,
  ChevronDown,
  MapPin,
  Copy,
  Check,
  FileText,
  ArrowLeftRight,
  Clock,
  Calendar,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  Settings2,
  Trash2,
  AlertCircle,
  Plus,
  X,
} from 'lucide-vue-next'
import { PROVINCES, VACCINE_TYPES, getVisibleProvinceCodes, filterByProvince, getVisibleCityCodes, filterByCity } from '@/mock'
import {
  mockGetAllVaccineBatches,
  mockGetInventorySummary,
  mockGetStockLogs,
  type VaccineBatch,
  type StockLog,
} from '@/mock'
import { useUserStore } from '@/stores/user'
import { ref, computed, onMounted, h } from 'vue'

const userStore = useUserStore()
const visibleProvinceCodes = computed(() => getVisibleProvinceCodes(userStore.userInfo))
const visibleCityCodes = computed(() => getVisibleCityCodes(userStore.userInfo))

const provinceDropdownOpen = ref(false)
const vaccineTypeDropdownOpen = ref(false)
const provinceSearch = ref('')
const selectedProvince = ref('')
const selectedVaccineTypes = ref<string[]>([])
const lowStockOnly = ref(false)
const keyword = ref('')

const batches = ref<VaccineBatch[]>([])
const stockLogs = ref<StockLog[]>([])
const summary = ref<any>(null)
const page = ref(1)
const pageSize = ref(10)
const activeTab = ref<'batches' | 'logs'>('batches')

const logModalVisible = ref(false)
const logModalBatch = ref<VaccineBatch | null>(null)
const logModalLogs = ref<StockLog[]>([])

const transferModalVisible = ref(false)
const transferModalBatch = ref<VaccineBatch | null>(null)

const copiedBatchNo = ref('')

const selectedProvinceName = computed(() => {
  if (!selectedProvince.value) return '全国'
  const p = PROVINCES.find((x) => x.code === selectedProvince.value)
  return p ? p.name : '全国'
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

const vaccineTypeOptions = computed(() => VACCINE_TYPES)

const selectedVaccineTypeNames = computed(() => {
  if (selectedVaccineTypes.value.length === 0) return '全部疫苗'
  if (selectedVaccineTypes.value.length <= 3) {
    return selectedVaccineTypes.value
      .map((c) => VACCINE_TYPES.find((v) => v.code === c)?.name || c)
      .join('、')
  }
  return `已选 ${selectedVaccineTypes.value.length} 种`
})

function toggleProvince(code: string) {
  selectedProvince.value = code
  provinceDropdownOpen.value = false
  provinceSearch.value = ''
  loadData()
}

function toggleVaccineType(code: string) {
  const idx = selectedVaccineTypes.value.indexOf(code)
  if (idx >= 0) selectedVaccineTypes.value.splice(idx, 1)
  else selectedVaccineTypes.value.push(code)
  loadData()
}

function clearVaccineTypes() {
  selectedVaccineTypes.value = []
  loadData()
}

function toggleLowStockOnly() {
  lowStockOnly.value = !lowStockOnly.value
  loadData()
}

function loadData() {
  let all = mockGetAllVaccineBatches()
  const provCodes = visibleProvinceCodes.value
  const cityCodes = visibleCityCodes.value
  all = filterByProvince(all, provCodes)
  all = filterByCity(all, cityCodes)

  if (selectedProvince.value) {
    all = all.filter((b) => b.provinceCode === selectedProvince.value)
  }
  if (selectedVaccineTypes.value.length > 0) {
    all = all.filter((b) => selectedVaccineTypes.value.includes(b.vaccineCode))
  }
  if (lowStockOnly.value) {
    all = all.filter((b) => b.isLowStock || b.quantity < b.threeDayUsage)
  }
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    all = all.filter(
      (b) =>
        b.vaccineName.toLowerCase().includes(kw) ||
        b.batchNo.toLowerCase().includes(kw) ||
        b.manufacturer.toLowerCase().includes(kw)
    )
  }
  batches.value = all
  summary.value = mockGetInventorySummary()
  let logs = mockGetStockLogs(150)
  logs = filterByProvince(logs, provCodes)
  logs = filterByCity(logs, cityCodes)
  stockLogs.value = logs
}

function refreshData() {
  loadData()
}

const totalQuantity = computed(() => summary.value?.totalQuantity || 0)
const totalBatches = computed(() => summary.value?.totalBatches || 0)
const lowStockCount = computed(() => summary.value?.lowStockCount || 0)
const nearExpireCount = computed(() => summary.value?.nearExpireCount || 0)

const vaccineTypeLabelMap: Record<string, { label: string; cls: string }> = {
  LIVE: { label: 'LIVE 减毒活', cls: 'bg-green-500/15 border-green-500/30 text-green-400' },
  INACTIVATED: { label: 'INACT 灭活', cls: 'bg-blue-500/15 border-blue-500/30 text-blue-400' },
  mRNA: { label: 'mRNA', cls: 'bg-purple-500/15 border-purple-500/30 text-purple-400' },
  OTHER: { label: 'OTHER 其他', cls: 'bg-gray-500/15 border-gray-500/30 text-gray-400' },
}

function daysUntilExpire(expireDate: string): number {
  const now = new Date()
  const expire = new Date(expireDate)
  return Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getExpireClass(expireDate: string): string {
  const days = daysUntilExpire(expireDate)
  if (days < 30) return 'text-danger-400 font-bold animate-pulse'
  if (days < 90) return 'text-warning-400 font-bold'
  return 'text-text-secondary'
}

function getTurnoverBadgeClass(days: number): string {
  if (days < 3) return 'bg-danger-500/15 border-danger-500/30 text-danger-400'
  if (days < 7) return 'bg-warning-500/15 border-warning-500/30 text-warning-400'
  return 'bg-success-500/15 border-success-500/30 text-success-400'
}

function getStockStatusBadge(batch: VaccineBatch): { label: string; cls: string } {
  if (batch.quantity < batch.threeDayUsage) {
    return { label: '短缺', cls: 'bg-danger-500/15 border-danger-500/30 text-danger-400' }
  }
  if (batch.turnoverDays < 7) {
    return { label: '紧张', cls: 'bg-warning-500/15 border-warning-500/30 text-warning-400' }
  }
  return { label: '充足', cls: 'bg-success-500/15 border-success-500/30 text-success-400' }
}

function isLowStockRow(batch: VaccineBatch): boolean {
  return batch.quantity < batch.threeDayUsage
}

function copyBatchNo(no: string) {
  navigator.clipboard?.writeText(no)
  copiedBatchNo.value = no
  setTimeout(() => {
    if (copiedBatchNo.value === no) copiedBatchNo.value = ''
  }, 2000)
}

const batchColumns: DataTableColumn<VaccineBatch>[] = [
  { key: 'vaccineName', title: '疫苗名称', width: 180 },
  { key: 'batchNo', title: '批次号', width: 180 },
  { key: 'location', title: '省/市', width: 140 },
  { key: 'quantity', title: '当前库存(剂)', width: 130, align: 'right' },
  { key: 'dailyUsage', title: '近7日日均', width: 110, align: 'right' },
  { key: 'turnoverDays', title: '周转天数', width: 110, align: 'center' },
  { key: 'threeDayUsage', title: '3日用量', width: 110, align: 'right' },
  { key: 'expireDate', title: '有效期', width: 130, align: 'center' },
  { key: 'status', title: '状态', width: 90, align: 'center' },
  { key: 'actions', title: '操作', width: 180, align: 'center', fixed: 'right' },
]

const pagedBatches = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return batches.value.slice(start, start + pageSize.value)
})

function viewStockLogs(batch: VaccineBatch) {
  logModalBatch.value = batch
  logModalLogs.value = stockLogs.value.filter((l) => l.batchNo === batch.batchNo)
  logModalVisible.value = true
}

function openTransferModal(batch: VaccineBatch) {
  transferModalBatch.value = batch
  transferModalVisible.value = true
}

const stockLogTypeConfig: Record<
  string,
  { label: string; icon: any; cls: string; dot: string }
> = {
  IN: { label: '入库', icon: ArrowDownToLine, cls: 'text-success-400', dot: 'bg-success-400' },
  OUT: { label: '出库', icon: ArrowUpFromLine, cls: 'text-primary-400', dot: 'bg-primary-400' },
  TRANSFER_IN: { label: '调入', icon: ArrowRightLeft, cls: 'text-purple-400', dot: 'bg-purple-400' },
  TRANSFER_OUT: { label: '调出', icon: ArrowRightLeft, cls: 'text-warning-400', dot: 'bg-warning-400' },
  ADJUST: { label: '调整', icon: Settings2, cls: 'text-text-tertiary', dot: 'bg-text-tertiary' },
  SCRAP: { label: '报废', icon: Trash2, cls: 'text-danger-400', dot: 'bg-danger-400' },
}

const timelineLogs = computed(() => {
  const logs = logModalVisible.value && logModalLogs.value.length > 0
    ? logModalLogs.value
    : stockLogs.value
  return logs.slice(0, 40)
})

function closeAllDropdowns(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.dropdown-trigger')) {
    provinceDropdownOpen.value = false
    vaccineTypeDropdownOpen.value = false
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
              @click.stop="vaccineTypeDropdownOpen = !vaccineTypeDropdownOpen"
            >
              <Package class="w-4 h-4 text-primary-400" />
              <span class="text-text-primary max-w-[180px] truncate">{{ selectedVaccineTypeNames }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-text-tertiary shrink-0" :class="vaccineTypeDropdownOpen ? 'rotate-180' : ''" />
            </button>
            <Transition name="dropdown">
              <div
                v-if="vaccineTypeDropdownOpen"
                class="absolute top-full left-0 mt-2 w-64 rounded-xl bg-bg-secondary border border-default shadow-glow-blue z-50 overflow-hidden"
              >
                <div class="p-2 border-b border-default flex items-center justify-between">
                  <span class="text-xs text-text-secondary">选择疫苗类型</span>
                  <button
                    v-if="selectedVaccineTypes.length > 0"
                    class="text-xs text-primary-400 hover:text-primary-300"
                    @click="clearVaccineTypes"
                  >
                    清空
                  </button>
                </div>
                <div class="max-h-64 overflow-y-auto py-1">
                  <label
                    v-for="v in vaccineTypeOptions"
                    :key="v.code"
                    class="flex items-center gap-2.5 px-4 py-2 cursor-pointer transition-colors hover:bg-primary-500/10"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedVaccineTypes.includes(v.code)"
                      class="w-3.5 h-3.5 accent-primary-500"
                      @change="toggleVaccineType(v.code)"
                    />
                    <span class="text-sm" :class="selectedVaccineTypes.includes(v.code) ? 'text-primary-400' : 'text-text-secondary'">
                      {{ v.name }}
                    </span>
                    <span
                      class="ml-auto text-[10px] px-1.5 py-0.5 rounded border"
                      :class="vaccineTypeLabelMap[v.type]?.cls"
                    >
                      {{ v.type }}
                    </span>
                  </label>
                </div>
              </div>
            </Transition>
          </div>

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

          <label class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 cursor-pointer hover:border-warning-500/40 hover:bg-warning-500/5 transition-all">
            <input
              type="checkbox"
              :checked="lowStockOnly"
              class="w-4 h-4 accent-warning-500"
              @change="toggleLowStockOnly"
            />
            <AlertTriangle class="w-4 h-4" :class="lowStockOnly ? 'text-warning-400' : 'text-text-tertiary'" />
            <span :class="lowStockOnly ? 'text-warning-400' : 'text-text-secondary'">仅显示库存预警</span>
          </label>

          <div class="relative flex-1 max-w-md min-w-[200px]">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              v-model="keyword"
              type="text"
              placeholder="搜索疫苗名称/批次号/厂家..."
              class="w-full pl-10 pr-4 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-500/50 transition-all"
              @keyup.enter="loadData"
            />
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

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up shrink-0">
        <KpiCard
          label="总库存剂数"
          :value="totalQuantity"
          unit="剂"
          :trend="8.5"
          :healthy="true"
          icon="Package"
          theme="primary"
        />
        <KpiCard
          label="批次总数"
          :value="totalBatches"
          unit="批"
          :trend="4.2"
          :healthy="true"
          icon="Activity"
          theme="primary"
        />
        <KpiCard
          label="低库存预警"
          :value="lowStockCount"
          unit="批"
          :trend="15.6"
          :healthy="lowStockCount === 0"
          icon="AlertTriangle"
          theme="warning"
        />
        <KpiCard
          label="即将过期"
          :value="nearExpireCount"
          unit="批"
          :trend="-6.3"
          :healthy="nearExpireCount === 0"
          icon="AlertCircle"
          theme="danger"
        />
      </div>

      <div class="panel p-4 flex flex-col min-h-0 animate-fade-in-up flex-1">
        <div class="flex items-center justify-between mb-4 shrink-0">
          <div class="flex items-center gap-1 p-1 rounded-xl bg-bg-secondary/40 border border-default">
            <button
              class="px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              :class="activeTab === 'batches' ? 'bg-primary-500/20 text-primary-400 shadow-glow-blue-sm' : 'text-text-secondary hover:text-text-primary'"
              @click="activeTab = 'batches'"
            >
              <Package class="w-4 h-4" />
              批次库存
              <span
                class="px-1.5 py-0.5 rounded text-xs"
                :class="activeTab === 'batches' ? 'bg-primary-500/30' : 'bg-bg-tertiary/50 text-text-tertiary'"
              >{{ batches.length }}</span>
            </button>
            <button
              class="px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              :class="activeTab === 'logs' ? 'bg-primary-500/20 text-primary-400 shadow-glow-blue-sm' : 'text-text-secondary hover:text-text-primary'"
              @click="activeTab = 'logs'"
            >
              <FileText class="w-4 h-4" />
              出入库记录
              <span
                class="px-1.5 py-0.5 rounded text-xs"
                :class="activeTab === 'logs' ? 'bg-primary-500/30' : 'bg-bg-tertiary/50 text-text-tertiary'"
              >{{ stockLogs.length }}</span>
            </button>
          </div>
        </div>

        <div v-if="activeTab === 'batches'" class="flex-1 min-h-0 relative">
          <DataTable
            :columns="batchColumns"
            :data="pagedBatches"
            :total="batches.length"
            v-model:page="page"
            v-model:page-size="pageSize"
            bordered
          >
            <template #cell-vaccineName="{ row }">
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="text-text-primary font-medium text-sm">{{ row.vaccineName }}</span>
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border"
                    :class="vaccineTypeLabelMap[row.vaccineType]?.cls"
                  >
                    {{ vaccineTypeLabelMap[row.vaccineType]?.label.split(' ')[0] }}
                  </span>
                </div>
                <span class="text-[10px] text-text-tertiary">{{ row.manufacturer }}</span>
              </div>
            </template>
            <template #cell-batchNo="{ row }">
              <div class="flex items-center gap-2 group">
                <span class="font-mono text-xs text-text-primary tracking-wide">{{ row.batchNo }}</span>
                <button
                  class="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary-500/10 hover:text-primary-400 text-text-tertiary"
                  @click="copyBatchNo(row.batchNo)"
                  :title="copiedBatchNo === row.batchNo ? '已复制' : '复制'"
                >
                  <Check v-if="copiedBatchNo === row.batchNo" class="w-3 h-3 text-success-400" />
                  <Copy v-else class="w-3 h-3" />
                </button>
              </div>
            </template>
            <template #cell-location="{ row }">
              <div class="flex items-center gap-1 text-xs text-text-secondary">
                <MapPin class="w-3 h-3 text-text-tertiary shrink-0" />
                <span>{{ row.province }} / {{ row.city }}</span>
              </div>
            </template>
            <template #cell-quantity="{ row }">
              <span
                class="font-rajdhani font-bold text-base"
                :class="isLowStockRow(row) ? 'text-danger-400' : 'text-text-primary'"
              >
                {{ row.quantity.toLocaleString() }}
              </span>
            </template>
            <template #cell-dailyUsage="{ row }">
              <span class="font-rajdhani text-text-secondary text-sm">
                {{ row.dailyUsage.toLocaleString() }}
              </span>
            </template>
            <template #cell-turnoverDays="{ row }">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                :class="getTurnoverBadgeClass(row.turnoverDays)"
              >
                <Clock class="w-3 h-3 mr-1" />
                {{ row.turnoverDays }}天
              </span>
            </template>
            <template #cell-threeDayUsage="{ row }">
              <span class="font-rajdhani text-xs" :class="isLowStockRow(row) ? 'text-danger-400 font-bold' : 'text-text-tertiary'">
                {{ row.threeDayUsage.toLocaleString() }}
              </span>
            </template>
            <template #cell-expireDate="{ row }">
              <div class="flex flex-col items-center">
                <span class="font-mono text-xs" :class="getExpireClass(row.expireDate)">
                  {{ row.expireDate }}
                </span>
                <span class="text-[10px] text-text-tertiary">
                  剩 <span :class="getExpireClass(row.expireDate)">{{ Math.max(0, daysUntilExpire(row.expireDate)) }}</span> 天
                </span>
              </div>
            </template>
            <template #cell-status="{ row }">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                :class="getStockStatusBadge(row).cls"
              >
                {{ getStockStatusBadge(row).label }}
              </span>
            </template>
            <template #cell-actions="{ row }">
              <div class="flex items-center justify-center gap-2">
                <button
                  class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-primary-500/30 text-primary-400 hover:bg-primary-500/10 transition-all"
                  @click="viewStockLogs(row)"
                >
                  <FileText class="w-3 h-3" />
                  出入库记录
                </button>
                <button
                  class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border transition-all"
                  :class="
                    getStockStatusBadge(row).label !== '充足'
                      ? 'border-warning-500/30 text-warning-400 hover:bg-warning-500/10'
                      : 'border-default/50 text-text-tertiary/60 cursor-not-allowed opacity-50'
                  "
                  :disabled="getStockStatusBadge(row).label === '充足'"
                  @click="getStockStatusBadge(row).label !== '充足' && openTransferModal(row)"
                >
                  <ArrowLeftRight class="w-3 h-3" />
                  发起调拨
                </button>
              </div>
            </template>
          </DataTable>
        </div>

        <div v-else class="flex-1 min-h-0 overflow-y-auto pr-2">
          <div v-if="timelineLogs.length > 0" class="relative py-4 px-2">
            <div class="absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-primary-500/40 via-default to-primary-500/40 -translate-x-1/2" />

            <div
              v-for="(log, idx) in timelineLogs"
              :key="log.id"
              class="relative mb-6 last:mb-0"
            >
              <div
                class="w-5 h-5 rounded-full border-2 border-bg-secondary absolute top-4 z-10 flex items-center justify-center shadow-lg"
                :class="[
                  stockLogTypeConfig[log.type].dot,
                  idx % 2 === 0 ? 'left-1/2 -ml-[42px]' : 'left-1/2 ml-[22px]'
                ]"
                :style="{ boxShadow: `0 0 10px ${stockLogTypeConfig[log.type].cls.replace('text-', '')}` }"
              >
                <component :is="stockLogTypeConfig[log.type].icon" class="w-2.5 h-2.5 text-bg-secondary" />
              </div>

              <div
                class="w-[calc(50%-32px)] rounded-xl border bg-bg-secondary/30 p-4 transition-all hover:border-primary-500/30 hover:bg-bg-secondary/50"
                :class="idx % 2 === 0 ? 'mr-auto' : 'ml-auto'"
              >
                <div class="flex items-center justify-between mb-2">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="[
                      stockLogTypeConfig[log.type].cls,
                      'bg-opacity-15'
                    ]"
                    :style="{ background: 'currentColor', opacity: 0.12 }"
                  >
                    <component :is="stockLogTypeConfig[log.type].icon" class="w-3 h-3 mr-1" :style="{ opacity: 1 }" />
                    <span :style="{ opacity: 1 }">{{ stockLogTypeConfig[log.type].label }}</span>
                  </span>
                  <span class="font-mono text-[10px] text-text-tertiary flex items-center gap-1">
                    <Clock class="w-2.5 h-2.5" />
                    {{ log.time }}
                  </span>
                </div>

                <div class="flex items-baseline gap-2 mb-2">
                  <span
                    class="font-rajdhani font-bold text-xl"
                    :class="stockLogTypeConfig[log.type].cls"
                  >
                    {{ log.quantity >= 0 ? '+' : '' }}{{ log.quantity.toLocaleString() }}
                  </span>
                  <span class="text-xs text-text-tertiary">剂</span>
                </div>

                <div class="space-y-1 text-xs">
                  <div class="flex items-center gap-2 text-text-secondary">
                    <Package class="w-3 h-3 text-text-tertiary shrink-0" />
                    <span>{{ log.vaccineName }}</span>
                    <span class="font-mono text-text-tertiary">[{{ log.batchNo }}]</span>
                  </div>
                  <div class="flex items-center gap-2 text-text-tertiary">
                    <MapPin class="w-3 h-3 shrink-0" />
                    <span>{{ log.province }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-text-tertiary">
                    <span class="inline-flex items-center gap-1">
                      <Settings2 class="w-3 h-3" />
                      {{ log.operator }}
                    </span>
                    <span v-if="log.relatedOrder" class="font-mono text-[10px] bg-bg-tertiary/50 px-1.5 py-0.5 rounded">
                      {{ log.relatedOrder }}
                    </span>
                  </div>
                  <div v-if="log.remark" class="pt-1 mt-1 border-t border-default/50 text-text-tertiary/80 italic">
                    "{{ log.remark }}"
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="h-full flex items-center justify-center">
            <EmptyState text="暂无出入库记录" size="sm" />
          </div>
        </div>
      </div>

      <Modal
        v-model:visible="logModalVisible"
        :title="logModalBatch ? `出入库记录 - ${logModalBatch.vaccineName}` : '出入库记录'"
        width="720px"
        :footer="false"
      >
        <div v-if="logModalBatch" class="space-y-4">
          <div class="grid grid-cols-4 gap-3">
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">批次号</div>
              <div class="font-mono font-bold text-sm text-primary-400">{{ logModalBatch.batchNo }}</div>
            </div>
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">当前库存</div>
              <div class="font-rajdhani font-bold text-lg text-text-primary">
                {{ logModalBatch.quantity.toLocaleString() }}
                <span class="text-xs font-normal text-text-tertiary ml-1">剂</span>
              </div>
            </div>
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">周转天数</div>
              <div class="font-rajdhani font-bold text-lg" :class="getTurnoverBadgeClass(logModalBatch.turnoverDays).includes('danger') ? 'text-danger-400' : getTurnoverBadgeClass(logModalBatch.turnoverDays).includes('warning') ? 'text-warning-400' : 'text-success-400'">
                {{ logModalBatch.turnoverDays }}天
              </div>
            </div>
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">有效期至</div>
              <div class="font-mono text-sm" :class="getExpireClass(logModalBatch.expireDate)">
                {{ logModalBatch.expireDate }}
              </div>
            </div>
          </div>

          <div class="text-xs text-text-secondary flex items-center gap-2">
            <div class="w-0.5 h-3 rounded-full bg-primary-500" />
            相关出入库记录
            <span class="text-text-tertiary ml-auto">共 {{ logModalLogs.length }} 条</span>
          </div>

          <div v-if="logModalLogs.length > 0" class="space-y-2 max-h-[360px] overflow-y-auto pr-2">
            <div
              v-for="log in logModalLogs"
              :key="log.id"
              class="p-3 rounded-xl border bg-bg-secondary/20 hover:border-primary-500/30 transition-all"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  :class="[
                    stockLogTypeConfig[log.type].cls,
                    'bg-opacity-15'
                  ]"
                  :style="{ background: 'currentColor', opacity: 0.1 }"
                >
                  <component :is="stockLogTypeConfig[log.type].icon" class="w-4 h-4" :style="{ opacity: 1 }" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                      <span
                        class="text-xs font-medium"
                        :class="stockLogTypeConfig[log.type].cls"
                      >
                        {{ stockLogTypeConfig[log.type].label }}
                      </span>
                      <span
                        class="font-rajdhani font-bold text-sm"
                        :class="stockLogTypeConfig[log.type].cls"
                      >
                        {{ log.quantity >= 0 ? '+' : '' }}{{ log.quantity.toLocaleString() }}剂
                      </span>
                    </div>
                    <span class="font-mono text-[10px] text-text-tertiary">{{ log.time }}</span>
                  </div>
                  <div class="text-xs text-text-tertiary flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>操作人：{{ log.operator }}</span>
                    <span v-if="log.relatedOrder">单号：{{ log.relatedOrder }}</span>
                  </div>
                  <div v-if="log.remark" class="text-xs text-text-tertiary/80 mt-1 italic">
                    {{ log.remark }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="py-10">
            <EmptyState text="该批次暂无出入库记录" size="sm" />
          </div>
        </div>
      </Modal>

      <Modal
        v-model:visible="transferModalVisible"
        :title="transferModalBatch ? `发起调拨 - ${transferModalBatch.vaccineName}` : '发起调拨'"
        width="560px"
      >
        <div v-if="transferModalBatch" class="space-y-4">
          <div class="p-4 rounded-xl bg-warning-500/10 border border-warning-500/20">
            <div class="flex items-start gap-3">
              <AlertTriangle class="w-5 h-5 text-warning-400 shrink-0 mt-0.5" />
              <div>
                <div class="text-sm font-medium text-warning-400 mb-1">调拨提醒</div>
                <div class="text-xs text-text-secondary leading-relaxed space-y-1">
                  <div>
                    疫苗：<span class="font-medium text-text-primary">{{ transferModalBatch.vaccineName }}</span>
                  </div>
                  <div>
                    批次：<span class="font-mono text-primary-400">{{ transferModalBatch.batchNo }}</span>
                  </div>
                  <div>
                    当前库存：<span class="font-rajdhani font-bold text-danger-400">
                      {{ transferModalBatch.quantity.toLocaleString() }}
                    </span> 剂
                    （周转 <span class="text-warning-400">{{ transferModalBatch.turnoverDays }}</span> 天）
                  </div>
                  <div>
                    存放地：<span class="text-text-primary">{{ transferModalBatch.province }} / {{ transferModalBatch.city }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-text-secondary mb-1.5">调往省份 <span class="text-danger-400">*</span></label>
                <select class="w-full px-3 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 text-text-primary focus:outline-none focus:border-primary-500/50">
                  <option value="">请选择省份</option>
                  <option v-for="p in PROVINCES" :key="p.code" :value="p.code">
                    {{ p.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-text-secondary mb-1.5">调拨数量(剂) <span class="text-danger-400">*</span></label>
                <div class="relative">
                  <Plus class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="number"
                    :max="transferModalBatch.quantity"
                    placeholder="请输入数量"
                    class="w-full pl-10 pr-3 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-500/50 font-rajdhani font-bold"
                  />
                </div>
              </div>
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1.5">紧急程度</label>
              <div class="flex gap-2">
                <button class="flex-1 px-4 py-2 rounded-lg text-xs font-medium border transition-all border-default text-text-secondary hover:border-primary-500/30 hover:text-primary-400 hover:bg-primary-500/5">
                  常规调拨
                </button>
                <button class="flex-1 px-4 py-2 rounded-lg text-xs font-medium border transition-all bg-warning-500/10 border-warning-500/30 text-warning-400">
                  紧急调拨
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1.5">调拨原因</label>
              <textarea
                rows="3"
                placeholder="请输入调拨原因及备注说明..."
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
