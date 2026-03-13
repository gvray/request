'use client'
import { useState } from 'react'
import { Nav, PageHeader, Section, Btn, Output, useRunner } from '@/components/ui'
import { createRequest } from '@gvray/request'

// 使用 localStorage 管理 token（简化版本，避免 SSR 问题）
const TOKEN_KEY = 'auth_refresh_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_refresh_token'

// Access Token: 5 分钟过期 (300 秒)
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  
  // 检查过期时间（存储格式：token|timestamp）
  const [value, timestamp] = token.split('|')
  if (!value || !timestamp) return null
  
  // 检查是否过期（5分钟 = 300秒）
  const now = Date.now()
  const storedTime = parseInt(timestamp, 10)
  if (now - storedTime > 300 * 1000) {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
  
  return value
}

function setToken(token: string) {
  if (typeof window === 'undefined') return
  // 设置 5 分钟过期时间（300 秒）
  const value = `${token}|${Date.now()}`
  localStorage.setItem(TOKEN_KEY, value)
}

// Refresh Token: 30 分钟过期 (1800 秒)
function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!token) return null
  
  // 检查过期时间（存储格式：token|timestamp）
  const [value, timestamp] = token.split('|')
  if (!value || !timestamp) return null
  
  // 检查是否过期（30分钟 = 1800秒）
  const now = Date.now()
  const storedTime = parseInt(timestamp, 10)
  if (now - storedTime > 1800 * 1000) {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    return null
  }
  
  return value
}

function setRefreshToken(token: string) {
  if (typeof window === 'undefined') return
  // 设置 30 分钟过期时间（1800 秒）
  const value = `${token}|${Date.now()}`
  localStorage.setItem(REFRESH_TOKEN_KEY, value)
}

function clearTokens() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// 模拟刷新 token 的函数
async function mockRefreshToken(): Promise<string | null> {
  console.log('[Refresh] Starting token refresh...')
  await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟网络延迟
  
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    console.log('[Refresh] No refresh token found')
    return null
  }
  
  // 模拟刷新成功
  const newAccessToken = `access_${Date.now()}`
  console.log('[Refresh] Token refreshed successfully:', newAccessToken)
  setToken(newAccessToken)
  return newAccessToken
}

// 请求拦截器模式：前端主动判断 token 过期
const requestAuthClient = createRequest({
  engine: 'fetch',
  baseURL: '/api',
  preset: {
    requestAuthRefresh: {
      getToken: () => {
        const token = getToken()
        console.log('[Fetch RequestAuth] getToken:', token)
        // 返回 null 表示 token 过期，触发刷新
        return token
      },
      refreshToken: mockRefreshToken,
      setToken: (token) => {
        console.log('[Fetch RequestAuth] setToken:', token)
        setToken(token)
      },
      header: 'Authorization',
      scheme: 'Bearer',
      exclude: ['/login', '/refresh-token'],
    },
  },
})

// 响应拦截器模式：后端返回 401 时刷新
const responseAuthClient = createRequest({
  engine: 'fetch',
  baseURL: '/api',
  preset: {
    bearerAuth: {
      getToken: () => getToken(),
      header: 'Authorization',
      scheme: 'Bearer',
    },
    responseAuthRefresh: {
      refreshToken: mockRefreshToken,
      setToken: (token) => {
        console.log('[Fetch ResponseAuth] setToken:', token)
        setToken(token)
      },
      getToken: () => Promise.resolve(getToken()),
      statuses: [401, 403],
      header: 'Authorization',
      scheme: 'Bearer',
    },
  },
})

