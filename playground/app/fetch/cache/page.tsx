'use client'
import { Nav, PageHeader, Section, Btn, Output, useRunner } from '@/components/ui'
import { fetchBasicRequest, fetchCacheRequest } from '@/lib/clients'

export default function FetchCachePage() {
  const { output, loading, run } = useRunner()

  return (
    <main>
      <div className="max-w-6xl mx-auto px-6 py-8">
      <Nav />
      <PageHeader title="Response Cache" desc="Using createRequest with cache interceptor (TTL: 5 seconds)" />

      <div className="grid gap-8">
        <Section title="Timestamp (test cache effect)">
          <Btn variant="primary" onClick={() => run(() => fetchCacheRequest('/api/timestamp'))}>Cached</Btn>
          <Btn onClick={() => run(() => fetchBasicRequest('/api/timestamp'))}>Fresh (no cache)</Btn>
        </Section>

        <Section title="Cached Data (fetchCacheRequest)">
          <Btn onClick={() => run(() => fetchCacheRequest('/api/data/1'))}>Data #1</Btn>
          <Btn onClick={() => run(() => fetchCacheRequest('/api/data/2'))}>Data #2</Btn>
          <Btn onClick={() => run(() => fetchCacheRequest('/api/users'))}>Users</Btn>
        </Section>

        <Section title="POST (bypasses cache)">
          <Btn variant="danger" onClick={() => run(() => fetchCacheRequest('/api/echo', { method: 'POST', data: { time: Date.now() } }))}>POST /echo</Btn>
        </Section>
      </div>

      <Output data={output} loading={loading} />

      <p className="mt-6 text-sm text-gray-500">
        Click &ldquo;Cached&rdquo; twice within 5s to see the same timestamp. Check console for HIT/MISS logs.
      </p>
          </div>
    </main>
  )
}
