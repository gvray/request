import type { ErrorConfig } from './types'

export const errorConfig: ErrorConfig = {
  errorHandler(error) {
    // 默认错误处理：可按需替换为 UI Toast 或日志上报
    console.error('[UniRequest] Error:', error)
  },
  errorThrower(res: any) {
    // 当服务端返回 success=false 时抛出业务错误
    const err = new Error((res && res.message) || 'BusinessError')
    ;(err as any).name = 'BusinessError'
    ;(err as any).info = res
    throw err
  },
}