<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import {
  Users,
  Shield,
  SlidersHorizontal,
  BookOpen,
  Search,
  Plus,
  Download,
  Upload,
  Edit3,
  Ban,
  RotateCcw,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  Clock,
  Package as PackageIcon,
  Bell,
  Loader2,
} from 'lucide-vue-next'
import { PROVINCES, CITIES, VACCINE_TYPES } from '@/mock'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

if (userStore.userLevel && userStore.userLevel > 2) {
  router.replace('/403')
}

type SettingsTab = 'users' | 'permissions' | 'thresholds' | 'dictionary'

const tabs = [
  { key: 'users' as const, label: '用户管理', icon: Users },
  { key: 'permissions' as const, label: '权限配置', icon: Shield },
  { key: 'thresholds' as const, label: '阈值配置', icon: SlidersHorizontal },
  { key: 'dictionary' as const, label: '字典维护', icon: BookOpen },
]

const activeTab = ref<SettingsTab>('users')
const isNational = computed(() => userStore.userLevel === 1)
const canManageUsers = computed(() => userStore.userLevel <= 2)
const canManageThresholds = computed(() => userStore.userLevel === 1)

// ==================== 用户管理 ====================
interface UserRow {
  id: string
  account: string
  name: string
  role: string
  roleLevel: 1 | 2 | 3 | 4 | 5
  province: string
  provinceCode: string
  city: string
  phone: string
  email: string
  status: 'ACTIVE' | 'DISABLED'
  createdAt: string
  lastLogin: string
}

const roleOptions = [
  { value: 1, label: '国家级管理员' },
  { value: 2, label: '省级管理员' },
  { value: 3, label: '市级管理员' },
  { value: 4, label: '冷链管理员' },
  { value: 5, label: '接种点管理员' },
]

const mockUsers: UserRow[] = [
  { id: 'U001', account: 'admin_national', name: '系统管理员', role: '国家级管理员', roleLevel: 1, province: '全国', provinceCode: '', city: '', phone: '138****0001', email: 'admin@cdc.gov.cn', status: 'ACTIVE', createdAt: '2024-01-15 09:00', lastLogin: '2026-06-16 08:32' },
  { id: 'U002', account: 'admin_beijing', name: '张伟', role: '省级管理员', roleLevel: 2, province: '北京市', provinceCode: '110000', city: '东城区', phone: '139****2345', email: 'zhangwei@bjcdc.gov.cn', status: 'ACTIVE', createdAt: '2024-02-20 10:15', lastLogin: '2026-06-15 17:45' },
  { id: 'U003', account: 'admin_shanghai', name: '李娜', role: '省级管理员', roleLevel: 2, province: '上海市', provinceCode: '310000', city: '黄浦区', phone: '137****6789', email: 'lina@shcdc.gov.cn', status: 'ACTIVE', createdAt: '2024-02-25 14:30', lastLogin: '2026-06-14 09:12' },
  { id: 'U004', account: 'admin_guangdong', name: '王强', role: '省级管理员', roleLevel: 2, province: '广东省', provinceCode: '440000', city: '广州市', phone: '136****1111', email: 'wangqiang@gdcdc.gov.cn', status: 'ACTIVE', createdAt: '2024-03-01 11:20', lastLogin: '2026-06-16 07:58' },
  { id: 'U005', account: 'cold_zhangsan', name: '张三', role: '冷链管理员', roleLevel: 4, province: '北京市', provinceCode: '110000', city: '朝阳区', phone: '135****2222', email: 'zhangsan@bjcdc.gov.cn', status: 'ACTIVE', createdAt: '2024-03-10 16:45', lastLogin: '2026-06-15 18:30' },
  { id: 'U006', account: 'cold_lisi', name: '李四', role: '冷链管理员', roleLevel: 4, province: '江苏省', provinceCode: '320000', city: '南京市', phone: '134****3333', email: 'lisi@jscdc.gov.cn', status: 'DISABLED', createdAt: '2024-03-15 09:30', lastLogin: '2026-05-20 14:22' },
  { id: 'U007', account: 'vaccinate_wangwu', name: '王五', role: '接种点管理员', roleLevel: 5, province: '浙江省', provinceCode: '330000', city: '杭州市', phone: '133****4444', email: 'wangwu@zjcdc.gov.cn', status: 'ACTIVE', createdAt: '2024-04-01 13:00', lastLogin: '2026-06-16 08:15' },
  { id: 'U008', account: 'admin_jiangsu', name: '陈静', role: '市级管理员', roleLevel: 3, province: '江苏省', provinceCode: '320000', city: '苏州市', phone: '132****5555', email: 'chenjing@jscdc.gov.cn', status: 'ACTIVE', createdAt: '2024-04-10 08:45', lastLogin: '2026-06-15 16:40' },
  { id: 'U009', account: 'cold_zhaoliu', name: '赵六', role: '冷链管理员', roleLevel: 4, province: '广东省', provinceCode: '440000', city: '深圳市', phone: '131****6666', email: 'zhaoliu@gdcdc.gov.cn', status: 'ACTIVE', createdAt: '2024-04-20 15:20', lastLogin: '2026-06-14 10:30' },
  { id: 'U010', account: 'vaccinate_qianqi', name: '钱七', role: '接种点管理员', roleLevel: 5, province: '四川省', provinceCode: '510000', city: '成都市', phone: '130****7777', email: 'qianqi@sccdc.gov.cn', status: 'ACTIVE', createdAt: '2024-05-05 11:10', lastLogin: '2026-06-15 11:20' },
  { id: 'U011', account: 'admin_sichuan', name: '孙八', role: '省级管理员', roleLevel: 2, province: '四川省', provinceCode: '510000', city: '成都市', phone: '159****8888', email: 'sunba@sccdc.gov.cn', status: 'DISABLED', createdAt: '2024-05-15 14:55', lastLogin: '2026-04-10 09:00' },
  { id: 'U012', account: 'cold_zhengjiu', name: '郑九', role: '冷链管理员', roleLevel: 4, province: '湖北省', provinceCode: '420000', city: '武汉市', phone: '158****9999', email: 'zhengjiu@hbcdc.gov.cn', status: 'ACTIVE', createdAt: '2024-06-01 09:40', lastLogin: '2026-06-16 07:30' },
]

