'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'

const engineTabs = [
  { key: 'axios', label: 'Axios Engine', icon: '🔷' },
  { key: 'fetch', label: 'Fetch Engine', icon: '⚡' },
]

const featureTabs = [
  { path: 'overview', label: 'Overview', icon: '◈' },
  { path: 'basic', label: 'Basic', icon: '○' },
  { path: 'auth', label: 'Auth', icon: '◎' },
  { path: 'auth-refresh', label: 'Auth Refresh', icon: '⟳' },
  { path: 'retry', label: 'Retry', icon: '↻' },
  { path: 'timeout', label: 'Timeout', icon: '◷' },
  { path: 'cache', label: 'Cache', icon: '◉' },
  { path: 'logging', label: 'Logging', icon: '▤' },
]

export function Nav() {
  const pathname = usePathname()
  
  // 判断当前引擎
  const currentEngine = pathname.startsWith('/fetch') ? 'fetch' : 'axios'
  
  return (
    <header className="border-b border-gray-100 mb-10">
      <div className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-lg font-semibold text-gray-900">@gvray/request</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">demo</span>
        </Link>
      </div>
      
      {/* 一级 Tab: 引擎切换 */}
      <nav className="flex gap-6 -mb-px border-b border-gray-200">
        {engineTabs.map(({ key, label, icon }) => (
          <Link
            key={key}
            href={`/${key}/overview`}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
              currentEngine === key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
      
      {/* 二级 Tab: 功能切换 */}
      <nav className="flex gap-6 -mb-px mt-2">
        {featureTabs.map(({ path, label, icon }) => {
          const href = `/${currentEngine}/${path}`
          const isActive = pathname === href
          
          return (
            <Link
              key={path}
              href={href}
              className={`flex items-center gap-1 px-1 py-2 border-b-2 text-sm transition-colors ${
                isActive
                  ? 'border-gray-900 text-gray-900 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="opacity-60">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}

export function PageHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-10">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
      <p className="text-gray-500 mt-2">{desc}</p>
    </div>
  )
}

export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      {title && (
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
      )}
      <div className="flex flex-wrap gap-3">{children}</div>
    </section>
  )
}

export function Btn({
  children,
  onClick,
  variant = 'default',
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'primary' | 'danger'
  disabled?: boolean
}) {
  const base = 'h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    default: 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm',
    primary: 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300',
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  )
}

export function Output({ data, loading }: { data: unknown; loading?: boolean }) {
  return (
    <div className="mt-10">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Response</h2>
        {loading && (
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            Loading...
          </span>
        )}
      </div>
      <div className="bg-gray-900 rounded-xl p-5 overflow-hidden">
        <pre className="text-sm font-mono text-gray-100 min-h-[120px] max-h-[320px] overflow-auto whitespace-pre-wrap break-words">
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export function useRunner() {
  const [output, setOutput] = useState<unknown>('// Click a button to make a request')
  const [loading, setLoading] = useState(false)

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    setLoading(true)
    try {
      const res = await fn()
      setOutput(res)
    } catch (e) {
      const err = e as { message?: string; response?: { status?: number; data?: unknown } }
      setOutput({
        error: true,
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  return { output, loading, run }
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="text-gray-900">{children}</div>
    </div>
  )
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8 text-sm text-amber-800 leading-relaxed">
      {children}
    </div>
  )
}
