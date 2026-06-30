'use client';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export function Header() {
  const { t, lang, isRtl, setLang, toggleLang } = useI18n();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <input type="text" placeholder={t.common.search} className="input-field w-64 pl-9 py-1.5 text-sm" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={toggleLang} className="btn-ghost text-sm px-3 py-1.5">
          {lang === 'fr' ? 'FR' : lang === 'en' ? 'EN' : 'AR'}
        </button>
        <button onClick={handleLogout} className="btn-ghost text-sm px-3 py-1.5 text-red-500">
          {t.nav.logout}
        </button>
      </div>
    </header>
  );
}
