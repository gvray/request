'use client'
import { Nav, PageHeader, Section, Btn, Output, useRunner } from '@/components/ui'
import { fetchLoggingRequest } from '@/lib/clients'

export default function LoggingPage() {
  const { output, loading, run } = useRunner()

  return (
    <main>
      <div className="max-w-6xl mx-auto px-6 py-8">
      <Nav />
      <PageHeader title="Request Logging" desc="Using createRequest with logging interceptor" />

      <div className="grid gap-8">
        <Section title="GET (fetchLoggingRequest)">
          <Btn variant="primary" onClick={() => run(() => fetchLoggingRequest('/api/ping'))}>GET /ping</Btn>
          <Btn onClick={() => run(() => fetchLoggingRequest('/api/users'))}>GET /users</Btn>
          <Btn onClick={() => run(() => fetchLoggingRequest('/api/headers'))}>GET /headers</Btn>
        </Section>

        <Section title="POST">
          <Btn variant="primary" onClick={() => run(() => fetchLoggingRequest('/api/echo', { method: 'POST', data: { message: 'Hello' } }))}>POST /echo</Btn>
          <Btn onClick={() => run(() => fetchLoggingRequest('/api/users', { method: 'POST', data: { name: 'Test' } }))}>POST /users</Btn>
        </Section>

        <Section title="Timing">
          <Btn onClick={() => run(() => fetchLoggingRequest('/api/delay/500'))}>500ms</Btn>
          <Btn onClick={() => run(() => fetchLoggingRequest('/api/delay/1000'))}>1000ms</Btn>
          <Btn onClick={() => run(() => fetchLoggingRequest('/api/delay/2000'))}>2000ms</Btn>
        </Section>

        <Section title="Errors">
          <Btn variant="danger" onClick={() => run(() => fetchLoggingRequest('/api/error'))}>400</Btn>
          <Btn variant="danger" onClick={() => run(() => fetchLoggingRequest('/api/not-found'))}>404</Btn>
          <Btn variant="danger" onClick={() => run(() => fetchLoggingRequest('/api/server-error'))}>500</Btn>
        </Section>
      </div>

      <Output data={output} loading={loading} />

      <p className="mt-6 text-sm text-gray-500">Open browser console (F12) to see detailed logs.</p>
          </div>
    </main>
  )
}
