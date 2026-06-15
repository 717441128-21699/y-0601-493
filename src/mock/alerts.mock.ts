import { PROVINCES, CITIES, VACCINE_TYPES } from './_provinces.js';

export type AlertLevel = 'L1' | 'L2';
export type AlertType = 'TEMP_OVER' | 'TEMP_UNDER' | 'STOCK_LOW' | 'DEVICE_FAULT';
export type AlertStatus = 'PENDING' | 'PROCESSING' | 'ESCALATED' | 'APPROVING' | 'CLOSED';
export type ApprovalStep = 'ADMIN_CONFIRM' | 'CITY_REVIEW' | 'PROVINCE_APPROVE';
export type ApprovalResult = 'TRANSFER' | 'SCRAP';
export type ApprovalNodeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AlertHandleLog {
  operator: string;
  role: string;
  action: string;
  remark: string;
  time: string;
}

export interface ApprovalNode {
  step: ApprovalStep;
  stepName: string;
  operator: string;
  operatorRole: string;
  opinion: string;
  time?: string;
  status: ApprovalNodeStatus;
}

export interface ApprovalFlow {
  id: string;
  alertId: string;
  currentStep: ApprovalStep;
  result?: ApprovalResult;
  steps: ApprovalNode[];
}

export interface AlertTemperatureData {
  current: number;
  min: number;
  max: number;
  duration: number;
  coldStoreName: string;
}

export interface AlertStockData {
  batchNo: string;
  vaccineName: string;
  current: number;
  threshold: number;
  threeDayUsage: number;
}

export interface AlertDeviceData {
  deviceName: string;
  deviceModel: string;
  faultType: string;
}

export interface Alert {
  id: string;
  level: AlertLevel;
  type: AlertType;
  typeName: string;
  title: string;
  description: string;
  province: string;
  provinceCode: string;
  city: string;
  cityCode: string;
  targetId: string;
  triggerTime: string;
  expireTime: string;
  status: AlertStatus;
  temperature?: AlertTemperatureData;
  stock?: AlertStockData;
  device?: AlertDeviceData;
  handleLogs: AlertHandleLog[];
  approval?: ApprovalFlow;
}

const LS_ALERTS = 'vaccine_mock_alerts';
const LS_APPROVALS = 'vaccine_mock_approvals';

