<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import { Calendar, FileSpreadsheet, Target, Search, Plus, Upload, RefreshCw, Download, Edit3, Save, TrendingUp, X, CheckCircle2, AlertCircle } from 'lucide-vue-next'
import { ref, computed, onMounted, nextTick } from 'vue'
import { mockGetTargets as _mockGetTargets, type MonthlyTarget } from '@/mock'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { LineChart } from '@/components/charts'
import * as XLSX from 'xlsx'
import { VACCINE_TYPES } from '@/mock/_provinces'

const LS_TARGETS = 'vaccine_plan_targets'

interface InvalidRow {
  rowNum: number
  vaccineName: string
  month?: string
  reason: string
}

interface ParseProgress {
  step: number
  label: string
}

const targets = ref<MonthlyTarget[]>([])
const search = ref('')
const page = ref(1)
const pageSize = ref(12)
const loading = ref(false)
const editing = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const fileName = ref('')
const fileSize = ref(0)
const totalRows = ref(0)
const validRows = ref(0)
const invalidRowsData = ref<InvalidRow[]>([])
const parseProgress = ref<ParseProgress>({ step: 0, label: '' })
const parseError = ref('')
const hasParsed = ref(false)

function lsGetTargets(): MonthlyTarget[] | null {
  try {
    const raw = localStorage.getItem(LS_TARGETS)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function lsSetTargets(data: MonthlyTarget[]): void {
  try {
    localStorage.setItem(LS_TARGETS, JSON.stringify(data))
  } catch (e) {
    console.warn('[Plan] 保存 targets 到 localStorage 失败', e)
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(2) + 'MB'
}

function getVaccineCodeByName(name: string): string {
  const found = VACCINE_TYPES.find(v => v.name === name)
  return found ? found.code : 'UNK'
}

function seededRand(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function loadData() {
  loading.value = true
  try {
    const cached = lsGetTargets()
    if (cached && cached.length > 0) {
      targets.value = cached
    } else {
      targets.value = _mockGetTargets()
      lsSetTargets(targets.value)
    }
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return targets.value
  return targets.value.filter(
    (t) => t.vaccineName.toLowerCase().includes(q) || t.month.toLowerCase().includes(q)
  )
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    parseFile(input.files[0])
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0]
    const name = file.name.toLowerCase()
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      parseFile(file)
    } else {
      parseError.value = '请上传 .xlsx 或 .xls 格式的 Excel 文件'
    }
  }
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function parseFile(file: File) {
  resetParseState()
  fileName.value = file.name
  fileSize.value = file.size
  parseError.value = ''

  try {
    parseProgress.value = { step: 25, label: '读取文件...' }
    await sleep(200)
    const buffer = await file.arrayBuffer()

    parseProgress.value = { step: 50, label: '校验数据格式...' }
    await sleep(200)
    const wb = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = wb.SheetNames[0]
    if (!firstSheetName) {
      throw new Error('Excel 文件中没有找到工作表')
    }
    const sheet = wb.Sheets[firstSheetName]
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    if (rows.length < 2) {
      throw new Error('Excel 文件内容不足，至少需要表头和1行数据')
    }

    const headerRow = rows[0].map(h => String(h).trim())
    const vaccineNameIdx = headerRow.findIndex(h => h.includes('疫苗名称') || h.includes('疫苗'))
    if (vaccineNameIdx === -1) {
      throw new Error('表头缺少"疫苗名称"列')
    }

    const monthIndices: { month: number; idx: number; label: string }[] = []
    for (let m = 1; m <= 12; m++) {
      const monthLabels = [
        `${m}月`, `${m}月份`, `${m}月计划`, `${m}月目标`,
        `${m < 10 ? '0' + m : m}月`, `${m}月数量`
      ]
      let foundIdx = -1
      for (const label of monthLabels) {
        const idx = headerRow.findIndex(h => h === label || h.includes(label))
        if (idx !== -1) {
          foundIdx = idx
          break
        }
      }
      if (foundIdx !== -1) {
        monthIndices.push({ month: m, idx: foundIdx, label: headerRow[foundIdx] })
      }
    }

    if (monthIndices.length === 0) {
      throw new Error('表头缺少月份列（1月~12月）')
    }

    parseProgress.value = { step: 75, label: '提取月度目标...' }
    await sleep(300)

    const currentYear = new Date().getFullYear()
    const parsedTargets: MonthlyTarget[] = []
    const invalidRows: InvalidRow[] = []

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      const rowNum = r + 1
      const vaccineName = String(row[vaccineNameIdx] || '').trim()

      if (!vaccineName) {
        invalidRows.push({
          rowNum,
          vaccineName: '(空)',
          reason: '疫苗名称缺失'
        })
        continue
      }

      const vaccineCode = getVaccineCodeByName(vaccineName)
      let rowHasValidMonth = false

      for (const { month, idx } of monthIndices) {
        const cellValue = row[idx]
        const monthStr = `${currentYear}-${month < 10 ? '0' + month : month}`

        if (cellValue === '' || cellValue === null || cellValue === undefined) {
          continue
        }

        let numValue: number
        if (typeof cellValue === 'number') {
          numValue = cellValue
        } else {
          const cleaned = String(cellValue).replace(/[,，\s]/g, '')
          numValue = Number(cleaned)
        }

        if (isNaN(numValue) || numValue < 0 || !Number.isFinite(numValue)) {
          invalidRows.push({
            rowNum,
            vaccineName,
            month: `${month}月`,
            reason: `数值非法: ${cellValue}`
          })
          continue
        }

        if (!Number.isInteger(numValue)) {
          numValue = Math.round(numValue)
        }

        rowHasValidMonth = true
        const seedStr = `${vaccineCode}-${monthStr}`
        let seed = 0
        for (let i = 0; i < seedStr.length; i++) {
          seed = seed * 31 + seedStr.charCodeAt(i)
        }
        const rand = seededRand(Math.abs(seed))
        const actualCount = month < 6 ? Math.round(numValue * (0.85 + rand() * 0.15)) : undefined

        parsedTargets.push({
          month: monthStr,
          vaccineName,
          vaccineCode,
          targetCount: numValue,
          actualCount,
          completionRate: actualCount ? Math.round((actualCount / numValue) * 1000) / 10 : undefined,
        })
      }

      if (!rowHasValidMonth) {
        invalidRows.push({
          rowNum,
          vaccineName,
          reason: '所有月份数据均缺失或无效'
        })
      }
    }

    parseProgress.value = { step: 100, label: '数据入库完成！' }
    await sleep(200)

    totalRows.value = rows.length - 1
    validRows.value = new Set(parsedTargets.map(t => t.vaccineName)).size
    invalidRowsData.value = invalidRows
    targets.value = parsedTargets
    lsSetTargets(parsedTargets)
    hasParsed.value = true

    await nextTick()
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  } catch (err: any) {
    parseError.value = err.message || '解析失败，请检查文件格式'
    parseProgress.value = { step: 0, label: '' }
  }
}

function resetParseState() {
  fileName.value = ''
  fileSize.value = 0
  totalRows.value = 0
  validRows.value = 0
  invalidRowsData.value = []
  parseProgress.value = { step: 0, label: '' }
  parseError.value = ''
  hasParsed.value = false
}

function resetAll() {
  resetParseState()
  targets.value = []
  localStorage.removeItem(LS_TARGETS)
  loadData()
}

function downloadTemplate() {
  const headers = ['疫苗名称', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const sampleData = [
    headers,
    ['乙肝疫苗', 10000, 12000, 11000, 10500, 9800, 11200, 12500, 13000, 11500, 10800, 12000, 13500],
    ['卡介苗', 8000, 8500, 8200, 7800, 7500, 8000, 8300, 8600, 8100, 7900, 8200, 8800],
    ['脊灰疫苗', 9500, 10000, 9800, 9200, 9000, 9600, 10200, 10500, 9900, 9400, 9800, 10800],
  ]
  const ws = XLSX.utils.aoa_to_sheet(sampleData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '接种计划模板')
  XLSX.writeFile(wb, '疫苗年度接种计划模板.xlsx')
}

function saveTargets() {
  editing.value = false
  lsSetTargets(targets.value)
}

const invalidColumns: DataTableColumn<InvalidRow>[] = [
  { key: 'rowNum', title: '行号', width: 80, align: 'center' },
  { key: 'vaccineName', title: '疫苗名称', width: 160 },
  { key: 'month', title: '月份', width: 100, align: 'center' },
  { key: 'reason', title: '错误原因', width: 300 },
]

const columns: DataTableColumn<MonthlyTarget>[] = [
  { key: 'month', title: '月份', width: 120 },
  { key: 'vaccineName', title: '疫苗名称', width: 140 },
  { key: 'targetCount', title: '目标人群(人)', width: 140, align: 'right', render: (r) => `<span class="font-rajdhani">${r.targetCount.toLocaleString()}</span>` },
  { key: 'targetCount', title: '计划剂次', width: 120, align: 'right', render: (r) => `<span class="font-rajdhani">${r.targetCount.toLocaleString()}</span>` },
  {
    key: 'actualCount',
    title: '实际接种',
    width: 120,
    align: 'right',
    render: (r) => {
      const actual = r.actualCount ?? 0
      return `<span class="font-rajdhani ${actual >= r.targetCount * 0.9 ? 'text-success-400' : 'text-warning-400'}">${actual.toLocaleString()}</span>`
    },
  },
  {
    key: 'completionRate',
    title: '覆盖率',
    width: 120,
    align: 'right',
    render: (r) => {
      const rate = r.completionRate ?? 0
      return `<span class="font-bold font-rajdhani ${rate >= 95 ? 'text-success-400' : rate >= 85 ? 'text-warning-400' : 'text-danger-400'}">${rate.toFixed(1)}%</span>`
    },
  },
  { key: 'responsible', title: '责任人', width: 100, render: () => '待分配' },
]

onMounted(loadData)

const planTrendXData = computed(() => {
  return targets.value
    .filter((_, i) => i % 10 === 0)
    .slice(0, 12)
    .map((t) => t.month.slice(5))
})

const planTrendSeries = computed(() => {
  const months = [...new Set(targets.value.map((t) => t.month))].slice(0, 12)
  const plannedByMonth = new Map<string, number>()
  const actualByMonth = new Map<string, number>()
  targets.value.forEach((t) => {
    plannedByMonth.set(t.month, (plannedByMonth.get(t.month) || 0) + t.targetCount)
    actualByMonth.set(t.month, (actualByMonth.get(t.month) || 0) + (t.actualCount || 0))
  })
  const sortedMonths = months.sort()
  return [
    { name: '计划接种', data: sortedMonths.map((m) => Math.round((plannedByMonth.get(m) || 0) / 10000)), color: '#1890FF', area: true },
    { name: '实际接种', data: sortedMonths.map((m) => Math.round((actualByMonth.get(m) || 0) / 10000)), color: '#52C41A' },
  ]
})

const progressSteps = [
  { threshold: 25, label: '读取文件' },
  { threshold: 50, label: '校验格式' },
  { threshold: 75, label: '提取数据' },
  { threshold: 100, label: '完成入库' },
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
              placeholder="搜索疫苗名称/月份..."
              class="w-full h-10 pl-10 pr-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary"
            />
          </div>
          <div class="flex-1"></div>
          <button class="btn-ghost h-10 flex items-center gap-2 text-sm" @click="$router.push('/forecast')">
            <TrendingUp class="w-4 h-4" />
            缺口预测
          </button>
          <button class="btn-ghost h-10 flex items-center gap-2 text-sm" @click="loadData">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            刷新
          </button>
          <button class="btn-ghost h-10 flex items-center gap-2 text-sm" @click="downloadTemplate">
            <Download class="w-4 h-4" />
            下载模板
          </button>
          <button
            class="h-10 flex items-center gap-2 text-sm px-4 rounded font-medium transition-all"
            :class="editing ? 'text-white' : 'text-text-secondary border border-default hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300'"
            :style="editing ? { background: 'linear-gradient(135deg, #52C41A, #389E0D)' } : {}"
            @click="editing ? saveTargets() : editing = true"
          >
            <component :is="editing ? Save : Edit3" class="w-4 h-4" />
            {{ editing ? '保存修改' : '编辑目标' }}
          </button>
          <button class="btn-primary h-10 flex items-center gap-2 text-sm">
            <Plus class="w-4 h-4" />
            新增计划
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div
          v-for="(kpi, idx) in [
            { label: '计划总剂次', value: targets.reduce((s, t) => s + t.targetCount, 0).toLocaleString(), icon: Target, color: 'primary' },
            { label: '已接种剂次', value: targets.reduce((s, t) => s + (t.actualCount ?? 0), 0).toLocaleString(), icon: Calendar, color: 'success' },
            { label: '平均覆盖率', value: (targets.reduce((s, t) => s + (t.completionRate ?? 0), 0) / Math.max(targets.length, 1)).toFixed(1) + '%', icon: FileSpreadsheet, color: 'primary' },
            { label: '待完成', value: Math.max(targets.reduce((s, t) => s + t.targetCount - (t.actualCount ?? 0), 0), 0).toLocaleString(), icon: Target, color: 'warning' },
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

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
        <div class="lg:col-span-1">
          <div
            class="panel p-5 h-full min-h-[300px] flex flex-col cursor-pointer transition-all"
            :class="isDragging ? 'ring-2 ring-primary-500 bg-primary-500/5' : 'hover:ring-1 hover:ring-primary-500/30'"
            @click="triggerFileInput"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept=".xlsx,.xls"
              style="display:none"
              @change="handleFileChange"
            />
            <div class="flex items-center justify-between mb-4">
              <h3 class="panel-title mb-0">Excel 导入</h3>
              <Upload class="w-5 h-5 text-primary-400" />
            </div>

            <div v-if="!hasParsed" class="flex-1 flex flex-col items-center justify-center text-center">
              <div class="w-16 h-16 rounded-2xl bg-primary-500/15 flex items-center justify-center mb-4">
                <FileSpreadsheet class="w-8 h-8 text-primary-400" />
              </div>
              <div class="text-text-primary font-medium mb-1">点击或拖拽上传 Excel</div>
              <div class="text-xs text-text-tertiary mb-4">支持 .xlsx / .xls 格式</div>
              <button
                class="btn-primary h-9 px-5 text-sm"
                @click.stop="triggerFileInput"
              >
                选择文件
              </button>
              <div class="mt-4 text-xs text-text-tertiary">
                表头格式：疫苗名称 | 1月 | 2月 | ... | 12月
              </div>
            </div>

            <div v-else class="flex-1 flex flex-col gap-4">
              <div class="flex items-center gap-2 p-3 rounded-lg bg-success-500/10 border border-success-500/20">
                <CheckCircle2 class="w-5 h-5 text-success-400 shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-text-primary font-medium truncate">{{ fileName }}</div>
                  <div class="text-xs text-text-tertiary">{{ formatFileSize(fileSize) }}</div>
                </div>
                <button
                  class="p-1.5 rounded-md hover:bg-bg-secondary text-text-tertiary hover:text-text-primary transition-all"
                  @click.stop="resetAll"
                  title="重新选择"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="p-3 rounded-lg bg-bg-secondary">
                  <div class="font-rajdhani font-bold text-xl text-text-primary">{{ totalRows }}</div>
                  <div class="text-xs text-text-tertiary">总行数</div>
                </div>
                <div class="p-3 rounded-lg bg-success-500/10">
                  <div class="font-rajdhani font-bold text-xl text-success-400">{{ validRows }}</div>
                  <div class="text-xs text-text-tertiary">有效行</div>
                </div>
                <div class="p-3 rounded-lg" :class="invalidRowsData.length > 0 ? 'bg-danger-500/10' : 'bg-bg-secondary'">
                  <div class="font-rajdhani font-bold text-xl" :class="invalidRowsData.length > 0 ? 'text-danger-400' : 'text-text-primary'">{{ invalidRowsData.length }}</div>
                  <div class="text-xs text-text-tertiary">错误行</div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between text-xs mb-1.5">
                  <span class="text-text-secondary">解析进度</span>
                  <span class="text-text-primary font-medium">{{ parseProgress.step }}%</span>
                </div>
                <div class="flex items-center gap-1">
                  <div
                    v-for="step in progressSteps"
                    :key="step.threshold"
                    class="flex-1 h-2 rounded-full transition-all"
                    :class="parseProgress.step >= step.threshold ? 'bg-primary-500' : 'bg-bg-secondary'"
                    :title="step.label"
                  />
                </div>
                <div class="flex items-center justify-between text-[10px] mt-1 text-text-tertiary">
                  <span>读取</span>
                  <span>校验</span>
                  <span>提取</span>
                  <span>入库</span>
                </div>
              </div>

              <button
                class="w-full h-9 flex items-center justify-center gap-2 text-sm rounded-lg border border-default hover:border-primary-500/40 hover:bg-primary-500/10 text-text-secondary hover:text-primary-300 transition-all"
                @click.stop="triggerFileInput"
              >
                <RefreshCw class="w-4 h-4" />
                重新选择文件
              </button>
            </div>

            <div v-if="parseError" class="mt-3 p-3 rounded-lg bg-danger-500/10 border border-danger-500/20">
              <div class="flex items-start gap-2">
                <AlertCircle class="w-4 h-4 text-danger-400 shrink-0 mt-0.5" />
                <div class="text-xs text-danger-400">{{ parseError }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 panel p-5 h-80">
          <h3 class="panel-title mb-4">全年接种计划完成趋势</h3>
          <LineChart
            v-if="targets.length > 0"
            :x-data="planTrendXData"
            :series="planTrendSeries"
            y-unit="万剂"
          />
        </div>
      </div>

      <div v-if="invalidRowsData.length > 0" class="panel p-5 shrink-0">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <AlertCircle class="w-5 h-5 text-danger-400" />
            <h3 class="panel-title mb-0">解析错误行明细</h3>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-danger-500/20 text-danger-400 border border-danger-500/30">
              共 {{ invalidRowsData.length }} 条
            </span>
          </div>
        </div>
        <DataTable
          :columns="invalidColumns"
          :data="invalidRowsData"
          :total="invalidRowsData.length"
          :page="1"
          :page-size="5"
        />
      </div>

      <div class="panel p-5 flex-1 min-h-0">
        <h3 class="panel-title mb-4">月度接种目标</h3>
        <DataTable
          :columns="columns"
          :data="filtered"
          :total="filtered.length"
          :loading="loading"
          v-model:page="page"
          v-model:page-size="pageSize"
        />
      </div>
    </div>
  </AppLayout>
</template>
