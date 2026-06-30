'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { analyticsApi } from '@/lib/api';
import { DashboardStats } from '@/types';
import { formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getDashboard().then(({ data }) => setStats(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">{t.dashboard.welcome}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t.dashboard.files} value={stats?.fileCount || 0} color="blue" icon="📁" />
        <StatCard title={t.dashboard.sheets} value={stats?.sheetCount || 0} color="green" icon="📋" />
        <StatCard title={t.dashboard.records} value={stats?.totalRecords || 0} color="purple" icon="📊" />
        <StatCard title={t.dashboard.users} value={stats?.userCount || 0} color="orange" icon="👥" />
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">{t.dashboard.kpi}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <KPIItem label="Total Fichiers" value={stats?.fileCount || 0} />
          <KPIItem label="Total Feuilles" value={stats?.sheetCount || 0} />
          <KPIItem label="Total Enregistrements" value={stats?.totalRecords || 0} />
          <KPIItem label="Utilisateurs" value={stats?.userCount || 0} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, icon }: { title: string; value: number; color: string; icon: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  };
  return (
    <div className={`card p-5 border ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold mt-1">{formatNumber(value)}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function KPIItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-bold text-blue-600">{formatNumber(value)}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
