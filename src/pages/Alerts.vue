<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import AlertCard from '@/components/AlertCard.vue'
import {
  AlertTriangle,
  Filter,
  Search,
  RefreshCw,
  FileCheck,
  Bell,
  X,
  Thermometer,
  Package,
  Cog,
  MessageSquare,
  Send,
  Clock,
  Timer,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-vue-next'
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAlertsStore } from '@/stores/alerts'
import { useUserStore } from '@/stores/user'
import type { Alert } from '@/mock'
import { mockGetAlerts, mockGetAlertById, getVisibleProvinceCodes, filterByProvince, getVisibleCityCodes, filterByCity, PROVINCES } from '@/mock'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { PieChart } from '@/components/charts'
import Modal from '@/components/Modal.vue'
import dayjs from 'dayjs'

const router = useRouter()
const alertsStore = useAlertsStore()
const userStore = useUserStore()

const search = ref('')
const levelFilter = ref<string>('')
const statusFilter = ref<string>('')
const viewMode = ref<'table' | 'card'>('table')
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const nowTick = ref(Date.now())

const allAlerts = ref<Alert[]>([])

const handleModalVisible = ref(false)
const detailModalVisible = ref(false)
const currentAlert = ref<Alert | null>(null)
const submitting = ref(false)

const handleForm = reactive({
  actionType: '现场处置',
  remark: '',
})

const actionTypeOptions = [
  { value: '现场处置', label: '现场处置' },
  { value: '设备修复', label: '设备修复' },
  { value: '库存调拨', label: '库存调拨' },
  { value: '温度调整', label: '温度调整' },
  { value: '升级申请', label: '升级申请' },
]

let countdownTimer: number | null = null

async function loadData() {
  loading.value = true
  try {
    await alertsStore.fetchAlerts()
    allAlerts.value = mockGetAlerts()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
  countdownTimer = window.setInterval(() => {
    nowTick.value = Date.now()
  }, 30000)
})

onUnmounted(() => {
  if (countdownTimer) {
    window.clearInterval(countdownTimer)
    countdownTimer = null
  }
})

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

const pendingL1List = computed(() => allAlerts.value.filter((a) => a.level === 'L1' && a.status !== 'CLOSED'))
const pendingL2List = computed(() => allAlerts.value.filter((a) => a.level === 'L2' && a.status !== 'CLOSED'))

const l1Count = computed(() => pendingL1List.value.length)
const l2Count = computed(() => pendingL2List.value.length)

const alertTypeStats = computed(() => [
  { name: '温度超标', value: allAlerts.value.filter((a) => a.type === 'TEMP_OVER').length, color: '#F5222D' },
  { name: '温度过低', value: allAlerts.value.filter((a) => a.type === 'TEMP_UNDER').length, color: '#63B3FF' },
  { name: '库存不足', value: allAlerts.value.filter((a) => a.type === 'STOCK_LOW').length, color: '#FAAD14' },
  { name: '设备故障', value: allAlerts.value.filter((a) => a.type === 'DEVICE_FAULT').length, color: '#722ED1' },
])

function getRemainingTime(alert: Alert) {
  if (alert.level !== 'L1' || alert.status === 'CLOSED') return null
  const diff = dayjs(alert.expireTime.replace(' ', 'T')).diff(dayjs(nowTick.value), 'minute')
  if (diff <= 0) return { text: '超时升级中', urgent: true, expired: true }
  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  return {
    text: hours > 0 ? `${hours}时${mins}分` : `${mins}分钟`,
    urgent: diff < 30,
    expired: false,
  }
}

