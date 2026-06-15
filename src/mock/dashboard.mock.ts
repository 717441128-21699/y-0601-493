import { PROVINCES, CITIES, VACCINE_TYPES } from './_provinces.js';

export interface KpiData {
  label: string;
  value: number;
  unit: string;
  trend: number;
  status: 'up' | 'down' | 'flat';
  healthy: boolean;
}

export interface ProvinceColdData {
  code: string;
  name: string;
  temperatureRate: number;
  coverageRate: number;
  alertCount: number;
  totalColdStores: number;
}

export interface CoverageRank {
  name: string;
  code: string;
  rate: number;
}

export interface TempChartPoint {
  time: string;
  coldStoreId: string;
  coldStoreName: string;
  temp: number;
  targetTempMin: number;
  targetTempMax: number;
}

export interface AgeDistribution {
  group: '0-6' | '7-17' | '18-59' | '60+';
  value: number;
}

export interface ProvinceDrillData {
  tempChartData: TempChartPoint[];
  ageDistribution: AgeDistribution[];
}

function randBetween(min: number, max: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
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

export function mockGetKpi(province?: string): KpiData[] {
  const seed = province ? province.charCodeAt(0) + province.length : 20240616;
  const rand = seededRand(seed);

  const tempRate = seededBetween(rand, 92, 99.8, 1);
  const turnoverDays = seededBetween(rand, 8, 28, 0);
  const timelyRate = seededBetween(rand, 85, 97, 1);
  const faultRate = seededBetween(rand, 0.3, 5, 1);

  const tempTrend = seededBetween(rand, -2, 3, 1);
  const turnoverTrend = seededBetween(rand, -2, 3, 1);
  const timelyTrend = seededBetween(rand, -2, 3, 1);
  const faultTrend = seededBetween(rand, -2, 3, 1);

  return [
    {
      label: '温度合格率',
      value: tempRate,
      unit: '%',
      trend: tempTrend,
      status: tempTrend > 0.5 ? 'up' : tempTrend < -0.5 ? 'down' : 'flat',
      healthy: tempRate >= 95,
    },
    {
      label: '库存周转天数',
      value: turnoverDays,
      unit: '天',
      trend: turnoverTrend,
      status: turnoverTrend < -0.5 ? 'up' : turnoverTrend > 0.5 ? 'down' : 'flat',
      healthy: turnoverDays >= 10 && turnoverDays <= 20,
    },
    {
      label: '接种及时率',
      value: timelyRate,
      unit: '%',
      trend: timelyTrend,
      status: timelyTrend > 0.5 ? 'up' : timelyTrend < -0.5 ? 'down' : 'flat',
      healthy: timelyRate >= 90,
    },
    {
      label: '设备故障率',
      value: faultRate,
      unit: '%',
      trend: faultTrend,
      status: faultTrend < -0.5 ? 'up' : faultTrend > 0.5 ? 'down' : 'flat',
      healthy: faultRate <= 2,
    },
  ];
}

export function mockGetProvinceData(provinceCodes?: string[]): ProvinceColdData[] {
  const provinces = provinceCodes && provinceCodes.length > 0
    ? PROVINCES.filter(p => provinceCodes.includes(p.code))
    : PROVINCES;
  return provinces.map((p, idx) => {
    const rand = seededRand(parseInt(p.code) + idx * 7);
    const tempRate = seededBetween(rand, 75, 99.5, 1);
    const coverageRate = seededBetween(rand, 60, 98, 1);
    const alertCount = Math.floor(seededBetween(rand, 0, 20, 0));
    const totalColdStores = Math.floor(seededBetween(rand, 5, 30, 0));

    return {
      code: p.code,
      name: p.name,
      temperatureRate: tempRate,
      coverageRate: coverageRate,
      alertCount: alertCount,
      totalColdStores: totalColdStores,
    };
  });
}

export function mockGetCoverageRank(vaccineType?: string, provinceCodes?: string[]): CoverageRank[] {
  const vaccineCode = vaccineType || 'ALL';
  const seedBase = vaccineCode.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const provinces = provinceCodes && provinceCodes.length > 0
    ? PROVINCES.filter(p => provinceCodes.includes(p.code))
    : PROVINCES;

  const allWithRate = provinces.map(p => {
    const rand = seededRand(parseInt(p.code) + seedBase);
    const rate = seededBetween(rand, 70, 99.5, 1);
    return { name: p.name, code: p.code, rate };
  });

  return allWithRate
    .sort((a, b) => b.rate - a.rate)
    .slice(0, Math.min(10, allWithRate.length));
}

export function mockGetProvinceDrillData(provinceCode: string): ProvinceDrillData {
  const province = PROVINCES.find((p) => p.code === provinceCode);
  const cities = CITIES[provinceCode] || [];
  const seed = parseInt(provinceCode);
  const rand = seededRand(seed);

  const coldStoreNames = cities.length > 0
    ? cities.slice(0, 4).map((c) => `${c.name}疾控中心冷库`)
    : ['一号冷库', '二号冷库', '三号冷库', '四号冷库'];

  const tempChartData: TempChartPoint[] = [];
  const now = new Date();

  for (let day = 6; day >= 0; day--) {
    for (let hour = 0; hour < 24; hour++) {
      coldStoreNames.forEach((name, idx) => {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        date.setHours(hour, 0, 0, 0);

        const vtIdx = idx % VACCINE_TYPES.length;
        const vt = VACCINE_TYPES[vtIdx];
        const targetMin = vt.tempMin;
        const targetMax = vt.tempMax;
        const range = targetMax - targetMin;

        let temp: number;
        const anomalyChance = rand();
        if (anomalyChance < 0.08) {
          temp = seededBetween(rand, targetMax + 0.5, targetMax + range * 0.4, 1);
        } else if (anomalyChance < 0.12) {
          temp = seededBetween(rand, targetMin - range * 0.4, targetMin - 0.5, 1);
        } else {
          temp = seededBetween(rand, targetMin + range * 0.2, targetMax - range * 0.2, 1);
        }

        tempChartData.push({
          time: date.toISOString().slice(0, 13).replace('T', ' ') + ':00',
          coldStoreId: `cs_${provinceCode}_${idx}`,
          coldStoreName: `${province?.name || ''}${name}`,
          temp: temp,
          targetTempMin: targetMin,
          targetTempMax: targetMax,
        });
      });
    }
  }

  const ageBase = [
    { group: '0-6' as const, baseWeight: 25 },
    { group: '7-17' as const, baseWeight: 20 },
    { group: '18-59' as const, baseWeight: 40 },
    { group: '60+' as const, baseWeight: 15 },
  ];

  const ageDistribution: AgeDistribution[] = ageBase.map((item) => ({
    group: item.group,
    value: Math.round(item.baseWeight + seededBetween(rand, -5, 5, 0)),
  }));

  const total = ageDistribution.reduce((sum, item) => sum + item.value, 0);
  ageDistribution.forEach((item) => {
    item.value = Math.round((item.value / total) * 100);
  });

  return {
    tempChartData: tempChartData.sort((a, b) => a.time.localeCompare(b.time)),
    ageDistribution,
  };
}
