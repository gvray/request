import express, { type Request, type Response } from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000

app.use(cors({ origin: ['http://localhost:5173'], credentials: true }))
app.use(express.json())

app.get('/api/ping', (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

app.get('/api/users', (_req: Request, res: Response) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ])
})

app.post('/api/echo', (req: Request, res: Response) => {
  res.json({ received: req.body })
})

app.get('/api/error', (_req: Request, res: Response) => {
  res.status(400).json({ success: false, errorMessage: 'Business error' })
})

app.listen(PORT, () => {
  console.log(`Example backend running at http://localhost:${PORT}`)
})