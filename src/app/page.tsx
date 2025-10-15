import Link from "next/link";
import Navigation from "@/components/Navigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              创新移动应用
              <span className="block text-blue-600 dark:text-blue-400">改变生活方式</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              我们致力于开发高质量的移动应用，为用户提供便捷、高效的数字化解决方案，让科技真正服务于生活。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg">
                立即下载
              </button>
              <Link href="/product" className="border border-gray-300 dark:border-gray-600 hover:border-blue-600 dark:hover:border-blue-400 text-gray-900 dark:text-white font-semibold py-3 px-8 rounded-lg transition-colors">
                了解更多
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              核心特色
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              我们的应用具备以下核心特色，为用户提供卓越的使用体验
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">高性能</h3>
              <p className="text-gray-600 dark:text-gray-300">
                采用最新技术栈，确保应用运行流畅，响应迅速，为用户提供极致体验。
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">安全可靠</h3>
              <p className="text-gray-600 dark:text-gray-300">
                采用企业级安全标准，保护用户数据安全，让您放心使用我们的服务。
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">用户友好</h3>
              <p className="text-gray-600 dark:text-gray-300">
                简洁直观的界面设计，易于上手，让每个用户都能轻松享受我们的服务。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">我的应用</h3>
              <p className="text-gray-400 mb-4">
                专业的移动应用开发团队，致力于为用户提供创新的数字化解决方案。
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">快速链接</h4>
              <ul className="space-y-2">
                <li><Link href="/product" className="text-gray-400 hover:text-white transition-colors">产品介绍</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">用户协议</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">隐私政策</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">联系我们</h4>
              <p className="text-gray-400">
                邮箱: contact@myapp.com<br />
                电话: 400-123-4567
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 我的应用. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
