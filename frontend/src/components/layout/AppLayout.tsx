'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from 'react-hot-toast';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (pathname === '/login') return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
          {children}
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
