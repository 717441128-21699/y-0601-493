import type { UserInfo } from '@/types'
import { PROVINCES } from './_provinces'

export function getVisibleProvinceCodes(user: UserInfo | null): string[] {
  if (!user) return []
  if (user.level === 1) return PROVINCES.map(p => p.code)
  if (user.provinceCode) return [user.provinceCode]
  return []
}

export function getVisibleCityCodes(user: UserInfo | null): string[] {
  if (!user) return []
  if (user.level <= 2) return []
  if (user.cityCode) return [user.cityCode]
  return []
}

export function filterByProvince<T extends Record<string, any>>(list: T[], codes: string[]): T[] {
  if (!codes.length) return list
  return list.filter(item => codes.includes(String(item.provinceCode ?? '')))
}

export function filterByCity<T extends Record<string, any>>(list: T[], codes: string[]): T[] {
  if (!codes.length) return list
  return list.filter(item => codes.includes(String(item.cityCode ?? '')))
}