function getStatusBadge(alert: Alert) {
  if (alert.status === 'CLOSED') {
    if (alert.approval?.result === 'TRANSFER') return { label: '调拨完成', class: 'bg-success-500/20 text-success-400 border border-success-500/30' }
    if (alert.approval?.result === 'SCRAP') return { label: '报废处理', class: 'bg-danger-500/20 text-danger-400 border border-danger-500/30' }
    return { label: '已关闭', class: 'bg-bg-tertiary/60 text-text-tertiary border border-default/50' }
  }
  const map: Record<string, { label: string; class: string }> = {
    PENDING: { label: '待处置', class: 'bg-warning-500/20 text-warning-400 border border-warning-500/30' },
    PROCESSING: { label: '处置中', class: 'bg-primary-500/20 text-primary-400 border border-primary-500/30' },
    ESCALATED: { label: '已升级', class: 'bg-[rgba(114,46,209,0.2)] text-[#9254DE] border border-[rgba(114,46,209,0.3)]' },
    APPROVING: { label: '审批中', class: 'bg-[rgba(24,144,255,0.2)] text-primary-400 border border-[rgba(24,144,255,0.3)]' },
  }
  return map[alert.status] || { label: alert.status, class: 'bg-bg-tertiary/60 text-text-tertiary' }
}

function getTypeIcon(type: string) {
  if (type.startsWith('TEMP')) return Thermometer
  if (type === 'STOCK_LOW') return Package
  return Cog
}

function openHandleModal(alert: Alert) {
  currentAlert.value = mockGetAlertById(alert.id) || alert
  handleForm.actionType = '现场处置'
  handleForm.remark = ''
  handleModalVisible.value = true
}

function openDetailModal(alert: Alert) {
  currentAlert.value = mockGetAlertById(alert.id) || alert
  detailModalVisible.value = true
}

async function submitHandle() {
  if (!currentAlert.value || !handleForm.remark.trim()) return
  submitting.value = true
  try {
    await alertsStore.handleAlert(currentAlert.value.id, handleForm.remark, handleForm.actionType)
    currentAlert.value = mockGetAlertById(currentAlert.value.id) || currentAlert.value
    handleModalVisible.value = false
    await loadData()
  } finally {
    submitting.value = false
  }
}

function refreshAndEscalateCheck() {
  loadData()
}

watch(nowTick, () => {
  let hasExpired = false
  for (const a of pendingL1List.value) {
    const remain = getRemainingTime(a)
    if (remain?.expired) {
      hasExpired = true
      break
    }
  }
  if (hasExpired) {
    loadData()
  }
})