const userList = ref<UserRow[]>([...mockUsers])
const userSearch = ref('')
const userPage = ref(1)
const userPageSize = ref(10)
const userModalVisible = ref(false)
const userModalMode = ref<'create' | 'edit'>('create')
const userLoading = ref(false)

const filteredUsers = computed(() => {
  const q = userSearch.value.trim().toLowerCase()
  if (!q) return userList.value
  return userList.value.filter(
    (u) =>
      u.account.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.includes(q)
  )
})

const userColumns: DataTableColumn<UserRow>[] = [
  { key: 'account', title: '账号', width: 140 },
  { key: 'name', title: '姓名', width: 100 },
  {
    key: 'role',
    title: '角色',
    width: 130,
    render: (row) => {
      const colors = [
        '',
        'bg-danger-500/20 text-danger-400 border-danger-500/30',
        'bg-warning-500/20 text-warning-400 border-warning-500/30',
        'bg-primary-500/20 text-primary-400 border-primary-500/30',
        'bg-success-500/20 text-success-400 border-success-500/30',
        'bg-[#722ED1]/20 text-[#A069FF] border-[#722ED1]/30',
      ]
      return `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors[row.roleLevel]}">${row.role}</span>`
    },
  },
  {
    key: 'region',
    title: '所属区域',
    width: 180,
    render: (row) => `${row.province}${row.city ? ' · ' + row.city : ''}`,
  },
  { key: 'phone', title: '手机号', width: 130 },
  { key: 'email', title: '邮箱', width: 200, ellipsis: true },
  {
    key: 'status',
    title: '状态',
    width: 100,
    align: 'center',
    render: (row) =>
      row.status === 'ACTIVE'
        ? `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-success-500/20 text-success-400 border border-success-500/30"><span class="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse"></span>正常</span>`
        : `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-danger-500/20 text-danger-400 border border-danger-500/30"><span class="w-1.5 h-1.5 rounded-full bg-danger-400"></span>已禁用</span>`,
  },
  { key: 'createdAt', title: '创建时间', width: 160 },
  { key: 'lastLogin', title: '最后登录', width: 160 },
]

