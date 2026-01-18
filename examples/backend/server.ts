import express, { type Request, type Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(
  cors({
    origin: (origin, cb) => {
      // allow same-origin requests (like curl or server-to-server) and any localhost:*
      if (!origin) return cb(null, true);
      const ok = /^http:\/\/localhost:\d+$/.test(origin);
      cb(null, ok);
    },
    credentials: true,
  })
);
app.use(express.json());

// 简易令牌存储，仅用于示例演示
let accessToken = 'token-initial';
let refreshToken = 'refresh-initial';

// 登录：返回新的 accessToken 和 refreshToken（示例）
app.post('/api/login', (_req: Request, res: Response) => {
  accessToken = 'token-1';
  refreshToken = 'refresh-1';
  res.json({ accessToken, refreshToken });
});

// 刷新令牌：校验传入的 refreshToken，成功则返回新的 accessToken
app.post('/api/refresh', (req: Request, res: Response) => {
  const incoming = req.body?.refreshToken;
  if (!incoming || incoming !== refreshToken) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
  accessToken = `token-${Date.now()}`; // 生成一个新的 token
  res.json({ accessToken });
});

// 受保护接口：需要携带 Authorization: Bearer <accessToken>
app.get('/api/protected', (req: Request, res: Response) => {
  const auth = req.headers['authorization'];
  const expected = `Bearer ${accessToken}`;
  if (!auth || auth !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ ok: true, user: { id: 1, name: 'Alice' }, time: new Date().toISOString() });
});

// 语言演示：返回 Accept-Language
app.get('/api/lang', (req: Request, res: Response) => {
  res.json({ acceptLanguage: req.headers['accept-language'] });
});

// 设置一个演示 cookie（需要 withCredentials: true）
app.get('/api/cookie-set', (_req: Request, res: Response) => {
  res.cookie('example', 'cookie123', { httpOnly: false });
  res.json({ set: true });
});

// 读取请求携带的 cookie（简单返回原始 header）
app.get('/api/cookie-read', (req: Request, res: Response) => {
  res.json({ cookie: req.headers.cookie || null });
});

app.get('/api/ping', (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/api/users', (_req: Request, res: Response) => {
  res.json([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ]);
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const users = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ];
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req: Request, res: Response) => {
  res.status(201).json({ id: Date.now(), ...req.body, createdAt: new Date().toISOString() });
});

app.post('/api/echo', (req: Request, res: Response) => {
  res.json({ received: req.body });
});

// 模拟慢接口，延迟 2 秒返回
app.get('/api/slow', async (_req: Request, res: Response) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  res.json({ ok: true, delayedMs: 2000, time: new Date().toISOString() });
});

app.get('/api/error', (_req: Request, res: Response) => {
  res.status(400).json({ success: false, errorMessage: 'Business error' });
});

app.get('/api/not-found', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Resource not found' });
});

app.get('/api/server-error', (_req: Request, res: Response) => {
  res.status(500).json({ error: 'Internal server error' });
});

app.get('/api/service-unavailable', (_req: Request, res: Response) => {
  res.status(503).json({ error: 'Service temporarily unavailable' });
});

// Alternative refresh token endpoint
app.post('/api/refresh-token', (_req: Request, res: Response) => {
  // For demo, always succeed and return new token
  accessToken = `token-${Date.now()}`;
  res.json({ token: accessToken, refreshToken: `refresh-${Date.now()}` });
});

// User profile and settings (protected)
app.get('/api/user/profile', (req: Request, res: Response) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ id: 1, name: 'Alice', email: 'alice@example.com', avatar: 'https://i.pravatar.cc/150' });
});

app.get('/api/user/settings', (req: Request, res: Response) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ theme: 'light', language: 'en', notifications: true });
});

