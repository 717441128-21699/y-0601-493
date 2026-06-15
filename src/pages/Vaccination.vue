<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import KpiCard from '@/components/KpiCard.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import { GaugeChart, PieChart } from '@/components/charts'
import {
  Syringe,
  Users,
  Search,
  RefreshCw,
  ChevronDown,
  MapPin,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  TrendingUp,
  User,
  Award,
  Building2,
} from 'lucide-vue-next'
import { PROVINCES, VACCINE_TYPES, getVisibleProvinceCodes, filterByProvince, getVisibleCityCodes, filterByCity } from '@/mock'
import {
  mockGetVaccinationRecords,
  mockGetTimelyRate,
  mockGetAgeDistribution,
  mockGetVaccinationStats,
  type VaccinationRecord,
  type AgeDistribution,
} from '@/mock'
import { useUserStore } from '@/stores/user'
import { ref, computed, onMounted } from 'vue'

const userStore = useUserStore()
const visibleProvinceCodes = computed(() => getVisibleProvinceCodes(userStore.userInfo))
const visibleCityCodes = computed(() => getVisibleCityCodes(userStore.userInfo))

const provinceDropdownOpen = ref(false)
const vaccineDropdownOpen = ref(false)
const ageGroupDropdownOpen = ref(false)
const provinceSearch = ref('')
const selectedProvince = ref('')
const selectedVaccine = ref('')
const selectedAgeGroup = ref('')
const keyword = ref('')
const timeRangeKey = ref<'7d' | '30d' | '90d' | 'all'>('30d')

const records = ref<VaccinationRecord[]>([])
const stats = ref<any>(null)
const timelyRate = ref<any>(null)
const ageDist = ref<AgeDistribution[]>([])
const page = ref(1)
const pageSize = ref(10)
const activeTab = ref<'records' | 'progress'>('records')

const certModalVisible = ref(false)
const certModalRecord = ref<VaccinationRecord | null>(null)

const selectedProvinceName = computed(() => {
  if (!selectedProvince.value) return '全国'
  const p = PROVINCES.find((x) => x.code === selectedProvince.value)
  return p ? p.name : '全国'
})

const selectedVaccineName = computed(() => {
  if (!selectedVaccine.value) return '全部疫苗'
  const v = VACCINE_TYPES.find((x) => x.code === selectedVaccine.value)
  return v ? v.name : '全部疫苗'
})

const ageGroupOptions = [
  { code: '', name: '全部年龄段' },
  { code: '0-6', name: '婴幼儿 (0-6岁)' },
  { code: '7-17', name: '青少年 (7-17岁)' },
  { code: '18-59', name: '成年人 (18-59岁)' },
  { code: '60+', name: '老年人 (60岁+)' },
]