const columns: DataTableColumn<Alert>[] = [
  {
    key: 'id',
    title: '预警编号',
    width: 120,
    render: (row) => `<span class="font-mono text-[11px]">${row.id}</span>`,
  },
  {
    key: 'level',
    title: '级别',
    width: 70,
    align: 'center',
    render: (row) =>
      row.level === 'L2'
        ? '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-danger-500/20 text-danger-400 border border-danger-500/30">L2</span>'
        : '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-warning-500/20 text-warning-400 border border-warning-500/30">L1</span>',
  },
  {
    key: 'type',
    title: '类型',
    width: 100,
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
  { key: 'title', title: '预警内容', width: 220, ellipsis: true },
  { key: 'province', title: '省份', width: 90 },
  { key: 'city', title: '城市', width: 90 },
  {
    key: 'countdown',
    title: '倒计时',
    width: 110,
    align: 'center',
    render: (row) => {
      const remain = getRemainingTime(row)
      if (!remain) return '<span class="text-text-tertiary">-</span>'
      return `<span class="${remain.urgent ? 'text-danger-400 font-medium' : 'text-warning-400'}">${remain.text}</span>`
    },
  },
  {
    key: 'status',
    title: '状态',
    width: 100,
    align: 'center',
    render: (row) => {
      const badge = getStatusBadge(row)
      return `<span class="px-2 py-0.5 rounded text-[11px] font-medium ${badge.class}">${badge.label}</span>`
    },
  },
  { key: 'triggerTime', title: '触发时间', width: 150 },
]
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
            <option value="L1">L1 一级预警</option>
            <option value="L2">L2 二级预警</option>
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
          <div class="flex items-center gap-1 p-0.5 bg-bg-secondary rounded-lg border border-default">
            <button
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="viewMode === 'table' ? 'bg-primary-500 text-white shadow-glow-blue' : 'text-text-secondary hover:text-text-primary'"
              @click="viewMode = 'table'"
            >
              列表
            </button>
            <button
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="viewMode === 'card' ? 'bg-primary-500 text-white shadow-glow-blue' : 'text-text-secondary hover:text-text-primary'"
              @click="viewMode = 'card'"
            >
              卡片
            </button>
          </div>
          <div class="flex-1"></div>
          <button class="btn-ghost h-10 flex items-center gap-2 text-sm" @click="$router.push('/alerts/approval')">
            <FileCheck class="w-4 h-4" />
            审批工作台
            <span
              v-if="l2Count > 0"
              class="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
              style="background: linear-gradient(135deg, #F5222D 0%, #CF1322 100%)"
            >
              {{ l2Count > 99 ? '99+' : l2Count }}
            </span>
          </button>
          <button class="btn-ghost h-10 flex items-center gap-2 text-sm" @click="refreshAndEscalateCheck">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            刷新
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div
          v-for="(kpi, idx) in [
            { label: '预警总数', value: allAlerts.length, icon: Bell, color: 'primary' },
            { label: '待处置(L1)', value: l1Count, icon: AlertTriangle, color: 'warning' },
            { label: '待审批(L2)', value: l2Count, icon: FileCheck, color: 'danger' },
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
          <div class="flex items-center justify-between mb-4 shrink-0">
            <h3 class="panel-title">预警列表</h3>
            <div class="flex items-center gap-3 text-xs text-text-tertiary">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-warning-500"></span>
                L1: {{ l1Count }}
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-danger-500"></span>
                L2: {{ l2Count }}
              </span>
            </div>
          </div>

          <div v-if="viewMode === 'table'" class="flex-1 min-h-0 overflow-y-auto">
            <DataTable
              :columns="columns"
              :data="filteredAlerts"
              :total="filteredAlerts.length"
              :loading="loading"
              v-model:page="page"
              v-model:page-size="pageSize"
            >
              <template #cell-actions="{ row }">
                <div class="flex items-center gap-1.5">
                  <button
                    v-if="row.level === 'L1' && row.status !== 'CLOSED'"
                    class="px-3 py-1.5 rounded-md text-xs font-medium text-white transition-all hover:-translate-y-0.5"
                    style="background: linear-gradient(135deg, #1890FF 0%, #096DD9 100%); box-shadow: 0 2px 8px rgba(24,144,255,0.3)"
                    @click.stop="openHandleModal(row)"
                  >
                    处置
                  </button>
                  <button
                    class="px-3 py-1.5 rounded-md text-xs text-text-secondary border border-default hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300 transition-all"
                    @click.stop="openDetailModal(row)"
                  >
                    详情
                  </button>
                </div>
              </template>
            </DataTable>
          </div>

          <div v-else class="flex-1 min-h-0 overflow-y-auto pr-1">
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <AlertCard
                v-for="alert in filteredAlerts"
                :key="alert.id"
                :alert="alert"
                @handle="openHandleModal"
                @detail="openDetailModal"
              />
            </div>
            <div v-if="filteredAlerts.length === 0" class="h-full flex items-center justify-center text-text-tertiary text-sm">
              暂无符合条件的预警
            </div>
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

    <Modal
      v-model:visible="handleModalVisible"
      title="预警处置"
      width="560px"
      @close="currentAlert = null"
    >
      <div v-if="currentAlert" class="space-y-4">
        <div class="p-3 rounded-lg" style="background: rgba(24,144,255,0.04); border: 1px solid rgba(24,144,255,0.12)">
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              :class="currentAlert.type.startsWith('TEMP') ? 'bg-danger-500/15 text-danger-400' : currentAlert.type === 'STOCK_LOW' ? 'bg-warning-500/15 text-warning-400' : 'bg-primary-500/15 text-primary-400'"
            >
              <component :is="getTypeIcon(currentAlert.type)" class="w-5 h-5" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  class="px-2 py-0.5 rounded text-[11px] font-medium"
                  :class="currentAlert.level === 'L2' ? 'bg-danger-500/20 text-danger-400 border border-danger-500/30' : 'bg-warning-500/20 text-warning-400 border border-warning-500/30'"
                >
                  {{ currentAlert.level === 'L2' ? 'L2 二级' : 'L1 一级' }}
                </span>
                <span class="text-sm font-semibold text-text-primary truncate flex-1">{{ currentAlert.title }}</span>
              </div>
              <div class="text-xs text-text-tertiary">
                {{ currentAlert.province }} · {{ currentAlert.city }} · {{ currentAlert.triggerTime }}
              </div>
              <div class="text-xs text-text-secondary mt-1.5 leading-relaxed">{{ currentAlert.description }}</div>
            </div>
          </div>
        </div>

        <div v-if="currentAlert.level === 'L1'" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning-500/10 border border-warning-500/30">
          <Timer class="w-4 h-4 text-warning-400 shrink-0" />
          <span class="text-xs text-warning-400">
            处置剩余时间：<span class="font-semibold font-mono">{{ getRemainingTime(currentAlert)?.text || '-' }}</span>
          </span>
          <AlertOctagon v-if="getRemainingTime(currentAlert)?.urgent" class="w-4 h-4 text-danger-400 ml-auto animate-pulse" />
        </div>

        <div>
          <label class="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
            处置措施类型
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="opt in actionTypeOptions"
              :key="opt.value"
              class="h-9 px-2 rounded-lg text-xs transition-all border"
              :class="handleForm.actionType === opt.value
                ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                : 'bg-bg-secondary text-text-secondary border-default hover:border-primary-500/40'"
              @click="handleForm.actionType = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
            <MessageSquare class="w-3.5 h-3.5" />
            处置措施说明 <span class="text-danger-400">*</span>
          </label>
          <textarea
            v-model="handleForm.remark"
            rows="4"
            placeholder="请填写具体的处置措施、现场情况说明、已采取的行动等..."
            class="w-full px-3 py-2 bg-bg-secondary border border-default rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-500 resize-none"
          ></textarea>
        </div>

        <div v-if="currentAlert.handleLogs && currentAlert.handleLogs.length > 0" class="rounded-lg border border-default overflow-hidden">
          <div class="px-3 py-2 bg-bg-secondary/60 border-b border-default">
            <div class="text-xs font-medium text-text-primary flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-primary-400" />
              历史处置记录
            </div>
          </div>
          <div class="max-h-[150px] overflow-y-auto divide-y divide-default/50">
            <div
              v-for="(log, idx) in currentAlert.handleLogs"
              :key="idx"
              class="px-3 py-2.5 text-xs hover:bg-white/[0.02]"
            >
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-1.5">
                  <span class="font-medium text-text-primary">{{ log.operator }}</span>
                  <span class="text-text-tertiary">·</span>
                  <span class="text-text-tertiary">{{ log.role }}</span>
                </div>
                <span class="text-text-tertiary font-mono text-[10px]">{{ log.time }}</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="px-1.5 py-0.5 rounded bg-bg-tertiary/60 text-text-secondary text-[10px] shrink-0">
                  {{ log.action }}
                </span>
                <span class="text-text-secondary leading-relaxed">{{ log.remark }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-ghost px-5 py-2 text-sm" @click="handleModalVisible = false">
          取消
        </button>
        <button
          class="btn-primary px-5 py-2 text-sm flex items-center gap-2"
          :disabled="submitting || !handleForm.remark.trim()"
          @click="submitHandle"
        >
          <Send class="w-4 h-4" />
          {{ submitting ? '提交中...' : '提交处置' }}
        </button>
      </template>
    </Modal>

    <Modal
      v-model:visible="detailModalVisible"
      title="预警详情"
      width="640px"
      @close="currentAlert = null"
    >
      <div v-if="currentAlert" class="space-y-4">
        <div class="p-4 rounded-xl" style="background: rgba(24,144,255,0.04); border: 1px solid rgba(24,144,255,0.12)">
          <div class="flex items-center gap-2 mb-3 flex-wrap">
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              :class="currentAlert.type.startsWith('TEMP') ? 'bg-danger-500/15 text-danger-400' : currentAlert.type === 'STOCK_LOW' ? 'bg-warning-500/15 text-warning-400' : 'bg-primary-500/15 text-primary-400'"
            >
              <component :is="getTypeIcon(currentAlert.type)" class="w-4.5 h-4.5" />
            </div>
            <div class="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              <span
                class="px-2 py-0.5 rounded text-[11px] font-medium"
                :class="currentAlert.level === 'L2' ? 'bg-danger-500/20 text-danger-400 border border-danger-500/30' : 'bg-warning-500/20 text-warning-400 border border-warning-500/30'"
              >
                {{ currentAlert.level === 'L2' ? 'L2 二级预警' : 'L1 一级预警' }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-[11px] font-medium"
                :class="getStatusBadge(currentAlert).class"
              >
                {{ getStatusBadge(currentAlert).label }}
              </span>
            </div>
            <CheckCircle2 v-if="currentAlert.status === 'CLOSED'" class="w-5 h-5 text-success-400 shrink-0" />
          </div>
          <div class="font-bold text-text-primary mb-3">{{ currentAlert.title }}</div>
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div class="text-text-tertiary mb-0.5">预警编号</div>
              <div class="font-mono text-text-primary">{{ currentAlert.id }}</div>
            </div>
            <div>
              <div class="text-text-tertiary mb-0.5">触发时间</div>
              <div class="text-text-primary">{{ currentAlert.triggerTime }}</div>
            </div>
            <div>
              <div class="text-text-tertiary mb-0.5">所在地区</div>
              <div class="text-text-primary">{{ currentAlert.province }} · {{ currentAlert.city }}</div>
            </div>
            <div v-if="currentAlert.level === 'L1'">
              <div class="text-text-tertiary mb-0.5">处置截止</div>
              <div class="text-text-primary font-mono">{{ currentAlert.expireTime }}</div>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-default/50">
            <div class="text-xs text-text-tertiary mb-1">详细描述</div>
            <div class="text-sm text-text-primary leading-relaxed">{{ currentAlert.description }}</div>
          </div>
        </div>

        <div
          v-if="currentAlert.temperature"
          class="rounded-lg px-4 py-3 text-xs"
          style="background: rgba(24,144,255,0.06); border: 1px solid rgba(24,144,255,0.15)"
        >
          <div class="flex items-center gap-2 mb-2">
            <Thermometer class="w-4 h-4 text-primary-400" />
            <span class="font-medium text-text-primary">温度数据</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><span class="text-text-tertiary">冷库：</span><span class="text-text-primary">{{ currentAlert.temperature.coldStoreName }}</span></div>
            <div><span class="text-text-tertiary">当前：</span><span class="font-mono font-bold text-danger-400">{{ currentAlert.temperature.current }}°C</span></div>
            <div><span class="text-text-tertiary">阈值：</span><span class="font-mono text-text-primary">{{ currentAlert.temperature.min }}~{{ currentAlert.temperature.max }}°C</span></div>
            <div><span class="text-text-tertiary">持续：</span><span class="text-text-primary">{{ currentAlert.temperature.duration }}分钟</span></div>
          </div>
        </div>

        <div
          v-if="currentAlert.stock"
          class="rounded-lg px-4 py-3 text-xs"
          style="background: rgba(250,173,20,0.06); border: 1px solid rgba(250,173,20,0.15)"
        >
          <div class="flex items-center gap-2 mb-2">
            <Package class="w-4 h-4 text-warning-400" />
            <span class="font-medium text-text-primary">库存数据</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><span class="text-text-tertiary">疫苗：</span><span class="text-text-primary">{{ currentAlert.stock.vaccineName }}</span></div>
            <div><span class="text-text-tertiary">批次：</span><span class="font-mono text-text-primary">{{ currentAlert.stock.batchNo }}</span></div>
            <div><span class="text-text-tertiary">当前库存：</span><span class="font-mono font-bold text-warning-400">{{ currentAlert.stock.current }}剂</span></div>
            <div><span class="text-text-tertiary">3日警戒线：</span><span class="font-mono text-danger-400">{{ currentAlert.stock.threshold }}剂</span></div>
          </div>
        </div>

        <div
          v-if="currentAlert.device"
          class="rounded-lg px-4 py-3 text-xs"
          style="background: rgba(114,46,209,0.06); border: 1px solid rgba(114,46,209,0.15)"
        >
          <div class="flex items-center gap-2 mb-2">
            <Cog class="w-4 h-4" style="color: #722ED1" />
            <span class="font-medium text-text-primary">设备数据</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><span class="text-text-tertiary">设备：</span><span class="text-text-primary">{{ currentAlert.device.deviceName }}</span></div>
            <div><span class="text-text-tertiary">型号：</span><span class="font-mono text-text-primary">{{ currentAlert.device.deviceModel }}</span></div>
            <div class="col-span-2"><span class="text-text-tertiary">故障：</span><span class="text-text-primary">{{ currentAlert.device.faultType }}</span></div>
          </div>
        </div>

        <div class="rounded-lg border border-default overflow-hidden">
          <div class="px-4 py-2.5 bg-bg-secondary/60 border-b border-default">
            <div class="text-xs font-medium text-text-primary flex items-center gap-1.5">
              <MessageSquare class="w-3.5 h-3.5 text-primary-400" />
              处置与审批记录（{{ currentAlert.handleLogs?.length || 0 }}）
            </div>
          </div>
          <div class="max-h-[240px] overflow-y-auto divide-y divide-default/50">
            <template v-if="currentAlert.handleLogs && currentAlert.handleLogs.length > 0">
              <div
                v-for="(log, idx) in currentAlert.handleLogs"
                :key="idx"
                class="px-4 py-3 text-xs hover:bg-white/[0.02]"
              >
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center gap-1.5">
                    <span class="font-medium text-text-primary">{{ log.operator }}</span>
                    <span class="text-text-tertiary">·</span>
                    <span class="text-text-tertiary">{{ log.role }}</span>
                  </div>
                  <span class="text-text-tertiary font-mono text-[10px]">{{ log.time }}</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="px-1.5 py-0.5 rounded bg-bg-tertiary/60 text-text-secondary text-[10px] shrink-0">
                    {{ log.action }}
                  </span>
                  <span class="text-text-secondary leading-relaxed">{{ log.remark }}</span>
                </div>
              </div>
            </template>
            <div v-else class="px-4 py-10 text-center text-xs text-text-tertiary">
              暂无处置记录
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center gap-2 w-full justify-end">
          <button
            v-if="currentAlert?.level === 'L1' && currentAlert?.status !== 'CLOSED'"
            class="btn-primary px-5 py-2 text-sm flex items-center gap-2"
            @click="detailModalVisible = false; openHandleModal(currentAlert!)"
          >
            <Send class="w-4 h-4" />
            立即处置
          </button>
          <button
            v-if="currentAlert?.level === 'L2' && currentAlert?.status !== 'CLOSED'"
            class="btn-primary px-5 py-2 text-sm flex items-center gap-2"
            @click="$router.push('/alerts/approval')"
          >
            <FileCheck class="w-4 h-4" />
            前往审批
          </button>
          <button class="btn-ghost px-5 py-2 text-sm" @click="detailModalVisible = false">
            关闭
          </button>
        </div>
      </template>
    </Modal>
  </AppLayout>
</template>
