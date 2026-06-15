import { mockGetVaccineBatches, mockGetStockInOutRecords } from '@/mock'
import type { VaccineBatch, StockLog, InventoryPaginationParams, PaginatedInventoryResult } from '@/mock'

export const fetchVaccineBatches = (params?: InventoryPaginationParams): Promise<PaginatedInventoryResult<VaccineBatch>> => {
  return Promise.resolve(mockGetVaccineBatches(params))
}

export const fetchStockInOutRecords = (count?: number): Promise<StockLog[]> => {
  return Promise.resolve(mockGetStockInOutRecords(count))
}
