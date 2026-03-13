'use client'
import { useState } from 'react'
import { Nav, PageHeader, Section, Btn, Output, useRunner } from '@/components/ui'
import { fetchBasicRequest, fetchAuthRequest } from '@/lib/clients'

function getInitialToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export default function FetchAuthPage() {
  const { output, loading, run } = useRunner()
  const [token, setToken] = useState<string | null>(getInitialToken)

  const handleLogin = async () => {
    await run(async () => {
      const res = await fetchBasicRequest('/api/login', { method: 'POST', data: { username: 'demo', password: 'pass' } })
      const newToken = (res as { token?: string })?.token
      if (newToken) {
        localStorage.setItem('token', newToken)
        setToken(newToken)
      }
      return res
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    run(async () => ({ message: 'Logged out' }))
  }

  const handleExpireToken = () => {
    localStorage.setItem('token', 'expired-token')
    setToken('expired-token')
    run(async () => ({ message: 'Token set to expired value' }))
  }

  return (
    <main>
      <div className="max-w-6xl mx-auto px-6 py-8">
      <Nav />
      <PageHeader title="Authentication" desc="Using createRequest with Fetch engine + preset.bearerAuth + preset.authRefresh" />

      <div className="flex items-center gap-3 mb-8 p-4 bg-gray-50 rounded-xl">
        <span className={`w-2 h-2 rounded-full ${token ? 'bg-green-500' : 'bg-gray-300'}`} />
        <span className="text-sm text-gray-600">
          {token ? `Token: ${token.substring(0, 20)}...` : 'Not authenticated'}
        </span>
      </div>

      <div className="grid gap-8">
        <Section title="Session">
          <Btn variant="primary" onClick={handleLogin}>Login</Btn>
          <Btn onClick={handleLogout}>Logout</Btn>
          <Btn variant="danger" onClick={handleExpireToken}>Expire Token</Btn>
        </Section>

        <Section title="Protected Endpoints (fetchAuthRequest)">
          <Btn onClick={() => run(() => fetchAuthRequest('/api/protected'))}>GET /protected</Btn>
          <Btn onClick={() => run(() => fetchAuthRequest('/api/user/profile'))}>GET /user/profile</Btn>
          <Btn onClick={() => run(() => fetchAuthRequest('/api/user/settings'))}>GET /user/settings</Btn>
        </Section>

        <Section title="Token Refresh">
          <Btn onClick={() => run(() => fetchBasicRequest('/api/refresh-token', { method: 'POST' }))}>Manual Refresh</Btn>
          <Btn variant="primary" onClick={() => run(() => fetchAuthRequest('/api/protected'))}>Auto Refresh</Btn>
        </Section>
      </div>

      <Output data={output} loading={loading} />
          </div>
    </main>
  )
}
