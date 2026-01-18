'use client'
import { useState } from 'react'
import { Nav, PageHeader, Section, Btn, Output, useRunner } from '@/components/ui'
import { basicRequest, authRequest } from '@/lib/clients'

function getInitialToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export default function AuthPage() {
  const { output, loading, run } = useRunner()
  const [token, setToken] = useState<string | null>(getInitialToken)

  const handleLogin = async () => {
    await run(async () => {
      const res = await basicRequest('/api/login', { method: 'POST', data: { username: 'demo', password: 'pass' } })
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
      <Nav />
      <PageHeader title="Authentication" desc="Using createRequest with preset.bearerAuth + preset.authRefresh" />

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

        <Section title="Protected Endpoints (authRequest)">
          <Btn onClick={() => run(() => authRequest('/api/protected'))}>GET /protected</Btn>
          <Btn onClick={() => run(() => authRequest('/api/user/profile'))}>GET /user/profile</Btn>
          <Btn onClick={() => run(() => authRequest('/api/user/settings'))}>GET /user/settings</Btn>
        </Section>

        <Section title="Token Refresh">
          <Btn onClick={() => run(() => basicRequest('/api/refresh-token', { method: 'POST' }))}>Manual Refresh</Btn>
          <Btn variant="primary" onClick={() => run(() => authRequest('/api/protected'))}>Auto Refresh</Btn>
        </Section>
      </div>

      <Output data={output} loading={loading} />
    </main>
  )
}
