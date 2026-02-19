'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'

const navItems = [
  { href: '/', label: 'Overview', icon: '◈' },
  { href: '/basic', label: 'Basic', icon: '○' },
  { href: '/auth', label: 'Auth', icon: '◎' },
  { href: '/retry', label: 'Retry', icon: '↻' },
  { href: '/timeout', label: 'Timeout', icon: '◷' },
  { href: '/cache', label: 'Cache', icon: '◉' },
  { href: '/logging', label: 'Logging', icon: '▤' },
  { href: '/fetch', label: 'Fetch Engine', icon: '⇄' },
]

export function Nav() {
  const pathname = usePathname()
  return (
    <header className="border-b border-gray-100 mb-10">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">@gvray/request</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">demo</span>
        </div>
      </div>
      <nav className="flex gap-6 -mb-px">
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`pb-3 text-sm transition-colors border-b-2 ${
              pathname === href
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-1.5 opacity-60">{icon}</span>
            {label}
          </Link>
        ))}
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
