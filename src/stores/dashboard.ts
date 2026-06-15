import { defineStore } from 'pinia'

interface DashboardState {
  selectedProvince: string | null
  selectedVaccineTypes: string[]
  timeRange: [Date, Date] | null
}

export const useDashboardStore = defineStore('dashboard', {
  state: (): DashboardState => ({
    selectedProvince: null,
    selectedVaccineTypes: [],
    timeRange: null,
  }),

  actions: {
    setFilters(filters: Partial<DashboardState>) {
      if (filters.selectedProvince !== undefined) {
        this.selectedProvince = filters.selectedProvince
      }
      if (filters.selectedVaccineTypes !== undefined) {
        this.selectedVaccineTypes = filters.selectedVaccineTypes
      }
      if (filters.timeRange !== undefined) {
        this.timeRange = filters.timeRange
      }
    },

    resetFilters() {
      this.selectedProvince = null
      this.selectedVaccineTypes = []
      this.timeRange = null
    },
  },
})
