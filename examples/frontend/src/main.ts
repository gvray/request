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

// ============================================
// 认证拦截器演示
// ============================================
(document.getElementById('btn-login') as HTMLButtonElement).onclick = async () => {
  try {
    await api.login();
    const tokens = api.getTokens();
    show({ login: true, ...tokens });
  } catch (e: unknown) {
    showError(e);
  }
};

(document.getElementById('btn-protected') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await api.protected();
    show(data);
  } catch (e: unknown) {
    showError(e);
  }
};

(document.getElementById('btn-expire') as HTMLButtonElement).onclick = async () => {
  try {
    const expired = api.expireToken();
    const data = await api.protected();
    show({ expired, retried: true, data });
  } catch (e: unknown) {
    showError(e);
  }
};

(document.getElementById('btn-lang') as HTMLButtonElement).onclick = async () => {
  const data = await api.lang();
  show(data);
};

(document.getElementById('btn-cookie-set') as HTMLButtonElement).onclick = async () => {
  const data = await api.cookieSet();
  show(data);
};

(document.getElementById('btn-cookie-read') as HTMLButtonElement).onclick = async () => {
  const data = await api.cookieRead();
  show(data);
};

// ============================================
// 重试拦截器演示
// ============================================
(document.getElementById('btn-retry-reset') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await api.retryReset();
    show({ reset: true, data: data.data });
  } catch (e: unknown) {
    showError(e);
  }
};

(document.getElementById('btn-retry-success') as HTMLButtonElement).onclick = async () => {
  try {
    show({ status: '请求中... (前2次会失败，第3次成功)' });
    const data = await api.retrySuccess();
    show({ success: true, data: data.data });
  } catch (e: unknown) {
    showError(e);
  }
};

(document.getElementById('btn-retry-fail') as HTMLButtonElement).onclick = async () => {
  try {
    show({ status: '请求中... (会失败5次，超过重试次数)' });
    const data = await api.retryFail();
    show(data.data);
  } catch (e: unknown) {
    showError(e);
  }
};

// ============================================
// 超时拦截器演示
// ============================================
(document.getElementById('btn-timeout-ok') as HTMLButtonElement).onclick = async () => {
  try {
    show({ status: '请求中... (延迟500ms，超时2s)' });
    const data = await api.timeoutOk();
    show(data);
  } catch (e: unknown) {
    showError(e);
  }
};

(document.getElementById('btn-timeout-fail') as HTMLButtonElement).onclick = async () => {
  try {
    show({ status: '请求中... (延迟3s，超时1s，会超时)' });
    const data = await api.timeoutFail();
    show(data);
  } catch (e: unknown) {
    showError(e);
  }
};

// ============================================
// 缓存拦截器演示
// ============================================
(document.getElementById('btn-cache-timestamp') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await api.cacheTimestamp();
    show({ cached: '5秒内再次请求会命中缓存', data: data.data });
  } catch (e: unknown) {
    showError(e);
  }
};

(document.getElementById('btn-cache-data1') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await api.cacheData1();
    show({ id: 1, data: data.data });
  } catch (e: unknown) {
    showError(e);
  }
};

(document.getElementById('btn-cache-data2') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await api.cacheData2();
    show({ id: 2, data: data.data });
  } catch (e: unknown) {
    showError(e);
  }
};

(document.getElementById('btn-cache-nocache') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await api.cacheNoCache();
    show({ noCache: true, data: data.data });
  } catch (e: unknown) {
    showError(e);
  }
};

// ============================================
// 日志拦截器演示 (查看控制台)
// ============================================
(document.getElementById('btn-log-get') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await api.logGet();
    show({ message: '查看浏览器控制台的日志输出', data: data.data });
  } catch (e: unknown) {
    showError(e);
  }
};

(document.getElementById('btn-log-post') as HTMLButtonElement).onclick = async () => {
  try {
    const data = await api.logPost();
    show({ message: '查看浏览器控制台的日志输出', data: data.data });
  } catch (e: unknown) {
    showError(e);
  }
};
