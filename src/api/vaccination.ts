import { mockGetVaccinationRecords, mockGetTimelyRate, mockGetAgeDistribution, mockGetVaccinationStats } from '@/mock'
import type { VaccinationRecord, TimelyRate, AgeDistribution, VaccinationPaginationParams, PaginatedVaccinationResult } from '@/mock'

export const fetchVaccinationRecords = (params?: VaccinationPaginationParams): Promise<PaginatedVaccinationResult<VaccinationRecord>> => {
  return Promise.resolve(mockGetVaccinationRecords(params))
}

export const fetchTimelyRate = (vaccine?: string, province?: string): Promise<TimelyRate> => {
  return Promise.resolve(mockGetTimelyRate(vaccine, province))
}

export const fetchAgeDistribution = (): Promise<AgeDistribution[]> => {
  return Promise.resolve(mockGetAgeDistribution())
}

export const fetchVaccinationStats = (): Promise<ReturnType<typeof mockGetVaccinationStats>> => {
  return Promise.resolve(mockGetVaccinationStats())
}
