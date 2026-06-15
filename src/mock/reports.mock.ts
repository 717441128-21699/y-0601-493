import { PROVINCES, VACCINE_TYPES } from './_provinces.js';

export interface TempOverRateData {
  week: string;
  current: number;
  yoy: number;
  mom: number;
}

export interface LossRateRank {
  name: string;
  code: string;
  rate: number;
  lossQuantity: number;
  totalQuantity: number;
}

export interface ProgressCompare {
  name: string;
  code: string;
  plan: number;
  actual: number;
  completionRate: number;
}

export interface WeeklyReportSummary {
  tempOverRateData: TempOverRateData[];
  vaccineLossRank: LossRateRank[];
  progressCompare: ProgressCompare[];
  radarData: { dimension: string; plan: number; actual: number }[];
  strategies: string[];
  keyFindings: string[];
  weeklyStats: {
    totalAlerts: number;
    closedAlerts: number;
    alertCloseRate: number;
    avgTempRate: number;
    avgCoverageRate: number;
    totalVaccinations: number;
    totalLossRate: number;
  };
}

export interface WeeklyReport {
  id: string;
  week: string;
  weekLabel: string;
  startDate: string;
  endDate: string;
  province: string;
  provinceCode: string;
  scope: 'NATIONAL' | 'PROVINCE';
  generateTime: string;
  author: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  summary?: WeeklyReportSummary;
  title: string;
}

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function seededBetween(rand: () => number, min: number, max: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round((rand() * (max - min) + min) * factor) / factor;
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

function getISOWeek(date: Date): { week: string; year: number; weekNum: number } {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = date.getFullYear();
  return {
    week: `${year}-W${pad(weekNum, 2)}`,
    year,
    weekNum,
  };
}

function generateSummary(weekSeed: number, scope: 'NATIONAL' | 'PROVINCE'): WeeklyReportSummary {
  const rand = seededRand(weekSeed * 131 + 42);

  const weeks: TempOverRateData[] = [];
  for (let i = 7; i >= 0; i--) {
    const wRand = seededRand(weekSeed * 131 + i * 17);
    const weekDate = addDays(new Date(), -i * 7);
    const iso = getISOWeek(weekDate);
    const current = seededBetween(wRand, 0.5, 5.5, 2);
    const yoy = seededBetween(wRand, -3, 2, 1);
    const mom = seededBetween(wRand, -2, 1.5, 1);
    weeks.push({
      week: iso.week,
      current,
      yoy,
      mom,
    });
  }

  const vaccineLossRank: LossRateRank[] = VACCINE_TYPES
    .map((vt, idx) => {
      const vRand = seededRand(weekSeed * 31 + idx * 7);
      const rate = seededBetween(vRand, 0.2, 3.8, 2);
      const totalQuantity = seededBetween(vRand, 50000, 300000, 0);
      return {
        name: vt.name,
        code: vt.code,
        rate,
        lossQuantity: Math.round(totalQuantity * rate / 100),
        totalQuantity,
      };
    })
    .sort((a, b) => b.rate - a.rate)
    .slice(0, scope === 'NATIONAL' ? 10 : 8);

  const compareProvinces = scope === 'NATIONAL'
    ? PROVINCES.slice(0, 10)
    : PROVINCES.filter((_, i) => i < 6);

  const progressCompare: ProgressCompare[] = compareProvinces.map((p, idx) => {
    const pRand = seededRand(weekSeed * 19 + parseInt(p.code.slice(0, 2)) + idx * 11);
    const plan = seededBetween(pRand, 70000, 200000, 0);
    const actual = Math.round(plan * (0.75 + pRand() * 0.2));
    return {
      name: p.name,
      code: p.code,
      plan,
      actual,
      completionRate: Math.round((actual / plan) * 1000) / 10,
    };
  });

  const radarDimensions = ['冷链运行', '接种进度', '库存健康', '预警处置', '设备维护', '审批效率'];
  const radarData = radarDimensions.map((dim, idx) => {
    const rRand = seededRand(weekSeed * 23 + idx * 13);
    return {
      dimension: dim,
      plan: 80 + Math.round(rRand() * 15),
      actual: 70 + Math.round(rRand() * 25),
    };
  });

  const strategyPool = [
    '建议对东北三省老旧冷库机组进行季度预防性维护，降低冬季超温风险',
    '建议增加华东地区HPV疫苗采购量，当前库存周转天数已降至警戒线下',
    '建议开展全国冷链管理员操作规范培训，提升一级预警2小时内处置率',
    '建议华南地区增加备用发电机组配置，应对夏季用电高峰导致的停机风险',
    '建议优化西南地区疫苗调拨路线，缩短偏远地区运输时间降低损耗',
    '建议加强脊灰疫苗超低温冷库温度监控频率，设置多级告警阈值',
    '建议对流感疫苗库存进行动态调配，避免Q4高峰期局部短缺',
    '建议建立省级冷链设备共享机制，提高设备利用率降低维护成本',
    '建议在新冠疫苗库存中推广先进先出(FIFO)策略，减少过期报废',
    '建议开展全国疾控中心接种及时率专项督导，重点关注7-17岁年龄段',
  ];

  const sRand = seededRand(weekSeed * 7 + 99);
  const strategies: string[] = [];
  const usedIdx = new Set<number>();
  while (strategies.length < 4) {
    const idx = Math.floor(sRand() * strategyPool.length);
    if (!usedIdx.has(idx)) {
      usedIdx.add(idx);
      strategies.push(strategyPool[idx]);
    }
  }

  const findingPool = [
    '本周温度超标率环比下降12.3%，设备预防性维护措施效果显著',
    'HPV疫苗全国平均库存周转仅8天，11个省份出现低于3日用量预警',
    '西南地区冷链设备故障率高于全国均值35%，建议启动专项排查',
    '0-6岁适龄儿童接种及时率达95.2%，较上周提升1.8个百分点',
    '本周共处置预警238起，2小时内处置率为89.1%，较目标低0.9%',
    '脊灰疫苗超低温冷库运行稳定，全周无超标记录，合格率100%',
    '华东地区疫苗损耗率环比上升，主要原因为夏季运输途中温度波动',
    '省级审批平均耗时较标准流程超出4.2小时，建议优化审批节点配置',
  ];

  const fRand = seededRand(weekSeed * 11 + 55);
  const keyFindings: string[] = [];
  const usedFIdx = new Set<number>();
  while (keyFindings.length < 3) {
    const idx = Math.floor(fRand() * findingPool.length);
    if (!usedFIdx.has(idx)) {
      usedFIdx.add(idx);
      keyFindings.push(findingPool[idx]);
    }
  }

  const statsRand = seededRand(weekSeed * 3 + 7);
  const totalAlerts = seededBetween(statsRand, 150, 400, 0);
  const closedAlerts = Math.round(totalAlerts * (0.82 + statsRand() * 0.12));

  return {
    tempOverRateData: weeks,
    vaccineLossRank,
    progressCompare,
    radarData,
    strategies,
    keyFindings,
    weeklyStats: {
      totalAlerts,
      closedAlerts,
      alertCloseRate: Math.round((closedAlerts / totalAlerts) * 1000) / 10,
      avgTempRate: seededBetween(statsRand, 93, 99.5, 1),
      avgCoverageRate: seededBetween(statsRand, 78, 97, 1),
      totalVaccinations: seededBetween(statsRand, 500000, 2000000, 0),
      totalLossRate: seededBetween(statsRand, 0.8, 2.5, 2),
    },
  };
}

let _reportsCache: WeeklyReport[] | null = null;

function generateReports(): WeeklyReport[] {
  const result: WeeklyReport[] = [];
  const now = new Date();
  const authors = ['国家疾控中心', '北京疾控中心', '上海疾控中心', '广东省疾控中心', '江苏省疾控中心'];

  for (let w = 0; w < 8; w++) {
    const weekEnd = addDays(now, -w * 7);
    const weekStart = addDays(weekEnd, -6);
    const iso = getISOWeek(weekEnd);

    const scopes: Array<'NATIONAL' | 'PROVINCE'> = w === 0 ? ['NATIONAL', 'PROVINCE'] : ['NATIONAL'];

    for (const scope of scopes) {
      const province = scope === 'NATIONAL'
        ? { name: '全国', code: '000000' }
        : PROVINCES[w % PROVINCES.length];

      const generateTime = addDays(weekEnd, 1);
      generateTime.setHours(9, 15 + w * 3, 0, 0);

      const statusRoll = Math.random();
      const status: WeeklyReport['status'] = w === 0 && scope === 'PROVINCE'
        ? 'DRAFT'
        : statusRoll < 0.1
          ? 'DRAFT'
          : w < 6
            ? 'ARCHIVED'
            : 'PUBLISHED';

      const seed = w * 10 + (scope === 'NATIONAL' ? 0 : 1);
      result.push({
        id: `RPT${iso.year}${pad(iso.weekNum, 2)}${scope === 'NATIONAL' ? '00' : province.code.slice(0, 2)}`,
        week: iso.week,
        weekLabel: `${iso.year}年第${iso.weekNum}周`,
        startDate: formatDate(weekStart),
        endDate: formatDate(weekEnd),
        province: province.name,
        provinceCode: province.code,
        scope,
        generateTime: generateTime.toISOString().slice(0, 16).replace('T', ' '),
        author: scope === 'NATIONAL' ? authors[0] : authors[(w % (authors.length - 1)) + 1],
        status,
        title: `${province.name}疫苗冷链监测周报（${iso.year}年第${iso.weekNum}周）`,
        summary: status !== 'DRAFT' ? generateSummary(seed, scope) : undefined,
      });
    }
  }

  return result.sort((a, b) => b.endDate.localeCompare(a.endDate));
}

function getReports(): WeeklyReport[] {
  if (!_reportsCache) {
    _reportsCache = generateReports();
  }
  return _reportsCache;
}

export function mockGetWeeklyReports(province?: string, scope?: 'NATIONAL' | 'PROVINCE'): WeeklyReport[] {
  let all = getReports();

  if (scope) {
    all = all.filter((r) => r.scope === scope);
  }
  if (province) {
    all = all.filter((r) => r.province === province || r.provinceCode === province);
  }

  return all;
}

export function mockGetReportDetail(reportId: string): WeeklyReport | null {
  const all = getReports();
  const report = all.find((r) => r.id === reportId);

  if (!report) return null;

  if (!report.summary) {
    const scope = report.scope;
    const seed = parseInt(reportId.replace(/\D/g, '')) || reportId.length;
    return {
      ...report,
      summary: generateSummary(seed, scope),
    };
  }

  return report;
}

export function mockGetReportList(params: {
  page?: number;
  pageSize?: number;
  province?: string;
  scope?: 'NATIONAL' | 'PROVINCE';
  status?: WeeklyReport['status'];
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;

  let all = getReports();

  if (params.scope) all = all.filter((r) => r.scope === params.scope);
  if (params.province) all = all.filter((r) => r.province === params.province || r.provinceCode === params.province);
  if (params.status) all = all.filter((r) => r.status === params.status);

  const total = all.length;
  const start = (page - 1) * pageSize;
  const list = all.slice(start, start + pageSize);

  return { list, total, page, pageSize };
}

export function mockGenerateReport(provinceCode?: string): WeeklyReport {
  const now = new Date();
  const iso = getISOWeek(now);
  const province = provinceCode
    ? PROVINCES.find((p) => p.code === provinceCode) || { name: '全国', code: '000000' }
    : { name: '全国', code: '000000' };
  const scope = provinceCode ? 'PROVINCE' : 'NATIONAL';
  const seed = Date.now() % 100000;

  const weekStart = addDays(now, -6);
  weekStart.setHours(0, 0, 0, 0);

  const newReport: WeeklyReport = {
    id: `RPT${iso.year}${pad(iso.weekNum, 2)}${scope === 'NATIONAL' ? '00' : province.code.slice(0, 2)}${pad(seed % 100, 2)}`,
    week: iso.week,
    weekLabel: `${iso.year}年第${iso.weekNum}周`,
    startDate: formatDate(weekStart),
    endDate: formatDate(now),
    province: province.name,
    provinceCode: province.code,
    scope,
    generateTime: now.toISOString().slice(0, 16).replace('T', ' '),
    author: scope === 'NATIONAL' ? '国家疾控中心' : `${province.name}疾控中心`,
    status: 'PUBLISHED',
    title: `${province.name}疫苗冷链监测周报（${iso.year}年第${iso.weekNum}周）`,
    summary: generateSummary(seed, scope),
  };

  if (_reportsCache) {
    _reportsCache.unshift(newReport);
  }

  return newReport;
}
