<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import ApprovalTimeline from '@/components/ApprovalTimeline.vue'
import {
  FileCheck,
  Search,
  Check,
  XCircle,
  Clock,
  User,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  Building2,
  Landmark,
  Thermometer,
  Package,
  Cog,
  ArrowLeft,
  AlertTriangle,
  BadgeCheck,
  Ban,
} from 'lucide-vue-next'
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAlertsStore } from '@/stores/alerts'
import { useUserStore } from '@/stores/user'
import { mockGetAlertById } from '@/mock'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import type { ApprovalFlow, ApprovalStep, ApprovalResult, Alert } from '@/types'

const router = useRouter()
const alertsStore = useAlertsStore()
const userStore = useUserStore()

const search = ref('')
const statusFilter = ref<string>('')
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const selectedFlow = ref<ApprovalFlow | null>(null)
const selectedAlert = ref<Alert | null>(null)
const detailTab = ref<'alert' | 'flow'>('alert')
const submitting = ref(false)

const stepForm = reactive({
  isConfirmed: null as boolean | null,
  suggestion: '' as '' | 'TRANSFER' | 'SCRAP',
  lossDoses: '' as string,
  opinion: '' as string,
  cityAgree: null as boolean | null,
  cityMeasures: [] as string[],
  cityOpinion: '' as string,
  provinceAgree: null as boolean | null,
  approvalNo: '' as string,
  resources: '' as string,
  provinceOpinion: '' as string,
})

function resetStepForm() {
  stepForm.isConfirmed = null
  stepForm.suggestion = ''
  stepForm.lossDoses = ''
  stepForm.opinion = ''
  stepForm.cityAgree = null
  stepForm.cityMeasures = []
  stepForm.cityOpinion = ''
  stepForm.provinceAgree = null
  stepForm.approvalNo = ''
  stepForm.resources = ''
  stepForm.provinceOpinion = ''
}

async function loadData() {
  loading.value = true
  try {
    await alertsStore.fetchAlerts()
    if (filtered.value.length > 0 && !selectedFlow.value) {
      selectFlow(filtered.value[0])
    }
  } finally {
    loading.value = false
  }
}

async function selectFlow(flow: ApprovalFlow) {
  selectedFlow.value = flow
  resetStepForm()
  const alert = mockGetAlertById(flow.alertId)
  selectedAlert.value = alert || null
}

const canHandleStep = computed(() => (flow: ApprovalFlow) => {
  const user = userStore.userInfo
  if (!user) return false
  if (user.level === 1) return true
  if (user.role === 'COLD_CHAIN') return flow.currentStep === 'ADMIN_CONFIRM'
  if (user.level === 3 || user.role === 'CITY') return flow.currentStep === 'CITY_REVIEW'
  if (user.level === 2 || user.role === 'PROVINCE') return flow.currentStep === 'PROVINCE_APPROVE'
  return false
})

const isStepPending = (flow: ApprovalFlow) => {
  const node = flow.steps.find(s => s.step === flow.currentStep)
  return node && node.status === 'PENDING'
}

const getApprovalStatus = (approval: ApprovalFlow): string => {
  const stepOrder: string[] = ['ADMIN_CONFIRM', 'CITY_REVIEW', 'PROVINCE_APPROVE']
  const currentIdx = stepOrder.indexOf(approval.currentStep)
  const allApproved = approval.steps.every((s) => s.status === 'APPROVED')
  const anyRejected = approval.steps.some((s) => s.status === 'REJECTED')
  if (anyRejected) return 'REJECTED'
  if (allApproved) return 'APPROVED'
  if (currentIdx >= 0 && currentIdx < stepOrder.length) return 'PENDING'
  return 'PENDING'
}

const isMyTask = computed(() => {
  if (!selectedFlow.value) return false
  return canHandleStep.value(selectedFlow.value) && isStepPending(selectedFlow.value)
})

