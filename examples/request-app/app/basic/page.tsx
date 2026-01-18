'use client'
import { Nav, PageHeader, Section, Btn, Output, useRunner } from '@/components/ui'
import { basicRequest } from '@/lib/clients'

export default function BasicPage() {
  const { output, loading, run } = useRunner()

  return (
    <main>
      <Nav />
      <PageHeader title="Basic Requests" desc="Using createRequest - independent instance without interceptors" />

      <div className="grid gap-8">
        <Section title="GET">
          <Btn variant="primary" onClick={() => run(() => basicRequest('/api/ping'))}>GET /ping</Btn>
          <Btn onClick={() => run(() => basicRequest('/api/users'))}>GET /users</Btn>
          <Btn onClick={() => run(() => basicRequest('/api/users/1'))}>GET /users/1</Btn>
          <Btn onClick={() => run(() => basicRequest('/api/headers'))}>GET /headers</Btn>
        </Section>

        <Section title="POST">
          <Btn variant="primary" onClick={() => run(() => basicRequest('/api/echo', { method: 'POST', data: { message: 'Hello' } }))}>POST /echo</Btn>
          <Btn onClick={() => run(() => basicRequest('/api/users', { method: 'POST', data: { name: 'John', email: 'john@test.com' } }))}>POST /users</Btn>
        </Section>

        <Section title="Errors">
          <Btn variant="danger" onClick={() => run(() => basicRequest('/api/error'))}>400</Btn>
          <Btn variant="danger" onClick={() => run(() => basicRequest('/api/not-found'))}>404</Btn>
          <Btn variant="danger" onClick={() => run(() => basicRequest('/api/server-error'))}>500</Btn>
        </Section>
      </div>

      <Output data={output} loading={loading} />
    </main>
  )
}
