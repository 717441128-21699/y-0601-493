import { PROVINCES, CITIES, VACCINE_TYPES } from './_provinces.js';

export interface ColdStore {
  id: string;
  name: string;
  province: string;
  provinceCode: string;
  city: string;
  cityCode: string;
  address: string;
  currentTemp: number;
  targetTempMin: number;
  targetTempMax: number;
  status: 'NORMAL' | 'WARNING' | 'ERROR' | 'OFFLINE';
  runningHours: number;
  deviceModel: string;
  capacity: number;
  usedCapacity: number;
}

export interface TempRecord {
  time: string;
  temp: number;
  coldStoreId: string;
  coldStoreName: string;
  isAbnormal: boolean;
}

export interface TransportVehicle {
  id: string;
  plateNo: string;
  driver: string;
  driverPhone: string;
  origin: string;
  destination: string;
  currentLng: number;
  currentLat: number;
  currentTemp: number;
  targetTempMin: number;
  targetTempMax: number;
  vaccineBatch: string;
  vaccineName: string;
  status: 'TRANSIT' | 'ARRIVED' | 'DELAYED';
  departTime: string;
  estimatedArrival: string;
  track: { lng: number; lat: number; time: string }[];
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  type: 'REFRIGERATOR' | 'FREEZER' | 'THERMOMETER' | 'GENERATOR' | 'MONITOR';
  coldStoreId: string;
  coldStoreName: string;
  province: string;
  provinceCode: string;
  status: 'RUNNING' | 'STANDBY' | 'MAINTENANCE' | 'FAULT';
  lastMaintainDate: string;
  nextMaintainDate: string;
  faultCount: number;
  totalRunningHours: number;
  installDate: string;
  manufacturer: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  province?: string;
  status?: string;
  keyword?: string;
}

export interface PaginatedResult<T> {
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

function seededBetween(rand: () => number, min: number, max: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round((rand() * (max - min) + min) * factor) / factor;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function generateColdStores(): ColdStore[] {
  const result: ColdStore[] = [];
  const deviceModels = ['海尔HYC-310', '美的BCD-568', '中科美菱DW-HL398', '澳柯玛YC-330', '松下MDF-U74V', '海信HC-5L760'];
  const streetNames = ['健康路', '疾控大道', '民生街', '卫生路', '防疫街', '医药巷', '康宁路'];

  let idCounter = 1;

  PROVINCES.forEach((province, pIdx) => {
    const cities = CITIES[province.code] || [];
    const storesPerProvince = Math.max(2, 2 + (pIdx % 4));

    for (let i = 0; i < storesPerProvince; i++) {
      const city = cities[i % cities.length] || { code: province.code + '01', name: '市区' };
      const rand = seededRand(parseInt(province.code) + i * 13 + pIdx * 3);
      const vt = VACCINE_TYPES[(pIdx + i) % VACCINE_TYPES.length];

      const targetTempMin = vt.tempMin;
      const targetTempMax = vt.tempMax;
      const range = targetTempMax - targetTempMin;

      let currentTemp: number;
      let status: ColdStore['status'] = 'NORMAL';

      const roll = rand();
      if (roll < 0.03) {
        status = 'OFFLINE';
        currentTemp = 0;
      } else if (roll < 0.08) {
        status = 'ERROR';
        currentTemp = seededBetween(rand, targetTempMax + range * 0.3, targetTempMax + range * 0.8, 1);
      } else if (roll < 0.18) {
        status = 'WARNING';
        currentTemp = seededBetween(rand, targetTempMax, targetTempMax + range * 0.3, 1);
      } else {
        currentTemp = seededBetween(rand, targetTempMin + range * 0.2, targetTempMax - range * 0.2, 1);
      }

      const capacity = 500 + Math.floor(rand() * 1500);
      const usedCapacity = Math.floor(capacity * (0.4 + rand() * 0.5));

      result.push({
        id: `CS${String(idCounter++).padStart(4, '0')}`,
        name: `${city.name}疾控中心${i + 1}号冷库`,
        province: province.name,
        provinceCode: province.code,
        city: city.name,
        cityCode: city.code,
        address: `${city.name}${streetNames[Math.floor(rand() * streetNames.length)]}${Math.floor(rand() * 800) + 1}号`,
        currentTemp,
        targetTempMin,
        targetTempMax,
        status,
        runningHours: Math.floor(500 + rand() * 8000),
        deviceModel: deviceModels[Math.floor(rand() * deviceModels.length)],
        capacity,
        usedCapacity,
      });
    }
  });

  return result;
}

let _coldStoresCache: ColdStore[] | null = null;
function getColdStores(): ColdStore[] {
  if (!_coldStoresCache) {
    _coldStoresCache = generateColdStores();
  }
  return _coldStoresCache;
}

export function mockGetColdStores(params: PaginationParams = {}): PaginatedResult<ColdStore> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;

  let all = getColdStores();

  if (params.province) {
    all = all.filter((s) => s.province === params.province || s.provinceCode === params.province);
  }
  if (params.status) {
    all = all.filter((s) => s.status === params.status);
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    all = all.filter(
      (s) =>
        s.name.toLowerCase().includes(kw) ||
        s.address.toLowerCase().includes(kw) ||
        s.deviceModel.toLowerCase().includes(kw)
    );
  }

  const total = all.length;
  const start = (page - 1) * pageSize;
  const list = all.slice(start, start + pageSize);

  return { list, total, page, pageSize };
}

export function mockGetAllColdStores(): ColdStore[] {
  return getColdStores();
}

export function mockGetTempRecords(coldStoreIds: string[], days = 7): TempRecord[] {
  const allStores = getColdStores();
  const stores = allStores.filter((s) => coldStoreIds.includes(s.id));
  if (stores.length === 0 && coldStoreIds.length === 0) {
    stores.push(...allStores.slice(0, 3));
  }

  const result: TempRecord[] = [];
  const now = new Date();

  stores.forEach((store) => {
    const rand = seededRand(parseInt(store.id.replace(/\D/g, '')) || store.name.length);
    const targetMin = store.targetTempMin;
    const targetMax = store.targetTempMax;
    const range = targetMax - targetMin;

    for (let day = days - 1; day >= 0; day--) {
      for (let hour = 0; hour < 24; hour++) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        date.setHours(hour, 0, 0, 0);

        let temp: number;
        let isAbnormal = false;
        const anomalyChance = rand();

        if (anomalyChance < 0.05) {
          temp = seededBetween(rand, targetMax + range * 0.3, targetMax + range * 0.8, 1);
          isAbnormal = true;
        } else if (anomalyChance < 0.08) {
          temp = seededBetween(rand, targetMin - range * 0.8, targetMin - range * 0.3, 1);
          isAbnormal = true;
        } else {
          const oscillation = Math.sin((hour / 24) * Math.PI * 2) * (range * 0.1);
          temp = seededBetween(rand, targetMin + range * 0.3, targetMax - range * 0.3, 1) + oscillation;
          temp = Math.round(temp * 10) / 10;
        }

        result.push({
          time: date.toISOString().slice(0, 16).replace('T', ' '),
          temp,
          coldStoreId: store.id,
          coldStoreName: store.name,
          isAbnormal,
        });
      }
    }
  });

