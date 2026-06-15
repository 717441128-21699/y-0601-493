export interface Province {
  code: string;
  name: string;
}

export interface City {
  code: string;
  name: string;
}

export interface VaccineType {
  code: string;
  name: string;
  type: 'LIVE' | 'INACTIVATED' | 'mRNA' | 'OTHER';
  tempMin: number;
  tempMax: number;
}

export const PROVINCES: Province[] = [
  { code: '110000', name: '北京市' },
  { code: '120000', name: '天津市' },
  { code: '130000', name: '河北省' },
  { code: '140000', name: '山西省' },
  { code: '150000', name: '内蒙古自治区' },
  { code: '210000', name: '辽宁省' },
  { code: '220000', name: '吉林省' },
  { code: '230000', name: '黑龙江省' },
  { code: '310000', name: '上海市' },
  { code: '320000', name: '江苏省' },
  { code: '330000', name: '浙江省' },
  { code: '340000', name: '安徽省' },
  { code: '350000', name: '福建省' },
  { code: '360000', name: '江西省' },
  { code: '370000', name: '山东省' },
  { code: '410000', name: '河南省' },
  { code: '420000', name: '湖北省' },
  { code: '430000', name: '湖南省' },
  { code: '440000', name: '广东省' },
  { code: '450000', name: '广西壮族自治区' },
  { code: '460000', name: '海南省' },
  { code: '500000', name: '重庆市' },
  { code: '510000', name: '四川省' },
  { code: '520000', name: '贵州省' },
  { code: '530000', name: '云南省' },
  { code: '540000', name: '西藏自治区' },
  { code: '610000', name: '陕西省' },
  { code: '620000', name: '甘肃省' },
  { code: '630000', name: '青海省' },
  { code: '640000', name: '宁夏回族自治区' },
  { code: '650000', name: '新疆维吾尔自治区' },
];

