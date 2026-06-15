<script setup lang="ts">
import { computed } from 'vue'
import type { ApprovalFlow, ApprovalStep } from '@/types'
import dayjs from 'dayjs'
import {
  CircleCheck,
  Loader2,
  Circle,
  ShieldAlert,
  Building2,
  Landmark,
} from 'lucide-vue-next'

const props = defineProps<{
  approval: ApprovalFlow
}>()

interface StepInfo {
  step: ApprovalStep
  title: string
  icon: any
  node?: typeof props.approval.steps[0]
}

const stepOrder: ApprovalStep[] = ['ADMIN_CONFIRM', 'CITY_REVIEW', 'PROVINCE_APPROVE']

const steps = computed<StepInfo[]>(() => {
  const stepMeta: Record<ApprovalStep, { title: string; icon: any }> = {
    ADMIN_CONFIRM: { title: '冷链管理员确认', icon: ShieldAlert },
    CITY_REVIEW: { title: '市级疾控复核', icon: Building2 },
    PROVINCE_APPROVE: { title: '省级卫健委批准', icon: Landmark },
  }

  const currentIdx = stepOrder.indexOf(props.approval.currentStep)

  return stepOrder.map((step, idx) => {
    const node = props.approval.steps.find((s) => s.step === step)
    return {
      step,
      title: stepMeta[step].title,
      icon: stepMeta[step].icon,
      node,
    }
  })
})

const getNodeStatus = (step: ApprovalStep) => {
  const currentIdx = stepOrder.indexOf(props.approval.currentStep)
  const stepIdx = stepOrder.indexOf(step)

  if (stepIdx < currentIdx) return 'approved'
  if (stepIdx === currentIdx) return 'current'
  return 'pending'
}

const getStatusStyle = (status: string) => {
  if (status === 'approved') {
    return {
      ring: 'rgba(82, 196, 26, 0.3)',
      icon: '#52C41A',
      bg: 'rgba(82, 196, 26, 0.15)',
      line: '#52C41A',
    }
  }
  if (status === 'current') {
    return {
      ring: 'rgba(24, 144, 255, 0.4)',
      icon: '#1890FF',
      bg: 'rgba(24, 144, 255, 0.15)',
      line: 'rgba(24, 144, 255, 0.4)',
    }
  }
  return {
    ring: 'rgba(92, 119, 153, 0.2)',
    icon: '#5C7799',
    bg: 'rgba(92, 119, 153, 0.1)',
    line: 'rgba(92, 119, 153, 0.2)',
  }
}
</script>

<template>
  <div class="py-2">
    <div
      v-if="approval.result"
      class="mb-5 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
      :class="approval.result === 'TRANSFER' ? 'bg-success-500/10 border border-success-500/30 text-success-400' : 'bg-danger-500/10 border border-danger-500/30 text-danger-400'"
    >
      <CircleCheck class="w-4 h-4 shrink-0" />
      <span>
        审批结果：
        <strong class="font-semibold">{{ approval.result === 'TRANSFER' ? '紧急调拨' : '报废处理' }}</strong>
      </span>
    </div>

    <div class="relative pl-6">
      <div
        v-for="(step, idx) in steps"
        :key="step.step"
        class="relative pb-8 last:pb-0"
      >
        <div
          v-if="idx < steps.length - 1"
          class="absolute left-[13px] top-7 bottom-0 w-[2px] rounded-full"
          :style="{ background: `linear-gradient(180deg, ${getStatusStyle(getNodeStatus(step.step)).line} 0%, ${getStatusStyle(getNodeStatus(steps[idx + 1].step)).line} 100%)` }"
        />

        <div
          class="absolute -left-6 top-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
          :class="getNodeStatus(step.step) === 'current' ? 'animate-pulse-slow' : ''"
          :style="{
            background: getStatusStyle(getNodeStatus(step.step)).bg,
            border: `2px solid ${getStatusStyle(getNodeStatus(step.step)).icon}`,
            boxShadow: `0 0 0 4px ${getStatusStyle(getNodeStatus(step.step)).ring}`,
          }"
        >
          <CircleCheck
            v-if="getNodeStatus(step.step) === 'approved'"
            class="w-3.5 h-3.5"
            :style="{ color: getStatusStyle(getNodeStatus(step.step)).icon }"
          />
          <Loader2
            v-else-if="getNodeStatus(step.step) === 'current'"
            class="w-3.5 h-3.5 animate-spin"
            :style="{ color: getStatusStyle(getNodeStatus(step.step)).icon }"
          />
          <Circle
            v-else
            class="w-2.5 h-2.5"
            :style="{ color: getStatusStyle(getNodeStatus(step.step)).icon }"
          />
        </div>

        <div class="ml-3">
          <div class="flex items-center gap-2 mb-1.5">
            <component
              :is="step.icon"
              class="w-4 h-4"
              :style="{ color: getStatusStyle(getNodeStatus(step.step)).icon }"
            />
            <span
              class="text-sm font-semibold"
              :class="[
                getNodeStatus(step.step) === 'approved'
                  ? 'text-success-400'
                  : getNodeStatus(step.step) === 'current'
                  ? 'text-primary-300'
                  : 'text-text-tertiary',
              ]"
            >
              {{ step.title }}
            </span>
            <span
              v-if="getNodeStatus(step.step) === 'current'"
              class="text-[10px] px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 font-medium"
            >
              进行中
            </span>
            <span
              v-if="getNodeStatus(step.step) === 'approved' && step.node?.status === 'REJECTED'"
              class="text-[10px] px-1.5 py-0.5 rounded bg-danger-500/20 text-danger-400 font-medium"
            >
              已驳回
            </span>
            <span
              v-if="getNodeStatus(step.step) === 'approved' && step.node?.status === 'APPROVED'"
              class="text-[10px] px-1.5 py-0.5 rounded bg-success-500/20 text-success-400 font-medium"
            >
              已通过
            </span>
          </div>

          <div
            v-if="step.node && (step.node.operator || step.node.time)"
            class="text-xs text-text-secondary mb-1"
          >
            <span v-if="step.node.operator">{{ step.node.operator }}</span>
            <span v-if="step.node.operator && step.node.time" class="mx-1.5 text-text-tertiary">·</span>
            <span v-if="step.node.time" class="text-text-tertiary">{{ dayjs(step.node.time).format('YYYY-MM-DD HH:mm') }}</span>
          </div>

          <div
            v-if="step.node && step.node.opinion"
            class="text-xs text-text-tertiary px-3 py-2 rounded-lg bg-bg-tertiary/40 border border-default/50 mt-1"
          >
            <span class="text-text-secondary font-medium">意见：</span>
            {{ step.node.opinion }}
          </div>

          <div
            v-if="getNodeStatus(step.step) === 'pending'"
            class="text-xs text-text-tertiary italic"
          >
            待处理
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
