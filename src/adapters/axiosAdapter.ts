import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { HttpAdapter, RequestOptions, UnifiedResponse } from '../types'

let axiosInstance: AxiosInstance | null = null

const getAxiosInstance = (options: RequestOptions): AxiosInstance => {
  if (axiosInstance) return axiosInstance
  axiosInstance = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeout,
  })
  return axiosInstance
}

const toAxiosConfig = (options: RequestOptions): AxiosRequestConfig => {
  const config: AxiosRequestConfig = {
    method: options.method || 'GET',
    headers: options.headers,
    params: options.params,
    data: options.data ?? options.body,
    timeout: options.timeout,
    baseURL: options.baseURL,
  }
  return config
}

export const axiosAdapter: HttpAdapter = {
  async request<T = any>(url: string, options: RequestOptions): Promise<UnifiedResponse<T>> {
    const instance = getAxiosInstance(options)
    const res: AxiosResponse<T> = await instance.request<T>({ ...toAxiosConfig(options), url })
    const headers: Record<string, string> = {}
    Object.entries(res.headers).forEach(([k, v]) => {
      headers[k] = Array.isArray(v) ? v.join('; ') : String(v)
    })
    return {
      data: res.data,
      status: res.status,
      headers,
      url: res.config?.url || url,
      raw: res,
    }
  },
}