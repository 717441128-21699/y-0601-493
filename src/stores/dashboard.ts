import { defineStore } from 'pinia'
import { useUserStore } from './user'
import { PROVINCES } from '@/mock/_provinces'

const LS_KEY_SELECTED_PROVINCE = 'vaccine_dashboard_province'
const LS_KEY_VACCINE_TYPES = 'vaccine_dashboard_vaccine_types'

interface DashboardState {
  selectedProvince: string | null
  selectedVaccineTypes: string[]
  timeRange: [Date, Date] | null
}

export const useDashboardStore = defineStore('dashboard', {
  state: (): DashboardState => ({
    selectedProvince: (() => {
      try {
        const raw = localStorage.getItem(LS_KEY_SELECTED_PROVINCE)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    })(),
    selectedVaccineTypes: (() => {
      try {
        const raw = localStorage.getItem(LS_KEY_VACCINE_TYPES)
        return raw ? JSON.parse(raw) : []
      } catch {
        return []
      }
    })(),
    timeRange: null,
  }),

  getters: {
    defaultProvinceByUser(state): { code: string; name: string } | null {
      const userStore = useUserStore()
      const user = userStore.userInfo
      if (!user) return null
      if (user.level === 1) return null
      const provinceCode = user.provinceCode
      if (!provinceCode) return null
      const province = PROVINCES.find(p => p.code === provinceCode)
      return province ? { code: province.code, name: province.name } : null
    },
  },

  actions: {
    setFilters(filters: Partial<DashboardState>) {
      if (filters.selectedProvince !== undefined) {
        this.selectedProvince = filters.selectedProvince
        localStorage.setItem(LS_KEY_SELECTED_PROVINCE, JSON.stringify(filters.selectedProvince))
      }
      if (filters.selectedVaccineTypes !== undefined) {
        this.selectedVaccineTypes = filters.selectedVaccineTypes
        localStorage.setItem(LS_KEY_VACCINE_TYPES, JSON.stringify(filters.selectedVaccineTypes))
      }
      if (filters.timeRange !== undefined) {
        this.timeRange = filters.timeRange
      }
    },

    resetFilters() {
      const userStore = useUserStore()
      const user = userStore.userInfo
      if (user && user.level >= 2 && user.provinceCode) {
        this.selectedProvince = user.provinceCode
        localStorage.setItem(LS_KEY_SELECTED_PROVINCE, JSON.stringify(user.provinceCode))
      } else {
        this.selectedProvince = null
        localStorage.setItem(LS_KEY_SELECTED_PROVINCE, JSON.stringify(null))
      }
      this.selectedVaccineTypes = []
      localStorage.setItem(LS_KEY_VACCINE_TYPES, JSON.stringify([]))
      this.timeRange = null
    },
  },
})
