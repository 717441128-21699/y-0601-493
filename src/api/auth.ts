import { mockLogin, mockGetUserInfo, mockLogout } from '@/mock'
import type { UserInfo, LoginResult } from '@/mock'
import type { UserLevel } from '@/types'

export interface LoginParams {
  username: string
  password: string
  level: number
}

export const login = (params: LoginParams): Promise<LoginResult | null> => {
  return Promise.resolve(mockLogin(params.username, params.password, params.level as UserLevel))
}

export const logout = (): Promise<boolean> => {
  return Promise.resolve(mockLogout())
}

export const fetchUserInfo = (token: string): Promise<UserInfo | null> => {
  return Promise.resolve(mockGetUserInfo(token))
}
