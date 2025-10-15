import Link from "next/link";

export default function Terms() {
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
                  className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  用户协议
                </Link>
                <Link
                  href="/privacy"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
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
            轻松删服务条款
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
              最后更新时间：2025年10月16日
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                简介
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                本服务条款适用于轻松删移动应用程序（以下简称“应用程序”），该应用由轻松删（以下简称“服务提供商”）提供，作为一项免费增值服务。下载或使用应用程序即表示您自动同意以下条款，请在使用前仔细阅读。
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                未经授权复制、修改或分发应用程序，提取源代码，翻译为其他语言，或创建衍生版本均被严格禁止。与应用程序相关的所有商标、版权、数据库权利及其他知识产权归服务提供商所有。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                修改与收费
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                为保持应用程序的实用性与高效性，服务提供商保留随时修改应用程序或对其服务收费的权利。任何收费都会提前明确告知您，以便您在知情的情况下决定是否继续使用相关功能。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                数据与安全性
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                应用程序会存储并处理您提供的个人数据，以便交付服务。请自行维护设备安全和账户访问控制。服务提供商强烈建议您不要对设备进行越狱或 root 操作，以免暴露于恶意软件、病毒或导致应用程序无法正常运行。
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                若因您未妥善保护设备或账户而导致损失，服务提供商概不负责。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                网络与连接
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                应用程序的部分功能需依赖活动的互联网连接（Wi-Fi 或移动数据）。若因网络不可用或数据流量耗尽导致应用程序无法正常运行，服务提供商不承担责任。
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                在非 Wi-Fi 环境下使用应用程序时，移动网络提供商可能收取数据或漫游费用。继续使用即表示您接受并负责相关费用；若您不是账单支付人，应确保已获得许可。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                设备责任
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                保持设备电量充足并确保其良好状态是您的责任。若因设备电量耗尽或故障导致无法访问服务，服务提供商概不负责。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                更新与终止
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                为适配系统要求或改进体验，服务提供商可能随时发布应用程序更新。若要继续使用，请在更新提供后及时安装。服务提供商不保证应用程序始终与您设备的操作系统保持兼容。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                服务提供商也可能随时停止提供应用程序或终止您对其使用，而无需另行通知。终止时：
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>您获得的权利和许可将即时终止；</li>
                <li>您需停止使用应用程序，并在必要时从设备中删除它；</li>
                <li>如另行要求，请遵循服务提供商提供的终止指引。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                服务条款的变更
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                服务提供商可能定期更新本服务条款，并将在本页面公布最新版本。建议您定期查看以了解最新变更。
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                本服务条款自 2025 年 10 月 16 日起生效。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                联系我们
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                如对本服务条款有任何疑问或建议，请通过以下方式联系服务提供商：
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
                href="/privacy"
                className="border border-gray-300 dark:border-gray-600 hover:border-blue-600 dark:hover:border-blue-400 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
              >
                查看隐私政策
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
