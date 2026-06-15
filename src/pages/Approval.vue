<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import ApprovalTimeline from '@/components/ApprovalTimeline.vue'
import { FileCheck, Search, Check, XCircle, Clock, User, ChevronRight, RefreshCw, MessageSquare } from 'lucide-vue-next'
import { ref, computed, onMounted, markRaw } from 'vue'
import { mockGetMyApprovals, type ApprovalFlow, type ApprovalNode } from '@/mock'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'

const myApprovals = ref<ApprovalFlow[]>([])
const search = ref('')
const statusFilter = ref<string>('')
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const selectedFlow = ref<ApprovalFlow | null>(null)
const approvalModalVisible = ref(false)
const rejectModalVisible = ref(false)
const rejectReason = ref('')
const currentApproval = ref<ApprovalFlow | null>(null)
const submitting = ref(false)

function loadData() {
  loading.value = true
  try {
    myApprovals.value = mockGetMyApprovals()
    if (myApprovals.value.length > 0) {
      selectedFlow.value = myApprovals.value[0]
    }
  } finally {
    loading.value = false
  }
}

function getApprovalStatus(approval: ApprovalFlow): string {
  const stepOrder: string[] = ['ADMIN_CONFIRM', 'CITY_REVIEW', 'PROVINCE_APPROVE']
  const currentIdx = stepOrder.indexOf(approval.currentStep)
  const allApproved = approval.steps.every((s) => s.status === 'APPROVED')
  const anyRejected = approval.steps.some((s) => s.status === 'REJECTED')
  if (anyRejected) return 'REJECTED'
  if (allApproved) return 'APPROVED'
  if (currentIdx >= 0 && currentIdx < stepOrder.length) return 'PENDING'
  return 'PENDING'
}

const pendingCount = computed(() => myApprovals.value.filter((a) => getApprovalStatus(a) === 'PENDING').length)
const approvedCount = computed(() => myApprovals.value.filter((a) => getApprovalStatus(a) === 'APPROVED').length)
const rejectedCount = computed(() => myApprovals.value.filter((a) => getApprovalStatus(a) === 'REJECTED').length)

const filtered = computed(() => {
  let list = myApprovals.value
  if (statusFilter.value) list = list.filter((a) => getApprovalStatus(a) === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        (a as any).alertTitle?.toLowerCase().includes(q) ||
        (a as any).applicant?.toLowerCase().includes(q)
    )
  }
  return list
})

function openApprovalModal(flow: ApprovalFlow) {
  currentApproval.value = flow
  approvalModalVisible.value = true
}

function openRejectModal(flow: ApprovalFlow) {
  currentApproval.value = flow
  rejectReason.value = ''
  rejectModalVisible.value = true
}

async function handleApprove() {
  submitting.value = true
  try {
    await new Promise((r) => setTimeout(r, 600))
    if (currentApproval.value) {
      const step = currentApproval.value.steps.find((s) => s.step === currentApproval.value!.currentStep)
      if (step) step.status = 'APPROVED'
      ;(currentApproval.value as any).currentStatus = 'APPROVED'
    }
    approvalModalVisible.value = false
  } finally {
    submitting.value = false
  }
}

async function handleReject() {
  submitting.value = true
  try {
    await new Promise((r) => setTimeout(r, 600))
    if (currentApproval.value) {
      const step = currentApproval.value.steps.find((s) => s.step === currentApproval.value!.currentStep)
      if (step) step.status = 'REJECTED'
      ;(currentApproval.value as any).currentStatus = 'REJECTED'
    }
    rejectModalVisible.value = false
  } finally {
    submitting.value = false
  }
}

