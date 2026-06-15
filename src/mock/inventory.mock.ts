import { PROVINCES, CITIES, VACCINE_TYPES } from './_provinces.js';

export interface VaccineBatch {
  id: string;
  vaccineName: string;
  vaccineCode: string;
  vaccineType: 'LIVE' | 'INACTIVATED' | 'mRNA' | 'OTHER';
  batchNo: string;
  province: string;
  provinceCode: string;
  city: string;
  cityCode: string;
  quantity: number;
  dailyUsage: number;
  turnoverDays: number;
  expireDate: string;
  threeDayUsage: number;
  isLowStock: boolean;
  manufacturer: string;
}

export interface StockLog {
  id: string;
  type: 'IN' | 'OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUST' | 'SCRAP';
  vaccineName: string;
  vaccineCode: string;
  batchNo: string;
  quantity: number;
  province: string;
  provinceCode: string;
  operator: string;
  time: string;
  remark: string;
  relatedOrder?: string;
}

export interface InventoryPaginationParams {
  page?: number;
  pageSize?: number;
  province?: string;
  vaccineCode?: string;
  lowStockOnly?: boolean;
  keyword?: string;
}

export interface PaginatedInventoryResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
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

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function pad(num: number, size: number): string {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

function generateVaccineBatches(): VaccineBatch[] {
  const result: VaccineBatch[] = [];
  const manufacturers = ['北京生物', '科兴中维', '武汉生物', '长春长生', '上海生物', '深圳康泰', '兰州生物', '成都生物'];
  let batchCounter = 1;
  const now = new Date();

  for (let vtIdx = 0; vtIdx < VACCINE_TYPES.length; vtIdx++) {
    const vt = VACCINE_TYPES[vtIdx];
    const batchesPerVaccine = 8 + (vtIdx % 4);

    for (let b = 0; b < batchesPerVaccine; b++) {
      const rand = seededRand(vtIdx * 1000 + b * 37 + batchCounter * 7);
      const provIdx = Math.floor(rand() * PROVINCES.length);
      const province = PROVINCES[provIdx];
      const cities = CITIES[province.code] || [];
      const city = cities[Math.floor(rand() * cities.length)] || { code: province.code, name: province.name };

      const dailyUsage = seededBetween(rand, 50, 800, 0);
      const daysMultiplier = seededBetween(rand, 6, 40, 0);
      const quantity = Math.round(dailyUsage * daysMultiplier);
      const turnoverDays = Math.round(quantity / dailyUsage);
      const threeDayUsage = Math.round(dailyUsage * 3);

      const expireBase = addDays(now, 180 + Math.floor(rand() * 540));
      const expireDate = formatDate(expireBase);

      const year = expireBase.getFullYear().toString().slice(2);
      const month = pad(expireBase.getMonth() + 1, 2);
      const manufIdx = Math.floor(rand() * manufacturers.length);

      result.push({
        id: `VB${String(batchCounter++).padStart(5, '0')}`,
        vaccineName: vt.name,
        vaccineCode: vt.code,
        vaccineType: vt.type,
        batchNo: `${vt.code}-${year}${month}-${pad(Math.floor(rand() * 9000) + 1000, 4)}`,
        province: province.name,
        provinceCode: province.code,
        city: city.name,
        cityCode: city.code,
        quantity,
        dailyUsage,
        turnoverDays,
        expireDate,
        threeDayUsage,
        isLowStock: quantity < threeDayUsage,
        manufacturer: manufacturers[manufIdx],
      });
    }
  }

  return result;
}

let _batchesCache: VaccineBatch[] | null = null;
function getBatches(): VaccineBatch[] {
  if (!_batchesCache) {
    _batchesCache = generateVaccineBatches();
  }
  return _batchesCache;
}

export function mockGetVaccineBatches(params: InventoryPaginationParams = {}): PaginatedInventoryResult<VaccineBatch> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;

  let all = getBatches();

  if (params.province) {
    all = all.filter((b) => b.province === params.province || b.provinceCode === params.province);
  }
  if (params.vaccineCode) {
    all = all.filter((b) => b.vaccineCode === params.vaccineCode);
  }
  if (params.lowStockOnly) {
    all = all.filter((b) => b.isLowStock);
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    all = all.filter(
      (b) =>
        b.vaccineName.toLowerCase().includes(kw) ||
        b.batchNo.toLowerCase().includes(kw) ||
        b.manufacturer.toLowerCase().includes(kw)
    );
  }

  const total = all.length;
  const start = (page - 1) * pageSize;
  const list = all.slice(start, start + pageSize);

  return { list, total, page, pageSize };
}