const approvalsFilteredByRole = computed(() => {
  const all = alertsStore.myApprovals as ApprovalFlow[]
  const user = userStore.userInfo
  if (!user) return all

  if (user.level === 1) return all

  return all.filter((flow) => canHandleStep.value(flow))
})

const pendingCount = computed(() => approvalsFilteredByRole.value.filter((a) => getApprovalStatus(a) === 'PENDING' && isStepPending(a)).length)
const approvedCount = computed(() => approvalsFilteredByRole.value.filter((a) => getApprovalStatus(a) === 'APPROVED').length)
const rejectedCount = computed(() => approvalsFilteredByRole.value.filter((a) => getApprovalStatus(a) === 'REJECTED').length)

const filtered = computed(() => {
  let list = approvalsFilteredByRole.value
  if (statusFilter.value) list = list.filter((a) => getApprovalStatus(a) === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (a) => {
        const alert = mockGetAlertById(a.alertId)
        return a.id.toLowerCase().includes(q) ||
          (alert?.title?.toLowerCase().includes(q)) ||
          (alert?.province?.toLowerCase().includes(q))
      }
    )
  }
  return list
})

const step1Valid = computed(() => {
  return stepForm.isConfirmed !== null
    && stepForm.suggestion
    && stepForm.lossDoses
    && stepForm.opinion.trim()
})

const step2Valid = computed(() => {
  return stepForm.cityAgree !== null
    && stepForm.cityMeasures.length > 0
    && stepForm.cityOpinion.trim()
})

const step3Valid = computed(() => {
  return stepForm.provinceAgree !== null
    && stepForm.approvalNo.trim()
    && stepForm.provinceOpinion.trim()
})

const submitValid = computed(() => {
  if (!selectedFlow.value) return false
  if (selectedFlow.value.currentStep === 'ADMIN_CONFIRM') return step1Valid.value
  if (selectedFlow.value.currentStep === 'CITY_REVIEW') return step2Valid.value
  if (selectedFlow.value.currentStep === 'PROVINCE_APPROVE') return step3Valid.value
  return false
})

function getAlertForFlow(flow: ApprovalFlow): Alert | null {
  return mockGetAlertById(flow.alertId)
}

function toggleCityMeasure(measure: string) {
  const idx = stepForm.cityMeasures.indexOf(measure)
  if (idx >= 0) {
    stepForm.cityMeasures.splice(idx, 1)
  } else {
    stepForm.cityMeasures.push(measure)
  }
}

async function handleSubmit(pass: boolean) {
  if (!selectedFlow.value || !submitValid.value && pass) return
  submitting.value = true

  try {
    let opinion = ''
    let result: ApprovalResult | undefined = undefined
    const step = selectedFlow.value.currentStep

    if (step === 'ADMIN_CONFIRM') {
      opinion = pass
        ? `【确认${stepForm.isConfirmed ? '属实' : '不属实'}】建议方案：${stepForm.suggestion === 'TRANSFER' ? '紧急调拨' : '报废'}，损失评估：${stepForm.lossDoses}剂。${stepForm.opinion}`
        : stepForm.opinion
      if (pass && stepForm.suggestion) {
        result = stepForm.suggestion as ApprovalResult
      }
    } else if (step === 'CITY_REVIEW') {
      opinion = pass
        ? `【${stepForm.cityAgree ? '同意' : '退回'}】补充措施：${stepForm.cityMeasures.join('、')}。${stepForm.cityOpinion}`
        : stepForm.cityOpinion
    } else if (step === 'PROVINCE_APPROVE') {
      opinion = pass
        ? `【${stepForm.provinceAgree ? '批准' : '退回重审'}】批准文号：${stepForm.approvalNo}，调配资源：${stepForm.resources || '无'}。${stepForm.provinceOpinion}`
        : stepForm.provinceOpinion
      if (pass) {
        if ((selectedAlert.value?.stock || stepForm.suggestion === 'TRANSFER')) {
          result = 'TRANSFER'
        } else {
          result = 'SCRAP'
        }
      }
    }

    await alertsStore.approveStep(selectedFlow.value.id, step, opinion, pass, result)

    await loadData()

    if (step === 'PROVINCE_APPROVE' && pass) {
      setTimeout(() => {
        router.push('/alerts')
      }, 800)
    }
  } finally {
    submitting.value = false
  }
}

