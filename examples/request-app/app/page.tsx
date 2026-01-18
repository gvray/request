'use client'
import { useEffect } from 'react'
import { Nav, PageHeader, Section, Btn, Output, useRunner } from '@/components/ui'
import { initClient, request, retryRequest, timeoutRequest, cacheRequest, loggingRequest } from '@/lib/clients'

export default function OverviewPage() {
  const { output, loading, run } = useRunner()

  useEffect(() => {
    initClient()
  }, [])

  return (
    <main>
      <Nav />
      <PageHeader 
        title="Interactive Demo" 
        desc="Explore all interceptors with live API calls. Click any button to see the response." 
      />

      <div className="grid gap-8">
        <Section title="Basic HTTP (createClient + request)">
          <Btn onClick={() => run(() => request('/api/ping'))}>GET /ping</Btn>
          <Btn onClick={() => run(() => request('/api/users'))}>GET /users</Btn>
          <Btn onClick={() => run(() => request('/api/echo', { method: 'POST', data: { msg: 'hello' } }))}>POST /echo</Btn>
          <Btn variant="danger" onClick={() => run(() => request('/api/error'))}>400 Error</Btn>
        </Section>

        <Section title="Authentication">
          <Btn variant="primary" onClick={() => run(() => request('/api/login', { method: 'POST', data: { username: 'demo', password: 'pass' } }))}>Login</Btn>
          <Btn onClick={() => run(() => request('/api/protected'))}>Access Protected</Btn>
        </Section>

        <Section title="Auto Retry (createRequest)">
          <Btn onClick={() => run(() => request('/api/unstable/reset', { method: 'POST' }))}>Reset Counter</Btn>
          <Btn variant="primary" onClick={() => run(() => retryRequest('/api/unstable?failTimes=2'))}>Retry → Success</Btn>
          <Btn variant="danger" onClick={() => run(() => retryRequest('/api/unstable?failTimes=5'))}>Retry → Fail</Btn>
        </Section>

        <Section title="Timeout (createRequest)">
          <Btn onClick={() => run(() => timeoutRequest('/api/delay/500'))}>500ms (OK)</Btn>
          <Btn variant="danger" onClick={() => run(() => timeoutRequest('/api/delay/3000'))}>3s (Timeout)</Btn>
        </Section>

        <Section title="Response Cache (createRequest)">
          <Btn variant="primary" onClick={() => run(() => cacheRequest('/api/timestamp'))}>Get Timestamp</Btn>
          <Btn onClick={() => run(() => cacheRequest('/api/users'))}>Cached Users</Btn>
        </Section>

        <Section title="Request Logging (createRequest)">
          <Btn onClick={() => run(() => loggingRequest('/api/headers'))}>Log GET</Btn>
          <Btn onClick={() => run(() => loggingRequest('/api/echo', { method: 'POST', data: { test: 1 } }))}>Log POST</Btn>
        </Section>
      </div>

      <Output data={output} loading={loading} />
    </main>
  )
}
