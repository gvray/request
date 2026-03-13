'use client'
import { Nav, PageHeader, Section, Btn, Output, useRunner } from '@/components/ui'
import { fetchBasicRequest, fetchTimeoutRequest } from '@/lib/clients'

export default function FetchTimeoutPage() {
  const { output, loading, run } = useRunner()

  return (
    <main>
      <div className="max-w-6xl mx-auto px-6 py-8">
      <Nav />
      <PageHeader title="Timeout" desc="Using createRequest with timeout interceptor (2000ms limit)" />

      <div className="grid gap-8">
        <Section title="Within Timeout (OK) - fetchTimeoutRequest">
          <Btn variant="primary" onClick={() => run(() => fetchTimeoutRequest('/api/delay/100'))}>100ms</Btn>
          <Btn onClick={() => run(() => fetchTimeoutRequest('/api/delay/500'))}>500ms</Btn>
          <Btn onClick={() => run(() => fetchTimeoutRequest('/api/delay/1000'))}>1000ms</Btn>
          <Btn onClick={() => run(() => fetchTimeoutRequest('/api/delay/1500'))}>1500ms</Btn>
        </Section>

        <Section title="Exceeds Timeout (Error)">
          <Btn variant="danger" onClick={() => run(() => fetchTimeoutRequest('/api/delay/2500'))}>2500ms</Btn>
          <Btn variant="danger" onClick={() => run(() => fetchTimeoutRequest('/api/delay/3000'))}>3000ms</Btn>
          <Btn variant="danger" onClick={() => run(() => fetchTimeoutRequest('/api/delay/5000'))}>5000ms</Btn>
        </Section>

        <Section title="Default (8s timeout) - fetchBasicRequest">
          <Btn onClick={() => run(() => fetchBasicRequest('/api/delay/3000'))}>3000ms</Btn>
          <Btn onClick={() => run(() => fetchBasicRequest('/api/delay/5000'))}>5000ms</Btn>
        </Section>
      </div>

      <Output data={output} loading={loading} />
          </div>
    </main>
  )
}
