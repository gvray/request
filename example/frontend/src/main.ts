import { getClient } from 'uni-request';

const client = getClient({
  baseURL: 'http://localhost:4000',
  timeout: 8000,
});

const out = document.getElementById('output')!;
function show(obj: unknown) {
  out.textContent = JSON.stringify(obj, null, 2);
}

(document.getElementById('btn-ping') as HTMLButtonElement).onclick = async () => {
  const data = await client.request({ url: '/api/ping', method: 'GET' });
  show(data);
};

(document.getElementById('btn-users') as HTMLButtonElement).onclick = async () => {
  const data = await client.request({ url: '/api/users', method: 'GET' });
  show(data);
};

(document.getElementById('btn-echo') as HTMLButtonElement).onclick = async () => {
  const data = await client.request({ url: '/api/echo', method: 'POST', data: { hello: 'world' } });
  show(data);
};

(document.getElementById('btn-error') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await client.request({ url: '/api/error', method: 'GET' });
    show(data);
  } catch (e: any) {
    show({ error: true, message: e?.message ?? String(e) });
  }
};