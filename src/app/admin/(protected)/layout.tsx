import Link from 'next/link';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white shadow-md flex flex-col fixed h-full z-10">
        <div className="p-6 border-b">
          <h1 className="mb-0 text-xl font-bold">与她的海大时光笺</h1>
          <p className="text-xs text-gray-500 mt-1">后台管理系统</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard" className="block px-4 py-2 rounded hover:bg-gray-100 transition-colors">
            控制台 (Dashboard)
          </Link>
          <Link href="/admin/content" className="block px-4 py-2 rounded hover:bg-gray-100 transition-colors">
            内容数据 (Content)
          </Link>
        </nav>
        <div className="p-4 border-t">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 block">
            返回前台
          </Link>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