  return result.sort((a, b) => a.time.localeCompare(b.time));
}

export function mockGetVehicles(province?: string): TransportVehicle[] {
  const drivers = ['王建国', '刘志强', '陈卫东', '杨明华', '赵晓军', '孙德才', '周立平', '吴国庆', '郑海涛', '黄伟东',
    '徐文斌', '朱建军', '马晓峰', '胡志远', '林建华', '何光明', '高文涛', '罗荣发', '宋鹏飞', '唐志宏'];
  const prefixes = ['京', '沪', '粤', '苏', '浙', '鲁', '川', '鄂', '湘', '豫', '冀', '辽', '吉', '黑', '陕', '甘', '闽', '赣', '皖', '桂'];

  const result: TransportVehicle[] = [];
  const allVehicles = 20;
  const now = new Date();

  for (let i = 0; i < allVehicles; i++) {
    const rand = seededRand(i * 101 + 42);
    const provIdx = Math.floor(rand() * PROVINCES.length);
    const originProv = PROVINCES[provIdx];
    const destProvIdx = (provIdx + Math.floor(rand() * 10) + 1) % PROVINCES.length;
    const destProv = PROVINCES[destProvIdx];
    const originCities = CITIES[originProv.code] || [];
    const destCities = CITIES[destProv.code] || [];
    const originCity = originCities[Math.floor(rand() * originCities.length)]?.name || originProv.name;
    const destCity = destCities[Math.floor(rand() * destCities.length)]?.name || destProv.name;

    if (province && originProv.name !== province && originProv.code !== province) {
      continue;
    }

    const vt = VACCINE_TYPES[Math.floor(rand() * VACCINE_TYPES.length)];
    const batchNo = `B${vt.code}${(20240000 + i * 137 + Math.floor(rand() * 9999))}`;

    const departTime = new Date(now);
    departTime.setHours(departTime.getHours() - Math.floor(rand() * 24) - 2);
    const estimatedArrival = new Date(departTime);
    estimatedArrival.setHours(estimatedArrival.getHours() + Math.floor(rand() * 36) + 8);

    const progress = Math.min(1, (now.getTime() - departTime.getTime()) / (estimatedArrival.getTime() - departTime.getTime()));
    const lng1 = 73 + rand() * 62;
    const lat1 = 18 + rand() * 35;
    const lng2 = 73 + rand() * 62;
    const lat2 = 18 + rand() * 35;
    const currentLng = Math.round((lng1 + (lng2 - lng1) * progress) * 1000) / 1000;
    const currentLat = Math.round((lat1 + (lat2 - lat1) * progress) * 1000) / 1000;

    let status: TransportVehicle['status'] = 'TRANSIT';
    if (progress >= 1) status = 'ARRIVED';
    else if (rand() < 0.1) status = 'DELAYED';

    const targetMin = vt.tempMin;
    const targetMax = vt.tempMax;
    const range = targetMax - targetMin;
    const currentTemp = seededBetween(rand, targetMin + range * 0.2, targetMax - range * 0.2, 1);

    const track: { lng: number; lat: number; time: string }[] = [];
    for (let t = 0; t < 5; t++) {
      const tp = t / 4;
      const trackTime = new Date(departTime);
      trackTime.setTime(trackTime.getTime() + (estimatedArrival.getTime() - departTime.getTime()) * tp * progress);
      track.push({
        lng: Math.round((lng1 + (lng2 - lng1) * tp * progress) * 1000) / 1000,
        lat: Math.round((lat1 + (lat2 - lat1) * tp * progress) * 1000) / 1000,
        time: trackTime.toISOString().slice(0, 16).replace('T', ' '),
      });
    }

    result.push({
      id: `VH${String(i + 1).padStart(4, '0')}`,
      plateNo: `${prefixes[provIdx % prefixes.length]}A·${String(Math.floor(rand() * 90000) + 10000)}`,
      driver: drivers[i % drivers.length],
      driverPhone: `138${String(Math.floor(rand() * 90000000) + 10000000)}`,
      origin: `${originProv.name}${originCity}`,
      destination: `${destProv.name}${destCity}`,
      currentLng,
      currentLat,
      currentTemp,
      targetTempMin: targetMin,
      targetTempMax: targetMax,
      vaccineBatch: batchNo,
      vaccineName: vt.name,
      status,
      departTime: departTime.toISOString().slice(0, 16).replace('T', ' '),
      estimatedArrival: estimatedArrival.toISOString().slice(0, 16).replace('T', ' '),
      track,
    });
  }

  if (province) {
    return result;
  }
  return result;
}

