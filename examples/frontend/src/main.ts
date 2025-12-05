import { createClient, errorConfig } from 'unirequest';

const client = createClient({
  baseURL: 'http://localhost:4001',
  timeout: 8000,
  errorConfig: {
    ...errorConfig,
    errorFeedBack: (errorInfo) => {
      console.error('[UniRequest] Error:', errorInfo);
    },
  },
});

const out = document.getElementById('output')! as HTMLPreElement;
function show(obj: unknown) {
  out.classList.remove('error');
  out.textContent = JSON.stringify(obj, null, 2);
}
function showError(e: any) {
  out.classList.add('error');
  const info = {
    error: true,
    name: e?.name,
    message: e?.message ?? String(e),
    status: e?.response?.status,
    data: e?.response?.data,
  };
  out.textContent = JSON.stringify(info, null, 2);
}

// 正常请求示例
(document.getElementById('btn-ping') as HTMLButtonElement).onclick = async () => {
  const data = await client.request('/api/ping', { method: 'GET' });
  show(data);
};

(document.getElementById('btn-users') as HTMLButtonElement).onclick = async () => {
  const data = await client.request('/api/users', { method: 'GET' });
  show(data);
};

(document.getElementById('btn-echo') as HTMLButtonElement).onclick = async () => {
  const data = await client.request('/api/echo', { method: 'POST', data: { hello: 'world' } });
  show(data);
};

// 后端返回业务错误（400）
(document.getElementById('btn-error') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await client.request('/api/error', { method: 'GET' });
    show(data);
  } catch (e: any) {
    showError(e);
  }
};

// 覆盖 timeout 为 500ms，调用慢接口以确保触发超时
(document.getElementById('btn-timeout') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await client.request('/api/slow', { method: 'GET', timeout: 500 });
    show(data);
  } catch (e: any) {
    showError(e);
  }
};

// 请求一个不存在的路径，触发 404 响应错误
(document.getElementById('btn-404') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await client.request('/api/not-found', { method: 'GET' });
    show(data);
  } catch (e: any) {
    showError(e);
  }
};

// 网络错误演示：访问一个无效域名（需允许跨域失败展示）
(document.getElementById('btn-network') as HTMLButtonElement).onclick = async () => {
  try {
    const other = createClient({ baseURL: 'http://localhost:59999', timeout: 1000 });
    const data = await other.request('/api/ping', { method: 'GET' });
    show(data);
  } catch (e: any) {
    showError(e);
  }
};
