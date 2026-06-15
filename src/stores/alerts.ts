import { defineStore } from 'pinia'
import { mockGetAlerts, mockGetApprovals, mockHandleAlert, mockApproveStep } from '@/mock'
import type { Alert, ApprovalStep } from '@/types'

interface AlertsState {
  pendingL1: Alert[]
  pendingL2: Alert[]
  myApprovals: any[]
  lastUpdate: number
  _pollingTimer: number | null
}

export const useAlertsStore = defineStore('alerts', {
  state: (): AlertsState => ({
    pendingL1: [],
    pendingL2: [],
    myApprovals: [],
    lastUpdate: 0,
    _pollingTimer: null,
  }),

  actions: {
    async fetchAlerts() {
      const alerts = mockGetAlerts()
      this.pendingL1 = alerts.filter(a => a.level === 'L1' && a.status !== 'CLOSED')
      this.pendingL2 = alerts.filter(a => a.level === 'L2' && a.status !== 'CLOSED')
      this.myApprovals = mockGetApprovals()
      this.lastUpdate = Date.now()
      return { pendingL1: this.pendingL1, pendingL2: this.pendingL2, myApprovals: this.myApprovals }
    },

    async handleAlert(id: string, remark: string) {
      const res = mockHandleAlert(id, remark)
      await this.fetchAlerts()
      return res
    },

    async approveStep(flowId: string, step: ApprovalStep, opinion: string, approve: boolean) {
      const res = mockApproveStep(flowId, step, opinion, approve)
      await this.fetchAlerts()
      return res
    },

    startPolling(delay = 30000) {
      this.stopPolling()
      this.fetchAlerts()
      this._pollingTimer = window.setInterval(() => {
        this.fetchAlerts()
      }, delay)
    },

    stopPolling() {
      if (this._pollingTimer !== null) {
        window.clearInterval(this._pollingTimer)
        this._pollingTimer = null
      }
    },
  },
})
