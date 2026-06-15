import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export type DayjsInput = string | number | Date | dayjs.Dayjs;

/**
 * 格式化日期
 * @param date 日期输入
 * @param fmt 格式化模板，默认 'YYYY-MM-DD'
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: DayjsInput, fmt = 'YYYY-MM-DD'): string {
  if (!date) return '';
  return dayjs(date).format(fmt);
}

/**
 * 格式化日期时间
 * @param date 日期输入
 * @returns 格式化后的日期时间字符串 'YYYY-MM-DD HH:mm:ss'
 */
export function formatDateTime(date: DayjsInput): string {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 格式化相对时间（几分钟前、几小时前等）
 * @param date 日期输入
 * @returns 相对时间描述字符串
 */
export function formatRelative(date: DayjsInput): string {
  if (!date) return '';
  return dayjs(date).fromNow();
}

/**
 * 获取近 N 天的日期字符串数组
 * @param n 天数
 * @returns 日期字符串数组，格式 'YYYY-MM-DD'，从远到近
 */
export function getRecentDays(n: number): string[] {
  const days: string[] = [];
  const today = dayjs();
  for (let i = n - 1; i >= 0; i--) {
    days.push(today.subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return days;
}

/**
 * 获取月份区间数组
 * @param start 起始月份 'YYYY-MM'
 * @param end 结束月份 'YYYY-MM'
 * @returns 月份字符串数组，格式 'YYYY-MM'
 */
export function getMonthRange(start: string, end: string): string[] {
  const months: string[] = [];
  let current = dayjs(start + '-01');
  const endDate = dayjs(end + '-01');

  while (current.isBefore(endDate) || current.isSame(endDate, 'month')) {
    months.push(current.format('YYYY-MM'));
    current = current.add(1, 'month');
  }

  return months;
}
