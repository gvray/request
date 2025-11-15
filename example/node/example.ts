import { createClient } from '../../src/client'
import { errorConfig } from '../../src/requestErrorConfig'

const client = createClient({
  adapter: 'fetch',
  baseURL: 'https://httpbin.org',
  timeout: 10000,
  errorConfig,
})

async function main() {
  // GET example
  const data = await client.request('/get', { method: 'GET' })
  console.log('GET data keys:', Object.keys(data))

  // POST example
  const res = await client.request('/post', {
    method: 'POST',
    data: { hello: 'world' },
    getResponse: true,
  })
  console.log('POST status:', res.status)
}

main().catch((e) => console.error('Example error:', e))