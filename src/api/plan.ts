import { mockGetMonthlyTargets, mockGetForecast, mockUploadPlan, mockUpdateTargets, mockGetTransferSuggestions } from '@/mock'
import type { MonthlyTarget, ForecastDay, TransferSuggestion, PlanParseResult } from '@/mock'

export const fetchMonthlyTargets = (year?: number): Promise<MonthlyTarget[]> => {
  return Promise.resolve(mockGetMonthlyTargets(year))
}

export const fetchForecast = (vaccineCode?: string): Promise<ForecastDay[]> => {
  return Promise.resolve(mockGetForecast(vaccineCode))
}

export const uploadPlan = (fileName?: string): Promise<PlanParseResult> => {
  return Promise.resolve(mockUploadPlan(fileName))
}

export const updateTargets = (updates: { month: string; vaccineCode: string; targetCount: number }[]): Promise<MonthlyTarget[]> => {
  return Promise.resolve(mockUpdateTargets(updates))
}

export const fetchTransferSuggestions = (): Promise<TransferSuggestion[]> => {
  return Promise.resolve(mockGetTransferSuggestions())
}
