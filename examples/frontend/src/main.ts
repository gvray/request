import { createClient } from '@gvray/request';
import api from './api';

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
  const data = await api.ping();
  show(data);
};

(document.getElementById('btn-users') as HTMLButtonElement).onclick = async () => {
  const data = await api.users();
  show(data);
};

(document.getElementById('btn-echo') as HTMLButtonElement).onclick = async () => {
  const data = await api.echo({ hello: 'world' });
  show(data);
};

// 后端返回业务错误（400）
(document.getElementById('btn-error') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await api.error();
    show(data);
  } catch (e: any) {
    showError(e);
  }
};

// 覆盖 timeout 为 500ms，调用慢接口以确保触发超时
(document.getElementById('btn-timeout') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await api.slow(500);
    show(data);
  } catch (e: any) {
    showError(e);
  }
};

// 请求一个不存在的路径，触发 404 响应错误
(document.getElementById('btn-404') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await api.notFound();
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

// 认证流程演示
(document.getElementById('btn-login') as HTMLButtonElement).onclick = async () => {
  try {
    await api.login();
    const tokens = api.getTokens();
    show({ login: true, ...tokens });
  } catch (e: any) {
    showError(e);
  }
};

// 访问受保护接口（需要 Authorization）
(document.getElementById('btn-protected') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await api.protected();
    show(data);
  } catch (e: any) {
    showError(e);
  }
};

// 模拟 token 过期：篡改本地 ACCESS_TOKEN，然后访问受保护接口，触发刷新与重试
(document.getElementById('btn-expire') as HTMLButtonElement).onclick = async () => {
  try {
    const expired = api.expireToken();
    const data = await api.protected();
    show({ expired, retried: true, data });
  } catch (e: any) {
    showError(e);
  }
};

// Accept-Language 演示
(document.getElementById('btn-lang') as HTMLButtonElement).onclick = async () => {
  const data = await api.lang();
  show(data);
};

// Cookie 跨域演示
(document.getElementById('btn-cookie-set') as HTMLButtonElement).onclick = async () => {
  const data = await api.cookieSet();
  show(data);
};
(document.getElementById('btn-cookie-read') as HTMLButtonElement).onclick = async () => {
  const data = await api.cookieRead();
  show(data);
};
