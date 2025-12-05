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

app.get('/api/ping', (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/api/users', (_req: Request, res: Response) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]);
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

app.listen(PORT, () => {
  console.log(`Example backend running at http://localhost:${PORT}`);
});
