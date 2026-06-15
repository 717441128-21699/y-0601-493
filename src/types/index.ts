// 用户与权限
export type UserLevel = 1 | 2 | 3; // 1-国家 2-省 3-市

export interface UserInfo {
  id: string;
  username: string;
  realName: string;
  level: UserLevel;
  role: 'NATIONAL' | 'PROVINCE' | 'CITY' | 'COLD_CHAIN' | 'VACCINE_POINT';
  province?: string;
  city?: string;
  permissions: string[];
  avatar?: string;
}

// 区域
export interface AreaNode {
  code: string;
  name: string;
  children?: AreaNode[];
}

// KPI 指标
export interface KpiData {
  label: string;
  value: number;
  unit: string;
  trend: number; // 同比百分比
  status: 'up' | 'down' | 'flat';
  healthy: boolean; // 是否在健康范围
}

// 省份冷链数据
export interface ProvinceColdData {
  code: string;
  name: string;
  temperatureRate: number; // 温度合格率 0-100
  coverageRate: number; // 接种覆盖率
  alertCount: number;
  totalColdStores: number;
}

// 冷库
export interface ColdStore {
  id: string;
  name: string;
  province: string;
  city: string;
  address: string;
  currentTemp: number;
  targetTempMin: number;
  targetTempMax: number;
  status: 'NORMAL' | 'WARNING' | 'ERROR' | 'OFFLINE';
  runningHours: number;
  deviceModel: string;
}

// 温度记录
export interface TempRecord {
  time: string;
  temp: number;
  coldStoreId: string;
}

// 运输车辆
export interface TransportVehicle {
  id: string;
  plateNo: string;
  driver: string;
  origin: string;
  destination: string;
  currentLng: number;
  currentLat: number;
  currentTemp: number;
  vaccineBatch: string;
  status: 'TRANSIT' | 'ARRIVED' | 'DELAYED';
  track: { lng: number; lat: number; time: string }[];
}

// 疫苗批次库存
export interface VaccineBatch {
  id: string;
  vaccineName: string;
  vaccineType: 'LIVE' | 'INACTIVATED' | 'mRNA' | 'OTHER';
  batchNo: string;
  province: string;
  city: string;
  quantity: number; // 当前库存（剂）
  dailyUsage: number; // 近7日日均用量
  turnoverDays: number; // 周转天数 = quantity/dailyUsage
  expireDate: string;
  threeDayUsage: number; // 3日预警线
}

// 接种记录
export interface VaccinationRecord {
  id: string;
  personName: string;
  ageGroup: '0-6' | '7-17' | '18-59' | '60+';
  vaccineName: string;
  batchNo: string;
  site: string;
  province: string;
  time: string;
  isTimely: boolean; // 是否及时接种（计划内）
}

// 预警
export type AlertLevel = 'L1' | 'L2';
export type AlertType = 'TEMP_OVER' | 'TEMP_UNDER' | 'STOCK_LOW' | 'DEVICE_FAULT';
export type AlertStatus = 'PENDING' | 'PROCESSING' | 'ESCALATED' | 'APPROVING' | 'CLOSED';

export interface Alert {
  id: string;
  level: AlertLevel;
  type: AlertType;
  title: string;
  description: string;
  province: string;
  city: string;
  targetId: string; // 关联冷库/批次ID
  triggerTime: string;
  expireTime: string; // 一级预警处置截止（+2h）
  status: AlertStatus;
  temperature?: { current: number; min: number; max: number; duration: number };
  stock?: { batchNo: string; current: number; threshold: number };
  handleLogs?: AlertHandleLog[];
  approval?: ApprovalFlow;
  typeName: string;
  provinceCode: string;
  cityCode: string;
  closed?: boolean;
}

export interface AlertHandleLog {
  operator: string;
  role: string;
  action: string;
  remark: string;
  time: string;
}

// 审批流程
export type ApprovalStep = 'ADMIN_CONFIRM' | 'CITY_REVIEW' | 'PROVINCE_APPROVE';

export interface ApprovalFlow {
  id: string;
  alertId: string;
  currentStep: ApprovalStep;
  result?: 'TRANSFER' | 'SCRAP'; // 紧急调拨 / 报废
  steps: ApprovalNode[];
  alertTitle?: string;
  alertLevel?: AlertLevel;
  applicant?: string;
  submitTime?: string;
  description?: string;
  nodes?: ApprovalNode[];
  currentStatus?: 'PENDING' | 'APPROVING' | 'APPROVED' | 'REJECTED';
}

export interface ApprovalNode {
  step: ApprovalStep;
  operator: string;
  opinion: string;
  time?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// 接种计划
export interface MonthlyTarget {
  month: string; // YYYY-MM
  vaccineName: string;
  targetCount: number;
  actualCount?: number;
  vaccineCode?: string;
  targetPopulation?: number;
  planDoses?: number;
  actualDoses?: number;
  completionRate?: number;
  coverageRate?: number;
}

// 计划解析结果
export interface PlanParseResult {
  success: boolean;
  totalRows: number;
  invalidRows: number;
  targets: MonthlyTarget[];
  message?: string;
}

// 预测缺口
export interface ForecastDay {
  date: string;
  demand: number;
  supply: number;
  gap: number; // 缺口 = max(0, demand-supply)
  vaccineName: string;
  currentStock?: number;
  forecastDemand?: number;
  projectedGap?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// 调拨建议
export interface TransferSuggestion {
  id: string;
  vaccineName: string;
  batchNo: string;
  from: string; // 调出省份
  to: string; // 调入省份
  quantity: number;
  estimatedDays: number; // 预计运输天数
  cost: number; // 预计成本
  priority: 1 | 2 | 3; // 优先级
}

// 周报
export interface WeeklyReport {
  id: string;
  week: string; // YYYY-Www
  province: string;
  generateTime: string;
  summary: {
    tempOverRate: number;
    tempOverRateYoy: number;
    tempOverRateMom: number;
    vaccineLossRate: number;
    vaccineLossRank: { name: string; rate: number }[];
    progressCompare: { name: string; plan: number; actual: number }[];
    strategies: string[];
    shortageRank?: { provinceName: string; vaccineName: string; shortageDays: number }[];
  };
}

// 通用 API 响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

// 分页结果类型
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 排名条
export interface BarRankItem {
  name: string;
  value: number;
  [k: string]: any;
}
