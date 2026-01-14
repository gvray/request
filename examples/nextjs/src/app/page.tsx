'use client'
import { useState } from 'react'
import { createClient } from '@gvray/request'

type Output = unknown

export default function Page() {
  const client = createClient({ baseURL: 'http://localhost:3000', timeout: 8000 })
  const [out, setOut] = useState<Output>('等待操作...')

  return (
    <main className="container mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-4">Request Next.js 示例</h1>
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={async () => setOut(await client.request('/api/ping', { method: 'GET' }))}
        >
          Ping
        </button>
        <button
          className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          onClick={async () => setOut(await client.request('/api/users', { method: 'GET' }))}
        >
          Users
        </button>
        <button
          className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          onClick={async () => setOut(await client.request('/api/echo', { method: 'POST', data: { hello: 'world' } }))}
        >
          Echo
        </button>
        <button
          className="px-3 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
          onClick={async () => {
            try {
              setOut(await client.request('/api/error', { method: 'GET' }))
            } catch (e) {
              const err = e as { message?: string }
              setOut({ error: true, message: err?.message ?? String(e) } as Output)
            }
          }}
        >
          Error
        </button>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white dark:bg-neutral-900 shadow-sm">
        <div className="border-b border-gray-200 px-4 py-2 text-sm text-gray-500">输出</div>
        <pre className="p-4 text-sm whitespace-pre-wrap break-words min-h-32">{
          typeof out === 'string' ? out : JSON.stringify(out, null, 2)
        }</pre>
      </div>
    </main>
  )
}