const columns: DataTableColumn<ApprovalFlow>[] = [
  { key: 'id', title: '审批编号', width: 140 },
  {
    key: 'alertTitle',
    title: '关联预警',
    width: 220,
    ellipsis: true,
    render: (row) => {
      const alert = getAlertForFlow(row)
      return alert?.title ?? '-'
    },
  },
  {
    key: 'alertLevel',
    title: '预警级别',
    width: 90,
    align: 'center',
    render: (row) => {
      const alert = getAlertForFlow(row)
      return alert?.level === 'L2'
        ? '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-danger-500/20 text-danger-400 border border-danger-500/30">二级</span>'
        : '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-warning-500/20 text-warning-400 border border-warning-500/30">一级</span>'
    },
  },
  {
    key: 'currentStep',
    title: '当前节点',
    width: 130,
    align: 'center',
    render: (row) => {
      const map: Record<ApprovalStep, string> = {
        ADMIN_CONFIRM: '<span class="text-warning-400">冷链确认</span>',
        CITY_REVIEW: '<span class="text-primary-400">市级复核</span>',
        PROVINCE_APPROVE: '<span class="text-[#722ED1]">省级批准</span>',
      }
      return map[row.currentStep]
    },
  },
  {
    key: 'currentStatus',
    title: '审批状态',
    width: 100,
    align: 'center',
    render: (row) => {
      const status = getApprovalStatus(row)
      const isMine = canHandleStep.value(row) && isStepPending(row)
      if (isMine) {
        return '<span class="text-primary-400 font-medium">待我处理</span>'
      }
      if (status === 'APPROVED') return '<span class="text-success-400">已通过</span>'
      if (status === 'REJECTED') return '<span class="text-danger-400">已驳回</span>'
      return '<span class="text-text-tertiary">处理中</span>'
    },
  },
  {
    key: 'submitTime',
    title: '提交时间',
    width: 150,
    render: (row) => {
      const alert = getAlertForFlow(row)
      return alert?.triggerTime ?? '-'
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
              placeholder="搜索审批编号/预警内容/地点..."
              class="w-full h-10 pl-10 pr-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary"
            />
          </div>
          <select
            v-model="statusFilter"
            class="h-10 px-3 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary cursor-pointer min-w-[140px]"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待处理</option>
            <option value="APPROVED">已通过</option>
            <option value="REJECTED">已驳回</option>
          </select>
          <div class="flex-1"></div>
          <button class="btn-ghost h-10 flex items-center gap-2 text-sm" @click="loadData">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            刷新
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div
          v-for="(kpi, idx) in [
            { label: '待我审批', value: pendingCount, icon: Clock, color: 'warning' },
            { label: '已通过', value: approvedCount, icon: Check, color: 'success' },
            { label: '已驳回', value: rejectedCount, icon: XCircle, color: 'danger' },
          ]"
          :key="kpi.label"
          class="panel p-5 animate-fade-in-up cursor-pointer transition-all hover:border-primary-500/60"
          :class="{ 'border-primary-500 shadow-glow-blue': idx === 0 }"
          :style="{ animationDelay: `${idx * 0.05}s` }"
          @click="statusFilter = idx === 0 ? 'PENDING' : idx === 1 ? 'APPROVED' : 'REJECTED'"
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

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
        <div class="lg:col-span-3 panel p-5 min-h-0 flex flex-col">
          <h3 class="panel-title mb-4 shrink-0">待办审批列表</h3>
          <div class="flex-1 min-h-0">
            <DataTable
              :columns="columns"
              :data="filtered"
              :total="filtered.length"
              :loading="loading"
              v-model:page="page"
              v-model:page-size="pageSize"
              @row-click="(row: any) => selectFlow(row)"
            >
              <template #cell-actions="{ row }">
                <div class="flex items-center gap-1" v-if="canHandleStep(row) && isStepPending(row)">
                  <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-primary-500/15 text-primary-400 border border-primary-500/30 animate-pulse">
                    待我处理
                  </span>
                </div>
                <div v-else-if="row.result">
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-medium"
                    :class="row.result === 'TRANSFER' ? 'bg-success-500/15 text-success-400 border border-success-500/30' : 'bg-danger-500/15 text-danger-400 border border-danger-500/30'"
                  >
                    {{ row.result === 'TRANSFER' ? '调拨完成' : '报废处理' }}
                  </span>
                </div>
                <div v-else class="flex items-center gap-1">
                  <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-bg-tertiary/50 text-text-tertiary border border-default/50">
                    已处理
                  </span>
                </div>
              </template>
            </DataTable>
          </div>
        </div>

        <div class="lg:col-span-2 panel p-5 min-h-0 flex flex-col">
          <h3 class="panel-title mb-4 shrink-0 flex items-center justify-between">
            <span>审批详情</span>
            <button
              v-if="selectedFlow"
              class="text-xs text-text-tertiary hover:text-primary-400 flex items-center gap-1 transition-colors"
              @click="$router.push('/alerts')"
            >
              <ArrowLeft class="w-3 h-3" />
              返回预警
            </button>
          </h3>

          <div v-if="selectedFlow && selectedAlert" class="flex-1 overflow-y-auto pr-1 flex flex-col min-h-0">
            <div class="mb-4 shrink-0">
              <div class="flex border-b border-default mb-0">
                <button
                  class="px-4 py-2.5 text-sm font-medium border-b-2 transition-all"
                  :class="detailTab === 'alert' ? 'border-primary-500 text-primary-400' : 'border-transparent text-text-tertiary hover:text-text-secondary'"
                  @click="detailTab = 'alert'"
                >
                  预警详情
                </button>
                <button
                  class="px-4 py-2.5 text-sm font-medium border-b-2 transition-all"
                  :class="detailTab === 'flow' ? 'border-primary-500 text-primary-400' : 'border-transparent text-text-tertiary hover:text-text-secondary'"
                  @click="detailTab = 'flow'"
                >
                  审批流程
                </button>
              </div>
            </div>

            <div v-if="detailTab === 'alert'" class="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
              <div class="p-4 rounded-xl" style="background: rgba(24,144,255,0.04); border: 1px solid rgba(24,144,255,0.12);">
                <div class="flex items-center gap-2 mb-3">
                  <FileCheck class="w-5 h-5 text-primary-400 shrink-0" />
                  <span class="font-bold text-text-primary">{{ selectedAlert?.title ?? '-' }}</span>
                </div>
                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div class="text-text-tertiary mb-1">审批编号</div>
                    <div class="font-mono text-text-primary">{{ selectedFlow.id }}</div>
                  </div>
                  <div>
                    <div class="text-text-tertiary mb-1">预警级别</div>
                    <div
                      class="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
                      :class="selectedAlert?.level === 'L2' ? 'bg-danger-500/20 text-danger-400 border border-danger-500/30' : 'bg-warning-500/20 text-warning-400 border border-warning-500/30'"
                    >
                      {{ selectedAlert?.level === 'L2' ? '二级预警' : '一级预警' }}
                    </div>
                  </div>
                  <div>
                    <div class="text-text-tertiary mb-1">所在地区</div>
                    <div class="flex items-center gap-1 text-text-primary">
                      {{ selectedAlert?.province }} / {{ selectedAlert?.city }}
                    </div>
                  </div>
                  <div>
                    <div class="text-text-tertiary mb-1">触发时间</div>
                    <div class="text-text-primary">{{ selectedAlert?.triggerTime ?? '-' }}</div>
                  </div>
                </div>
                <div class="mt-3 pt-3 border-t border-default/50">
                  <div class="text-text-tertiary mb-1 text-xs">预警描述</div>
                  <div class="text-sm text-text-primary leading-relaxed">{{ selectedAlert?.description ?? '-' }}</div>
                </div>
              </div>

              <div
                v-if="selectedAlert?.temperature"
                class="rounded-lg px-4 py-3 text-xs"
                style="background: rgba(24,144,255,0.06); border: 1px solid rgba(24,144,255,0.15)"
              >
                <div class="flex items-center gap-2 mb-2">
                  <Thermometer class="w-4 h-4 text-primary-400" />
                  <span class="font-medium text-text-primary">温度监测数据</span>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <span class="text-text-tertiary">冷库：</span>
                    <span class="text-text-primary">{{ selectedAlert.temperature.coldStoreName }}</span>
                  </div>
                  <div>
                    <span class="text-text-tertiary">当前：</span>
                    <span class="font-mono font-bold text-danger-400">{{ selectedAlert.temperature.current }}°C</span>
                  </div>
                  <div>
                    <span class="text-text-tertiary">阈值：</span>
                    <span class="font-mono text-text-primary">{{ selectedAlert.temperature.min }}~{{ selectedAlert.temperature.max }}°C</span>
                  </div>
                  <div>
                    <span class="text-text-tertiary">持续：</span>
                    <span class="text-text-primary">{{ selectedAlert.temperature.duration }}分钟</span>
                  </div>
                </div>
              </div>

              <div
                v-if="selectedAlert?.stock"
                class="rounded-lg px-4 py-3 text-xs"
                style="background: rgba(250,173,20,0.06); border: 1px solid rgba(250,173,20,0.15)"
              >
                <div class="flex items-center gap-2 mb-2">
                  <Package class="w-4 h-4 text-warning-400" />
                  <span class="font-medium text-text-primary">库存监测数据</span>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <span class="text-text-tertiary">疫苗：</span>
                    <span class="text-text-primary">{{ selectedAlert.stock.vaccineName }}</span>
                  </div>
                  <div>
                    <span class="text-text-tertiary">批次：</span>
                    <span class="font-mono text-text-primary">{{ selectedAlert.stock.batchNo }}</span>
                  </div>
                  <div>
                    <span class="text-text-tertiary">当前库存：</span>
                    <span class="font-mono font-bold text-warning-400">{{ selectedAlert.stock.current }}剂</span>
                  </div>
                  <div>
                    <span class="text-text-tertiary">3日警戒线：</span>
                    <span class="font-mono text-danger-400">{{ selectedAlert.stock.threshold }}剂</span>
                  </div>
                </div>
              </div>

              <div
                v-if="selectedAlert?.device"
                class="rounded-lg px-4 py-3 text-xs"
                style="background: rgba(114,46,209,0.06); border: 1px solid rgba(114,46,209,0.15)"
              >
                <div class="flex items-center gap-2 mb-2">
                  <Cog class="w-4 h-4" style="color: #722ED1" />
                  <span class="font-medium text-text-primary">设备故障数据</span>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <span class="text-text-tertiary">设备：</span>
                    <span class="text-text-primary">{{ selectedAlert.device.deviceName }}</span>
                  </div>
                  <div>
                    <span class="text-text-tertiary">型号：</span>
                    <span class="font-mono text-text-primary">{{ selectedAlert.device.deviceModel }}</span>
                  </div>
                  <div class="col-span-2">
                    <span class="text-text-tertiary">故障类型：</span>
                    <span class="text-text-primary">{{ selectedAlert.device.faultType }}</span>
                  </div>
                </div>
              </div>

              <div class="rounded-lg border border-default overflow-hidden">
                <div class="px-4 py-2.5 bg-bg-secondary/60 border-b border-default">
                  <div class="text-xs font-medium text-text-primary flex items-center gap-1.5">
                    <MessageSquare class="w-3.5 h-3.5 text-primary-400" />
                    处置与审批记录
                  </div>
                </div>
                <div class="max-h-[180px] overflow-y-auto divide-y divide-default/50">
                  <div
                    v-for="(log, idx) in selectedAlert?.handleLogs ?? []"
                    :key="idx"
                    class="px-4 py-2.5 text-xs hover:bg-white/[0.02]"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <div class="flex items-center gap-1.5">
                        <span class="font-medium text-text-primary">{{ log.operator }}</span>
                        <span class="text-text-tertiary">·</span>
                        <span class="text-text-tertiary">{{ log.role }}</span>
                      </div>
                      <span class="text-text-tertiary font-mono">{{ log.time }}</span>
                    </div>
                    <div class="flex items-start gap-2">
                      <span class="px-1.5 py-0.5 rounded bg-bg-tertiary/60 text-text-secondary text-[10px] shrink-0">
                        {{ log.action }}
                      </span>
                      <span class="text-text-secondary leading-relaxed">{{ log.remark }}</span>
                    </div>
                  </div>
                  <div v-if="!selectedAlert?.handleLogs?.length" class="px-4 py-6 text-center text-xs text-text-tertiary">
                    暂无记录
                  </div>
                </div>
              </div>
            </div>

            <div v-if="detailTab === 'flow'" class="flex-1 min-h-0 overflow-y-auto pr-1">
              <ApprovalTimeline :approval="selectedFlow as any" />
            </div>

            <div v-if="isMyTask" class="mt-4 pt-4 border-t border-default shrink-0">
              <div class="mb-3 flex items-center gap-2">
                <div
                  class="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  :class="{
                    'bg-warning-500/20 text-warning-400': selectedFlow.currentStep === 'ADMIN_CONFIRM',
                    'bg-primary-500/20 text-primary-400': selectedFlow.currentStep === 'CITY_REVIEW',
                    'bg-[rgba(114,46,209,0.2)] text-[#9254DE]': selectedFlow.currentStep === 'PROVINCE_APPROVE',
                  }"
                >
                  <ShieldAlert v-if="selectedFlow.currentStep === 'ADMIN_CONFIRM'" class="w-3.5 h-3.5" />
                  <Building2 v-else-if="selectedFlow.currentStep === 'CITY_REVIEW'" class="w-3.5 h-3.5" />
                  <Landmark v-else class="w-3.5 h-3.5" />
                </div>
                <span class="font-semibold text-text-primary text-sm">
                  {{ selectedFlow.currentStep === 'ADMIN_CONFIRM' ? 'Step 1：冷链管理员确认' :
                     selectedFlow.currentStep === 'CITY_REVIEW' ? 'Step 2：市级疾控复核' :
                     'Step 3：省级卫健委批准' }}
                </span>
                <span class="ml-auto text-[10px] px-2 py-0.5 rounded bg-primary-500/15 text-primary-400 border border-primary-500/30 animate-pulse">
                  待处理
                </span>
              </div>

              <div v-if="selectedFlow.currentStep === 'ADMIN_CONFIRM'" class="space-y-3">
                <div>
                  <label class="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
                    现场情况是否属实 <span class="text-danger-400">*</span>
                  </label>
                  <div class="flex gap-2">
                    <button
                      class="flex-1 h-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 border"
                      :class="stepForm.isConfirmed === true
                        ? 'bg-success-500/20 text-success-400 border-success-500/40'
                        : 'bg-bg-secondary text-text-secondary border-default hover:border-success-500/40'"
                      @click="stepForm.isConfirmed = true"
                    >
                      <BadgeCheck class="w-3.5 h-3.5" />
                      属实
                    </button>
                    <button
                      class="flex-1 h-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 border"
                      :class="stepForm.isConfirmed === false
                        ? 'bg-danger-500/20 text-danger-400 border-danger-500/40'
                        : 'bg-bg-secondary text-text-secondary border-default hover:border-danger-500/40'"
                      @click="stepForm.isConfirmed = false"
                    >
                      <Ban class="w-3.5 h-3.5" />
                      不属实
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
                    建议方案 <span class="text-danger-400">*</span>
                  </label>
                  <div class="flex gap-2">
                    <button
                      class="flex-1 h-9 rounded-lg text-xs font-medium transition-all border"
                      :class="stepForm.suggestion === 'TRANSFER'
                        ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                        : 'bg-bg-secondary text-text-secondary border-default hover:border-primary-500/40'"
                      @click="stepForm.suggestion = 'TRANSFER'"
                    >
                      紧急调拨
                    </button>
                    <button
                      class="flex-1 h-9 rounded-lg text-xs font-medium transition-all border"
                      :class="stepForm.suggestion === 'SCRAP'
                        ? 'bg-danger-500/20 text-danger-400 border-danger-500/40'
                        : 'bg-bg-secondary text-text-secondary border-default hover:border-danger-500/40'"
                      @click="stepForm.suggestion = 'SCRAP'"
                    >
                      报废处理
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
                    损失评估（剂） <span class="text-danger-400">*</span>
                  </label>
                  <input
                    v-model="stepForm.lossDoses"
                    type="number"
                    placeholder="请输入预估损失剂数"
                    class="w-full h-9 px-3 bg-bg-secondary border border-default rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label class="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
                    确认意见 <span class="text-danger-400">*</span>
                  </label>
                  <textarea
                    v-model="stepForm.opinion"
                    rows="3"
                    placeholder="请填写现场核实意见..."
                    class="w-full px-3 py-2 bg-bg-secondary border border-default rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-500 resize-none"
                  ></textarea>
                </div>
              </div>

              <div v-if="selectedFlow.currentStep === 'CITY_REVIEW'" class="space-y-3">
                <div>
                  <label class="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
                    复核结果 <span class="text-danger-400">*</span>
                  </label>
                  <div class="flex gap-2">
                    <button
                      class="flex-1 h-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 border"
                      :class="stepForm.cityAgree === true
                        ? 'bg-success-500/20 text-success-400 border-success-500/40'
                        : 'bg-bg-secondary text-text-secondary border-default hover:border-success-500/40'"
                      @click="stepForm.cityAgree = true"
                    >
                      <Check class="w-3.5 h-3.5" />
                      同意上一步意见
                    </button>
                    <button
                      class="flex-1 h-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 border"
                      :class="stepForm.cityAgree === false
                        ? 'bg-warning-500/20 text-warning-400 border-warning-500/40'
                        : 'bg-bg-secondary text-text-secondary border-default hover:border-warning-500/40'"
                      @click="stepForm.cityAgree = false"
                    >
                      <XCircle class="w-3.5 h-3.5" />
                      退回补充
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
                    补充措施（多选） <span class="text-danger-400">*</span>
                  </label>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="m in ['加强温度监控', '增加备用设备', '协调邻近库存', '安排紧急运输', '启动应急预案', '通知相关部门']"
                      :key="m"
                      class="h-8 px-3 rounded-lg text-xs transition-all border text-left"
                      :class="stepForm.cityMeasures.includes(m)
                        ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                        : 'bg-bg-secondary text-text-secondary border-default hover:border-primary-500/40'"
                      @click="toggleCityMeasure(m)"
                    >
                      {{ m }}
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
                    复核意见 <span class="text-danger-400">*</span>
                  </label>
                  <textarea
                    v-model="stepForm.cityOpinion"
                    rows="3"
                    placeholder="请填写市级复核意见..."
                    class="w-full px-3 py-2 bg-bg-secondary border border-default rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-500 resize-none"
                  ></textarea>
                </div>
              </div>

              <div v-if="selectedFlow.currentStep === 'PROVINCE_APPROVE'" class="space-y-3">
                <div>
                  <label class="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
                    批准结果 <span class="text-danger-400">*</span>
                  </label>
                  <div class="flex gap-2">
                    <button
                      class="flex-1 h-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 border"
                      :class="stepForm.provinceAgree === true
                        ? 'bg-success-500/20 text-success-400 border-success-500/40'
                        : 'bg-bg-secondary text-text-secondary border-default hover:border-success-500/40'"
                      @click="stepForm.provinceAgree = true"
                    >
                      <Check class="w-3.5 h-3.5" />
                      批准执行
                    </button>
                    <button
                      class="flex-1 h-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 border"
                      :class="stepForm.provinceAgree === false
                        ? 'bg-warning-500/20 text-warning-400 border-warning-500/40'
                        : 'bg-bg-secondary text-text-secondary border-default hover:border-warning-500/40'"
                      @click="stepForm.provinceAgree = false"
                    >
                      <XCircle class="w-3.5 h-3.5" />
                      退回重审
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
                    批准文号 <span class="text-danger-400">*</span>
                  </label>
                  <input
                    v-model="stepForm.approvalNo"
                    type="text"
                    placeholder="如：WJW-2026-06-XXXX"
                    class="w-full h-9 px-3 bg-bg-secondary border border-default rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label class="block text-xs text-text-secondary mb-1.5">
                    调配资源
                  </label>
                  <input
                    v-model="stepForm.resources"
                    type="text"
                    placeholder="如：从XX省调拨XXX剂、调配冷藏车X辆..."
                    class="w-full h-9 px-3 bg-bg-secondary border border-default rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label class="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
                    最终意见 <span class="text-danger-400">*</span>
                  </label>
                  <textarea
                    v-model="stepForm.provinceOpinion"
                    rows="3"
                    placeholder="请填写省级最终批准意见..."
                    class="w-full px-3 py-2 bg-bg-secondary border border-default rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-500 resize-none"
                  ></textarea>
                </div>
              </div>

              <div class="mt-4 flex gap-2">
                <button
                  class="flex-1 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                  :class="submitValid
                    ? 'text-white cursor-pointer hover:-translate-y-0.5'
                    : 'bg-bg-tertiary/50 text-text-tertiary cursor-not-allowed'"
                  :style="submitValid ? { background: 'linear-gradient(135deg, #52C41A 0%, #389E0D 100%)', boxShadow: '0 2px 8px rgba(82,196,26,0.3)' } : {}"
                  :disabled="!submitValid || submitting"
                  @click="handleSubmit(true)"
                >
                  <Check class="w-4 h-4" />
                  {{ submitting ? '提交中...' : '通过 / 批准' }}
                </button>
                <button
                  class="flex-1 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 text-white cursor-pointer hover:-translate-y-0.5"
                  :style="{ background: 'linear-gradient(135deg, #F5222D 0%, #CF1322 100%)', boxShadow: '0 2px 8px rgba(245,34,45,0.3)' }"
                  :disabled="submitting"
                  @click="handleSubmit(false)"
                >
                  <XCircle class="w-4 h-4" />
                  {{ submitting ? '提交中...' : '退回 / 驳回' }}
                </button>
              </div>
            </div>
          </div>
          <div v-else-if="selectedFlow && !selectedAlert" class="flex-1 flex items-center justify-center text-text-tertiary text-sm">
            <div class="text-center">
              <AlertTriangle class="w-12 h-12 mx-auto mb-3 opacity-30" />
              <div>关联预警数据加载失败</div>
            </div>
          </div>
          <div v-else class="flex-1 flex items-center justify-center text-text-tertiary text-sm">
            <div class="text-center">
              <FileCheck class="w-12 h-12 mx-auto mb-3 opacity-30" />
              <div>请从左侧列表选择一条审批记录</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