export default function FetchAuthRefreshPage() {
  const { output, loading, run } = useRunner()
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [refreshToken, setRefreshTokenState] = useState<string | null>(() => getRefreshToken())
  const [mode, setMode] = useState<'request' | 'response'>('request')

  const handleLogin = async () => {
    await run(async () => {
      const newAccessToken = `access_${Date.now()}`
      const newRefreshToken = `refresh_${Date.now()}`
      
      setToken(newAccessToken)
      setRefreshToken(newRefreshToken)
      setTokenState(newAccessToken)
      setRefreshTokenState(newRefreshToken)
      
      return {
        message: 'Login successful',
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }
    })
  }

  const handleLogout = () => {
    clearTokens()
    setTokenState(null)
    setRefreshTokenState(null)
    run(async () => ({ message: 'Logged out' }))
  }

  const handleExpireToken = () => {
    localStorage.removeItem(TOKEN_KEY)
    setTokenState(null)
    run(async () => ({ message: 'Access token cleared (simulating expiry)' }))
  }

  const handleTestRequest = async () => {
    const client = mode === 'request' ? requestAuthClient : responseAuthClient
    await run(async () => {
      console.log(`[Test] Testing ${mode} mode...`)
      const result = await client('/protected')
      return result
    })
  }

  const handleConcurrentRequests = async () => {
    const client = mode === 'request' ? requestAuthClient : responseAuthClient
    await run(async () => {
      console.log(`[Test] Testing concurrent requests in ${mode} mode...`)
      const promises = [
        client('/protected'),
        client('/user/profile'),
        client('/user/settings'),
      ]
      const results = await Promise.all(promises)
      return {
        message: 'All requests completed',
        results,
      }
    })
  }

  return (
    <main>
      <div className="max-w-6xl mx-auto px-6 py-8">
      <Nav />
      <PageHeader 
        title="Auth Refresh Testing" 
        desc="Test requestAuthRefresh (proactive) vs responseAuthRefresh (reactive)" 
      />

      {/* Token Status */}
      <div className="mb-8 p-4 bg-gray-50 rounded-xl space-y-2">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${token ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-sm text-gray-600">
            Access Token: {token ? `${token.substring(0, 30)}...` : 'None'}
            <span className="ml-2 text-xs text-gray-400">(5 min TTL)</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${refreshToken ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <span className="text-sm text-gray-600">
            Refresh Token: {refreshToken ? `${refreshToken.substring(0, 30)}...` : 'None'}
            <span className="ml-2 text-xs text-gray-400">(30 min TTL)</span>
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
          💾 Using localStorage with manual expiration (5min access, 30min refresh)
        </div>
      </div>

      {/* Mode Selection */}
      <Section title="Select Mode">
        <div className="flex gap-4">
          <button
            onClick={() => setMode('request')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              mode === 'request'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Request Interceptor
            <div className="text-xs mt-1 opacity-80">Proactive (getToken returns null)</div>
          </button>
          <button
            onClick={() => setMode('response')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              mode === 'response'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Response Interceptor
            <div className="text-xs mt-1 opacity-80">Reactive (401/403 response)</div>
          </button>
        </div>
      </Section>

      <div className="grid gap-8">
        {/* Session Management */}
        <Section title="Session Management">
          <Btn variant="primary" onClick={handleLogin}>
            Login (Get Tokens)
          </Btn>
          <Btn onClick={handleLogout}>
            Logout (Clear All)
          </Btn>
          <Btn variant="danger" onClick={handleExpireToken}>
            Expire Access Token
          </Btn>
        </Section>

        {/* Test Requests */}
        <Section title={`Test ${mode === 'request' ? 'Request' : 'Response'} Auth Refresh`}>
          <Btn variant="primary" onClick={handleTestRequest}>
            Single Request
          </Btn>
          <Btn onClick={handleConcurrentRequests}>
            Concurrent Requests (3x)
          </Btn>
        </Section>

        {/* How It Works */}
        <Section title="How It Works">
          {mode === 'request' ? (
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Request Interceptor (Proactive):</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Before sending request, call <code className="bg-gray-100 px-1 rounded">getToken()</code></li>
                <li>If returns <code className="bg-gray-100 px-1 rounded">null</code>, trigger refresh</li>
                <li>All concurrent requests wait for refresh to complete</li>
                <li>Inject new token and continue requests</li>
              </ol>
              <p className="mt-2 text-xs text-gray-500">
                ✅ No invalid requests sent to server<br/>
                ✅ Suitable when frontend can detect token expiry
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Response Interceptor (Reactive):</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Send request with current token</li>
                <li>If server returns 401/403, trigger refresh</li>
                <li>Queue subsequent 401/403 requests</li>
                <li>After refresh, retry all queued requests</li>
              </ol>
              <p className="mt-2 text-xs text-gray-500">
                ✅ Works with any backend<br/>
                ✅ Relies on server response to detect expiry
              </p>
            </div>
          )}
        </Section>
      </div>

      <Output data={output} loading={loading} />
          </div>
    </main>
  )
}
