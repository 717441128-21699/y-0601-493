import axios from 'axios'
import type { ApiResponse } from '@/types'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vaccine_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse<any>
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code !== 200) {
        const err = new Error(res.message || '请求失败')
        ;(err as any).code = res.code
        return Promise.reject(err)
      }
      return res.data
    }
    return response.data
  },
  (error) => {
    const message = error?.response?.data?.message || error.message || '网络异常'
    const err = new Error(message)
    ;(err as any).status = error?.response?.status
    return Promise.reject(err)
  }
)

export default request
