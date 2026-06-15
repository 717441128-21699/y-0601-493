import { mockGetWeeklyReports, mockGetReportList, mockGetReportDetail, mockGenerateReport } from '@/mock'
import type { WeeklyReport } from '@/mock'

export const fetchReports = (province?: string, scope?: 'NATIONAL' | 'PROVINCE'): Promise<WeeklyReport[]> => {
  return Promise.resolve(mockGetWeeklyReports(province, scope))
}

export const fetchReportList = (params: {
  page?: number
  pageSize?: number
  province?: string
  scope?: 'NATIONAL' | 'PROVINCE'
  status?: WeeklyReport['status']
}): Promise<{ list: WeeklyReport[]; total: number; page: number; pageSize: number }> => {
  return Promise.resolve(mockGetReportList(params))
}

export const fetchReportDetail = (reportId: string): Promise<WeeklyReport | null> => {
  return Promise.resolve(mockGetReportDetail(reportId))
}

export const generateReport = (provinceCode?: string): Promise<WeeklyReport> => {
  return Promise.resolve(mockGenerateReport(provinceCode))
}