export function mockGetAllVaccineBatches(): VaccineBatch[] {
  return getBatches();
}

export function mockGetStockLogs(count = 100): StockLog[] {
  const result: StockLog[] = [];
  const operators = ['张敏', '李娟', '王芳', '赵静', '刘艳', '陈磊', '杨帆', '周萍', '吴昊', '郑敏',
    '马丽', '朱强', '胡勇', '林峰', '何静', '高翔', '罗红', '宋佳', '唐亮', '许丹'];
  const logTypes: StockLog['type'][] = ['IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUST', 'SCRAP'];
  const typeWeights = [30, 40, 10, 10, 7, 3];
  const inRemarks = ['生产入库', '调拨入库', '退货入库', '采购入库'];
  const outRemarks = ['门诊接种', '批量出库', '紧急调拨', '日常出库'];
  const transferInRemarks = ['从省疾控转入', '从邻市调入', '上级调拨入库'];
  const transferOutRemarks = ['调至下级疾控', '调出至兄弟市', '支援外区'];
  const adjustRemarks = ['库存盘点调整', '系统修正', '账实差调整'];
  const scrapRemarks = ['过期报废', '破损报废', '质量问题报废', '冷链异常报废'];

  function pickWeighted<T>(items: T[], weights: number[], rand: () => number): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  const batches = getBatches();
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const rand = seededRand(i * 89 + 1024 + count);
    const batch = batches[Math.floor(rand() * batches.length)];

    const type = pickWeighted(logTypes, typeWeights, rand);
    let quantity = seededBetween(rand, 20, 600, 0);
    let remark = '';

    switch (type) {
      case 'IN':
        remark = inRemarks[Math.floor(rand() * inRemarks.length)];
        break;
      case 'OUT':
        remark = outRemarks[Math.floor(rand() * outRemarks.length)];
        break;
      case 'TRANSFER_IN':
        remark = transferInRemarks[Math.floor(rand() * transferInRemarks.length)];
        break;
      case 'TRANSFER_OUT':
        remark = transferOutRemarks[Math.floor(rand() * transferOutRemarks.length)];
        break;
      case 'ADJUST':
        if (rand() < 0.5) quantity = -quantity;
        remark = adjustRemarks[Math.floor(rand() * adjustRemarks.length)];
        break;
      case 'SCRAP':
        quantity = Math.min(quantity, batch.quantity);
        remark = scrapRemarks[Math.floor(rand() * scrapRemarks.length)];
        break;
    }

    const timeOffset = Math.floor(rand() * 86400 * 30 * 6);
    const logTime = new Date(now.getTime() - timeOffset * 1000);

    result.push({
      id: `SL${String(i + 1).padStart(6, '0')}`,
      type,
      vaccineName: batch.vaccineName,
      vaccineCode: batch.vaccineCode,
      batchNo: batch.batchNo,
      quantity,
      province: batch.province,
      provinceCode: batch.provinceCode,
      operator: operators[i % operators.length],
      time: logTime.toISOString().slice(0, 16).replace('T', ' '),
      remark,
      relatedOrder: type.startsWith('TRANSFER') ? `ORD${pad(Math.floor(rand() * 900000) + 100000, 6)}` : undefined,
    });
  }

  return result.sort((a, b) => b.time.localeCompare(a.time));
}

export function mockGetInventorySummary() {
  const batches = getBatches();
  const totalBatches = batches.length;
  const totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0);
  const lowStockCount = batches.filter((b) => b.isLowStock).length;
  const nearExpireCount = batches.filter((b) => {
    const expire = new Date(b.expireDate);
    const now = new Date();
    const diffDays = (expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 90 && diffDays > 0;
  }).length;

  const vaccineStats = VACCINE_TYPES.map((vt) => {
    const vtBatches = batches.filter((b) => b.vaccineCode === vt.code);
    return {
      name: vt.name,
      code: vt.code,
      totalQuantity: vtBatches.reduce((sum, b) => sum + b.quantity, 0),
      batchCount: vtBatches.length,
    };
  });

  return {
    totalBatches,
    totalQuantity,
    lowStockCount,
    nearExpireCount,
    vaccineStats,
  };
}
