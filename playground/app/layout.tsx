import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '@gvray/request - Interactive Demo',
  description: 'Interactive examples for @gvray/request interceptors',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  )
}
