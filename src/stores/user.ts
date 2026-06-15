import { defineStore } from 'pinia'
import type { UserInfo, UserLevel } from '@/types'
import { mockLogin } from '@/mock'

interface UserState {
  token: string
  userInfo: UserInfo | null
  loginTime: number
}

const LS_TOKEN_KEY = 'vaccine_token'
const LS_USER_KEY = 'vaccine_userInfo'
const LS_LOGIN_TIME_KEY = 'vaccine_loginTime'

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem(LS_TOKEN_KEY) || '',
    userInfo: (() => {
      try {
        const raw = localStorage.getItem(LS_USER_KEY)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    })(),
    loginTime: Number(localStorage.getItem(LS_LOGIN_TIME_KEY) || 0),
  }),

  getters: {
    isLoggedIn(state): boolean {
      return !!state.token && !!state.userInfo
    },

    userLevel(state): UserLevel {
      return state.userInfo?.level ?? 3
    },

    areaScope(state): string {
      const u = state.userInfo
      if (!u) return '全国'
      if (u.level === 1) return '全国'
      if (u.level === 2) return u.province || '全省'
      return (u.province ? u.province + '/' : '') + (u.city || '全市')
    },

    roleLabel(state): string {
      const map: Record<UserInfo['role'], string> = {
        NATIONAL: '国家级管理员',
        PROVINCE: '省级管理员',
        CITY: '市级管理员',
        COLD_CHAIN: '冷链管理员',
        VACCINE_POINT: '接种点管理员',
      }
      return state.userInfo ? map[state.userInfo.role] : '未登录'
    },
  },

  actions: {
    async login(params: { username: string; password: string; level: number }) {
      const { token, userInfo } = mockLogin(params.username, params.password, params.level as UserLevel)
      this.token = token
      this.userInfo = userInfo
      this.loginTime = Date.now()
      localStorage.setItem(LS_TOKEN_KEY, token)
      localStorage.setItem(LS_USER_KEY, JSON.stringify(userInfo))
      localStorage.setItem(LS_LOGIN_TIME_KEY, String(this.loginTime))
      return { token, userInfo }
    },

    logout() {
      this.token = ''
      this.userInfo = null
      this.loginTime = 0
      localStorage.removeItem(LS_TOKEN_KEY)
      localStorage.removeItem(LS_USER_KEY)
      localStorage.removeItem(LS_LOGIN_TIME_KEY)
    },

    hasPermission(perm: string): boolean {
      if (!this.userInfo) return false
      if (this.userInfo.level === 1) return true
      return this.userInfo.permissions.includes(perm)
    },
  },
})
