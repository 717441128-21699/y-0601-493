import { defineStore } from 'pinia'
import { mockGetAlerts, mockGetApprovals, mockHandleAlertV2, mockApproveStepV2, checkEscalateL2 } from '@/mock'
import type { Alert, ApprovalStep, ApprovalResult } from '@/types'

interface AlertsState {
  pendingL1: Alert[]
  pendingL2: Alert[]
  myApprovals: any[]
  lastUpdate: number
  _pollingTimer: number | null
  _escalateCount: number
  escalatedNotifyCount: number
}

export const useAlertsStore = defineStore('alerts', {
  state: (): AlertsState => ({
    pendingL1: [],
    pendingL2: [],
    myApprovals: [],
    lastUpdate: 0,
    _pollingTimer: null,
    _escalateCount: 0,
    escalatedNotifyCount: 0,
  }),

  actions: {
    async escalateCheck(): Promise<number> {
      const count = checkEscalateL2()
      if (count > 0) {
        this._escalateCount += count
        await this.fetchAlerts()
      }
      return count
    },

    async fetchAlerts() {
      const alerts = mockGetAlerts()
      this.pendingL1 = alerts.filter(a => a.level === 'L1' && a.status !== 'CLOSED')
      this.pendingL2 = alerts.filter(a => a.level === 'L2' && a.status !== 'CLOSED')
      this.myApprovals = mockGetApprovals()
      this.lastUpdate = Date.now()
      return { pendingL1: this.pendingL1, pendingL2: this.pendingL2, myApprovals: this.myApprovals }
    },

    async handleAlert(id: string, remark: string, actionType: string = '处置措施') {
      const res = mockHandleAlertV2(id, remark, actionType)
      await this.fetchAlerts()
      return res
    },

    async approveStep(flowId: string, step: ApprovalStep, opinion: string, pass: boolean, result?: ApprovalResult) {
      const res = mockApproveStepV2(flowId, step, opinion, pass, result)
      await this.fetchAlerts()
      return res
    },

    async startPolling(delay = 30000) {
      this.stopPolling()
      await this.escalateCheck()
      await this.fetchAlerts()
      this._pollingTimer = window.setInterval(async () => {
        const count = await this.escalateCheck()
        if (count > 0) {
          this.escalatedNotifyCount += count
        }
        await this.fetchAlerts()
      }, delay)
    },

    stopPolling() {
      if (this._pollingTimer !== null) {
        window.clearInterval(this._pollingTimer)
        this._pollingTimer = null
      }
    },

    clearEscalatedNotifyCount() {
      this.escalatedNotifyCount = 0
    },
  },
})
