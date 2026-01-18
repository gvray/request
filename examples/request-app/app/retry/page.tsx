'use client'
import { Nav, PageHeader, Section, Btn, Output, useRunner } from '@/components/ui'
import { basicRequest, retryRequest } from '@/lib/clients'

export default function RetryPage() {
  const { output, loading, run } = useRunner()

  return (
    <main>
      <Nav />
      <PageHeader title="Auto Retry" desc="Using createRequest with retry interceptor (3 retries, 800ms delay)" />

      <div className="grid gap-8">
        <Section title="Control">
          <Btn onClick={() => run(() => basicRequest('/api/unstable/reset', { method: 'POST' }))}>Reset Counter</Btn>
          <Btn onClick={() => run(() => basicRequest('/api/unstable/status'))}>Check Status</Btn>
        </Section>

        <Section title="Retry Scenarios (retryRequest)">
          <Btn variant="primary" onClick={() => run(() => retryRequest('/api/unstable?failTimes=1'))}>Fail 1x → OK</Btn>
          <Btn onClick={() => run(() => retryRequest('/api/unstable?failTimes=2'))}>Fail 2x → OK</Btn>
          <Btn onClick={() => run(() => retryRequest('/api/unstable?failTimes=3'))}>Fail 3x → OK</Btn>
          <Btn variant="danger" onClick={() => run(() => retryRequest('/api/unstable?failTimes=5'))}>Fail 5x → Error</Btn>
        </Section>

        <Section title="Server Errors">
          <Btn variant="danger" onClick={() => run(() => retryRequest('/api/server-error'))}>500 Error</Btn>
          <Btn variant="danger" onClick={() => run(() => retryRequest('/api/service-unavailable'))}>503 Unavailable</Btn>
        </Section>
      </div>

      <Output data={output} loading={loading} />

      <p className="mt-6 text-sm text-gray-500">Open browser console to see retry logs with timing.</p>
    </main>
  )
}