const selectedAgeGroupName = computed(() => {
  return ageGroupOptions.find((g) => g.code === selectedAgeGroup.value)?.name || '全部年龄段'
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

function toggleProvince(code: string) {
  selectedProvince.value = code
  provinceDropdownOpen.value = false
  provinceSearch.value = ''
  loadData()
}

function toggleVaccine(code: string) {
  selectedVaccine.value = code
  vaccineDropdownOpen.value = false
  loadData()
}

function toggleAgeGroup(code: string) {
  selectedAgeGroup.value = code
  ageGroupDropdownOpen.value = false
  loadData()
}

function setTimeRange(key: '7d' | '30d' | '90d' | 'all') {
  timeRangeKey.value = key
  loadData()
}

function loadData() {
  const params: any = { page: 1, pageSize: 500 }
  if (selectedProvince.value) params.province = selectedProvince.value
  if (selectedVaccine.value) params.vaccineCode = selectedVaccine.value
  if (selectedAgeGroup.value) params.ageGroup = selectedAgeGroup.value
  if (keyword.value) params.keyword = keyword.value

  const provCodes = visibleProvinceCodes.value
  const cityCodes = visibleCityCodes.value

  const result = mockGetVaccinationRecords(params)
  let list = filterByProvince(result.list, provCodes)
  list = filterByCity(list, cityCodes)
  records.value = list

  stats.value = mockGetVaccinationStats()
  timelyRate.value = mockGetTimelyRate(selectedVaccine.value || undefined, selectedProvince.value || undefined)
  ageDist.value = mockGetAgeDistribution()
}

function refreshData() {
  loadData()
}

const totalRecords = computed(() => stats.value?.totalRecords || 0)
const todayCount = computed(() => stats.value?.todayCount || 0)
const timelyRateValue = computed(() => timelyRate.value?.rate || 0)
const siteCount = computed(() => {
  const uniqueSites = new Set(records.value.map((r) => r.site))
  return Math.max(uniqueSites.size, 120)
})

function ageGroupLabel(code: string): string {
  return ageGroupOptions.find((g) => g.code === code)?.name || code
}

const recordColumns: DataTableColumn<VaccinationRecord>[] = [
  { key: 'id', title: '记录编号', width: 120 },
  { key: 'person', title: '受种者', width: 200 },
  { key: 'ageGroup', title: '年龄段', width: 130, align: 'center' },
  { key: 'vaccineName', title: '疫苗名称', width: 140 },
  { key: 'batchNo', title: '批次号', width: 160 },
  { key: 'site', title: '接种点', width: 180 },
  { key: 'province', title: '省/市', width: 120 },
  { key: 'time', title: '接种时间', width: 150, align: 'center' },
  { key: 'isTimely', title: '是否及时', width: 100, align: 'center' },
  { key: 'actions', title: '操作', width: 120, align: 'center', fixed: 'right' },
]

const pagedRecords = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return records.value.slice(start, start + pageSize.value)
})

function viewCertificate(record: VaccinationRecord) {
  certModalRecord.value = record
  certModalVisible.value = true
}

const ageDistPieData = computed(() => {
  return ageDist.value.map((d) => ({
    name: d.group + '岁',
    value: d.value,
  }))
})

const ageDistTotal = computed(() => {
  return ageDist.value.reduce((s, d) => s + d.value, 0)
})

const vaccineProgress = computed(() => {
  const vaccineStats = stats.value?.vaccineStats || []
  return vaccineStats.map((v: any) => {
    const target = v.count * (1 + (0.1 + Math.random() * 0.3))
    const planned = Math.round(target)
    const actual = v.count
    const percent = Math.min(100, Math.round((actual / planned) * 1000) / 10)
    const gap = Math.max(0, planned - actual)
    return {
      name: v.name,
      code: v.code,
      planned,
      actual,
      percent,
      gap,
      timelyRate: v.timelyRate,
    }
  }).sort((a: any, b: any) => b.actual - a.actual)
})

function getProgressBarColor(pct: number): string {
  if (pct >= 90) return 'from-success-500 to-success-400'
  if (pct >= 70) return 'from-primary-500 to-primary-400'
  if (pct >= 50) return 'from-warning-500 to-warning-400'
  return 'from-danger-500 to-danger-400'
}

