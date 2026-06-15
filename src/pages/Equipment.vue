<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import KpiCard from '@/components/KpiCard.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import {
  Settings2,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Search,
  RefreshCw,
  Clock,
  FileText,
  AlertTriangle,
  ChevronDown,
  MapPin,
  Calendar,
  History,
  Phone,
} from 'lucide-vue-next'
import { PROVINCES, CITIES } from '@/mock'
import {
  mockGetEquipments,
  type Equipment,
} from '@/mock'
import { ref, computed, onMounted, h } from 'vue'

const provinceDropdownOpen = ref(false)
const typeDropdownOpen = ref(false)
const statusDropdownOpen = ref(false)
const provinceSearch = ref('')
const selectedProvince = ref('')
const selectedType = ref('')
const selectedStatus = ref('')
const keyword = ref('')

const equipments = ref<Equipment[]>([])
const page = ref(1)
const pageSize = ref(10)

const maintainModalVisible = ref(false)
const maintainModalEquipment = ref<Equipment | null>(null)

const repairModalVisible = ref(false)
const repairModalEquipment = ref<Equipment | null>(null)
const repairRemark = ref('')

const selectedProvinceName = computed(() => {
  if (!selectedProvince.value) return '全国'
  const p = PROVINCES.find((x) => x.code === selectedProvince.value)
  return p ? p.name : '全国'
})

const filteredProvinces = computed(() => {
  const q = provinceSearch.value.trim()
  const list = [{ code: '', name: '全国' }, ...PROVINCES]
  if (!q) return list
  return list.filter((p) => p.name.includes(q) || p.code.includes(q))
})

const typeOptions = [
  { code: '', name: '全部类型' },
  { code: 'REFRIGERATOR', name: '医用冷藏箱' },
  { code: 'FREEZER', name: '超低温冷冻箱' },
  { code: 'THERMOMETER', name: '温度记录仪' },
  { code: 'GENERATOR', name: '备用发电机' },
  { code: 'MONITOR', name: '监控终端' },
]

const typeNameMap: Record<string, string> = {
  REFRIGERATOR: '医用冷藏箱',
  FREEZER: '超低温冷冻箱',
  THERMOMETER: '温度记录仪',
  GENERATOR: '备用发电机',
  MONITOR: '监控终端',
}

const statusOptions = [
  { code: '', name: '全部状态' },
  { code: 'RUNNING', name: '运行中' },
  { code: 'STANDBY', name: '待机' },
  { code: 'MAINTENANCE', name: '维护中' },
  { code: 'FAULT', name: '故障' },
]

const selectedTypeName = computed(() => {
  return typeOptions.find((t) => t.code === selectedType.value)?.name || '全部类型'
})

const selectedStatusName = computed(() => {
  return statusOptions.find((s) => s.code === selectedStatus.value)?.name || '全部状态'
})

function toggleProvince(code: string) {
  selectedProvince.value = code
  provinceDropdownOpen.value = false
  provinceSearch.value = ''
  loadData()
}

function toggleType(code: string) {
  selectedType.value = code
  typeDropdownOpen.value = false
  loadData()
}

function toggleStatus(code: string) {
  selectedStatus.value = code
  statusDropdownOpen.value = false
  loadData()
}

function loadData() {
  let all = mockGetEquipments()
  if (selectedProvince.value) {
    all = all.filter((e) => e.provinceCode === selectedProvince.value)
  }
  if (selectedType.value) {
    all = all.filter((e) => e.type === selectedType.value)
  }
  if (selectedStatus.value) {
    all = all.filter((e) => e.status === selectedStatus.value)
  }
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    all = all.filter(
      (e) =>
        e.name.toLowerCase().includes(kw) ||
        e.model.toLowerCase().includes(kw) ||
        e.manufacturer.toLowerCase().includes(kw) ||
        e.coldStoreName.toLowerCase().includes(kw)
    )
  }
  equipments.value = all
}

function refreshData() {
  loadData()
}

const totalEquipments = computed(() => equipments.value.length)
const runningEquipments = computed(() => equipments.value.filter((e) => e.status === 'RUNNING').length)
const pendingMaintainEquipments = computed(() => {
  const now = new Date()
  return equipments.value.filter((e) => {
    const next = new Date(e.nextMaintainDate)
    const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 14 && diffDays > 0
  }).length
})
const faultEquipments = computed(() => equipments.value.filter((e) => e.status === 'FAULT').length)