// ============================================
// Retry 演示接口
// ============================================
let retryCount = 0;
// 模拟不稳定接口：前 N 次失败，之后成功
app.get('/api/unstable', (req: Request, res: Response) => {
  const failTimes = parseInt(req.query.failTimes as string) || 2;
  retryCount++;
  console.log(`[Unstable API] Attempt ${retryCount}, failTimes=${failTimes}`);
  if (retryCount <= failTimes) {
    return res.status(503).json({ error: 'Service temporarily unavailable', attempt: retryCount });
  }
  const result = { ok: true, attempt: retryCount, message: 'Success after retries' };
  retryCount = 0; // Reset for next test
  res.json(result);
});

// 重置 retry 计数器
app.post('/api/unstable/reset', (_req: Request, res: Response) => {
  retryCount = 0;
  res.json({ reset: true, message: 'Counter reset to 0' });
});

// 查看 retry 状态
app.get('/api/unstable/status', (_req: Request, res: Response) => {
  res.json({ currentCount: retryCount });
});

// ============================================
// Cache 演示接口
// ============================================
// 返回时间戳，用于验证缓存是否生效
app.get('/api/timestamp', (_req: Request, res: Response) => {
  res.json({ timestamp: Date.now(), time: new Date().toISOString() });
});

// 带参数的缓存演示
app.get('/api/data/:id', (req: Request, res: Response) => {
  res.json({ id: req.params.id, timestamp: Date.now(), random: Math.random() });
});

// ============================================
// Timeout 演示接口
// ============================================
// 可配置延迟的接口
app.get('/api/delay/:ms', async (req: Request, res: Response) => {
  const ms = parseInt(req.params.ms as string) || 1000;
  await new Promise((resolve) => setTimeout(resolve, ms));
  res.json({ ok: true, delayedMs: ms, time: new Date().toISOString() });
});

// ============================================
// Logging 演示接口
// ============================================
// 返回请求头信息，用于验证 logging
app.get('/api/headers', (req: Request, res: Response) => {
  res.json({
    headers: req.headers,
    method: req.method,
    url: req.url,
  });
});

// POST 请求，返回请求体
app.post('/api/log-test', (req: Request, res: Response) => {
  res.json({
    received: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'accept-language': req.headers['accept-language'],
      authorization: req.headers['authorization'] ? '[PRESENT]' : '[MISSING]',
    },
  });
});

// ============================================
// 综合演示接口
// ============================================
// 模拟真实 API：带认证、分页、缓存
app.get('/api/posts', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const posts = Array.from({ length: limit }, (_, i) => ({
    id: (page - 1) * limit + i + 1,
    title: `Post ${(page - 1) * limit + i + 1}`,
    createdAt: new Date().toISOString(),
  }));
  res.json({ page, limit, total: 100, data: posts });
});

// 模拟文件上传
app.post('/api/upload', (req: Request, res: Response) => {
  res.json({ uploaded: true, contentType: req.headers['content-type'] });
});

app.listen(PORT, () => {
  console.log(`Example backend running at http://localhost:${PORT}`);
  console.log(`
Available endpoints:
  - GET  /api/ping          - Basic ping
  - GET  /api/users         - Get users
  - POST /api/echo          - Echo request body
  - GET  /api/slow          - Slow response (2s)
  - GET  /api/error         - Business error (400)
  - POST /api/login         - Login and get tokens
  - POST /api/refresh       - Refresh access token
  - GET  /api/protected     - Protected endpoint (needs auth)
  - GET  /api/lang          - Show Accept-Language header
  - GET  /api/cookie-set    - Set a cookie
  - GET  /api/cookie-read   - Read cookies
  - GET  /api/unstable      - Retry demo (fails first N times)
  - GET  /api/timestamp     - Cache demo (returns timestamp)
  - GET  /api/data/:id      - Cache demo with params
  - GET  /api/delay/:ms     - Timeout demo (configurable delay)
  - GET  /api/headers       - Logging demo (show headers)
  - POST /api/log-test      - Logging demo (POST)
  - GET  /api/posts         - Paginated posts
  `);
});