export function mockGetEquipments(): Equipment[] {
  const coldStores = getColdStores();
  const result: Equipment[] = [];
  const manufacturers = ['海尔生物医疗', '中科美菱', '澳柯玛医疗', '松下冷链', '海信医疗', '美的生物医疗'];
  const typeModels: Record<Equipment['type'], string[]> = {
    REFRIGERATOR: ['HYC-310L', 'YC-330', 'BCD-568W', 'HYC-650'],
    FREEZER: ['DW-HL398', 'MDF-U74V', 'DW-86L728J', 'MDF-C8V'],
    THERMOMETER: ['TESTO-174T', 'ELITECH-RC-5', 'TEMPTRACKER-V2'],
    GENERATOR: ['CUMMINS-6BT', 'PERKINS-1104', 'YUCHAI-YC6MK'],
    MONITOR: ['DVP-9020', 'HK-3208', 'SMART-CLOUD-V3'],
  };
  const typeNames: Record<Equipment['type'], string> = {
    REFRIGERATOR: '医用冷藏箱',
    FREEZER: '超低温冷冻箱',
    THERMOMETER: '温度记录仪',
    GENERATOR: '备用发电机',
    MONITOR: '监控终端',
  };

  const types: Equipment['type'][] = ['REFRIGERATOR', 'FREEZER', 'THERMOMETER', 'GENERATOR', 'MONITOR'];
  const now = new Date();
  const installBase = new Date(2020, 0, 1);

  for (let i = 0; i < 40; i++) {
    const rand = seededRand(i * 31 + 17);
    const store = coldStores[i % coldStores.length];
    const type = types[i % types.length];
    const models = typeModels[type];
    const model = models[Math.floor(rand() * models.length)];

    const statusRoll = rand();
    let status: Equipment['status'] = 'RUNNING';
    let faultCount = Math.floor(rand() * 6);

    if (statusRoll < 0.05) {
      status = 'FAULT';
      faultCount += 1;
    } else if (statusRoll < 0.12) {
      status = 'MAINTENANCE';
    } else if (statusRoll < 0.22) {
      status = 'STANDBY';
    }

    const installDate = new Date(installBase);
    installDate.setDate(installDate.getDate() + Math.floor(rand() * 1500));
    const installDateStr = formatDate(installDate);

    let lastMaintainDate = new Date(now);
    lastMaintainDate.setDate(lastMaintainDate.getDate() - Math.floor(rand() * 120) - 10);
    const lastMaintainDateStr = formatDate(lastMaintainDate);

    let nextMaintainDate = new Date(lastMaintainDate);
    nextMaintainDate.setDate(nextMaintainDate.getDate() + 90 + Math.floor(rand() * 30));
    const nextMaintainDateStr = formatDate(nextMaintainDate);

    result.push({
      id: `EQ${String(i + 1).padStart(4, '0')}`,
      name: typeNames[type],
      model,
      type,
      coldStoreId: store.id,
      coldStoreName: store.name,
      province: store.province,
      provinceCode: store.provinceCode,
      status,
      lastMaintainDate: lastMaintainDateStr,
      nextMaintainDate: nextMaintainDateStr,
      faultCount,
      totalRunningHours: Math.floor(500 + rand() * 12000),
      installDate: installDateStr,
      manufacturer: manufacturers[Math.floor(rand() * manufacturers.length)],
    });
  }

  return result;
}