function daysSince(dateStr: string): number {
  const now = new Date()
  const date = new Date(dateStr)
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  const date = new Date(dateStr)
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getLastMaintainClass(dateStr: string): string {
  const days = daysSince(dateStr)
  if (days > 180) return 'text-danger-400 font-bold'
  if (days > 90) return 'text-warning-400 font-bold'
  return 'text-text-secondary'
}

function getNextMaintainClass(dateStr: string): string {
  const days = daysUntil(dateStr)
  if (days < 7 && days > 0) return 'text-danger-400 font-bold animate-pulse'
  if (days < 14 && days > 0) return 'text-warning-400 font-bold'
  return 'text-text-secondary'
}

function getStatusBadge(status: string): string {
  const map: Record<string, string> = {
    RUNNING: 'bg-success-500/15 border-success-500/30 text-success-400',
    STANDBY: 'bg-primary-500/15 border-primary-500/30 text-primary-400',
    MAINTENANCE: 'bg-warning-500/15 border-warning-500/30 text-warning-400',
    FAULT: 'bg-danger-500/15 border-danger-500/30 text-danger-400',
  }
  return map[status] || ''
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    RUNNING: '运行中',
    STANDBY: '待机',
    MAINTENANCE: '维护中',
    FAULT: '故障',
  }
  return map[status] || status
}

function getTypeBadgeClass(type: string): string {
  const map: Record<string, string> = {
    REFRIGERATOR: 'bg-primary-500/15 border-primary-500/30 text-primary-400',
    FREEZER: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
    THERMOMETER: 'bg-green-500/15 border-green-500/30 text-green-400',
    GENERATOR: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    MONITOR: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
  }
  return map[type] || ''
}

const equipmentColumns: DataTableColumn<Equipment>[] = [
  { key: 'code', title: '设备编号', width: 120 },
  { key: 'name', title: '设备名称/型号', width: 200 },
  { key: 'coldStoreName', title: '所属冷库', width: 180 },
  { key: 'province', title: '所在省市', width: 140 },
  { key: 'type', title: '类型', width: 120, align: 'center' },
  { key: 'installDate', title: '安装日期', width: 120, align: 'center' },
  { key: 'lastMaintainDate', title: '上次维护', width: 130, align: 'center' },
  { key: 'nextMaintainDate', title: '下次维护', width: 130, align: 'center' },
  { key: 'faultCount', title: '故障次数', width: 100, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'actions', title: '操作', width: 180, align: 'center', fixed: 'right' },
]

const pagedEquipments = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return equipments.value.slice(start, start + pageSize.value)
})

function viewMaintainHistory(equipment: Equipment) {
  maintainModalEquipment.value = equipment
  maintainModalVisible.value = true
}

function openRepairModal(equipment: Equipment) {
  repairModalEquipment.value = equipment
  repairRemark.value = ''
  repairModalVisible.value = true
}

const maintainHistory = computed(() => {
  if (!maintainModalEquipment.value) return []
  const base = daysSince(maintainModalEquipment.value.lastMaintainDate)
  const count = 5 + (maintainModalEquipment.value.faultCount || 0)
  const records: {
    date: string
    type: string
    operator: string
    content: string
    status: 'normal' | 'warning' | 'danger'
  }[] = []

  const types = [
    { t: '日常巡检', s: 'normal' as const },
    { t: '定期保养', s: 'normal' as const },
    { t: '部件更换', s: 'warning' as const },
    { t: '故障维修', s: 'danger' as const },
    { t: '性能校准', s: 'normal' as const },
  ]
  const operators = ['王工', '李工', '张师傅', '刘工', '赵工', '陈师傅']
  const contents = [
    '设备运行正常，清洁散热片，检查温度传感器',
    '更换空气滤芯，检查压缩机运行状态',
    '更换温度传感器，重新校准温控系统',
    '修复制冷系统泄漏，补充制冷剂',
    '校准温度显示，验证记录准确性',
    '检查电路连接，紧固接线端子',
  ]

  for (let i = 0; i < count; i++) {
    const tIdx = i === 0 && maintainModalEquipment.value.faultCount > 0 ? 3 : Math.floor(Math.random() * types.length)
    const daysAgo = base + i * Math.floor(30 + Math.random() * 60)
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    records.push({
      date: d.toISOString().slice(0, 10),
      type: types[tIdx].t,
      operator: operators[i % operators.length],
      content: contents[Math.floor(Math.random() * contents.length)],
      status: types[tIdx].s,
    })
  }
  return records
})

