'use client'
import { Nav, PageHeader, Section, Btn, Output, useRunner } from '@/components/ui'
import { fetchRequest, fetchLoggingRequest } from '@/lib/clients'

export default function FetchOverviewPage() {
  const { output, loading, run } = useRunner()

  return (
    <main>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Nav />
        <PageHeader 
          title="Fetch Engine - Interactive Demo" 
          desc="Explore all interceptors with native Fetch API. Click any button to see the response." 
        />

        <div className="grid gap-8">
          <Section title="Basic HTTP (Fetch Engine)">
            <Btn onClick={() => run(() => fetchRequest('/api/ping'))}>GET /ping</Btn>
            <Btn onClick={() => run(() => fetchRequest('/api/users'))}>GET /users</Btn>
            <Btn onClick={() => run(() => fetchRequest('/api/echo', { method: 'POST', data: { msg: 'hello from fetch' } }))}>POST /echo</Btn>
            <Btn variant="danger" onClick={() => run(() => fetchRequest('/api/error'))}>400 Error</Btn>
          </Section>

          <Section title="Request Logging (Fetch Engine)">
            <Btn onClick={() => run(() => fetchLoggingRequest('/api/headers'))}>Log GET</Btn>
            <Btn onClick={() => run(() => fetchLoggingRequest('/api/echo', { method: 'POST', data: { test: 1, engine: 'fetch' } }))}>Log POST</Btn>
          </Section>

          <Section title="Engine Comparison">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">🔷 Axios Engine vs ⚡ Fetch Engine</h3>
              <p className="text-sm text-blue-800">
                Both engines support the same interceptor API. Switch between tabs to see how the same functionality works with different underlying implementations.
              </p>
            </div>
          </Section>
        </div>

        <Output data={output} loading={loading} />
      </div>
    </main>
  )
}
