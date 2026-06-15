import { mockGetKpiData, mockGetProvinceColdData, mockGetCoverageRank, mockGetProvinceDrillData } from '@/mock'
import type { KpiData, ProvinceColdData, CoverageRank, ProvinceDrillData } from '@/mock'

export const fetchKpiData = (province?: string): Promise<KpiData[]> => {
  return Promise.resolve(mockGetKpiData(province))
}

export const fetchProvinceColdData = (): Promise<ProvinceColdData[]> => {
  return Promise.resolve(mockGetProvinceColdData())
}

export const fetchCoverageRank = (vaccineType?: string): Promise<CoverageRank[]> => {
  return Promise.resolve(mockGetCoverageRank(vaccineType))
}

export const fetchProvinceDrillData = (provinceCode: string): Promise<ProvinceDrillData> => {
  return Promise.resolve(mockGetProvinceDrillData(provinceCode))
}