function closeAllDropdowns(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.dropdown-trigger')) {
    provinceDropdownOpen.value = false
    typeDropdownOpen.value = false
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
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all"
              @click.stop="typeDropdownOpen = !typeDropdownOpen"
            >
              <Settings2 class="w-4 h-4 text-primary-400" />
              <span class="text-text-primary">{{ selectedTypeName }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-text-tertiary" :class="typeDropdownOpen ? 'rotate-180' : ''" />
            </button>
            <Transition name="dropdown">
              <div
                v-if="typeDropdownOpen"
                class="absolute top-full left-0 mt-2 w-44 rounded-xl bg-bg-secondary border border-default shadow-glow-blue z-50 overflow-hidden py-1"
              >
                <button
                  v-for="t in typeOptions"
                  :key="t.code"
                  class="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-500/10"
                  :class="selectedType === t.code ? 'bg-primary-500/15 text-primary-400' : 'text-text-secondary hover:text-text-primary'"
                  @click="toggleType(t.code)"
                >
                  {{ t.name }}
                </button>
              </div>
            </Transition>
          </div>

          <div class="relative dropdown-trigger">
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all"
              @click.stop="statusDropdownOpen = !statusDropdownOpen"
            >
              <AlertCircle class="w-4 h-4 text-warning-400" />
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
              placeholder="搜索设备名称/型号/厂家/冷库..."
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
          label="设备总数"
          :value="totalEquipments"
          unit="台"
          :trend="6.8"
          :healthy="true"
          icon="Activity"
          theme="primary"
        />
        <KpiCard
          label="运行中"
          :value="runningEquipments"
          unit="台"
          :trend="3.2"
          :healthy="true"
          icon="CheckCircle2"
          theme="success"
        />
        <KpiCard
          label="待维护"
          :value="pendingMaintainEquipments"
          unit="台"
          :trend="12.5"
          :healthy="pendingMaintainEquipments === 0"
          icon="Wrench"
          theme="warning"
        />
        <KpiCard
          label="故障"
          :value="faultEquipments"
          unit="台"
          :trend="-15.3"
          :healthy="faultEquipments === 0"
          icon="AlertTriangle"
          theme="danger"
        />
      </div>

      <div class="panel p-4 flex-1 min-h-0 animate-fade-in-up">
        <DataTable
          :columns="equipmentColumns"
          :data="pagedEquipments"
          :total="equipments.length"
          v-model:page="page"
          v-model:page-size="pageSize"
          bordered
        >
          <template #cell-code="{ row }">
            <span class="font-mono text-xs text-primary-400 font-bold">{{ row.id }}</span>
          </template>
          <template #cell-name="{ row }">
            <div class="flex flex-col">
              <span class="text-text-primary font-medium text-sm">{{ row.name }}</span>
              <span class="text-xs text-text-tertiary font-mono">{{ row.model }}</span>
              <span class="text-[10px] text-text-tertiary/70">{{ row.manufacturer }}</span>
            </div>
          </template>
          <template #cell-coldStoreName="{ row }">
            <span class="text-text-secondary text-xs" :title="row.coldStoreName">
              {{ row.coldStoreName }}
            </span>
          </template>
          <template #cell-province="{ row }">
            <div class="flex items-center gap-1 text-xs text-text-secondary">
              <MapPin class="w-3 h-3 text-text-tertiary shrink-0" />
              <span>{{ row.province }}</span>
            </div>
          </template>
          <template #cell-type="{ row }">
            <span
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
              :class="getTypeBadgeClass(row.type)"
            >
              {{ typeNameMap[row.type] || row.type }}
            </span>
          </template>
          <template #cell-installDate="{ row }">
            <span class="text-text-secondary font-mono text-xs">
              <Calendar class="w-3 h-3 inline mr-1 text-text-tertiary" />
              {{ row.installDate }}
            </span>
          </template>
          <template #cell-lastMaintainDate="{ row }">
            <div class="flex flex-col items-center">
              <span class="font-mono text-xs" :class="getLastMaintainClass(row.lastMaintainDate)">
                {{ row.lastMaintainDate }}
              </span>
              <span class="text-[10px] text-text-tertiary">
                距今 <span :class="getLastMaintainClass(row.lastMaintainDate)">{{ daysSince(row.lastMaintainDate) }}</span> 天
              </span>
            </div>
          </template>
          <template #cell-nextMaintainDate="{ row }">
            <div class="flex flex-col items-center">
              <span class="font-mono text-xs" :class="getNextMaintainClass(row.nextMaintainDate)">
                {{ row.nextMaintainDate }}
              </span>
              <span class="text-[10px] text-text-tertiary">
                剩余 <span :class="getNextMaintainClass(row.nextMaintainDate)">
                  {{ Math.max(0, daysUntil(row.nextMaintainDate)) }}
                </span> 天
              </span>
            </div>
          </template>
          <template #cell-faultCount="{ row }">
            <span
              class="font-rajdhani font-bold text-lg"
              :class="row.faultCount > 3 ? 'text-danger-400' : row.faultCount > 0 ? 'text-warning-400' : 'text-success-400'"
            >
              {{ row.faultCount }}
            </span>
          </template>
          <template #cell-status="{ row }">
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
              :class="getStatusBadge(row.status)"
            >
              {{ getStatusLabel(row.status) }}
            </span>
          </template>
          <template #cell-actions="{ row }">
            <div class="flex items-center justify-center gap-2">
              <button
                class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-primary-500/30 text-primary-400 hover:bg-primary-500/10 transition-all"
                @click="viewMaintainHistory(row)"
              >
                <History class="w-3 h-3" />
                维护记录
              </button>
              <button
                class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border transition-all"
                :class="
                  row.status === 'FAULT'
                    ? 'border-danger-500/30 text-danger-400 hover:bg-danger-500/10'
                    : 'border-default text-text-secondary hover:border-warning-500/30 hover:text-warning-400 hover:bg-warning-500/5'
                "
                @click="openRepairModal(row)"
              >
                <Wrench class="w-3 h-3" />
                {{ row.status === 'FAULT' ? '报修' : '申请维护' }}
              </button>
            </div>
          </template>
        </DataTable>
      </div>

      <Modal
        v-model:visible="maintainModalVisible"
        :title="maintainModalEquipment ? `维护记录 - ${maintainModalEquipment.name}` : '维护记录'"
        width="720px"
        :footer="false"
      >
        <div v-if="maintainModalEquipment" class="space-y-5">
          <div class="grid grid-cols-3 gap-4">
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">设备编号</div>
              <div class="font-mono font-bold text-sm text-primary-400">{{ maintainModalEquipment.id }}</div>
            </div>
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">所属冷库</div>
              <div class="text-sm text-text-primary truncate" :title="maintainModalEquipment.coldStoreName">
                {{ maintainModalEquipment.coldStoreName }}
              </div>
            </div>
            <div class="p-3 rounded-xl bg-bg-secondary/40 border border-default">
              <div class="text-xs text-text-tertiary mb-1">运行状态</div>
              <div>
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                  :class="getStatusBadge(maintainModalEquipment.status)"
                >
                  {{ getStatusLabel(maintainModalEquipment.status) }}
                </span>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-xs text-text-secondary flex items-center gap-2">
              <div class="w-0.5 h-3 rounded-full bg-primary-500" />
              维护时间线
              <span class="text-text-tertiary ml-auto">共 {{ maintainHistory.length }} 条记录</span>
            </div>

            <div class="relative pl-6 space-y-4 max-h-[420px] overflow-y-auto pr-2 py-2">
              <div class="absolute left-2.5 top-2 bottom-2 w-px bg-gradient-to-b from-primary-500/50 via-default to-transparent" />

              <div
                v-for="(record, idx) in maintainHistory"
                :key="idx"
                class="relative"
              >
                <div
                  class="absolute -left-[18px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-bg-secondary z-10 flex items-center justify-center"
                  :class="[
                    record.status === 'danger' ? 'bg-danger-400 shadow-[0_0_8px_rgba(245,34,45,0.5)]'
                    : record.status === 'warning' ? 'bg-warning-400 shadow-[0_0_8px_rgba(250,173,20,0.5)]'
                    : 'bg-success-400 shadow-[0_0_8px_rgba(82,196,26,0.5)]'
                  ]"
                />
                <div class="p-4 rounded-xl border bg-bg-secondary/30 transition-all hover:border-primary-500/30">
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        :class="[
                          record.status === 'danger' ? 'bg-danger-500/15 text-danger-400'
                          : record.status === 'warning' ? 'bg-warning-500/15 text-warning-400'
                          : 'bg-success-500/15 text-success-400'
                        ]"
                      >
                        {{ record.type }}
                      </span>
                      <span class="text-xs font-mono text-text-tertiary flex items-center gap-1">
                        <Calendar class="w-3 h-3" />
                        {{ record.date }}
                      </span>
                    </div>
                    <div class="flex items-center gap-1 text-xs text-text-tertiary">
                      <Wrench class="w-3 h-3" />
                      {{ record.operator }}
                    </div>
                  </div>
                  <div class="text-sm text-text-secondary leading-relaxed">
                    {{ record.content }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        v-model:visible="repairModalVisible"
        :title="
          repairModalEquipment
            ? (repairModalEquipment.status === 'FAULT' ? '设备报修' : '申请维护') + ` - ${repairModalEquipment.name}`
            : '设备报修'
        "
        width="560px"
      >
        <div v-if="repairModalEquipment" class="space-y-4">
          <div
            class="p-4 rounded-xl border"
            :class="
              repairModalEquipment.status === 'FAULT'
                ? 'bg-danger-500/10 border-danger-500/20'
                : 'bg-warning-500/10 border-warning-500/20'
            "
          >
            <div class="flex items-start gap-3">
              <AlertTriangle
                class="w-5 h-5 shrink-0 mt-0.5"
                :class="repairModalEquipment.status === 'FAULT' ? 'text-danger-400' : 'text-warning-400'"
              />
              <div>
                <div
                  class="text-sm font-medium mb-1"
                  :class="repairModalEquipment.status === 'FAULT' ? 'text-danger-400' : 'text-warning-400'"
                >
                  {{ repairModalEquipment.status === 'FAULT' ? '故障报修提醒' : '维护申请提醒' }}
                </div>
                <div class="text-xs text-text-secondary leading-relaxed space-y-1">
                  <div>
                    设备：<span class="font-medium text-text-primary">{{ repairModalEquipment.name }}</span>
                    <span class="font-mono text-text-tertiary ml-2">{{ repairModalEquipment.model }}</span>
                  </div>
                  <div>
                    所属冷库：<span class="text-text-primary">{{ repairModalEquipment.coldStoreName }}</span>
                  </div>
                  <div>
                    当前状态：
                    <span
                      class="inline-flex px-2 py-0.5 rounded text-xs border"
                      :class="getStatusBadge(repairModalEquipment.status)"
                    >
                      {{ getStatusLabel(repairModalEquipment.status) }}
                    </span>
                  </div>
                  <div>
                    历史故障次数：<span class="font-rajdhani font-bold text-danger-400">{{ repairModalEquipment.faultCount }}</span> 次
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs text-text-secondary mb-1.5">
                {{ repairModalEquipment.status === 'FAULT' ? '故障现象描述' : '维护需求说明' }}
                <span class="text-danger-400">*</span>
              </label>
              <textarea
                rows="3"
                :placeholder="repairModalEquipment.status === 'FAULT' ? '请详细描述故障现象，便于维修人员准备...' : '请描述需要进行的维护内容...'"
                class="w-full px-3 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-500/50 resize-none"
              />
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1.5">紧急程度</label>
              <div class="flex gap-2">
                <button
                  class="flex-1 px-4 py-2 rounded-lg text-xs font-medium border transition-all bg-success-500/10 border-success-500/30 text-success-400"
                >
                  一般
                </button>
                <button
                  class="flex-1 px-4 py-2 rounded-lg text-xs font-medium border transition-all border-default text-text-secondary hover:border-warning-500/30 hover:text-warning-400 hover:bg-warning-500/5"
                >
                  较紧急
                </button>
                <button
                  class="flex-1 px-4 py-2 rounded-lg text-xs font-medium border transition-all border-default text-text-secondary hover:border-danger-500/30 hover:text-danger-400 hover:bg-danger-500/5"
                >
                  非常紧急
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1.5">联系电话</label>
              <div class="relative">
                <Phone class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="tel"
                  placeholder="请输入联系电话"
                  class="w-full pl-10 pr-4 py-2 rounded-lg text-sm border border-default bg-bg-secondary/50 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-500/50 font-mono"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1.5">备注说明</label>
              <textarea
                v-model="repairRemark"
                rows="2"
                placeholder="其他需要说明的信息..."
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