function closeAllDropdowns(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.dropdown-trigger')) {
    provinceDropdownOpen.value = false
    vaccineDropdownOpen.value = false
    ageGroupDropdownOpen.value = false
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
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all"
              @click.stop="vaccineDropdownOpen = !vaccineDropdownOpen"
            >
              <Syringe class="w-4 h-4 text-primary-400" />
              <span class="text-text-primary">{{ selectedVaccineName }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-text-tertiary" :class="vaccineDropdownOpen ? 'rotate-180' : ''" />
            </button>
            <Transition name="dropdown">
              <div
                v-if="vaccineDropdownOpen"
                class="absolute top-full left-0 mt-2 w-56 rounded-xl bg-bg-secondary border border-default shadow-glow-blue z-50 overflow-hidden py-1"
              >
                <button
                  v-for="v in [{ code: '', name: '全部疫苗' }, ...VACCINE_TYPES]"
                  :key="v.code"
                  class="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-500/10"
                  :class="selectedVaccine === v.code ? 'bg-primary-500/15 text-primary-400' : 'text-text-secondary hover:text-text-primary'"
                  @click="toggleVaccine(v.code)"
                >
                  {{ v.name }}
                </button>
              </div>
            </Transition>
          </div>

          <div class="relative dropdown-trigger">
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all"
              @click.stop="ageGroupDropdownOpen = !ageGroupDropdownOpen"
            >
              <Users class="w-4 h-4 text-primary-400" />
              <span class="text-text-primary">{{ selectedAgeGroupName }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-text-tertiary" :class="ageGroupDropdownOpen ? 'rotate-180' : ''" />
            </button>
            <Transition name="dropdown">
              <div
                v-if="ageGroupDropdownOpen"
                class="absolute top-full left-0 mt-2 w-52 rounded-xl bg-bg-secondary border border-default shadow-glow-blue z-50 overflow-hidden py-1"
              >
                <button
                  v-for="g in ageGroupOptions"
                  :key="g.code"
                  class="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-500/10"
                  :class="selectedAgeGroup === g.code ? 'bg-primary-500/15 text-primary-400' : 'text-text-secondary hover:text-text-primary'"
                  @click="toggleAgeGroup(g.code)"
                >
                  {{ g.name }}
                </button>
              </div>
            </Transition>
          </div>

          <div class="flex items-center gap-1 p-1 rounded-lg border border-default bg-bg-secondary/30">
            <button
              v-for="k in (['7d', '30d', '90d', 'all'] as const)"
              :key="k"
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1"
              :class="timeRangeKey === k ? 'bg-primary-500/20 text-primary-400' : 'text-text-secondary hover:text-text-primary'"
              @click="setTimeRange(k)"
            >
              <Calendar class="w-3 h-3" />
              {{ k === '7d' ? '近7天' : k === '30d' ? '近30天' : k === '90d' ? '近90天' : '全部' }}
            </button>
          </div>

          <div class="relative flex-1 max-w-md min-w-[200px]">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              v-model="keyword"
              type="text"
              placeholder="搜索受种者/疫苗/接种点..."
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
          label="累计接种数"
          :value="totalRecords"
          unit="剂次"
          :trend="12.8"
          :healthy="true"
          icon="Syringe"
          theme="primary"
        />
        <KpiCard
          label="今日接种"
          :value="todayCount"
          unit="剂次"
          :trend="8.5"
          :healthy="true"
          icon="Activity"
          theme="primary"
        />
        <KpiCard
          label="及时率"
          :value="timelyRateValue"
          unit="%"
          :trend="3.2"
          :healthy="timelyRateValue >= 90"
          icon="CheckCircle2"
          theme="success"
        />
        <KpiCard
          label="接种点数"
          :value="siteCount"
          unit="个"
          :trend="5.1"
          :healthy="true"
          icon="Package"
          theme="primary"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up shrink-0">
        <div class="panel p-5 min-h-[320px]">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-1 h-5 rounded-full bg-gradient-to-b from-success-400 to-success-600" />
              <h3 class="text-base font-semibold text-text-primary">接种及时率</h3>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-success-500/10 text-success-400">
                <Award class="w-3 h-3" />
                阈值 85/90
              </span>
            </div>
          </div>
          <GaugeChart
            :value="timelyRateValue"
            :min="0"
            :max="100"
            title="接种及时率"
            unit="%"
            :thresholds="{ l1: 85, l2: 90 }"
            :height="240"
          />
        </div>

        <div class="panel p-5 min-h-[320px]">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-1 h-5 rounded-full bg-gradient-to-b from-primary-400 to-primary-600" />
              <h3 class="text-base font-semibold text-text-primary">接种人群年龄分布</h3>
            </div>
            <div class="text-xs text-text-tertiary">
              共 <span class="text-primary-400 font-rajdhani font-bold text-sm">{{ ageDistTotal.toLocaleString() }}</span> 人
            </div>
          </div>
          <div class="h-[250px]">
            <PieChart
              :data="ageDistPieData"
              :radius="[50, 78]"
              donut
              legend="bottom"
              :center-text="{
                main: ageDistTotal >= 10000 ? (ageDistTotal / 10000).toFixed(1) + '万' : ageDistTotal.toLocaleString(),
                sub: '总接种人数',
              }"
            />
          </div>
        </div>
      </div>

      <div class="panel p-4 flex flex-col min-h-0 animate-fade-in-up flex-1">
        <div class="flex items-center justify-between mb-4 shrink-0">
          <div class="flex items-center gap-1 p-1 rounded-xl bg-bg-secondary/40 border border-default">
            <button
              class="px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              :class="activeTab === 'records' ? 'bg-primary-500/20 text-primary-400 shadow-glow-blue-sm' : 'text-text-secondary hover:text-text-primary'"
              @click="activeTab = 'records'"
            >
              <FileText class="w-4 h-4" />
              接种记录
              <span
                class="px-1.5 py-0.5 rounded text-xs"
                :class="activeTab === 'records' ? 'bg-primary-500/30' : 'bg-bg-tertiary/50 text-text-tertiary'"
              >{{ records.length }}</span>
            </button>
            <button
              class="px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              :class="activeTab === 'progress' ? 'bg-primary-500/20 text-primary-400 shadow-glow-blue-sm' : 'text-text-secondary hover:text-text-primary'"
              @click="activeTab = 'progress'"
            >
              <TrendingUp class="w-4 h-4" />
              接种进度
              <span
                class="px-1.5 py-0.5 rounded text-xs"
                :class="activeTab === 'progress' ? 'bg-primary-500/30' : 'bg-bg-tertiary/50 text-text-tertiary'"
              >{{ vaccineProgress.length }}</span>
            </button>
          </div>
        </div>

        <div v-if="activeTab === 'records'" class="flex-1 min-h-0">
          <DataTable
            :columns="recordColumns"
            :data="pagedRecords"
            :total="records.length"
            v-model:page="page"
            v-model:page-size="pageSize"
            bordered
          >
            <template #cell-id="{ row }">
              <span class="font-mono text-xs text-primary-400 font-bold">{{ row.id }}</span>
            </template>
            <template #cell-person="{ row }">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style="background: linear-gradient(135deg, rgba(24,144,255,0.2), rgba(24,144,255,0.05)); border: 1px solid rgba(24,144,255,0.25)"
                >
                  <User class="w-4 h-4 text-primary-400" />
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-text-primary font-medium text-sm">{{ row.personName }}</span>
                  <span class="font-mono text-[10px] text-text-tertiary">{{ row.idCardMasked }}</span>
                </div>
              </div>
            </template>
            <template #cell-ageGroup="{ row }">
              <div class="flex flex-col items-center">
                <span class="text-xs text-text-primary">{{ ageGroupLabel(row.ageGroup).split(' ')[0] }}</span>
                <span class="text-[10px] text-text-tertiary">{{ row.age }}岁</span>
              </div>
            </template>
            <template #cell-vaccineName="{ row }">
              <div class="flex items-center gap-1.5">
                <Syringe class="w-3 h-3 text-primary-400 shrink-0" />
                <span class="text-text-primary text-sm">{{ row.vaccineName }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-400">
                  第{{ row.dose }}剂
                </span>
              </div>
            </template>
            <template #cell-batchNo="{ row }">
              <span class="font-mono text-xs text-text-secondary">{{ row.batchNo }}</span>
            </template>
            <template #cell-site="{ row }">
              <div class="flex items-center gap-1.5">
                <Building2 class="w-3 h-3 text-text-tertiary shrink-0" />
                <span class="text-xs text-text-secondary truncate max-w-[160px]" :title="row.site">
                  {{ row.site }}
                </span>
              </div>
            </template>
            <template #cell-province="{ row }">
              <div class="flex items-center gap-1 text-xs text-text-secondary">
                <MapPin class="w-3 h-3 text-text-tertiary shrink-0" />
                <span>{{ row.province }}</span>
              </div>
            </template>
            <template #cell-time="{ row }">
              <div class="flex flex-col items-center">
                <span class="font-mono text-xs text-text-primary">{{ row.time.split(' ')[0] }}</span>
                <span class="text-[10px] text-text-tertiary">{{ row.time.split(' ')[1] }}</span>
              </div>
            </template>
            <template #cell-isTimely="{ row }">
              <span
                v-if="row.isTimely"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success-500/15 border border-success-500/30 text-success-400"
              >
                <CheckCircle2 class="w-3 h-3" />
                及时
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-danger-500/15 border border-danger-500/30 text-danger-400"
              >
                <XCircle class="w-3 h-3" />
                延迟
              </span>
            </template>
            <template #cell-actions="{ row }">
              <button
                class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-primary-500/30 text-primary-400 hover:bg-primary-500/10 transition-all"
                @click="viewCertificate(row)"
              >
                <Eye class="w-3 h-3" />
                查看凭证
              </button>
            </template>
          </DataTable>
        </div>

        <div v-else class="flex-1 min-h-0 overflow-y-auto pr-2">
          <div v-if="vaccineProgress.length > 0" class="space-y-4 py-2">
            <div
              v-for="(vp, idx) in vaccineProgress"
              :key="vp.code"
              class="p-4 rounded-xl border bg-bg-secondary/20 hover:border-primary-500/30 transition-all"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-rajdhani font-bold text-sm"
                    :style="{
                      background: idx === 0
                        ? 'linear-gradient(135deg, rgba(250,173,20,0.2), rgba(250,173,20,0.05))'
                        : idx === 1
                        ? 'linear-gradient(135deg, rgba(192,196,206,0.2), rgba(192,196,206,0.05))'
                        : idx === 2
                        ? 'linear-gradient(135deg, rgba(217,115,61,0.2), rgba(217,115,61,0.05))'
                        : 'linear-gradient(135deg, rgba(24,144,255,0.15), rgba(24,144,255,0.03))',
                      border: `1px solid ${idx === 0 ? 'rgba(250,173,20,0.35)' : idx === 1 ? 'rgba(192,196,206,0.35)' : idx === 2 ? 'rgba(217,115,61,0.35)' : 'rgba(24,144,255,0.25)'}`,
                    }"
                  >
                    <span
                      :class="
                        idx === 0 ? 'text-warning-400'
                          : idx === 1 ? 'text-gray-300'
                          : idx === 2 ? 'text-orange-400'
                          : 'text-primary-400'
                      "
                    >
                      {{ idx + 1 }}
                    </span>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-text-primary font-medium text-sm">{{ vp.name }}</span>
                      <span
                        class="text-[10px] px-1.5 py-0.5 rounded"
                        :class="vp.timelyRate >= 90 ? 'bg-success-500/10 text-success-400' : vp.timelyRate >= 80 ? 'bg-warning-500/10 text-warning-400' : 'bg-danger-500/10 text-danger-400'"
                      >
                        及时率 {{ vp.timelyRate }}%
                      </span>
                    </div>
                    <div class="text-[10px] text-text-tertiary mt-0.5">
                      疫苗编码：<span class="font-mono">{{ vp.code }}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="flex items-baseline gap-1.5">
                    <span
                      class="font-rajdhani font-bold text-2xl"
                      :class="
                        vp.percent >= 90 ? 'text-success-400'
                          : vp.percent >= 70 ? 'text-primary-400'
                          : vp.percent >= 50 ? 'text-warning-400'
                          : 'text-danger-400'
                      "
                    >
                      {{ vp.percent }}
                    </span>
                    <span class="text-xs text-text-tertiary">%</span>
                  </div>
                  <div class="text-[10px] text-text-tertiary">完成度</div>
                </div>
              </div>

              <div class="mb-3">
                <div class="h-3 rounded-full bg-bg-tertiary/60 overflow-hidden relative">
                  <div
                    class="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                    :class="`bg-gradient-to-r ${getProgressBarColor(vp.percent)}`"
                    :style="{ width: `${vp.percent}%` }"
                  >
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                  <div
                    class="absolute top-0 h-full w-px bg-white/30"
                    :style="{ left: '70%' }"
                    title="目标线 70%"
                  />
                  <div
                    class="absolute top-0 h-full w-px bg-success-400/50"
                    :style="{ left: '90%' }"
                    title="优秀线 90%"
                  />
                </div>
                <div class="flex justify-between mt-1.5 text-[10px] text-text-tertiary">
                  <span>0%</span>
                  <span class="text-warning-400/70">70%</span>
                  <span class="text-success-400/70">90%</span>
                  <span>100%</span>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3 text-center pt-3 border-t border-default/50">
                <div>
                  <div class="font-rajdhani font-bold text-lg text-text-primary">
                    {{ vp.planned.toLocaleString() }}
                  </div>
                  <div class="text-[10px] text-text-tertiary">计划数(剂)</div>
                </div>
                <div>
                  <div
                    class="font-rajdhani font-bold text-lg"
                    :class="
                      vp.percent >= 70 ? 'text-success-400'
                        : vp.percent >= 50 ? 'text-primary-400'
                        : 'text-warning-400'
                    "
                  >
                    {{ vp.actual.toLocaleString() }}
                  </div>
                  <div class="text-[10px] text-text-tertiary">实际接种(剂)</div>
                </div>
                <div>
                  <div
                    class="font-rajdhani font-bold text-lg"
                    :class="vp.gap > 0 ? 'text-danger-400' : 'text-success-400'"
                  >
                    {{ vp.gap > 0 ? '-' : '+' }}{{ vp.gap.toLocaleString() }}
                  </div>
                  <div class="text-[10px] text-text-tertiary">差距数(剂)</div>
                </div>
              </div>

              <div v-if="vp.gap > 0" class="mt-3 pt-3 border-t border-default/50">
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-1.5 text-text-secondary">
                    <div class="w-2 h-2 rounded-full bg-danger-400/60 animate-pulse" />
                    <span>距目标还差</span>
                    <span class="font-rajdhani font-bold text-danger-400">{{ vp.gap.toLocaleString() }}</span>
                    <span>剂次</span>
                  </div>
                  <div class="h-2 flex-1 mx-4 rounded-full bg-bg-tertiary/60 overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-danger-500/60 to-warning-500/60 rounded-full"
                      :style="{ width: `${Math.min(100, (vp.gap / vp.planned) * 100)}%` }"
                    />
                  </div>
                  <span class="text-text-tertiary font-mono text-[10px]">
                    {{ Math.round((vp.gap / vp.planned) * 1000) / 10 }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="h-full flex items-center justify-center">
            <EmptyState text="暂无接种进度数据" size="sm" />
          </div>
        </div>
      </div>

      <Modal
        v-model:visible="certModalVisible"
        :title="certModalRecord ? '接种凭证' : '接种凭证'"
        width="520px"
        :footer="false"
      >
        <div v-if="certModalRecord" class="space-y-4">
          <div
            class="relative p-5 rounded-xl overflow-hidden"
            style="
              background: linear-gradient(135deg, rgba(24,144,255,0.12) 0%, rgba(9,109,217,0.06) 100%);
              border: 1px solid rgba(24,144,255,0.3);
            "
          >
            <div class="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none"
              style="background: radial-gradient(circle at top right, rgba(24,144,255,0.8), transparent 70%);"
            />
            <div class="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10 pointer-events-none bg-primary-400" />

            <div class="relative flex items-center justify-between mb-5">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center border border-primary-500/30">
                    <Syringe class="w-4 h-4 text-primary-400" />
                  </div>
                  <h4 class="text-lg font-bold text-text-primary">新冠疫苗预防接种凭证</h4>
                </div>
                <div class="text-xs text-text-tertiary font-mono">
                  Certificate No. {{ certModalRecord.id }}-{{ certModalRecord.dose }}
                </div>
              </div>
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center border-2"
                style="
                  border-color: 'rgba(82,196,26,0.4)';
                  background: 'linear-gradient(135deg, rgba(82,196,26,0.15), rgba(82,196,26,0.05))';
                "
              >
                <CheckCircle2 class="w-6 h-6 text-success-400" />
              </div>
            </div>

            <div class="relative grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">受种者姓名</div>
                <div class="text-text-primary font-medium">{{ certModalRecord.personName }}</div>
              </div>
              <div>
                <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">身份证件号</div>
                <div class="text-text-primary font-mono">{{ certModalRecord.idCardMasked }}</div>
              </div>
              <div>
                <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">年龄 / 年龄段</div>
                <div class="text-text-primary">
                  {{ certModalRecord.age }} 岁
                  <span class="text-text-tertiary text-xs ml-1">({{ ageGroupLabel(certModalRecord.ageGroup).split(' ')[0] }})</span>
                </div>
              </div>
              <div>
                <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">接种剂次</div>
                <div class="text-text-primary">
                  第 <span class="font-rajdhani font-bold text-primary-400 text-base">{{ certModalRecord.dose }}</span> 剂
                </div>
              </div>
              <div>
                <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">疫苗名称</div>
                <div class="text-text-primary font-medium">{{ certModalRecord.vaccineName }}</div>
              </div>
              <div>
                <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">疫苗批次</div>
                <div class="text-text-primary font-mono text-xs">{{ certModalRecord.batchNo }}</div>
              </div>
              <div class="col-span-2">
                <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">接种单位</div>
                <div class="text-text-primary flex items-center gap-1.5">
                  <Building2 class="w-3.5 h-3.5 text-primary-400" />
                  {{ certModalRecord.site }}
                </div>
              </div>
              <div>
                <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">接种地区</div>
                <div class="text-text-primary flex items-center gap-1.5">
                  <MapPin class="w-3.5 h-3.5 text-primary-400" />
                  {{ certModalRecord.province }}
                </div>
              </div>
              <div>
                <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">接种时间</div>
                <div class="text-text-primary flex items-center gap-1.5 font-mono">
                  <Clock class="w-3.5 h-3.5 text-primary-400" />
                  {{ certModalRecord.time }}
                </div>
              </div>
            </div>

            <div class="relative mt-5 pt-4 border-t border-primary-500/20 flex items-center justify-between">
              <div>
                <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">接种医生</div>
                <div class="text-text-primary text-sm">{{ certModalRecord.operator }}</div>
              </div>
              <div class="text-right">
                <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">接种状态</div>
                <span
                  v-if="certModalRecord.isTimely"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success-500/15 border border-success-500/30 text-success-400"
                >
                  <CheckCircle2 class="w-3 h-3" />
                  及时接种
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-warning-500/15 border border-warning-500/30 text-warning-400"
                >
                  <Clock class="w-3 h-3" />
                  延迟接种
                </span>
              </div>
            </div>

            <div class="relative mt-4 pt-4 border-t border-dashed border-default/60 flex items-center justify-between text-[10px] text-text-tertiary">
              <span>* 本凭证由系统自动生成，具有同等法律效力</span>
              <span class="font-mono">QR-{{ certModalRecord.id }}-VERIFIED</span>
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

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
</style>
