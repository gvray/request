'use client'
import { Nav, PageHeader, Section, Btn, Output, useRunner } from '@/components/ui'
import { loggingRequest } from '@/lib/clients'

export default function LoggingPage() {
  const { output, loading, run } = useRunner()

  return (
    <main>
      <Nav />
      <PageHeader title="Request Logging" desc="Using createRequest with logging interceptor" />

      <div className="grid gap-8">
        <Section title="GET (loggingRequest)">
          <Btn variant="primary" onClick={() => run(() => loggingRequest('/api/ping'))}>GET /ping</Btn>
          <Btn onClick={() => run(() => loggingRequest('/api/users'))}>GET /users</Btn>
          <Btn onClick={() => run(() => loggingRequest('/api/headers'))}>GET /headers</Btn>
        </Section>

        <Section title="POST">
          <Btn variant="primary" onClick={() => run(() => loggingRequest('/api/echo', { method: 'POST', data: { message: 'Hello' } }))}>POST /echo</Btn>
          <Btn onClick={() => run(() => loggingRequest('/api/users', { method: 'POST', data: { name: 'Test' } }))}>POST /users</Btn>
        </Section>

        <Section title="Timing">
          <Btn onClick={() => run(() => loggingRequest('/api/delay/500'))}>500ms</Btn>
          <Btn onClick={() => run(() => loggingRequest('/api/delay/1000'))}>1000ms</Btn>
          <Btn onClick={() => run(() => loggingRequest('/api/delay/2000'))}>2000ms</Btn>
        </Section>

        <Section title="Errors">
          <Btn variant="danger" onClick={() => run(() => loggingRequest('/api/error'))}>400</Btn>
          <Btn variant="danger" onClick={() => run(() => loggingRequest('/api/not-found'))}>404</Btn>
          <Btn variant="danger" onClick={() => run(() => loggingRequest('/api/server-error'))}>500</Btn>
        </Section>
      </div>

      <Output data={output} loading={loading} />

      <p className="mt-6 text-sm text-gray-500">Open browser console (F12) to see detailed logs.</p>
    </main>
  )
}
