'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
              <h1 className="relative text-6xl md:text-8xl font-bold text-white tracking-tight">
                @gvray/request
              </h1>
            </div>
          </div>
          <p className="text-xl md:text-2xl text-blue-200 mb-4 font-light">
            Universal HTTP Client for JavaScript
          </p>
          <p className="text-gray-400 max-w-2xl mx-auto">
            One API, Multiple Engines. Switch between Axios and Fetch seamlessly with full interceptor support.
          </p>
        </div>

        {/* Engine Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Axios Engine Card */}
          <Link href="/axios/overview">
            <div className="group relative bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 hover:border-blue-400/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/5 group-hover:to-blue-600/5 rounded-2xl transition-all duration-300"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-5xl">🔷</div>
                  <div className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full border border-blue-400/30">
                    CLASSIC
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                  Axios Engine
                </h2>
                
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Battle-tested HTTP client with extensive features and proven reliability.
                </p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-300">
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Request/Response Transformation
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Automatic JSON Handling
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Request Cancellation
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    XSRF Protection
                  </div>
                </div>
                
                <div className="flex items-center text-blue-400 font-semibold group-hover:translate-x-2 transition-transform">
                  Explore Axios Engine
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Fetch Engine Card */}
          <Link href="/fetch/overview">
            <div className="group relative bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-8 hover:border-green-400/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-600/0 group-hover:from-green-500/5 group-hover:to-emerald-600/5 rounded-2xl transition-all duration-300"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-5xl">⚡</div>
                  <div className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full border border-green-400/30">
                    MODERN
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-green-300 transition-colors">
                  Fetch Engine
                </h2>
                
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Native browser API with modern performance and minimal bundle size.
                </p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-300">
                    <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Native Browser API
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Smaller Bundle Size
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Stream Support
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Service Worker Compatible
                  </div>
                </div>
                
                <div className="flex items-center text-green-400 font-semibold group-hover:translate-x-2 transition-transform">
                  Explore Fetch Engine
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <div className="mt-20 text-center">
          <div className="inline-block px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
            <p className="text-gray-300 text-sm">
              <span className="text-blue-400 font-semibold">Same API</span>
              {' • '}
              <span className="text-green-400 font-semibold">Different Engines</span>
              {' • '}
              <span className="text-purple-400 font-semibold">Full Interceptor Support</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
