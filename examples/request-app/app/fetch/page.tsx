'use client'
import { Nav, PageHeader, Section, Btn, Output, InfoBox, useRunner } from '@/components/ui'
import { fetchRequest, fetchLoggingRequest } from '@/lib/clients'

export default function FetchEnginePage() {
  const { output, loading, run } = useRunner()

  return (
    <main>
      <Nav />
      <PageHeader
        title="Fetch Engine"
        desc="Using createRequest with engine: 'fetch' — same API, different underlying implementation"
      />

      <InfoBox>
        These requests use the native <strong>Fetch API</strong> as the HTTP engine instead of Axios.
        The usage is identical — only the <code>engine: &apos;fetch&apos;</code> option differs at creation time.
      </InfoBox>

      <div className="grid gap-8">
        <Section title="Basic Fetch (GET)">
          <Btn variant="primary" onClick={() => run(() => fetchRequest('/api/ping'))}>GET /ping</Btn>
          <Btn onClick={() => run(() => fetchRequest('/api/users'))}>GET /users</Btn>
          <Btn onClick={() => run(() => fetchRequest('/api/users/1'))}>GET /users/1</Btn>
          <Btn onClick={() => run(() => fetchRequest('/api/headers'))}>GET /headers</Btn>
          <Btn onClick={() => run(() => fetchRequest('/api/timestamp'))}>GET /timestamp</Btn>
        </Section>

        <Section title="Basic Fetch (POST)">
          <Btn variant="primary" onClick={() => run(() => fetchRequest('/api/echo', { method: 'POST', data: { message: 'Hello from Fetch' } }))}>POST /echo</Btn>
          <Btn onClick={() => run(() => fetchRequest('/api/users', { method: 'POST', data: { name: 'Fetch User', email: 'fetch@test.com' } }))}>POST /users</Btn>
        </Section>

        <Section title="Fetch with getResponse">
          <Btn onClick={() => run(() => fetchRequest('/api/ping', { getResponse: true }))}>GET /ping (full response)</Btn>
          <Btn onClick={() => run(() => fetchRequest('/api/users', { getResponse: true }))}>GET /users (full response)</Btn>
        </Section>

        <Section title="Fetch + Logging Interceptor">
          <Btn onClick={() => run(() => fetchLoggingRequest('/api/ping'))}>GET /ping (logged)</Btn>
          <Btn onClick={() => run(() => fetchLoggingRequest('/api/echo', { method: 'POST', data: { test: 'fetch-log' } }))}>POST /echo (logged)</Btn>
        </Section>

        <Section title="Error Handling">
          <Btn variant="danger" onClick={() => run(() => fetchRequest('/api/error'))}>400 Error</Btn>
          <Btn variant="danger" onClick={() => run(() => fetchRequest('/api/not-found'))}>404 Error</Btn>
          <Btn variant="danger" onClick={() => run(() => fetchRequest('/api/server-error'))}>500 Error</Btn>
        </Section>
      </div>

      <Output data={output} loading={loading} />
    </main>
  )
}
