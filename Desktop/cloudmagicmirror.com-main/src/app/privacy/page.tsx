import Link from "next/link";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
                  轻松删
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  首页
                </Link>
                <Link
                  href="/product"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  产品介绍
                </Link>
                <Link
                  href="/terms"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  用户协议
                </Link>
                <Link
                  href="/privacy"
                  className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  隐私政策
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            轻松删隐私政策
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
              最后更新时间：2025年10月16日
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                使用范围
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                本隐私政策适用于轻松删移动应用程序（以下简称“应用程序”），该应用由轻松删（以下简称“服务提供商”）提供，作为一项免费增值服务。本服务按“原样”提供。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                应用程序收集并使用哪些信息？
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                应用程序仅收集与用户交互相关的有限信息，以改进体验并优化功能，包括：
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>应用内按钮点击次数；</li>
                <li>照片分类后的数量及文件大小统计；</li>
                <li>错误日志、崩溃报告和使用时长；</li>
                <li>其他用于性能分析的匿名使用数据。</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                这些数据仅用于产品改进，不会用于与收集目的无关的活动。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                是否收集照片或位置信息？
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                应用程序不会上传您的照片，也不会尝试理解照片内容。
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                本应用程序不会收集您设备的精确位置信息。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                数据共享
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                服务提供商不会向第三方共享或出售上述交互数据，所有信息均仅供内部分析使用。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                退出方式
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                您可以随时通过卸载应用程序停止所有信息收集。请使用设备系统或应用商店提供的标准卸载流程。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                儿童隐私
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                服务提供商不会故意向 13 岁以下儿童征求或收集个人信息，也不会向其营销。若发现收集了此类信息，请立即联系服务提供商，以便及时删除。
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                在某些地区，您必须年满 16 岁方可同意我们处理您的个人信息；如适用，可由父母或监护人代表您同意。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                安全性
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                服务提供商重视数据安全，收集的交互数据经过妥善存储，未经授权的人员无法访问。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                政策变更
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                隐私政策可能因任何原因不时更新。服务提供商将通过更新本页面提示变更，建议您定期查阅。继续使用应用程序即视为接受最新政策。
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                本隐私政策自 2025 年 10 月 16 日起生效。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                您的同意
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                使用本应用程序即表示您同意按照本隐私政策（包括未来修订版本）处理您的信息。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                联系我们
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                若您对隐私实践或本政策有任何疑问，请联系服务提供商：
              </p>
              <ul className="list-none text-gray-700 dark:text-gray-300 space-y-2">
                <li>邮箱：support@cloudmagicmirror.com</li>
              </ul>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
              >
                返回首页
              </Link>
              <Link
                href="/terms"
                className="border border-gray-300 dark:border-gray-600 hover:border-blue-600 dark:hover:border-blue-400 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
              >
                查看用户协议
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">轻松删</h3>
              <p className="text-gray-400 mb-4">
                专注于提供高效的移动端文件管理与隐私保护体验。
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">快速链接</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/product" className="text-gray-400 hover:text-white transition-colors">
                    产品介绍
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                    用户协议
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    隐私政策
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">联系我们</h4>
              <p className="text-gray-400">
                邮箱: support@cloudmagicmirror.com
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 轻松删. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