const userForm = reactive({
  account: '',
  name: '',
  roleLevel: 3 as 1 | 2 | 3 | 4 | 5,
  provinceCode: '',
  cityCode: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const cityOptions = computed(() => {
  if (!userForm.provinceCode) return []
  return CITIES[userForm.provinceCode] || []
})

function openCreateUser() {
  userModalMode.value = 'create'
  Object.assign(userForm, {
    account: '',
    name: '',
    roleLevel: 3,
    provinceCode: '',
    cityCode: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  userModalVisible.value = true
}

function openEditUser(user: UserRow) {
  userModalMode.value = 'edit'
  Object.assign(userForm, {
    account: user.account,
    name: user.name,
    roleLevel: user.roleLevel,
    provinceCode: user.provinceCode,
    cityCode: '',
    phone: user.phone.replace(/\*/g, '0'),
    email: user.email,
    password: '',
    confirmPassword: '',
  })
  userModalVisible.value = true
}

async function handleUserModalConfirm() {
  userLoading.value = true
  try {
    await new Promise((r) => setTimeout(r, 600))
    if (userModalMode.value === 'create') {
      const newUser: UserRow = {
        id: 'U' + String(userList.value.length + 1).padStart(3, '0'),
        account: userForm.account,
        name: userForm.name,
        role: roleOptions.find((r) => r.value === userForm.roleLevel)?.label || '',
        roleLevel: userForm.roleLevel,
        province: PROVINCES.find((p) => p.code === userForm.provinceCode)?.name || '全国',
        provinceCode: userForm.provinceCode,
        city: cityOptions.value.find((c) => c.code === userForm.cityCode)?.name || '',
        phone: userForm.phone,
        email: userForm.email,
        status: 'ACTIVE',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        lastLogin: '-',
      }
      userList.value.unshift(newUser)
    }
    userModalVisible.value = false
  } finally {
    userLoading.value = false
  }
}

function toggleUserStatus(user: UserRow) {
  user.status = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
}

function resetUserPassword(user: UserRow) {
  alert(`已向 ${user.phone} 发送密码重置短信`)
}

// ==================== 权限配置 ====================
interface PermissionNode {
  id: string
  name: string
  type: 'menu' | 'page' | 'action'
  children?: PermissionNode[]
  checked?: boolean
  expanded?: boolean
}

interface RoleItem {
  id: string
  name: string
  level: number
  desc: string
  color: string
  userCount: number
}

const roles: RoleItem[] = [
  { id: 'R1', name: '国家级管理员', level: 1, desc: '全系统最高权限，可管理所有功能与数据', color: 'from-danger-500 to-danger-700', userCount: 2 },
  { id: 'R2', name: '省级管理员', level: 2, desc: '管理本省范围内的用户、设备与数据', color: 'from-warning-500 to-warning-700', userCount: 31 },
  { id: 'R3', name: '市级管理员', level: 3, desc: '管理本市范围内的接种点与冷链监控', color: 'from-primary-500 to-primary-700', userCount: 285 },
  { id: 'R4', name: '冷链管理员', level: 4, desc: '负责冷链设备监控、温度异常处置', color: 'from-success-500 to-success-700', userCount: 1024 },
  { id: 'R5', name: '接种点管理员', level: 5, desc: '负责疫苗接种登记、库存上报等操作', color: 'from-[#722ED1] to-[#531DAB]', userCount: 8650 },
]

const selectedRole = ref<string>('R1')
const permissionsSaving = ref(false)

const permissionTree: PermissionNode[] = [
  {
    id: 'dashboard',
    name: '核心看板',
    type: 'menu',
    expanded: true,
    children: [
      { id: 'dashboard:view', name: '查看看板', type: 'page', children: [{ id: 'dashboard:export', name: '导出数据', type: 'action' }] },
    ],
  },
  {
    id: 'coldchain',
    name: '冷链监测',
    type: 'menu',
    expanded: true,
    children: [
      { id: 'coldchain:view', name: '温度监控', type: 'page' },
      {
        id: 'coldchain:equipment',
        name: '冷链设备',
        type: 'page',
        children: [
          { id: 'coldchain:equipment:add', name: '新增设备', type: 'action' },
          { id: 'coldchain:equipment:edit', name: '编辑设备', type: 'action' },
          { id: 'coldchain:equipment:delete', name: '删除设备', type: 'action' },
        ],
      },
    ],
  },
  {
    id: 'inventory',
    name: '库存管理',
    type: 'menu',
    children: [
      { id: 'inventory:view', name: '库存查询', type: 'page' },
      { id: 'inventory:log', name: '出入库记录', type: 'page', children: [{ id: 'inventory:import', name: '批量导入', type: 'action' }] },
    ],
  },
  {
    id: 'vaccination',
    name: '接种管理',
    type: 'menu',
    children: [
      { id: 'vaccination:view', name: '接种记录', type: 'page' },
      { id: 'vaccination:register', name: '登记接种', type: 'action' },
    ],
  },
  {
    id: 'alerts',
    name: '预警中心',
    type: 'menu',
    children: [
      { id: 'alerts:view', name: '预警列表', type: 'page' },
      { id: 'alerts:handle', name: '处置预警', type: 'action' },
      {
        id: 'alerts:approval',
        name: '审批工作台',
        type: 'page',
        children: [
          { id: 'alerts:approval:approve', name: '审批通过', type: 'action' },
          { id: 'alerts:approval:reject', name: '审批驳回', type: 'action' },
        ],
      },
    ],
  },
  {
    id: 'plan',
    name: '免疫规划',
    type: 'menu',
    children: [
      { id: 'plan:view', name: '接种计划', type: 'page' },
      { id: 'plan:forecast', name: '缺口预测', type: 'page' },
    ],
  },
  {
    id: 'reports',
    name: '统计报表',
    type: 'menu',
    children: [
      { id: 'reports:view', name: '查看报告', type: 'page' },
      { id: 'reports:generate', name: '生成报告', type: 'action' },
      { id: 'reports:download', name: '下载PDF', type: 'action' },
    ],
  },
  {
    id: 'settings',
    name: '系统设置',
    type: 'menu',
    children: [
      { id: 'settings:users', name: '用户管理', type: 'page', children: [{ id: 'settings:users:create', name: '新增用户', type: 'action' }] },
      { id: 'settings:permissions', name: '权限配置', type: 'page' },
      { id: 'settings:thresholds', name: '阈值配置', type: 'page' },
      { id: 'settings:dictionary', name: '字典维护', type: 'page' },
    ],
  },
]

const permissions = ref(JSON.parse(JSON.stringify(permissionTree)))

function setAllPermissions(nodes: PermissionNode[], checked: boolean) {
  nodes.forEach((n) => {
    n.checked = checked
    if (n.children) setAllPermissions(n.children, checked)
  })
}

function initRolePermissions(roleId: string) {
  const role = roles.find((r) => r.id === roleId)
  if (!role) return
  const lvl = role.level
  permissions.value = JSON.parse(JSON.stringify(permissionTree))
  if (lvl === 1) {
    setAllPermissions(permissions.value, true)
  } else if (lvl === 2) {
    setAllPermissions(permissions.value, true)
    const settings = permissions.value.find((p) => p.id === 'settings')
    if (settings?.children) {
      const th = settings.children.find((c) => c.id === 'settings:thresholds')
      if (th) th.checked = false
    }
  } else if (lvl === 3) {
    setAllPermissions(permissions.value, true)
    const settings = permissions.value.find((p) => p.id === 'settings')
    if (settings?.children) {
      settings.children.forEach((c) => {
        c.checked = false
        if (c.children) setAllPermissions(c.children, false)
      })
    }
  } else if (lvl === 4) {
    setAllPermissions(permissions.value, false)
    const cc = permissions.value.find((p) => p.id === 'coldchain')
    const al = permissions.value.find((p) => p.id === 'alerts')
    if (cc) {
      cc.checked = true
      cc.children?.forEach((c) => {
        c.checked = true
        if (c.children) setAllPermissions(c.children, true)
      })
    }
    if (al) {
      al.checked = true
      al.children?.forEach((c) => {
        if (c.id === 'alerts:view' || c.id === 'alerts:handle') {
          c.checked = true
        }
      })
    }
  } else {
    setAllPermissions(permissions.value, false)
    const va = permissions.value.find((p) => p.id === 'vaccination')
    const inv = permissions.value.find((p) => p.id === 'inventory')
    if (va) {
      va.checked = true
      va.children?.forEach((c) => {
        c.checked = true
      })
    }
    if (inv) {
      inv.checked = true
      inv.children?.forEach((c) => {
        if (c.id === 'inventory:view') c.checked = true
      })
    }
  }
  permissions.value.forEach((p) => (p.expanded = true))
}

function toggleExpand(node: PermissionNode) {
  node.expanded = !node.expanded
}

function togglePermission(node: PermissionNode) {
  const setDown = (n: PermissionNode[], v: boolean) =>
    n.forEach((x) => {
      x.checked = v
      if (x.children) setDown(x.children, v)
    })
  node.checked = !node.checked
  if (node.children) setDown(node.children, node.checked!)
}

async function savePermissions() {
  permissionsSaving.value = true
  try {
    await new Promise((r) => setTimeout(r, 800))
  } finally {
    permissionsSaving.value = false
  }
}

selectedRole.value && initRolePermissions(selectedRole.value)

// ==================== 阈值配置 ====================
interface ThresholdRow {
  id: string
  vaccineCode: string
  vaccineName: string
  tempMin: number
  tempMax: number
  overDurationMin: number
  safetyStockDays: number
  escalateIntervalHour: number
  _dirty?: boolean
  _origin?: Partial<ThresholdRow>
}

const thresholdList = ref<ThresholdRow[]>(
  VACCINE_TYPES.map((v) => ({
    id: v.code,
    vaccineCode: v.code,
    vaccineName: v.name,
    tempMin: v.tempMin,
    tempMax: v.tempMax,
    overDurationMin: 30,
    safetyStockDays: 3,
    escalateIntervalHour: 2,
  }))
)

function markDirty(row: ThresholdRow, field: keyof ThresholdRow) {
  if (!row._origin) {
    row._origin = { ...row }
  }
  row._dirty = true
}

function resetRow(row: ThresholdRow) {
  if (row._origin) {
    Object.assign(row, row._origin)
    row._dirty = false
    row._origin = undefined
  }
}

function saveRow(row: ThresholdRow) {
  row._dirty = false
  row._origin = undefined
}

const thresholdsLoading = ref(false)

async function saveAllThresholds() {
  thresholdsLoading.value = true
  try {
    await new Promise((r) => setTimeout(r, 800))
    thresholdList.value.forEach((r) => {
      r._dirty = false
      r._origin = undefined
    })
  } finally {
    thresholdsLoading.value = false
  }
}

async function resetAllThresholds() {
  thresholdList.value = VACCINE_TYPES.map((v) => ({
    id: v.code,
    vaccineCode: v.code,
    vaccineName: v.name,
    tempMin: v.tempMin,
    tempMax: v.tempMax,
    overDurationMin: 30,
    safetyStockDays: 3,
    escalateIntervalHour: 2,
  }))
}

// ==================== 字典维护 ====================
type DictCategory = 'vaccine' | 'region' | 'device' | 'alert'

const dictTabs = [
  { key: 'vaccine' as const, label: '疫苗种类' },
  { key: 'region' as const, label: '行政区划' },
  { key: 'device' as const, label: '设备类型' },
  { key: 'alert' as const, label: '预警类型' },
]

const activeDictTab = ref<DictCategory>('vaccine')
const dictLoading = ref(false)

interface DictRow {
  id: string
  code: string
  name: string
  sort: number
  status: 'ACTIVE' | 'INACTIVE'
}

const vaccineDict: DictRow[] = VACCINE_TYPES.map((v, i) => ({
  id: v.code,
  code: v.code,
  name: v.name,
  sort: i + 1,
  status: 'ACTIVE' as const,
}))

const regionDict: DictRow[] = PROVINCES.slice(0, 20).map((p, i) => ({
  id: p.code,
  code: p.code,
  name: p.name,
  sort: i + 1,
  status: 'ACTIVE' as const,
}))

const deviceDict: DictRow[] = [
  { id: 'D01', code: 'COLD_STORE', name: '冷库', sort: 1, status: 'ACTIVE' },
  { id: 'D02', code: 'REFRIGERATOR', name: '医用冷藏箱', sort: 2, status: 'ACTIVE' },
  { id: 'D03', code: 'FREEZER', name: '低温冰箱', sort: 3, status: 'ACTIVE' },
  { id: 'D04', code: 'ULTRA_FREEZER', name: '超低温冰箱', sort: 4, status: 'ACTIVE' },
  { id: 'D05', code: 'COLD_BOX', name: '冷藏箱', sort: 5, status: 'ACTIVE' },
  { id: 'D06', code: 'VEHICLE', name: '冷藏运输车', sort: 6, status: 'ACTIVE' },
  { id: 'D07', code: 'TEMP_MONITOR', name: '温度监测仪', sort: 7, status: 'ACTIVE' },
  { id: 'D08', code: 'GENERATOR', name: '备用发电机', sort: 8, status: 'INACTIVE' },
]

const alertDict: DictRow[] = [
  { id: 'A01', code: 'TEMP_OVER', name: '温度超标(高温)', sort: 1, status: 'ACTIVE' },
  { id: 'A02', code: 'TEMP_UNDER', name: '温度过低', sort: 2, status: 'ACTIVE' },
  { id: 'A03', code: 'STOCK_LOW', name: '库存不足', sort: 3, status: 'ACTIVE' },
  { id: 'A04', code: 'DEVICE_FAULT', name: '设备故障', sort: 4, status: 'ACTIVE' },
  { id: 'A05', code: 'POWER_OFF', name: '断电告警', sort: 5, status: 'ACTIVE' },
  { id: 'A06', code: 'DOOR_OPEN', name: '门长时间开启', sort: 6, status: 'ACTIVE' },
  { id: 'A07', code: 'EXPIRE_SOON', name: '疫苗临近效期', sort: 7, status: 'INACTIVE' },
]

const dictMap: Record<DictCategory, DictRow[]> = {
  vaccine: vaccineDict,
  region: regionDict,
  device: deviceDict,
  alert: alertDict,
}

const dictColumns: DataTableColumn<DictRow>[] = [
  { key: 'code', title: '编码', width: 140 },
  { key: 'name', title: '名称', width: 240 },
  { key: 'sort', title: '排序', width: 100, align: 'center' },
  {
    key: 'status',
    title: '状态',
    width: 120,
    align: 'center',
    render: (row) =>
      row.status === 'ACTIVE'
        ? `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-success-500/20 text-success-400 border border-success-500/30">启用</span>`
        : `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-bg-tertiary/60 text-text-tertiary border border-default">停用</span>`,
  },
]

function toggleDictStatus(row: DictRow) {
  row.status = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
}

function deleteDictRow(row: DictRow) {
  const list = dictMap[activeDictTab.value]
  const idx = list.findIndex((x) => x.id === row.id)
  if (idx >= 0) list.splice(idx, 1)
}

onMounted(() => {
  initRolePermissions(selectedRole.value)
})
</script>

<template>
  <AppLayout>
    <div class="h-full flex flex-col gap-4">
      <!-- Tab 切换 -->
      <div class="panel p-2 animate-fade-in-up shrink-0 inline-flex">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative"
          :class="[
            activeTab === tab.key
              ? 'text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/40',
          ]"
          :style="activeTab === tab.key ? { background: 'linear-gradient(135deg, #1890FF 0%, #096DD9 100%)', boxShadow: '0 0 16px rgba(24,144,255,0.4)' } : {}"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>

      <!-- 用户管理 -->
      <div v-if="activeTab === 'users'" class="flex-1 min-h-0 flex flex-col gap-3">
        <div class="panel p-4 shrink-0">
          <div class="flex flex-wrap items-center gap-3">
            <div class="relative flex-1 min-w-[260px] max-w-md">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                v-model="userSearch"
                type="text"
                placeholder="搜索账号 / 姓名 / 手机号 / 邮箱 / 角色..."
                class="w-full h-10 pl-10 pr-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div class="flex-1"></div>
            <button class="btn-ghost h-10 flex items-center gap-2 text-sm">
              <Download class="w-4 h-4" />
              导出
            </button>
            <button class="btn-ghost h-10 flex items-center gap-2 text-sm">
              <Upload class="w-4 h-4" />
              批量导入
            </button>
            <button
              v-if="canManageUsers"
              class="btn-primary h-10 flex items-center gap-2 text-sm"
              @click="openCreateUser"
            >
              <UserPlus class="w-4 h-4" />
              新增用户
            </button>
          </div>
        </div>

        <div class="panel p-5 flex-1 min-h-0">
          <DataTable
            :columns="userColumns"
            :data="filteredUsers"
            :total="filteredUsers.length"
            v-model:page="userPage"
            v-model:page-size="userPageSize"
          >
            <template #cell-actions="{ row }">
              <div class="flex items-center gap-1">
                <button
                  class="w-8 h-8 rounded-md flex items-center justify-center text-text-secondary hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                  title="编辑"
                  @click="openEditUser(row)"
                >
                  <Edit3 class="w-4 h-4" />
                </button>
                <button
                  class="w-8 h-8 rounded-md flex items-center justify-center transition-all"
                  :class="row.status === 'ACTIVE' ? 'text-warning-400 hover:bg-warning-500/10' : 'text-success-400 hover:bg-success-500/10'"
                  :title="row.status === 'ACTIVE' ? '禁用' : '启用'"
                  @click="toggleUserStatus(row)"
                >
                  <Ban class="w-4 h-4" />
                </button>
                <button
                  class="w-8 h-8 rounded-md flex items-center justify-center text-text-secondary hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                  title="重置密码"
                  @click="resetUserPassword(row)"
                >
                  <RotateCcw class="w-4 h-4" />
                </button>
              </div>
            </template>
          </DataTable>
        </div>

        <!-- 新增/编辑用户 Modal -->
        <Modal
          v-model:visible="userModalVisible"
          :title="userModalMode === 'create' ? '新增用户' : '编辑用户'"
          width="640px"
          @confirm="handleUserModalConfirm"
        >
          <div class="grid grid-cols-2 gap-5">
            <div>
              <label class="block text-sm text-text-secondary mb-2">账号 <span class="text-danger-400">*</span></label>
              <input
                v-model="userForm.account"
                type="text"
                class="w-full h-10 px-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary-500"
                placeholder="请输入登录账号"
                :disabled="userModalMode === 'edit'"
              />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-2">姓名 <span class="text-danger-400">*</span></label>
              <input
                v-model="userForm.name"
                type="text"
                class="w-full h-10 px-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary-500"
                placeholder="请输入用户姓名"
              />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-2">角色 <span class="text-danger-400">*</span></label>
              <select
                v-model="userForm.roleLevel"
                class="w-full h-10 px-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary-500 cursor-pointer"
              >
                <option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-2">所属省份</label>
              <select
                v-model="userForm.provinceCode"
                class="w-full h-10 px-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary-500 cursor-pointer"
              >
                <option value="">全国</option>
                <option v-for="p in PROVINCES" :key="p.code" :value="p.code">{{ p.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-2">所属城市</label>
              <select
                v-model="userForm.cityCode"
                class="w-full h-10 px-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary-500 cursor-pointer disabled:opacity-50"
                :disabled="!userForm.provinceCode"
              >
                <option value="">请选择城市</option>
                <option v-for="c in cityOptions" :key="c.code" :value="c.code">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-2">手机号</label>
              <input
                v-model="userForm.phone"
                type="tel"
                class="w-full h-10 px-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary-500"
                placeholder="请输入手机号"
              />
            </div>
            <div class="col-span-2">
              <label class="block text-sm text-text-secondary mb-2">邮箱</label>
              <input
                v-model="userForm.email"
                type="email"
                class="w-full h-10 px-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary-500"
                placeholder="请输入邮箱地址"
              />
            </div>
            <template v-if="userModalMode === 'create'">
              <div>
                <label class="block text-sm text-text-secondary mb-2">初始密码 <span class="text-danger-400">*</span></label>
                <input
                  v-model="userForm.password"
                  type="password"
                  class="w-full h-10 px-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary-500"
                  placeholder="请输入初始密码"
                />
              </div>
              <div>
                <label class="block text-sm text-text-secondary mb-2">确认密码 <span class="text-danger-400">*</span></label>
                <input
                  v-model="userForm.confirmPassword"
                  type="password"
                  class="w-full h-10 px-4 bg-bg-secondary border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary-500"
                  placeholder="请再次输入密码"
                />
              </div>
            </template>
          </div>
          <template #footer>
            <button class="btn-ghost px-5 py-2 text-sm" @click="userModalVisible = false">取消</button>
            <button
              class="btn-primary px-5 py-2 text-sm flex items-center gap-2"
              :disabled="userLoading"
              @click="handleUserModalConfirm"
            >
              <Loader2 v-if="userLoading" class="w-4 h-4 animate-spin" />
              {{ userLoading ? '保存中...' : '确定保存' }}
            </button>
          </template>
        </Modal>
      </div>

      <!-- 权限配置 -->
      <div v-if="activeTab === 'permissions'" class="flex-1 min-h-0 flex gap-4">
        <div class="w-72 shrink-0 panel p-4 space-y-3 overflow-y-auto">
          <h3 class="panel-title text-sm mb-4">角色列表</h3>
          <button
            v-for="role in roles"
            :key="role.id"
            class="w-full p-4 rounded-xl text-left transition-all duration-200 border relative overflow-hidden"
            :class="[
              selectedRole === role.id
                ? 'border-primary-500/60 shadow-glow-blue bg-primary-500/10'
                : 'border-default hover:border-primary-500/40 bg-bg-secondary/40',
            ]"
            @click="selectedRole = role.id; initRolePermissions(role.id)"
          >
            <div
              v-if="selectedRole === role.id"
              class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-400 to-primary-700"
            ></div>
            <div class="flex items-start justify-between mb-3">
              <div
                class="px-3 py-1 rounded-lg text-white text-xs font-bold"
                :style="{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }"
                :class="[
                  role.level === 1 ? 'bg-gradient-to-br from-danger-500 to-danger-700' : '',
                  role.level === 2 ? 'bg-gradient-to-br from-warning-500 to-warning-700' : '',
                  role.level === 3 ? 'bg-gradient-to-br from-primary-500 to-primary-700' : '',
                  role.level === 4 ? 'bg-gradient-to-br from-success-500 to-success-700' : '',
                  role.level === 5 ? 'bg-gradient-to-br from-[#722ED1] to-[#531DAB]' : '',
                ]"
              >
                L{{ role.level }}
              </div>
              <span class="text-xs text-text-tertiary">{{ role.userCount }} 人</span>
            </div>
            <div class="font-bold text-text-primary text-sm mb-1">{{ role.name }}</div>
            <div class="text-xs text-text-tertiary leading-relaxed">{{ role.desc }}</div>
          </button>
        </div>

        <div class="flex-1 panel p-5 min-h-0 flex flex-col">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="panel-title">
                权限树配置
                <span class="ml-2 text-xs font-normal text-primary-400">
                  {{ roles.find((r) => r.id === selectedRole)?.name }}
                </span>
              </h3>
              <p class="text-xs text-text-tertiary mt-1 ml-3">勾选菜单 / 页面 / 操作按钮三级权限</p>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn-ghost h-9 flex items-center gap-2 text-sm" @click="setAllPermissions(permissions, true)">
                <CheckCircle2 class="w-4 h-4" />
                全选
              </button>
              <button class="btn-ghost h-9 flex items-center gap-2 text-sm" @click="setAllPermissions(permissions, false)">
                <Ban class="w-4 h-4" />
                清空
              </button>
              <button
                class="btn-primary h-9 flex items-center gap-2 text-sm"
                :disabled="permissionsSaving"
                @click="savePermissions"
              >
                <Loader2 v-if="permissionsSaving" class="w-4 h-4 animate-spin" />
                <Save v-else class="w-4 h-4" />
                {{ permissionsSaving ? '保存中...' : '保存权限' }}
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto pr-2 border border-default rounded-xl p-4 bg-bg-secondary/30">
            <template v-for="(menu, mi) in permissions" :key="menu.id">
              <div class="mb-2">
                <div
                  class="flex items-center gap-2 p-2.5 rounded-lg transition-colors hover:bg-primary-500/5 cursor-pointer group"
                  @click="toggleExpand(menu)"
                >
                  <ChevronRight
                    class="w-4 h-4 text-text-tertiary shrink-0 transition-transform"
                    :class="{ 'rotate-90': menu.expanded }"
                  />
                  <label class="flex items-center gap-2 flex-1 cursor-pointer" @click.stop>
                    <input
                      type="checkbox"
                      :checked="menu.checked"
                      class="w-4 h-4 rounded border-default bg-bg-secondary text-primary-500 focus:ring-primary-500/30 focus:ring-2"
                      @change="togglePermission(menu)"
                    />
                    <span
                      class="text-xs px-2 py-0.5 rounded font-medium"
                      style="background: rgba(24,144,255,0.12); color: #63B3FF; border: 1px solid rgba(24,144,255,0.25);"
                    >菜单</span>
                    <span class="text-sm font-semibold text-text-primary">{{ menu.name }}</span>
                  </label>
                </div>
                <div v-if="menu.expanded && menu.children" class="ml-6 border-l border-default/60 pl-4 py-1 space-y-1">
                  <template v-for="(page, pi) in menu.children" :key="page.id">
                    <div>
                      <div
                        class="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-primary-500/5 cursor-pointer group"
                        @click="toggleExpand(page)"
                      >
                        <ChevronRight
                          v-if="page.children && page.children.length > 0"
                          class="w-3.5 h-3.5 text-text-tertiary shrink-0 transition-transform"
                          :class="{ 'rotate-90': page.expanded }"
                        />
                        <div v-else class="w-3.5 shrink-0"></div>
                        <label class="flex items-center gap-2 flex-1 cursor-pointer" @click.stop>
                          <input
                            type="checkbox"
                            :checked="page.checked"
                            class="w-3.5 h-3.5 rounded border-default bg-bg-secondary text-primary-500 focus:ring-primary-500/30 focus:ring-2"
                            @change="togglePermission(page)"
                          />
                          <span
                            class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style="background: rgba(82,196,26,0.1); color: #73D13D; border: 1px solid rgba(82,196,26,0.25);"
                          >页面</span>
                          <span class="text-sm text-text-primary">{{ page.name }}</span>
                        </label>
                      </div>
                      <div v-if="page.expanded && page.children" class="ml-6 border-l border-default/60 pl-4 py-1 space-y-0.5">
                        <div
                          v-for="(action, ai) in page.children"
                          :key="action.id"
                          class="flex items-center gap-2 p-1.5 rounded transition-colors hover:bg-primary-500/5"
                        >
                          <div class="w-3.5 shrink-0"></div>
                          <label class="flex items-center gap-2 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              :checked="action.checked"
                              class="w-3.5 h-3.5 rounded border-default bg-bg-secondary text-primary-500 focus:ring-primary-500/30 focus:ring-2"
                              @change="togglePermission(action)"
                            />
                            <span
                              class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style="background: rgba(250,173,20,0.1); color: #FFC53D; border: 1px solid rgba(250,173,20,0.25);"
                            >操作</span>
                            <span class="text-xs text-text-secondary">{{ action.name }}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 阈值配置 -->
      <div v-if="activeTab === 'thresholds'" class="flex-1 min-h-0 flex flex-col gap-3">
        <div class="panel p-4 shrink-0">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="panel-title">疫苗阈值参数配置</h3>
              <p class="text-xs text-text-tertiary mt-1 ml-3">
                <AlertTriangle class="w-3 h-3 inline text-warning-400 mr-1" />
                仅国家级管理员可修改此配置，修改后将立即生效并影响全系统预警触发条件
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn-ghost h-9 flex items-center gap-2 text-sm" @click="resetAllThresholds">
                <RefreshCw class="w-4 h-4" />
                全部重置
              </button>
              <button
                class="btn-primary h-9 flex items-center gap-2 text-sm"
                :disabled="thresholdsLoading || !canManageThresholds"
                @click="saveAllThresholds"
              >
                <Loader2 v-if="thresholdsLoading" class="w-4 h-4 animate-spin" />
                <Save v-else class="w-4 h-4" />
                {{ thresholdsLoading ? '保存中...' : '保存全部' }}
              </button>
            </div>
          </div>
        </div>

        <div class="panel p-5 flex-1 min-h-0 overflow-y-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr
                class="sticky top-0 z-10 text-left"
                style="background: linear-gradient(180deg, rgba(0, 39, 102, 0.6) 0%, rgba(0, 58, 140, 0.4) 100%); backdrop-filter: blur(8px)"
              >
                <th class="px-4 py-3 font-medium text-text-secondary whitespace-nowrap border-b border-default">疫苗名称</th>
                <th class="px-4 py-3 font-medium text-text-secondary whitespace-nowrap border-b border-default">
                  <span class="flex items-center gap-1.5"><Thermometer class="w-3.5 h-3.5 text-primary-400" />保存温度下限 (℃)</span>
                </th>
                <th class="px-4 py-3 font-medium text-text-secondary whitespace-nowrap border-b border-default">
                  <span class="flex items-center gap-1.5"><Thermometer class="w-3.5 h-3.5 text-danger-400" />保存温度上限 (℃)</span>
                </th>
                <th class="px-4 py-3 font-medium text-text-secondary whitespace-nowrap border-b border-default">
                  <span class="flex items-center gap-1.5"><Clock class="w-3.5 h-3.5 text-warning-400" />连续超标时长阈值 (分钟)</span>
                </th>
                <th class="px-4 py-3 font-medium text-text-secondary whitespace-nowrap border-b border-default">
                  <span class="flex items-center gap-1.5"><PackageIcon class="w-3.5 h-3.5 text-success-400" />库存安全天数</span>
                </th>
                <th class="px-4 py-3 font-medium text-text-secondary whitespace-nowrap border-b border-default">
                  <span class="flex items-center gap-1.5"><Bell class="w-3.5 h-3.5 text-[#722ED1]" />预警升级间隔 (小时)</span>
                </th>
                <th class="px-4 py-3 font-medium text-text-secondary whitespace-nowrap border-b border-default w-36 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in thresholdList"
                :key="row.id"
                class="border-b border-default/60 transition-colors hover:bg-primary-500/10"
                :class="[idx % 2 === 1 ? 'bg-white/[0.02]' : '']"
              >
                <td class="px-4 py-3 font-medium text-text-primary">
                  <span class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-primary-400"></span>
                    {{ row.vaccineName }}
                    <span class="text-xs text-text-tertiary font-mono">({{ row.vaccineCode }})</span>
                  </span>
                </td>
                <td class="px-4 py-3">
                  <input
                    type="number"
                    :value="row.tempMin"
                    class="w-24 h-8 px-2 bg-bg-secondary border rounded-md text-sm text-text-primary focus:outline-none focus:border-primary-500 text-right font-mono"
                    :class="row._dirty ? 'border-warning-500/60' : 'border-default'"
                    :disabled="!canManageThresholds"
                    @input="(e: any) => { row.tempMin = parseFloat(e.target.value); markDirty(row, 'tempMin') }"
                  />
                </td>
                <td class="px-4 py-3">
                  <input
                    type="number"
                    :value="row.tempMax"
                    class="w-24 h-8 px-2 bg-bg-secondary border rounded-md text-sm text-text-primary focus:outline-none focus:border-primary-500 text-right font-mono"
                    :class="row._dirty ? 'border-warning-500/60' : 'border-default'"
                    :disabled="!canManageThresholds"
                    @input="(e: any) => { row.tempMax = parseFloat(e.target.value); markDirty(row, 'tempMax') }"
                  />
                </td>
                <td class="px-4 py-3">
                  <input
                    type="number"
                    :value="row.overDurationMin"
                    min="5"
                    class="w-24 h-8 px-2 bg-bg-secondary border rounded-md text-sm text-text-primary focus:outline-none focus:border-primary-500 text-right font-mono"
                    :class="row._dirty ? 'border-warning-500/60' : 'border-default'"
                    :disabled="!canManageThresholds"
                    @input="(e: any) => { row.overDurationMin = parseInt(e.target.value); markDirty(row, 'overDurationMin') }"
                  />
                </td>
                <td class="px-4 py-3">
                  <input
                    type="number"
                    :value="row.safetyStockDays"
                    min="1"
                    class="w-24 h-8 px-2 bg-bg-secondary border rounded-md text-sm text-text-primary focus:outline-none focus:border-primary-500 text-right font-mono"
                    :class="row._dirty ? 'border-warning-500/60' : 'border-default'"
                    :disabled="!canManageThresholds"
                    @input="(e: any) => { row.safetyStockDays = parseInt(e.target.value); markDirty(row, 'safetyStockDays') }"
                  />
                </td>
                <td class="px-4 py-3">
                  <input
                    type="number"
                    :value="row.escalateIntervalHour"
                    min="1"
                    class="w-24 h-8 px-2 bg-bg-secondary border rounded-md text-sm text-text-primary focus:outline-none focus:border-primary-500 text-right font-mono"
                    :class="row._dirty ? 'border-warning-500/60' : 'border-default'"
                    :disabled="!canManageThresholds"
                    @input="(e: any) => { row.escalateIntervalHour = parseInt(e.target.value); markDirty(row, 'escalateIntervalHour') }"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      class="px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-primary-500/15 text-primary-400 hover:bg-primary-500/25 disabled:opacity-40"
                      :disabled="!row._dirty || !canManageThresholds"
                      @click="saveRow(row)"
                    >
                      保存
                    </button>
                    <button
                      class="px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-bg-tertiary/50 text-text-secondary hover:bg-bg-tertiary disabled:opacity-40"
                      :disabled="!row._dirty"
                      @click="resetRow(row)"
                    >
                      重置
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 字典维护 -->
      <div v-if="activeTab === 'dictionary'" class="flex-1 min-h-0 flex flex-col gap-3">
        <div class="panel p-2 shrink-0 inline-flex">
          <button
            v-for="tab in dictTabs"
            :key="tab.key"
            class="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
            :class="[
              activeDictTab === tab.key
                ? 'bg-primary-500 text-white shadow-glow-blue'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/40',
            ]"
            @click="activeDictTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="panel p-5 flex-1 min-h-0">
          <div class="flex items-center justify-between mb-4">
            <h3 class="panel-title text-sm">{{ dictTabs.find((t) => t.key === activeDictTab)?.label }} · 字典项管理</h3>
            <div class="flex items-center gap-2">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="搜索编码或名称..."
                  class="w-56 h-8 pl-9 pr-3 bg-bg-secondary border border-default rounded-md text-xs text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:border-primary-500"
                />
              </div>
              <button class="btn-ghost h-8 flex items-center gap-1.5 text-xs px-3">
                <Plus class="w-3.5 h-3.5" />
                新增字典项
              </button>
            </div>
          </div>
          <DataTable
            :columns="dictColumns"
            :data="dictMap[activeDictTab]"
            :total="dictMap[activeDictTab].length"
            :page="1"
            :page-size="50"
          >
            <template #cell-actions="{ row }">
              <div class="flex items-center gap-1">
                <button
                  class="w-8 h-8 rounded-md flex items-center justify-center text-text-secondary hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                  title="编辑"
                >
                  <Edit3 class="w-4 h-4" />
                </button>
                <button
                  class="w-8 h-8 rounded-md flex items-center justify-center transition-all"
                  :class="row.status === 'ACTIVE' ? 'text-warning-400 hover:bg-warning-500/10' : 'text-success-400 hover:bg-success-500/10'"
                  :title="row.status === 'ACTIVE' ? '停用' : '启用'"
                  @click="toggleDictStatus(row)"
                >
                  <Ban class="w-4 h-4" />
                </button>
                <button
                  class="w-8 h-8 rounded-md flex items-center justify-center text-text-secondary hover:text-danger-400 hover:bg-danger-500/10 transition-all"
                  title="删除"
                  @click="deleteDictRow(row)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </template>
          </DataTable>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
