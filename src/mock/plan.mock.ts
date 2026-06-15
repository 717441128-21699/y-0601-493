import { PROVINCES, VACCINE_TYPES } from './_provinces.js';

export interface MonthlyTarget {
  month: string;
  vaccineName: string;
  vaccineCode: string;
  targetCount: number;
  actualCount?: number;
  completionRate?: number;
}

export interface ForecastDay {
  date: string;
  vaccineName: string;
  vaccineCode: string;
  demand: number;
  supply: number;
  gap: number;
  status: 'NORMAL' | 'WARNING' | 'SHORTAGE';
}

export interface TransferSuggestion {
  id: string;
  vaccineName: string;
  vaccineCode: string;
  batchNo: string;
  fromProvince: string;
  fromProvinceCode: string;
  toProvince: string;
  toProvinceCode: string;
  quantity: number;
  estimatedDays: number;
  cost: number;
  priority: 1 | 2 | 3;
  reason: string;
  route: string;
}

export interface PlanParseResult {
  year: number;
  totalTargets: number;
  validRows: number;
  invalidRows: number;
  targets: MonthlyTarget[];
  warnings: string[];
}

const LS_TARGETS = 'vaccine_plan_targets';

function lsGetTargets(): MonthlyTarget[] | null {
  try {
    const raw = localStorage.getItem(LS_TARGETS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function lsSetTargets(data: MonthlyTarget[]): void {
  try {
    localStorage.setItem(LS_TARGETS, JSON.stringify(data));
  } catch (e) {
    console.warn('[plan.mock] 保存 targets 到 localStorage 失败', e);
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

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pad(num: number, size: number): string {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const VACCINE_BASE_DEMAND: Record<string, number> = {
  BCG: 80000,
  HepB: 120000,
  OPV: 95000,
  DTaP: 110000,
  MMR: 85000,
  VarV: 75000,
  Flu: 200000,
  HPV: 150000,
  COVID: 300000,
  PCV13: 65000,
};

export function mockParsePlanExcel(fileName?: string): PlanParseResult {
  const year = new Date().getFullYear();
  const targets: MonthlyTarget[] = [];
  const warnings: string[] = [];
  let validRows = 0;

  VACCINE_TYPES.forEach((vt, vtIdx) => {
    const baseDemand = VACCINE_BASE_DEMAND[vt.code] || 80000;

    for (let m = 0; m < 12; m++) {
      const month = `${year}-${pad(m + 1, 2)}`;
      const rand = seededRand(vtIdx * 100 + m + year);

      const seasonalMultiplier = m === 0 || m === 1 ? 0.8 :
        m >= 2 && m <= 4 ? 1.1 :
        m >= 5 && m <= 7 ? 1.0 :
        m >= 8 && m <= 10 ? 1.15 :
        1.2;

      const targetCount = Math.round(baseDemand * seasonalMultiplier * (0.9 + rand() * 0.2) / 10) * 10;
      const actualCount = m < 5 ? Math.round(targetCount * (0.85 + rand() * 0.15)) : undefined;

      targets.push({
        month,
        vaccineName: vt.name,
        vaccineCode: vt.code,
        targetCount,
        actualCount,
        completionRate: actualCount ? Math.round((actualCount / targetCount) * 1000) / 10 : undefined,
      });
      validRows++;
    }
  });

  return {
    year,
    totalTargets: targets.length,
    validRows,
    invalidRows: 0,
    targets,
    warnings,
  };
}

export function mockUpdateTargets(updates: { month: string; vaccineCode: string; targetCount: number }[]): MonthlyTarget[] {
  const current = mockGetTargets();

  updates.forEach(({ month, vaccineCode, targetCount }) => {
    const idx = current.findIndex((t) => t.month === month && t.vaccineCode === vaccineCode);
    if (idx !== -1) {
      current[idx] = {
        ...current[idx],
        targetCount,
        completionRate: current[idx].actualCount
          ? Math.round((current[idx].actualCount! / targetCount) * 1000) / 10
          : undefined,
      };
    }
  });

  lsSetTargets(current);
  return [...current];
}

export function mockGetTargets(year?: number): MonthlyTarget[] {
  const cached = lsGetTargets();
  if (cached && cached.length > 0) {
    return [...cached];
  }
  const parsed = mockParsePlanExcel();
  lsSetTargets(parsed.targets);
  return [...parsed.targets];
}

function getVaccineMonthlyDemand(): Map<string, number> {
  const targets = mockGetTargets();
  const demandMap = new Map<string, number>();

  for (const vt of VACCINE_TYPES) {
    const vtTargets = targets.filter(t => t.vaccineCode === vt.code);
    if (vtTargets.length > 0) {
      const total = vtTargets.reduce((s, t) => s + t.targetCount, 0);
      demandMap.set(vt.code, Math.round(total / 365));
    } else {
      const base = VACCINE_BASE_DEMAND[vt.code] || 80000;
      demandMap.set(vt.code, Math.round(base * 12 / 365));
    }
  }

  return demandMap;
}

export function mockGetForecast90(vaccineCode?: string, provinceCode?: string): ForecastDay[] {
  const result: ForecastDay[] = [];
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const dailyDemandMap = getVaccineMonthlyDemand();
  const vaccinesToForecast = vaccineCode
    ? VACCINE_TYPES.filter((v) => v.code === vaccineCode)
    : VACCINE_TYPES;

  vaccinesToForecast.forEach((vt, vtIdx) => {
    const dailyBase = dailyDemandMap.get(vt.code) || 1000;

    for (let d = 0; d < 90; d++) {
      const seedKey = `${provinceCode || 'ALL'}-${vt.code}-${d}`;
      const seed = hashString(seedKey);
      const rand = seededRand(seed + 888);
      const date = addDays(startDate, d);

      const weekday = date.getDay();
      const weekendFactor = (weekday === 0 || weekday === 6) ? 0.7 : 1.0;

      const monthFactor = d < 30 ? 1.0 : d < 60 ? 1.05 : 1.1;
      const noise = 0.9 + rand() * 0.2;

      const demand = Math.round(dailyBase * weekendFactor * monthFactor * noise);

      let supply: number;
      let gap: number;
      let status: ForecastDay['status'];

      const supplyVariation = rand();
      if (supplyVariation < 0.15) {
        supply = Math.round(demand * (0.5 + rand() * 0.2));
        status = 'SHORTAGE';
      } else if (supplyVariation < 0.35) {
        supply = Math.round(demand * (0.8 + rand() * 0.15));
        status = 'WARNING';
      } else {
        supply = Math.round(demand * (1.0 + rand() * 0.3));
        status = 'NORMAL';
      }

      gap = Math.max(0, demand - supply);

      result.push({
        date: formatDate(date),
        vaccineName: vt.name,
        vaccineCode: vt.code,
        demand,
        supply,
        gap,
        status,
      });
    }
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export function mockGetForecastSummary(vaccineCode?: string, provinceCode?: string) {
  const forecast = mockGetForecast90(vaccineCode, provinceCode);
  const totalDemand = forecast.reduce((sum, f) => sum + f.demand, 0);
  const totalSupply = forecast.reduce((sum, f) => sum + f.supply, 0);
  const totalGap = forecast.reduce((sum, f) => sum + f.gap, 0);
  const shortageDays = forecast.filter((f) => f.status === 'SHORTAGE').length;
  const warningDays = forecast.filter((f) => f.status === 'WARNING').length;

  const byVaccine = VACCINE_TYPES
    .filter((vt) => !vaccineCode || vt.code === vaccineCode)
    .map((vt) => {
      const vf = forecast.filter((f) => f.vaccineCode === vt.code);
      return {
        name: vt.name,
        code: vt.code,
        totalDemand: vf.reduce((sum, f) => sum + f.demand, 0),
        totalSupply: vf.reduce((sum, f) => sum + f.supply, 0),
        totalGap: vf.reduce((sum, f) => sum + f.gap, 0),
        shortageDays: vf.filter((f) => f.status === 'SHORTAGE').length,
      };
    });

  return {
    totalDemand,
    totalSupply,
    totalGap,
    shortageDays,
    warningDays,
    normalDays: 90 - shortageDays - warningDays,
    totalForecast: Math.round(totalDemand / 10000),
    highRiskCount: byVaccine.filter(v => v.shortageDays > 10).length,
    byVaccine,
  };
}

export function mockGetTransferSuggestions(provinceCode?: string): TransferSuggestion[] {
  const result: TransferSuggestion[] = [];
  const reasons = [
    '预测90天内缺口较大，建议从库存充裕省份调拨',
    '当前库存不足3日用量，邻省有富余库存',
    '即将过期批次较多，跨区调配合理利用',
    '季节性需求高峰提前，建议预防性调拨',
    '冷链异常导致本地库存报废，需紧急补充',
  ];
  const routes = [
    '公路冷链专车（约8小时）',
    '铁路冷链班列（约6小时）',
    '航空+公路联运（约4小时）',
    '公路冷链专车（约12小时）',
    '高铁冷链物流（约3小时）',
  ];

  const usedPairs = new Set<string>();
  let count = 0;
  let attempt = 0;

  while (count < 15 && attempt < 200) {
    attempt++;
    const seedKey = `${provinceCode || 'ALL'}-transfer-${attempt}-${count}`;
    const seed = hashString(seedKey);
    const rand = seededRand(seed + 999);

    const fromIdx = Math.floor(rand() * PROVINCES.length);
    let toIdx = Math.floor(rand() * PROVINCES.length);
    if (toIdx === fromIdx) toIdx = (toIdx + 1) % PROVINCES.length;

    const pairKey = `${fromIdx}-${toIdx}`;
    if (usedPairs.has(pairKey)) continue;
    usedPairs.add(pairKey);

    const from = PROVINCES[fromIdx];
    const to = PROVINCES[toIdx];
    const vtIdx = Math.floor(rand() * VACCINE_TYPES.length);
    const vt = VACCINE_TYPES[vtIdx];

    const priorityRoll = rand();
    const priority: 1 | 2 | 3 = priorityRoll < 0.3 ? 1 : priorityRoll < 0.7 ? 2 : 3;
    const quantity = priority === 1
      ? seededBetween(rand, 5000, 15000, 0)
      : priority === 2
        ? seededBetween(rand, 3000, 10000, 0)
        : seededBetween(rand, 1000, 5000, 0);

    const estimatedDays = seededBetween(rand, 1, 7, 0);
    const cost = quantity * seededBetween(rand, 15, 35, 0);

    result.push({
      id: `TR${pad(count + 1, 5)}`,
      vaccineName: vt.name,
      vaccineCode: vt.code,
      batchNo: `${vt.code}-24${pad(Math.floor(rand() * 12) + 1, 2)}-${pad(Math.floor(rand() * 9000) + 1000, 4)}`,
      fromProvince: from.name,
      fromProvinceCode: from.code,
      toProvince: to.name,
      toProvinceCode: to.code,
      quantity,
      estimatedDays,
      cost,
      priority,
      reason: reasons[Math.floor(rand() * reasons.length)],
      route: routes[Math.floor(rand() * routes.length)],
    });

    count++;
  }

  return result.sort((a, b) => a.priority - b.priority || b.quantity - a.quantity);
}
