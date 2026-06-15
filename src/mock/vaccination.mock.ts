import { PROVINCES, CITIES, VACCINE_TYPES } from './_provinces.js';

export type AgeGroup = '0-6' | '7-17' | '18-59' | '60+';

export interface VaccinationRecord {
  id: string;
  personName: string;
  idCardMasked: string;
  ageGroup: AgeGroup;
  age: number;
  vaccineName: string;
  vaccineCode: string;
  batchNo: string;
  site: string;
  siteCode: string;
  province: string;
  provinceCode: string;
  time: string;
  isTimely: boolean;
  dose: number;
  operator: string;
}

export interface TimelyRate {
  rate: number;
  total: number;
  timely: number;
  delayed: number;
  vaccineName?: string;
  province?: string;
}

export interface AgeDistribution {
  group: AgeGroup;
  name: string;
  value: number;
  percent: number;
}

export interface VaccinationPaginationParams {
  page?: number;
  pageSize?: number;
  province?: string;
  vaccineCode?: string;
  ageGroup?: AgeGroup;
  isTimely?: boolean;
  keyword?: string;
}

export interface PaginatedVaccinationResult<T> {
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

function pad(num: number, size: number): string {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

function maskName(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

function generateIdCardMasked(rand: () => number): string {
  const prefix = pad(Math.floor(rand() * 900000) + 100000, 6);
  const year = 1950 + Math.floor(rand() * 75);
  const month = pad(Math.floor(rand() * 12) + 1, 2);
  const day = pad(Math.floor(rand() * 28) + 1, 2);
  return `${prefix}${year}${month}${day}****`;
}

function ageToGroup(age: number): AgeGroup {
  if (age <= 6) return '0-6';
  if (age <= 17) return '7-17';
  if (age <= 59) return '18-59';
  return '60+';
}

const AGE_GROUP_WEIGHTS: Record<AgeGroup, number> = {
  '0-6': 25,
  '7-17': 18,
  '18-59': 42,
  '60+': 15,
};

function pickAgeGroup(rand: () => number): AgeGroup {
  const total = Object.values(AGE_GROUP_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (const [group, weight] of Object.entries(AGE_GROUP_WEIGHTS)) {
    r -= weight;
    if (r <= 0) return group as AgeGroup;
  }
  return '18-59';
}

function ageFromGroup(group: AgeGroup, rand: () => number): number {
  switch (group) {
    case '0-6':
      return seededBetween(rand, 0, 6, 0);
    case '7-17':
      return seededBetween(rand, 7, 17, 0);
    case '18-59':
      return seededBetween(rand, 18, 59, 0);
    case '60+':
      return seededBetween(rand, 60, 92, 0);
  }
}

const SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
  '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
  '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧'];
const GIVEN_NAMES = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋',
  '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平',
  '刚', '桂英', '伟', '飞', '建华', '文', '鑫', '博', '宇', '浩'];

function randomChineseName(rand: () => number): string {
  const surname = SURNAMES[Math.floor(rand() * SURNAMES.length)];
  const given = GIVEN_NAMES[Math.floor(rand() * GIVEN_NAMES.length)];
  return surname + given;
}

function generateVaccinationRecords(): VaccinationRecord[] {
  const result: VaccinationRecord[] = [];
  const operators = ['王护士', '李护士', '张医生', '刘医生', '陈护士', '杨医生', '赵护士', '黄护士',
    '周医生', '吴护士', '徐医生', '孙护士', '胡医生', '朱护士', '高医生'];
  const siteSuffix = ['社区卫生服务中心', '疾控中心接种门诊', '妇幼保健院', '人民医院', '中医院'];
  const now = new Date();

  for (let i = 0; i < 150; i++) {
    const rand = seededRand(i * 53 + 777);
    const provIdx = Math.floor(rand() * PROVINCES.length);
    const province = PROVINCES[provIdx];
    const cities = CITIES[province.code] || [];
    const city = cities[Math.floor(rand() * cities.length)] || { code: province.code, name: '市区' };

    const vtIdx = Math.floor(rand() * VACCINE_TYPES.length);
    const vt = VACCINE_TYPES[vtIdx];

    const year = now.getFullYear().toString().slice(2);
    const month = pad(now.getMonth() + 1, 2);
    const batchNo = `${vt.code}-${year}${month}-${pad(Math.floor(rand() * 9000) + 1000, 4)}`;

    const ageGroup = pickAgeGroup(rand);
    const age = ageFromGroup(ageGroup, rand);

    const timeOffset = Math.floor(rand() * 86400 * 30 * 3);
    const vaccTime = new Date(now.getTime() - timeOffset * 1000);

    const isTimely = rand() < (ageGroup === '0-6' ? 0.92 : ageGroup === '7-17' ? 0.88 : 0.82);
    const dose = 1 + Math.floor(rand() * 3);
    const siteIdx = Math.floor(rand() * siteSuffix.length);
    const rawName = randomChineseName(rand);

    result.push({
      id: `VR${String(i + 1).padStart(6, '0')}`,
      personName: maskName(rawName),
      idCardMasked: generateIdCardMasked(rand),
      ageGroup,
      age,
      vaccineName: vt.name,
      vaccineCode: vt.code,
      batchNo,
      site: `${city.name}${siteSuffix[siteIdx]}`,
      siteCode: `${city.code}${pad(siteIdx + 1, 3)}`,
      province: province.name,
      provinceCode: province.code,
      time: vaccTime.toISOString().slice(0, 16).replace('T', ' '),
      isTimely,
      dose,
      operator: operators[Math.floor(rand() * operators.length)],
    });
  }

  return result.sort((a, b) => b.time.localeCompare(a.time));
}

let _recordsCache: VaccinationRecord[] | null = null;
function getRecords(): VaccinationRecord[] {
  if (!_recordsCache) {
    _recordsCache = generateVaccinationRecords();
  }
  return _recordsCache;
}

export function mockGetVaccinationRecords(params: VaccinationPaginationParams = {}): PaginatedVaccinationResult<VaccinationRecord> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;

  let all = getRecords();

  if (params.province) {
    all = all.filter((r) => r.province === params.province || r.provinceCode === params.province);
  }
  if (params.vaccineCode) {
    all = all.filter((r) => r.vaccineCode === params.vaccineCode);
  }
  if (params.ageGroup) {
    all = all.filter((r) => r.ageGroup === params.ageGroup);
  }
  if (params.isTimely !== undefined) {
    all = all.filter((r) => r.isTimely === params.isTimely);
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    all = all.filter(
      (r) =>
        r.personName.includes(params.keyword) ||
        r.vaccineName.toLowerCase().includes(kw) ||
        r.batchNo.toLowerCase().includes(kw) ||
        r.site.toLowerCase().includes(kw)
    );
  }

  const total = all.length;
  const start = (page - 1) * pageSize;
  const list = all.slice(start, start + pageSize);

  return { list, total, page, pageSize };
}

export function mockGetTimelyRate(vaccine?: string, province?: string): TimelyRate {
  let all = getRecords();

  if (vaccine) {
    all = all.filter((r) => r.vaccineCode === vaccine || r.vaccineName === vaccine);
  }
  if (province) {
    all = all.filter((r) => r.province === province || r.provinceCode === province);
  }

  if (all.length === 0) {
    const rand = seededRand((vaccine?.length || 0) * 13 + (province?.length || 0) * 7);
    const rate = seededBetween(rand, 85, 97, 1);
    const total = 10000 + Math.floor(rand() * 50000);
    return {
      rate,
      total,
      timely: Math.round(total * rate / 100),
      delayed: Math.round(total * (100 - rate) / 100),
      vaccineName: vaccine,
      province,
    };
  }

  const total = all.length;
  const timely = all.filter((r) => r.isTimely).length;
  const rate = Math.round((timely / total) * 1000) / 10;
  const scale = 1 + Math.floor(Math.random() * 20);

  return {
    rate,
    total: total * scale,
    timely: timely * scale,
    delayed: (total - timely) * scale,
    vaccineName: vaccine,
    province,
  };
}

export function mockGetAgeDistribution(): AgeDistribution[] {
  const all = getRecords();
  const groups: AgeGroup[] = ['0-6', '7-17', '18-59', '60+'];
  const groupNames: Record<AgeGroup, string> = {
    '0-6': '婴幼儿 (0-6岁)',
    '7-17': '青少年 (7-17岁)',
    '18-59': '成年人 (18-59岁)',
    '60+': '老年人 (60岁+)',
  };

  const total = all.length;
  const result = groups.map((group) => {
    const count = all.filter((r) => r.ageGroup === group).length;
    const percent = Math.round((count / total) * 1000) / 10;
    const scale = 1 + Math.floor(Math.random() * 30);
    return {
      group,
      name: groupNames[group],
      value: count * scale,
      percent,
    };
  });

  return result;
}

export function mockGetVaccinationStats() {
  const all = getRecords();
  const totalRecords = all.length;
  const todayCount = Math.floor(20 + Math.random() * 100);
  const weekCount = todayCount * 7 + Math.floor(Math.random() * 300);

  const vaccineStats = VACCINE_TYPES.map((vt) => {
    const vtRecords = all.filter((r) => r.vaccineCode === vt.code);
    const timelyCount = vtRecords.filter((r) => r.isTimely).length;
    const rate = vtRecords.length > 0 ? Math.round((timelyCount / vtRecords.length) * 1000) / 10 : 0;
    const scale = 1 + Math.floor(Math.random() * 20);
    return {
      name: vt.name,
      code: vt.code,
      count: vtRecords.length * scale,
      timelyRate: rate,
    };
  });

  return {
    totalRecords: totalRecords * 50,
    todayCount,
    weekCount,
    monthCount: weekCount * 4,
    vaccineStats,
  };
}
