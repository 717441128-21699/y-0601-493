import { mockGetAlerts, mockHandleAlert, mockGetApprovals, mockApproveStep } from '@/mock'
import type { Alert, ApprovalStep, ApprovalFlow, AlertLevel } from '@/mock'

export const fetchAlerts = (level?: AlertLevel): Promise<Alert[]> => {
  return Promise.resolve(mockGetAlerts(level))
}

export const handleAlert = (id: string, remark: string): Promise<Alert | null> => {
  return Promise.resolve(mockHandleAlert(id, remark))
}

export const approveStep = (
  approvalId: string,
  step: ApprovalStep,
  opinion: string,
  approve: boolean
): Promise<ApprovalFlow | null> => {
  return Promise.resolve(mockApproveStep(approvalId, step, opinion, approve))
}

export const fetchApprovals = (userLevel?: 1 | 2 | 3): Promise<ApprovalFlow[]> => {
  return Promise.resolve(mockGetApprovals(userLevel))
}
