"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                我的应用
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                首页
              </Link>
              <Link 
                href="/product" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/product') 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                产品介绍
              </Link>
              <Link 
                href="/terms" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/terms') 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                用户协议
              </Link>
              <Link 
                href="/privacy" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/privacy') 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                隐私政策
              </Link>
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 p-2 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <Link 
                href="/" 
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                首页
              </Link>
              <Link 
                href="/product" 
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/product') 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                产品介绍
              </Link>
              <Link 
                href="/terms" 
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/terms') 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                用户协议
              </Link>
              <Link 
                href="/privacy" 
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/privacy') 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                隐私政策
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
