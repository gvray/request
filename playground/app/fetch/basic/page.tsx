'use client'
import { Nav, PageHeader, Section, Btn, Output, useRunner } from '@/components/ui'
import { fetchRequest } from '@/lib/clients'

export default function FetchBasicPage() {
  const { output, loading, run } = useRunner()

  return (
    <main>
      <div className="max-w-6xl mx-auto px-6 py-8">
      <Nav />
      <PageHeader title="Basic Requests" desc="Using createRequest with Fetch engine - independent instance without interceptors" />

      <div className="grid gap-8">
        <Section title="GET">
          <Btn variant="primary" onClick={() => run(() => fetchRequest('/api/ping'))}>GET /ping</Btn>
          <Btn onClick={() => run(() => fetchRequest('/api/users'))}>GET /users</Btn>
          <Btn onClick={() => run(() => fetchRequest('/api/users/1'))}>GET /users/1</Btn>
          <Btn onClick={() => run(() => fetchRequest('/api/headers'))}>GET /headers</Btn>
        </Section>

        <Section title="POST">
          <Btn variant="primary" onClick={() => run(() => fetchRequest('/api/echo', { method: 'POST', data: { message: 'Hello from Fetch' } }))}>POST /echo</Btn>
          <Btn onClick={() => run(() => fetchRequest('/api/users', { method: 'POST', data: { name: 'Jane', email: 'jane@test.com' } }))}>POST /users</Btn>
        </Section>

        <Section title="Errors">
          <Btn variant="danger" onClick={() => run(() => fetchRequest('/api/error'))}>400</Btn>
          <Btn variant="danger" onClick={() => run(() => fetchRequest('/api/not-found'))}>404</Btn>
          <Btn variant="danger" onClick={() => run(() => fetchRequest('/api/server-error'))}>500</Btn>
        </Section>
      </div>

      <Output data={output} loading={loading} />
          </div>
    </main>
  )
}
