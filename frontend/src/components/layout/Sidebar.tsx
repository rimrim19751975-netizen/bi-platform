'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/dashboard', icon: '📊', key: 'dashboard' },
  { href: '/data', icon: '📁', key: 'data' },
  { href: '/analytics', icon: '📈', key: 'analytics' },
  { href: '/reports', icon: '📄', key: 'reports' },
  { href: '/admin', icon: '⚙️', key: 'admin', roles: ['SUPER_ADMIN', 'ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t, lang, isRtl } = useI18n();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 h-screen sticky top-0 ${isRtl ? 'border-l' : ''}`}>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          {!collapsed && <h1 className="text-lg font-bold text-blue-600">{t.app.name}</h1>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {collapsed ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />}
            </svg>
          </button>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => !item.roles || item.roles.includes(user?.role || ''))
          .map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <span className="text-lg">{item.icon}</span>
                {!collapsed && <span className="text-sm font-medium">{t.nav[item.key as keyof typeof t.nav] as string}</span>}
              </Link>
            );
          })}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
          <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          {!collapsed && <span className="truncate">{user?.firstName} {user?.lastName}</span>}
        </Link>
      </div>
    </aside>
  );
}
