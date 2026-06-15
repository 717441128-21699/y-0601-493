<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VNode } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  ChevronDown,
} from 'lucide-vue-next'
import EmptyState from './EmptyState.vue'

export interface DataTableColumn<T = any> {
  key: string
  title: string
  width?: string | number
  render?: (row: T, index: number) => VNode | string
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
  ellipsis?: boolean
}

const props = withDefaults(
  defineProps<{
    columns: DataTableColumn[]
    data: any[]
    total: number
    page: number
    pageSize: number
    loading?: boolean
    bordered?: boolean
  }>(),
  {
    loading: false,
    bordered: false,
  }
)

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'page-change', page: number, pageSize: number): void
}>()

const pageSizeOptions = [10, 20, 50, 100]
const showPageSizeDropdown = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const currentPage = computed({
  get: () => props.page,
  set: (val) => emit('update:page', val),
})

const currentPageSize = computed({
  get: () => props.pageSize,
  set: (val) => emit('update:pageSize', val),
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages: (number | '...')[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 4) pages.push('...')
    const start = Math.max(2, current - 2)
    const end = Math.min(total - 1, current + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 3) pages.push('...')
    pages.push(total)
  }
  return pages
})

const rangeText = computed(() => {
  if (props.total === 0) return '0 - 0'
  const start = (currentPage.value - 1) * currentPageSize.value + 1
  const end = Math.min(currentPage.value * currentPageSize.value, props.total)
  return `${start} - ${end}`
})

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  emit('page-change', page, currentPageSize.value)
}

const changePageSize = (size: number) => {
  currentPageSize.value = size
  currentPage.value = 1
  showPageSizeDropdown.value = false
  emit('page-change', 1, size)
}

watch(
  () => props.total,
  () => {
    if (currentPage.value > totalPages.value) {
      goToPage(totalPages.value)
    }
  }
)
</script>

<template>
  <div class="flex flex-col h-full">
    <div
      class="relative flex-1 overflow-auto rounded-xl"
      :class="bordered ? 'border border-default' : ''"
      :style="bordered ? { background: 'rgba(15, 31, 56, 0.5)' } : {}"
    >
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr
            class="sticky top-0 z-10 text-left"
            style="background: linear-gradient(180deg, rgba(0, 39, 102, 0.5) 0%, rgba(0, 58, 140, 0.3) 100%); backdrop-filter: blur(8px)"
          >
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 font-medium text-text-secondary whitespace-nowrap border-b border-default"
              :style="{
                width: typeof col.width === 'number' ? `${col.width}px` : col.width,
                textAlign: col.align || 'left',
                position: col.fixed ? 'sticky' : undefined,
                [col.fixed || 'left']: col.fixed ? 0 : undefined,
                zIndex: col.fixed ? 11 : undefined,
              }"
            >
              {{ col.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-if="loading"
            class="h-[240px]"
          >
            <td :colspan="columns.length" class="text-center">
              <div class="flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 class="w-8 h-8 text-primary-400 animate-spin" />
                <span class="text-sm text-text-secondary">加载中...</span>
              </div>
            </td>
          </tr>
          <template v-else-if="data.length === 0">
            <tr class="h-[240px]">
              <td :colspan="columns.length" class="text-center p-0">
                <div class="py-12">
                  <EmptyState text="暂无数据" />
                </div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="(row, idx) in data"
              :key="row.id ?? idx"
              class="border-b border-default/60 transition-colors duration-200 hover:bg-primary-500/10 group"
              :class="idx % 2 === 1 ? 'bg-white/[0.02]' : ''"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3 text-text-primary align-middle"
                :style="{
                  width: typeof col.width === 'number' ? `${col.width}px` : col.width,
                  textAlign: col.align || 'left',
                  position: col.fixed ? 'sticky' : undefined,
                  [col.fixed || 'left']: col.fixed ? 0 : undefined,
                  zIndex: col.fixed ? 5 : undefined,
                  background: col.fixed ? 'rgba(15, 31, 56, 0.95)' : undefined,
                }"
                :class="col.ellipsis ? 'truncate max-w-[200px]' : ''"
              >
                <slot
                  :name="`cell-${col.key}`"
                  :row="row"
                  :index="idx"
                >
                  <template v-if="col.render">
                    <component :is="col.render(row, idx)" />
                  </template>
                  <template v-else>
                    <span>{{ row[col.key] ?? '-' }}</span>
                  </template>
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div
      class="flex flex-wrap items-center justify-between gap-4 mt-4 px-1"
    >
      <div class="flex items-center gap-4 text-xs text-text-secondary">
        <span>
          共 <span class="text-text-primary font-medium">{{ total }}</span> 条记录
        </span>
        <span class="text-text-tertiary">|</span>
        <span>显示 {{ rangeText }} 条</span>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative">
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-secondary border border-default hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-200"
            @click="showPageSizeDropdown = !showPageSizeDropdown"
          >
            <span>{{ currentPageSize }} 条/页</span>
            <ChevronDown class="w-3 h-3" :class="showPageSizeDropdown ? 'rotate-180' : ''" />
          </button>
          <Transition name="dropdown">
            <div
              v-if="showPageSizeDropdown"
              class="absolute bottom-full left-0 mb-2 py-1 rounded-lg bg-bg-secondary border border-default shadow-glow-blue z-20 min-w-[100px] overflow-hidden"
            >
              <button
                v-for="size in pageSizeOptions"
                :key="size"
                class="w-full px-3 py-2 text-xs text-left transition-colors duration-150"
                :class="size === currentPageSize ? 'bg-primary-500/20 text-primary-300' : 'text-text-secondary hover:bg-primary-500/10 hover:text-text-primary'"
                @click="changePageSize(size)"
              >
                {{ size }} 条/页
              </button>
            </div>
          </Transition>
        </div>

        <div class="flex items-center gap-1">
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary border border-default hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="currentPage <= 1"
            @click="goToPage(1)"
          >
            <ChevronsLeft class="w-4 h-4" />
          </button>
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary border border-default hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <template v-for="(p, pIdx) in pageNumbers" :key="pIdx">
            <span
              v-if="p === '...'"
              class="w-8 h-8 flex items-center justify-center text-text-tertiary text-xs"
            >
              ...
            </span>
            <button
              v-else
              class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200"
              :class="
                p === currentPage
                  ? 'text-white'
                  : 'text-text-secondary border border-default hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300'
              "
              :style="
                p === currentPage
                  ? {
                      background: 'linear-gradient(135deg, #1890FF 0%, #096DD9 100%)',
                      boxShadow: '0 0 12px rgba(24,144,255,0.5)',
                    }
                  : {}
              "
              @click="goToPage(p as number)"
            >
              {{ p }}
            </button>
          </template>

          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary border border-default hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary border border-default hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="currentPage >= totalPages"
            @click="goToPage(totalPages)"
          >
            <ChevronsRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
