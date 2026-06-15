import { mockGetColdStores, mockGetTempRecords, mockGetTransportVehicles, mockGetEquipmentList } from '@/mock'
import type { ColdStore, TempRecord, TransportVehicle, Equipment, PaginationParams, PaginatedResult } from '@/mock'

export const fetchColdStores = (params?: PaginationParams): Promise<PaginatedResult<ColdStore>> => {
  return Promise.resolve(mockGetColdStores(params))
}

export const fetchTempRecords = (coldStoreIds: string[], days = 7): Promise<TempRecord[]> => {
  return Promise.resolve(mockGetTempRecords(coldStoreIds, days))
}

export const fetchTransportVehicles = (province?: string): Promise<TransportVehicle[]> => {
  return Promise.resolve(mockGetTransportVehicles(province))
}

export const fetchEquipmentList = (): Promise<Equipment[]> => {
  return Promise.resolve(mockGetEquipmentList())
}
