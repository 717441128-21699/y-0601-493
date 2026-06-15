import { defineStore } from 'pinia'

interface UiState {
  sidebarCollapsed: boolean
  currentTheme: string
  pageLoadings: Record<string, boolean>
}

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    sidebarCollapsed: false,
    currentTheme: 'dark-tech',
    pageLoadings: {},
  }),

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    beginLoading(page: string) {
      this.pageLoadings = { ...this.pageLoadings, [page]: true }
    },

    endLoading(page: string) {
      const next = { ...this.pageLoadings }
      delete next[page]
      this.pageLoadings = next
    },
  },
})
