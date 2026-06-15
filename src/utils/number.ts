import { CountUp } from 'countup.js';

/**
 * 数字格式化千分位
 * @param num 数字
 * @returns 千分位格式化字符串，例如 1,234,567
 */
export function formatThousand(num: number | string): string {
  const n = Number(num);
  if (Number.isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}

/**
 * 数字格式化为百分比
 * @param num 数字（0.85 表示 85%）
 * @param digits 小数位数，默认 1
 * @returns 百分比字符串，例如 85.0%
 */
export function formatPercent(num: number | string, digits = 1): string {
  const n = Number(num);
  if (Number.isNaN(n)) return `0.${'0'.repeat(digits)}%`;
  return `${(n * 100).toFixed(digits)}%`;
}

/**
 * 数字格式化
 * @param num 数字
 * @param digits 小数位数，默认 2
 * @returns 格式化字符串，例如 1,234.56
 */
export function formatNumber(num: number | string, digits = 2): string {
  const n = Number(num);
  if (Number.isNaN(n)) return `0.${'0'.repeat(digits)}`;
  return n.toFixed(digits);
}

/**
 * 创建并启动 CountUp 数字滚动动画
 * @param el 目标 DOM 元素
 * @param end 结束数值
 * @param duration 动画时长（毫秒），默认 1800
 * @returns CountUp 实例
 */
export function createCountUp(
  el: HTMLElement,
  end: number,
  duration = 1800
): CountUp {
  const countUp = new CountUp(el, end, {
    duration: duration / 1000,
    useEasing: true,
    useGrouping: true,
    separator: ',',
    decimal: '.',
  });

  if (!countUp.error) {
    countUp.start();
  }

  return countUp;
}