const columns: DataTableColumn<ApprovalFlow>[] = [
  { key: 'id', title: '审批编号', width: 140 },
  { key: 'alertTitle', title: '关联预警', width: 220, ellipsis: true, render: (row) => (row as any).alertTitle ?? '-' },
  { key: 'applicant', title: '申请人', width: 100, render: (row) => (row as any).applicant ?? '-' },
  {
    key: 'alertLevel',
    title: '预警级别',
    width: 100,
    align: 'center',
    render: (row) =>
      (row as any).alertLevel === 'L2'
        ? '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-danger-500/20 text-danger-400 border border-danger-500/30">二级</span>'
        : '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-warning-500/20 text-warning-400 border border-warning-500/30">一级</span>',
  },
  {
    key: 'currentStatus',
    title: '审批状态',
    width: 100,
    align: 'center',
    render: (row) => {
      const status = getApprovalStatus(row)
      const map: Record<string, string> = {
        PENDING: '<span class="text-warning-400">待审批</span>',
        APPROVED: '<span class="text-success-400">已通过</span>',
        REJECTED: '<span class="text-danger-400">已驳回</span>',
      }
      return map[status] || status
    },
  },
  { key: 'submitTime', title: '提交时间', width: 160, render: (row) => (row as any).submitTime ?? '-' },
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
              placeholder="搜索审批编号/预警内容/申请人..."
              class="w-full h-10 pl-10 pr-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary"
            />
          </div>
          <select
            v-model="statusFilter"
            class="h-10 px-3 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary cursor-pointer min-w-[140px]"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待审批</option>
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
              @row-click="(row: any) => selectedFlow = row"
            >
              <template #cell-actions="{ row }">
                <div class="flex items-center gap-1" v-if="getApprovalStatus(row) === 'PENDING'">
                  <button
                    class="px-3 py-1.5 rounded-md text-xs font-medium bg-success-500/15 text-success-400 hover:bg-success-500/25 transition-all flex items-center gap-1"
                    @click.stop="openApprovalModal(row)"
                  >
                    <Check class="w-3.5 h-3.5" />
                    通过
                  </button>
                  <button
                    class="px-3 py-1.5 rounded-md text-xs font-medium bg-danger-500/15 text-danger-400 hover:bg-danger-500/25 transition-all flex items-center gap-1"
                    @click.stop="openRejectModal(row)"
                  >
                    <XCircle class="w-3.5 h-3.5" />
                    驳回
                  </button>
                </div>
                <div v-else class="flex items-center gap-1">
                  <button
                    class="px-3 py-1.5 rounded-md text-xs font-medium bg-bg-tertiary/50 text-text-secondary hover:bg-primary-500/10 hover:text-primary-300 transition-all flex items-center gap-1"
                    @click.stop="selectedFlow = row"
                  >
                    <ChevronRight class="w-3.5 h-3.5" />
                    详情
                  </button>
                </div>
              </template>
            </DataTable>
          </div>
        </div>

        <div class="lg:col-span-2 panel p-5 min-h-0 flex flex-col">
          <h3 class="panel-title mb-4 shrink-0">审批详情</h3>
          <div v-if="selectedFlow" class="flex-1 overflow-y-auto pr-1">
            <div class="mb-5 p-4 rounded-xl" style="background: rgba(24,144,255,0.04); border: 1px solid rgba(24,144,255,0.12);">
              <div class="flex items-center gap-2 mb-3">
                <FileCheck class="w-5 h-5 text-primary-400" />
                <span class="font-bold text-text-primary">{{ (selectedFlow as any)?.alertTitle ?? '-' }}</span>
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
                    :class="(selectedFlow as any)?.alertLevel === 'L2' ? 'bg-danger-500/20 text-danger-400 border border-danger-500/30' : 'bg-warning-500/20 text-warning-400 border border-warning-500/30'"
                  >
                    {{ (selectedFlow as any)?.alertLevel === 'L2' ? '二级预警' : '一级预警' }}
                  </div>
                </div>
                <div>
                  <div class="text-text-tertiary mb-1">申请人</div>
                  <div class="flex items-center gap-1 text-text-primary">
                    <User class="w-3 h-3" />
                    {{ (selectedFlow as any)?.applicant ?? '-' }}
                  </div>
                </div>
                <div>
                  <div class="text-text-tertiary mb-1">提交时间</div>
                  <div class="text-text-primary">{{ (selectedFlow as any)?.submitTime ?? '-' }}</div>
                </div>
              </div>
              <div class="mt-3 pt-3 border-t border-default/50">
                <div class="text-text-tertiary mb-1 text-xs">申请说明</div>
                <div class="text-sm text-text-primary leading-relaxed">{{ (selectedFlow as any)?.description ?? '-' }}</div>
              </div>
            </div>
            <ApprovalTimeline :approval="selectedFlow as any" />
          </div>
          <div v-else class="flex-1 flex items-center justify-center text-text-tertiary text-sm">
            请从左侧列表选择一条审批记录
          </div>
        </div>
      </div>
    </div>

    <!-- 审批通过 Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="approvalModalVisible" class="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div class="absolute inset-0 backdrop-blur-sm bg-black/50" @click="approvalModalVisible = false" />
          <div class="relative panel w-full max-w-md shadow-glow-blue animate-fade-in-up p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-11 h-11 rounded-xl bg-success-500/15 text-success-400 flex items-center justify-center shrink-0">
                <Check class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-text-primary">确认通过审批？</h3>
                <p class="text-xs text-text-tertiary mt-0.5">审批编号：{{ currentApproval?.id }}</p>
              </div>
            </div>
            <div class="mb-6 p-4 rounded-lg bg-bg-secondary/60 border border-default">
              <div class="text-sm text-text-secondary mb-2">关联预警</div>
              <div class="font-medium text-text-primary">{{ (currentApproval as any)?.alertTitle ?? '-' }}</div>
            </div>
            <div class="flex items-center justify-end gap-3">
              <button class="btn-ghost px-5 py-2 text-sm" @click="approvalModalVisible = false">取消</button>
              <button
                class="btn-primary px-5 py-2 text-sm flex items-center gap-2"
                :disabled="submitting"
                @click="handleApprove"
              >
                <Check class="w-4 h-4" />
                {{ submitting ? '提交中...' : '确认通过' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 审批驳回 Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="rejectModalVisible" class="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div class="absolute inset-0 backdrop-blur-sm bg-black/50" @click="rejectModalVisible = false" />
          <div class="relative panel w-full max-w-md shadow-glow-blue animate-fade-in-up p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-11 h-11 rounded-xl bg-danger-500/15 text-danger-400 flex items-center justify-center shrink-0">
                <XCircle class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-text-primary">驳回该审批？</h3>
                <p class="text-xs text-text-tertiary mt-0.5">审批编号：{{ currentApproval?.id }}</p>
              </div>
            </div>
            <div class="mb-4">
              <label class="block text-sm text-text-secondary mb-2 flex items-center gap-1.5">
                <MessageSquare class="w-3.5 h-3.5" />
                驳回原因 <span class="text-danger-400">*</span>
              </label>
              <textarea
                v-model="rejectReason"
                rows="4"
                placeholder="请填写驳回原因..."
                class="w-full px-4 py-3 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary-500 resize-none"
              ></textarea>
            </div>
            <div class="flex items-center justify-end gap-3">
              <button class="btn-ghost px-5 py-2 text-sm" @click="rejectModalVisible = false">取消</button>
              <button
                class="px-5 py-2 text-sm rounded flex items-center gap-2 text-white font-medium"
                style="background: linear-gradient(135deg, #F5222D, #CF1322);"
                :disabled="submitting || !rejectReason.trim()"
                @click="handleReject"
              >
                <XCircle class="w-4 h-4" />
                {{ submitting ? '提交中...' : '确认驳回' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