export const CITIES: Record<string, City[]> = {
  '110000': [
    { code: '110101', name: '东城区' },
    { code: '110102', name: '西城区' },
    { code: '110105', name: '朝阳区' },
    { code: '110106', name: '丰台区' },
    { code: '110108', name: '海淀区' },
  ],
  '120000': [
    { code: '120101', name: '和平区' },
    { code: '120102', name: '河东区' },
    { code: '120103', name: '河西区' },
    { code: '120104', name: '南开区' },
  ],
  '130000': [
    { code: '130100', name: '石家庄市' },
    { code: '130200', name: '唐山市' },
    { code: '130300', name: '秦皇岛市' },
    { code: '130400', name: '邯郸市' },
    { code: '130500', name: '邢台市' },
  ],
  '140000': [
    { code: '140100', name: '太原市' },
    { code: '140200', name: '大同市' },
    { code: '140300', name: '阳泉市' },
    { code: '140400', name: '长治市' },
  ],
  '150000': [
    { code: '150100', name: '呼和浩特市' },
    { code: '150200', name: '包头市' },
    { code: '150300', name: '乌海市' },
    { code: '150400', name: '赤峰市' },
    { code: '150500', name: '通辽市' },
  ],
  '210000': [
    { code: '210100', name: '沈阳市' },
    { code: '210200', name: '大连市' },
    { code: '210300', name: '鞍山市' },
    { code: '210400', name: '抚顺市' },
  ],
  '220000': [
    { code: '220100', name: '长春市' },
    { code: '220200', name: '吉林市' },
    { code: '220300', name: '四平市' },
    { code: '220400', name: '辽源市' },
    { code: '220500', name: '通化市' },
  ],
  '230000': [
    { code: '230100', name: '哈尔滨市' },
    { code: '230200', name: '齐齐哈尔市' },
    { code: '230300', name: '鸡西市' },
    { code: '230400', name: '鹤岗市' },
  ],
  '310000': [
    { code: '310101', name: '黄浦区' },
    { code: '310104', name: '徐汇区' },
    { code: '310105', name: '长宁区' },
    { code: '310106', name: '静安区' },
    { code: '310115', name: '浦东新区' },
  ],
  '320000': [
    { code: '320100', name: '南京市' },
    { code: '320200', name: '无锡市' },
    { code: '320300', name: '徐州市' },
    { code: '320400', name: '常州市' },
    { code: '320500', name: '苏州市' },
  ],
  '330000': [
    { code: '330100', name: '杭州市' },
    { code: '330200', name: '宁波市' },
    { code: '330300', name: '温州市' },
    { code: '330400', name: '嘉兴市' },
  ],
  '340000': [
    { code: '340100', name: '合肥市' },
    { code: '340200', name: '芜湖市' },
    { code: '340300', name: '蚌埠市' },
    { code: '340400', name: '淮南市' },
    { code: '340500', name: '马鞍山市' },
  ],
  '350000': [
    { code: '350100', name: '福州市' },
    { code: '350200', name: '厦门市' },
    { code: '350300', name: '莆田市' },
    { code: '350400', name: '三明市' },
  ],
  '360000': [
    { code: '360100', name: '南昌市' },
    { code: '360200', name: '景德镇市' },
    { code: '360300', name: '萍乡市' },
    { code: '360400', name: '九江市' },
    { code: '360500', name: '新余市' },
  ],
  '370000': [
    { code: '370100', name: '济南市' },
    { code: '370200', name: '青岛市' },
    { code: '370300', name: '淄博市' },
    { code: '370400', name: '枣庄市' },
  ],
  '410000': [
    { code: '410100', name: '郑州市' },
    { code: '410200', name: '开封市' },
    { code: '410300', name: '洛阳市' },
    { code: '410400', name: '平顶山市' },
    { code: '410500', name: '安阳市' },
  ],
  '420000': [
    { code: '420100', name: '武汉市' },
    { code: '420200', name: '黄石市' },
    { code: '420300', name: '十堰市' },
    { code: '420500', name: '宜昌市' },
  ],
  '430000': [
    { code: '430100', name: '长沙市' },
    { code: '430200', name: '株洲市' },
    { code: '430300', name: '湘潭市' },
    { code: '430400', name: '衡阳市' },
    { code: '430600', name: '岳阳市' },
  ],
  '440000': [
    { code: '440100', name: '广州市' },
    { code: '440300', name: '深圳市' },
    { code: '440400', name: '珠海市' },
    { code: '440600', name: '佛山市' },
    { code: '441900', name: '东莞市' },
  ],
  '450000': [
    { code: '450100', name: '南宁市' },
    { code: '450200', name: '柳州市' },
    { code: '450300', name: '桂林市' },
    { code: '450400', name: '梧州市' },
  ],
  '460000': [
    { code: '460100', name: '海口市' },
    { code: '460200', name: '三亚市' },
    { code: '460300', name: '三沙市' },
    { code: '460400', name: '儋州市' },
  ],
  '500000': [
    { code: '500101', name: '万州区' },
    { code: '500103', name: '渝中区' },
    { code: '500105', name: '江北区' },
    { code: '500106', name: '沙坪坝区' },
    { code: '500108', name: '南岸区' },
  ],
  '510000': [
    { code: '510100', name: '成都市' },
    { code: '510300', name: '自贡市' },
    { code: '510400', name: '攀枝花市' },
    { code: '510500', name: '泸州市' },
  ],
  '520000': [
    { code: '520100', name: '贵阳市' },
    { code: '520200', name: '六盘水市' },
    { code: '520300', name: '遵义市' },
    { code: '520400', name: '安顺市' },
    { code: '520500', name: '毕节市' },
  ],
  '530000': [
    { code: '530100', name: '昆明市' },
    { code: '530300', name: '曲靖市' },
    { code: '530400', name: '玉溪市' },
    { code: '530500', name: '保山市' },
  ],
  '540000': [
    { code: '540100', name: '拉萨市' },
    { code: '540200', name: '日喀则市' },
    { code: '540300', name: '昌都市' },
    { code: '540400', name: '林芝市' },
  ],
  '610000': [
    { code: '610100', name: '西安市' },
    { code: '610200', name: '铜川市' },
    { code: '610300', name: '宝鸡市' },
    { code: '610400', name: '咸阳市' },
    { code: '610500', name: '渭南市' },
  ],
  '620000': [
    { code: '620100', name: '兰州市' },
    { code: '620200', name: '嘉峪关市' },
    { code: '620300', name: '金昌市' },
    { code: '620400', name: '白银市' },
  ],
  '630000': [
    { code: '630100', name: '西宁市' },
    { code: '630200', name: '海东市' },
    { code: '630300', name: '海北藏族自治州' },
    { code: '630400', name: '黄南藏族自治州' },
  ],
  '640000': [
    { code: '640100', name: '银川市' },
    { code: '640200', name: '石嘴山市' },
    { code: '640300', name: '吴忠市' },
    { code: '640400', name: '固原市' },
    { code: '640500', name: '中卫市' },
  ],
  '650000': [
    { code: '650100', name: '乌鲁木齐市' },
    { code: '650200', name: '克拉玛依市' },
    { code: '650400', name: '吐鲁番市' },
    { code: '650500', name: '哈密市' },
  ],
};

export const VACCINE_TYPES: VaccineType[] = [
  { code: 'BCG', name: '卡介苗', type: 'LIVE', tempMin: 2, tempMax: 8 },
  { code: 'HepB', name: '乙肝疫苗', type: 'INACTIVATED', tempMin: 2, tempMax: 8 },
  { code: 'OPV', name: '脊灰疫苗', type: 'LIVE', tempMin: -20, tempMax: -15 },
  { code: 'DTaP', name: '百白破疫苗', type: 'INACTIVATED', tempMin: 2, tempMax: 8 },
  { code: 'MMR', name: '麻腮风疫苗', type: 'LIVE', tempMin: 2, tempMax: 8 },
  { code: 'VarV', name: '水痘疫苗', type: 'LIVE', tempMin: 2, tempMax: 8 },
  { code: 'Flu', name: '流感疫苗', type: 'INACTIVATED', tempMin: 2, tempMax: 8 },
  { code: 'HPV', name: 'HPV疫苗', type: 'OTHER', tempMin: 2, tempMax: 8 },
  { code: 'COVID', name: '新冠疫苗', type: 'mRNA', tempMin: -80, tempMax: -60 },
  { code: 'PCV13', name: '肺炎13价疫苗', type: 'INACTIVATED', tempMin: 2, tempMax: 8 },
];