function lsGetAlerts(): Alert[] | null {
  try {
    const raw = localStorage.getItem(LS_ALERTS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function lsSetAlerts(alerts: Alert[]): void {
  try {
    localStorage.setItem(LS_ALERTS, JSON.stringify(alerts));
  } catch (e) {
    console.warn('[alerts.mock] 保存 alerts 到 localStorage 失败', e);
  }
}

function lsGetApprovals(): ApprovalFlow[] | null {
  try {
    const raw = localStorage.getItem(LS_APPROVALS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function lsSetApprovals(approvals: ApprovalFlow[]): void {
  try {
    localStorage.setItem(LS_APPROVALS, JSON.stringify(approvals));
  } catch (e) {
    console.warn('[alerts.mock] 保存 approvals 到 localStorage 失败', e);
  }
}

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function seededBetween(rand: () => number, min: number, max: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round((rand() * (max - min) + min) * factor) / factor;
}

function pad(num: number, size: number): string {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

const ALERT_TYPE_NAMES: Record<AlertType, string> = {
  TEMP_OVER: '温度超标',
  TEMP_UNDER: '温度过低',
  STOCK_LOW: '库存不足',
  DEVICE_FAULT: '设备故障',
};

const STEP_NAMES: Record<ApprovalStep, string> = {
  ADMIN_CONFIRM: '冷链管理员确认',
  CITY_REVIEW: '市级疾控复核',
  PROVINCE_APPROVE: '省级卫健委批准',
};

function formatDateTime(d: Date): string {
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

function addMinutes(date: Date, minutes: number): Date {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

function generateAlerts(): Alert[] {
  const result: Alert[] = [];
  const now = new Date();
  const alertTypes: AlertType[] = ['TEMP_OVER', 'TEMP_UNDER', 'STOCK_LOW', 'DEVICE_FAULT'];
  const typeWeights = [40, 15, 25, 20];

  function pickWeighted<T>(items: T[], weights: number[], rand: () => number): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[0];
  }

  for (let i = 0; i < 20; i++) {
    const rand = seededRand(i * 47 + 2024);
    const provIdx = Math.floor(rand() * PROVINCES.length);
    const province = PROVINCES[provIdx];
    const cities = CITIES[province.code] || [];
    const city = cities[Math.floor(rand() * cities.length)] || { code: province.code, name: '市辖区' };

    const type = pickWeighted(alertTypes, typeWeights, rand);
    const isL2 = i % 3 === 0;
    const level: AlertLevel = isL2 ? 'L2' : 'L1';

    const ageHours = seededBetween(rand, 0, 72, 0);
    const triggerTime = addHours(now, -ageHours);
    const expireTime = addMinutes(triggerTime, level === 'L1' ? 120 : 1440);

    let status: AlertStatus;
    if (level === 'L2') {
      if (ageHours > 24) status = 'APPROVING';
      else status = 'ESCALATED';
    } else {
      if (ageHours < 1) status = 'PENDING';
      else if (ageHours < 2) status = 'PROCESSING';
      else if (ageHours < 3) status = 'ESCALATED';
      else status = i % 5 === 0 ? 'CLOSED' : 'APPROVING';
    }

    let title = '';
    let description = '';
    let temperature: AlertTemperatureData | undefined;
    let stock: AlertStockData | undefined;
    let device: AlertDeviceData | undefined;
    let targetId = '';

    switch (type) {
      case 'TEMP_OVER': {
        const vt = VACCINE_TYPES[Math.floor(rand() * VACCINE_TYPES.length)];
        const targetMin = vt.tempMin;
        const targetMax = vt.tempMax;
        const range = targetMax - targetMin;
        const current = seededBetween(rand, targetMax + range * 0.3, targetMax + range * 0.8, 1);
        const duration = seededBetween(rand, 30, 240, 0);
        const coldStoreName = `${city.name}疾控中心${Math.floor(rand() * 3) + 1}号冷库`;
        title = `【温度超标】${coldStoreName}连续高温`;
        description = `冷库温度持续${duration}分钟超过${targetMax}℃，可能影响${vt.name}质量安全`;
        temperature = { current, min: targetMin, max: targetMax, duration, coldStoreName };
        targetId = `CS${pad(provIdx * 5 + 1, 4)}`;
        break;
      }
      case 'TEMP_UNDER': {
        const vt = VACCINE_TYPES[Math.floor(rand() * VACCINE_TYPES.length)];
        const targetMin = vt.tempMin;
        const targetMax = vt.tempMax;
        const range = targetMax - targetMin;
        const current = seededBetween(rand, targetMin - range * 0.8, targetMin - range * 0.3, 1);
        const duration = seededBetween(rand, 25, 180, 0);
        const coldStoreName = `${city.name}疾控中心${Math.floor(rand() * 3) + 1}号冷库`;
        title = `【温度过低】${coldStoreName}温度异常`;
        description = `冷库温度低于${targetMin}℃已持续${duration}分钟，请检查冷冻机组`;
        temperature = { current, min: targetMin, max: targetMax, duration, coldStoreName };
        targetId = `CS${pad(provIdx * 5 + 2, 4)}`;
        break;
      }
      case 'STOCK_LOW': {
        const vt = VACCINE_TYPES[Math.floor(rand() * VACCINE_TYPES.length)];
        const threeDayUsage = seededBetween(rand, 200, 800, 0);
        const current = Math.floor(threeDayUsage * seededBetween(rand, 0.3, 0.9, 2));
        const batchNo = `${vt.code}-24${pad(Math.floor(rand() * 12) + 1, 2)}-${pad(Math.floor(rand() * 9000) + 1000, 4)}`;
        title = `【库存不足】${vt.name}低于3日用量`;
        description = `${city.name}${vt.name}库存${current}剂，预计${Math.round(current / (threeDayUsage / 3))}天后耗尽`;
        stock = { batchNo, vaccineName: vt.name, current, threshold: threeDayUsage, threeDayUsage };
        targetId = `VB${pad(i + 1, 5)}`;
        break;
      }
      case 'DEVICE_FAULT': {
        const deviceTypes = ['冷藏机组', '温度传感器', '备用发电机', '监控终端', '门禁系统'];
        const faultTypes = ['机组异常停机', '传感器通信中断', '电池电量告警', '无法远程连接', '压缩机异响'];
        const dtIdx = Math.floor(rand() * deviceTypes.length);
        const deviceName = `${city.name}疾控中心${deviceTypes[dtIdx]}`;
        const deviceModel = ['HYC-310', 'TESTO-174T', 'CUMMINS-6BT', 'DVP-9020', 'SMART-V3'][dtIdx];
        title = `【设备故障】${deviceName}异常`;
        description = `${deviceName}出现${faultTypes[dtIdx]}，请立即安排维修人员检查`;
        device = { deviceName, deviceModel, faultType: faultTypes[dtIdx] };
        targetId = `EQ${pad(i + 1, 4)}`;
        break;
      }
    }

    const handleLogs: AlertHandleLog[] = [];

    if (status === 'PROCESSING' || status === 'ESCALATED' || status === 'APPROVING' || status === 'CLOSED') {
      handleLogs.push({
        operator: '冷管-王建国',
        role: '冷链管理员',
        action: '开始处置',
        remark: '已收到预警，正在现场核实情况',
        time: formatDateTime(addMinutes(triggerTime, seededBetween(rand, 5, 20, 0))),
      });
    }

    if (status === 'ESCALATED' || status === 'APPROVING' || status === 'CLOSED') {
      handleLogs.push({
        operator: '冷管-王建国',
        role: '冷链管理员',
        action: '现场核实',
        remark: level === 'L2' ? '现场确认情况属实，已无法在2小时内解决，申请升级二级预警' : '现场核实完成，问题已初步处理，等待观察',
        time: formatDateTime(addMinutes(triggerTime, seededBetween(rand, 40, 90, 0))),
      });
    }

    if (status === 'CLOSED') {
      handleLogs.push({
        operator: '疾管-李主任',
        role: '市级管理员',
        action: '关闭预警',
        remark: '问题已解决，系统恢复正常',
        time: formatDateTime(addMinutes(triggerTime, seededBetween(rand, 150, 200, 0))),
      });
    }

    let approval: ApprovalFlow | undefined;
    if (level === 'L2' && (status === 'ESCALATED' || status === 'APPROVING' || status === 'CLOSED')) {
      const approvalId = `APR${pad(i + 1, 6)}`;
      const stepIndex = status === 'APPROVING' ? seededBetween(rand, 0, 2, 0) : 3;
      const currentStep: ApprovalStep = (['ADMIN_CONFIRM', 'CITY_REVIEW', 'PROVINCE_APPROVE'] as ApprovalStep[])[Math.min(stepIndex, 2)];
      const steps: ApprovalNode[] = [
        {
          step: 'ADMIN_CONFIRM',
          stepName: STEP_NAMES.ADMIN_CONFIRM,
          operator: '冷管-王建国',
          operatorRole: '冷链管理员',
          opinion: stepIndex >= 0 ? (status === 'CLOSED' ? '情况已确认，建议紧急调拨邻近省份库存' : '情况已确认，申请调拨') : '',
          time: stepIndex >= 0 ? formatDateTime(addMinutes(triggerTime, 130)) : undefined,
          status: stepIndex > 0 || status === 'CLOSED' ? 'APPROVED' : stepIndex === 0 ? 'PENDING' : 'PENDING',
        },
        {
          step: 'CITY_REVIEW',
          stepName: STEP_NAMES.CITY_REVIEW,
          operator: '疾管-李主任',
          operatorRole: '市级疾控',
          opinion: stepIndex >= 1 ? (status === 'CLOSED' ? '复核通过，同意调拨方案' : '复核中...') : '',
          time: stepIndex >= 1 ? formatDateTime(addMinutes(triggerTime, 180)) : undefined,
          status: stepIndex > 1 || status === 'CLOSED' ? 'APPROVED' : stepIndex === 1 ? 'PENDING' : 'PENDING',
        },
        {
          step: 'PROVINCE_APPROVE',
          stepName: STEP_NAMES.PROVINCE_APPROVE,
          operator: '卫健-张局长',
          operatorRole: '省级卫健委',
          opinion: stepIndex >= 2 || status === 'CLOSED' ? '批准执行，从邻省紧急调拨' : '',
          time: stepIndex >= 2 || status === 'CLOSED' ? formatDateTime(addMinutes(triggerTime, 240)) : undefined,
          status: status === 'CLOSED' ? 'APPROVED' : stepIndex >= 2 ? 'PENDING' : 'PENDING',
        },
      ];

      approval = {
        id: approvalId,
        alertId: `ALT${pad(i + 1, 6)}`,
        currentStep,
        result: status === 'CLOSED' ? (stock ? 'TRANSFER' : 'SCRAP') : undefined,
        steps,
      };
    }

    result.push({
      id: `ALT${pad(i + 1, 6)}`,
      level,
      type,
      typeName: ALERT_TYPE_NAMES[type],
      title,
      description,
      province: province.name,
      provinceCode: province.code,
      city: city.name,
      cityCode: city.code,
      targetId,
      triggerTime: formatDateTime(triggerTime),
      expireTime: formatDateTime(expireTime),
      status,
      temperature,
      stock,
      device,
      handleLogs,
      approval,
    });
  }

  const sorted = result.sort((a, b) => b.triggerTime.localeCompare(a.triggerTime));
  lsSetAlerts(sorted);
  return sorted;
}

function getAlerts(): Alert[] {
  const cached = lsGetAlerts();
  if (cached && cached.length > 0) {
    return cached;
  }
  return generateAlerts();
}

export function mockGetAlerts(level?: AlertLevel): Alert[] {
  checkEscalateL2();
  let all = getAlerts();
  if (level) {
    all = all.filter((a) => a.level === level);
  }
  return all;
}

export function mockGetAlertStats() {
  checkEscalateL2();
  const all = getAlerts();
  return {
    total: all.length,
    l1Pending: all.filter((a) => a.level === 'L1' && (a.status === 'PENDING' || a.status === 'PROCESSING')).length,
    l2Pending: all.filter((a) => a.level === 'L2' && (a.status === 'ESCALATED' || a.status === 'APPROVING')).length,
    todayNew: all.filter((a) => {
      const t = new Date(a.triggerTime);
      const now = new Date();
      return (now.getTime() - t.getTime()) < 86400000;
    }).length,
    tempAlerts: all.filter((a) => a.type.startsWith('TEMP')).length,
    stockAlerts: all.filter((a) => a.type === 'STOCK_LOW').length,
    deviceAlerts: all.filter((a) => a.type === 'DEVICE_FAULT').length,
  };
}

export function mockHandleAlert(id: string, remark: string): Alert | null {
  const all = getAlerts();
  const alert = all.find((a) => a.id === id);
  if (!alert) return null;

  alert.status = alert.level === 'L2' ? 'APPROVING' : 'PROCESSING';
  alert.handleLogs.push({
    operator: '当前用户',
    role: '处置人员',
    action: '处置记录',
    remark,
    time: formatDateTime(new Date()),
  });

  lsSetAlerts(all);
  return { ...alert };
}

export function mockGetMyApprovals(userLevel?: 1 | 2 | 3): ApprovalFlow[] {
  checkEscalateL2();
  const all = getAlerts();
  const approvals: ApprovalFlow[] = [];

  for (const alert of all) {
    if (alert.approval && (alert.status === 'ESCALATED' || alert.status === 'APPROVING')) {
      let include = false;
      if (userLevel === 3 && alert.approval.currentStep === 'ADMIN_CONFIRM') include = true;
      if (userLevel === 2 && alert.approval.currentStep === 'CITY_REVIEW') include = true;
      if (userLevel === 1 && alert.approval.currentStep === 'PROVINCE_APPROVE') include = true;
      if (!userLevel) include = true;

      if (include) {
        approvals.push({
          ...alert.approval,
          alertId: alert.id,
        });
      }
    }
  }

  return approvals;
}

export function mockGetFlowById(id: string): ApprovalFlow | null {
  checkEscalateL2();
  const all = getAlerts();
  for (const alert of all) {
    if (alert.approval && alert.approval.id === id) {
      return { ...alert.approval };
    }
  }
  const cachedApprovals = lsGetApprovals();
  if (cachedApprovals) {
    const flow = cachedApprovals.find((f) => f.id === id);
    return flow ? { ...flow } : null;
  }
  return null;
}

export function mockApproveStep(
  approvalId: string,
  step: ApprovalStep,
  opinion: string,
  pass: boolean = true
): ApprovalFlow | null {
  const all = getAlerts();

  for (const alert of all) {
    if (alert.approval && alert.approval.id === approvalId) {
      const flow = alert.approval;
      const node = flow.steps.find((s) => s.step === step);
      if (!node) return null;

      node.status = pass ? 'APPROVED' : 'REJECTED';
      node.opinion = opinion;
      node.time = formatDateTime(new Date());

      const stepOrder: ApprovalStep[] = ['ADMIN_CONFIRM', 'CITY_REVIEW', 'PROVINCE_APPROVE'];
      const currentIdx = stepOrder.indexOf(step);

      if (pass && currentIdx < stepOrder.length - 1) {
        flow.currentStep = stepOrder[currentIdx + 1];
        alert.status = 'APPROVING';
      } else if (pass && currentIdx === stepOrder.length - 1) {
        flow.result = alert.stock ? 'TRANSFER' : 'SCRAP';
        alert.status = 'CLOSED';
        if (alert.approval) {
          alert.approval.result = flow.result;
        }
        alert.handleLogs.push({
          operator: '系统',
          role: '系统',
          action: '审批完成',
          remark: `三级审批全部通过，执行${flow.result === 'TRANSFER' ? '紧急调拨' : '报废'}`,
          time: formatDateTime(new Date()),
        });
      } else if (!pass) {
        alert.status = 'CLOSED';
        alert.handleLogs.push({
          operator: '系统',
          role: '系统',
          action: '审批驳回',
          remark: `在${STEP_NAMES[step]}环节被驳回: ${opinion}`,
          time: formatDateTime(new Date()),
        });
      }

      lsSetAlerts(all);
      return { ...flow };
    }
  }

  return null;
}

export function mockCloseAlert(id: string, closeRemark: string): Alert | null {
  const all = getAlerts();
  const alert = all.find((a) => a.id === id);
  if (!alert) return null;

  alert.status = 'CLOSED';
  alert.handleLogs.push({
    operator: '当前用户',
    role: '管理员',
    action: '关闭预警',
    remark: closeRemark || '问题已解决',
    time: formatDateTime(new Date()),
  });

  lsSetAlerts(all);
  return { ...alert };
}

export function checkEscalateL2(): number {
  const all = getAlerts();
  const now = new Date();
  let escalatedCount = 0;

  for (const alert of all) {
    if (alert.level === 'L1' && alert.status !== 'CLOSED') {
      const expireTimeStr = alert.expireTime.replace(' ', 'T');
      const expire = new Date(expireTimeStr);
      if (now.getTime() >= expire.getTime() && alert.status !== 'ESCALATED' && alert.status !== 'APPROVING') {
        alert.level = 'L2';
        alert.status = 'ESCALATED';
        alert.handleLogs.unshift({
          operator: '系统',
          role: '系统',
          action: '超时升级',
          remark: 'L1预警处置超时，自动升级为L2二级预警，请尽快进入审批工作台处理',
          time: formatDateTime(now),
        });

        if (!alert.approval) {
          const ts = Date.now();
          const approvalId = `APR${String(ts % 1000000).padStart(6, '0')}`;
          alert.approval = {
            id: approvalId,
            alertId: alert.id,
            currentStep: 'ADMIN_CONFIRM',
            steps: [
              {
                step: 'ADMIN_CONFIRM',
                stepName: STEP_NAMES.ADMIN_CONFIRM,
                operator: '',
                operatorRole: '冷链管理员',
                opinion: '',
                status: 'PENDING',
              },
              {
                step: 'CITY_REVIEW',
                stepName: STEP_NAMES.CITY_REVIEW,
                operator: '',
                operatorRole: '市级疾控',
                opinion: '',
                status: 'PENDING',
              },
              {
                step: 'PROVINCE_APPROVE',
                stepName: STEP_NAMES.PROVINCE_APPROVE,
                operator: '',
                operatorRole: '省级卫健委',
                opinion: '',
                status: 'PENDING',
              },
            ],
          };
        }
        escalatedCount++;
      }
    }
  }

  if (escalatedCount > 0) {
    lsSetAlerts(all);
  }
  return escalatedCount;
}

export function mockHandleAlertV2(id: string, remark: string, actionType: string = '处置措施'): Alert | null {
  const all = getAlerts();
  const alert = all.find((a) => a.id === id);
  if (!alert) return null;

  alert.status = alert.level === 'L2' ? 'APPROVING' : 'PROCESSING';
  alert.handleLogs.unshift({
    operator: '当前用户',
    role: '处置人员',
    action: actionType,
    remark,
    time: formatDateTime(new Date()),
  });

  lsSetAlerts(all);
  return { ...alert };
}

export function mockApproveStepV2(
  approvalId: string,
  step: ApprovalStep,
  opinion: string,
  pass: boolean = true,
  result?: ApprovalResult
): ApprovalFlow | null {
  const all = getAlerts();

  for (const alert of all) {
    if (alert.approval && alert.approval.id === approvalId) {
      const flow = alert.approval;
      const node = flow.steps.find((s) => s.step === step);
      if (!node) return null;

      node.status = pass ? 'APPROVED' : 'REJECTED';
      node.opinion = opinion;
      node.time = formatDateTime(new Date());

      const stepOrder: ApprovalStep[] = ['ADMIN_CONFIRM', 'CITY_REVIEW', 'PROVINCE_APPROVE'];
      const currentIdx = stepOrder.indexOf(step);

      if (pass && currentIdx < stepOrder.length - 1) {
        flow.currentStep = stepOrder[currentIdx + 1];
        alert.status = 'APPROVING';
        alert.handleLogs.unshift({
          operator: node.operator || '审批人员',
          role: node.operatorRole || STEP_NAMES[step],
          action: `通过${STEP_NAMES[step]}`,
          remark: opinion,
          time: formatDateTime(new Date()),
        });
      } else if (pass && currentIdx === stepOrder.length - 1) {
        flow.result = result || (alert.stock ? 'TRANSFER' : 'SCRAP');
        alert.status = 'CLOSED';
        alert.approval = { ...flow, result: flow.result };
        alert.handleLogs.unshift({
          operator: '系统',
          role: '系统',
          action: '审批完成',
          remark: `三级审批全部通过，执行${flow.result === 'TRANSFER' ? '紧急调拨' : '报废'}`,
          time: formatDateTime(new Date()),
        });
      } else if (!pass) {
        const stepOrderReversed: ApprovalStep[] = ['PROVINCE_APPROVE', 'CITY_REVIEW', 'ADMIN_CONFIRM'];
        const reverseIdx = stepOrderReversed.indexOf(step);
        if (reverseIdx < stepOrderReversed.length - 1) {
          flow.currentStep = stepOrderReversed[reverseIdx + 1];
          const prevNode = flow.steps.find((s) => s.step === flow.currentStep);
          if (prevNode) {
            prevNode.status = 'PENDING';
            prevNode.opinion = '';
            prevNode.time = undefined;
          }
        }
        alert.status = 'APPROVING';
        alert.handleLogs.unshift({
          operator: node.operator || '审批人员',
          role: node.operatorRole || STEP_NAMES[step],
          action: `退回${STEP_NAMES[step]}`,
          remark: `退回理由: ${opinion}`,
          time: formatDateTime(new Date()),
        });
      }

      lsSetAlerts(all);
      return { ...flow };
    }
  }

  return null;
}

export function mockGetAlertById(id: string): Alert | null {
  checkEscalateL2();
  const all = getAlerts();
  const alert = all.find((a) => a.id === id);
  return alert ? { ...alert } : null;
}
