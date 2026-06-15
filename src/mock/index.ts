export * from './_provinces.js';
export * from './_filters.js';

export {
  mockLogin,
  mockGetUserInfo,
  mockLogout,
  mockGetCurrentUser,
} from './auth.mock.js';
export type { UserInfo, LoginResult } from './auth.mock.js';

import {
  mockGetKpi as _mockGetKpi,
  mockGetProvinceData as _mockGetProvinceData,
  mockGetCoverageRank,
  mockGetProvinceDrillData,
} from './dashboard.mock.js';

export {
  mockGetCoverageRank,
  mockGetProvinceDrillData,
};
export type {
  KpiData,
  ProvinceColdData,
  CoverageRank,
  TempChartPoint,
  AgeDistribution,
  ProvinceDrillData,
} from './dashboard.mock.js';

export const mockGetKpi = _mockGetKpi;
export const mockGetKpiData = _mockGetKpi;
export const mockGetProvinceData = _mockGetProvinceData;
export const mockGetProvinceColdData = _mockGetProvinceData;

import {
  mockGetColdStores as _mockGetColdStores,
  mockGetAllColdStores,
  mockGetTempRecords,
  mockGetVehicles as _mockGetVehicles,
  mockGetEquipments as _mockGetEquipments,
} from './coldchain.mock.js';

export {
  mockGetAllColdStores,
  mockGetTempRecords,
};
export type {
  ColdStore,
  TempRecord,
  TransportVehicle,
  Equipment,
  PaginationParams,
  PaginatedResult,
} from './coldchain.mock.js';

export const mockGetColdStores = _mockGetColdStores;
export const mockGetVehicles = _mockGetVehicles;
export const mockGetTransportVehicles = _mockGetVehicles;
export const mockGetEquipments = _mockGetEquipments;
export const mockGetEquipmentList = _mockGetEquipments;

import {
  mockGetVaccineBatches as _mockGetVaccineBatches,
  mockGetAllVaccineBatches,
  mockGetStockLogs as _mockGetStockLogs,
  mockGetInventorySummary,
} from './inventory.mock.js';

export {
  mockGetAllVaccineBatches,
  mockGetInventorySummary,
};
export type {
  VaccineBatch,
  StockLog,
  InventoryPaginationParams,
  PaginatedInventoryResult,
} from './inventory.mock.js';

export const mockGetVaccineBatches = _mockGetVaccineBatches;
export const mockGetStockLogs = _mockGetStockLogs;
export const mockGetStockInOutRecords = _mockGetStockLogs;

import {
  mockGetVaccinationRecords as _mockGetVaccinationRecords,
  mockGetTimelyRate,
  mockGetAgeDistribution,
  mockGetVaccinationStats as _mockGetVaccinationStats,
} from './vaccination.mock.js';

export {
  mockGetTimelyRate,
  mockGetAgeDistribution,
};
export type {
  AgeGroup,
  VaccinationRecord,
  TimelyRate,
  VaccinationPaginationParams,
  PaginatedVaccinationResult,
} from './vaccination.mock.js';

export const mockGetVaccinationRecords = _mockGetVaccinationRecords;
export const mockGetVaccinationStats = _mockGetVaccinationStats;

import {
  mockGetAlerts,
  mockGetAlertStats,
  mockHandleAlert,
  mockGetMyApprovals as _mockGetMyApprovals,
  mockApproveStep,
  mockCloseAlert,
  mockGetFlowById,
  checkEscalateL2,
  mockHandleAlertV2,
  mockApproveStepV2,
  mockGetAlertById,
} from './alerts.mock.js';

export {
  mockGetAlerts,
  mockGetAlertStats,
  mockHandleAlert,
  mockApproveStep,
  mockCloseAlert,
  mockGetFlowById,
  checkEscalateL2,
  mockHandleAlertV2,
  mockApproveStepV2,
  mockGetAlertById,
};
export type {
  AlertLevel,
  AlertType,
  AlertStatus,
  ApprovalStep,
  ApprovalResult,
  ApprovalNodeStatus,
  AlertHandleLog,
  ApprovalNode,
  ApprovalFlow,
  AlertTemperatureData,
  AlertStockData,
  AlertDeviceData,
  Alert,
} from './alerts.mock.js';

export const mockGetMyApprovals = _mockGetMyApprovals;
export const mockGetApprovals = _mockGetMyApprovals;

import {
  mockParsePlanExcel as _mockParsePlanExcel,
  mockUpdateTargets,
  mockGetTargets as _mockGetTargets,
  mockGetForecast90 as _mockGetForecast90,
  mockGetForecastSummary,
  mockGetTransferSuggestions,
} from './plan.mock.js';

export {
  mockUpdateTargets,
  mockGetForecastSummary,
  mockGetTransferSuggestions,
};
export type {
  MonthlyTarget,
  ForecastDay,
  TransferSuggestion,
  PlanParseResult,
} from './plan.mock.js';

export const mockParsePlanExcel = _mockParsePlanExcel;
export const mockUploadPlan = _mockParsePlanExcel;
export const mockGetTargets = _mockGetTargets;
export const mockGetMonthlyTargets = _mockGetTargets;
export const mockGetForecast90 = _mockGetForecast90;
export const mockGetForecast = _mockGetForecast90;

import {
  mockGetWeeklyReports as _mockGetWeeklyReports,
  mockGetReportDetail,
  mockGetReportList as _mockGetReportList,
  mockGenerateReport,
} from './reports.mock.js';

export {
  mockGetReportDetail,
  mockGenerateReport,
};
export type {
  TempOverRateData,
  LossRateRank,
  ProgressCompare,
  WeeklyReportSummary,
  WeeklyReport,
} from './reports.mock.js';

export const mockGetWeeklyReports = _mockGetWeeklyReports;
export const mockGetReportList = _mockGetReportList;
